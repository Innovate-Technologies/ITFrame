import crypto from "crypto";

import rest from "restler";
import xml2js from "xml2js";
import moment from "moment-timezone";

import WHMCSError from "./WHMCSError.js";
import phpSerialize from "./phpSerialize.js";
import { Cache, ONE_SECOND } from "~/components/cache.js";

const cache = new Cache();

const moduleLogger = log.child({ component: "legacy/whmcs" });

const parseXml = (s) => new Promise((resolve, reject) => {
    xml2js.parseString(s, { explicitArray: false }, function (err, result) {
        if (err) {
            return reject(err);
        }
        resolve(result);
    });
});

const sendRequest = (action, data, format = "json") => new Promise((resolve, reject) => {
    const logger = moduleLogger.child({ action, data });

    data.username = config.whmcsUsername;
    data.password = config.whmcsPassword;
    data.accesskey = config.whmcsKey;
    data.responsetype = format;
    data.action = action;

    rest.post(`${config.whmcsURL}/includes/api.php`, {
        data,
        rejectUnauthorized: false,
        timeout: 20000,
    }).on("timeout", () => {
        reject(new WHMCSError("Timeout"));
    }).on("complete", async (info) => {
        if (info instanceof Error) {
            logger.error(info, "Request to WHMCS failed");
            return reject(info);
        }
        logger.error({ content: info }, "Got data from WHMCS");
        try {
            if (typeof info === "string") {
                if (format === "json") {
                    info = JSON.parse(info);
                } else if (format === "xml") {
                    info = (await parseXml(info)).whmcsapi;
                } else {
                    throw new Error("Unexpected format");
                }
            }
            
        } catch (error) {
            logger.error({ info }, "Failed to parse WHMCS API reply");
            return reject(new Error("Failed to parse WHMCS API reply."));
        }
        if (info.result === "error") {
            logger.error({ error: info.message }, "Got an error from WHMCS");
            return reject(new WHMCSError(info.message));
        }
        resolve(info);
    });
});

/**
 * Check if credentials are correct
 * @param  {String} email     Email address
 * @param  {String} password  Password
 * @async
 * @return {Boolean}          Whether the credentials are correct
 */
export const checkLogin = async (email, password) => {
    try {
        const [correctHash, salt] =
            (await sendRequest("getclientpassword", { email })).password.split(":");
        const hash = crypto.createHash("md5").update(salt + password).digest("hex");
        return hash === correctHash;
    } catch (error) {
        if (error instanceof WHMCSError) {
            // WHMCS returned an error explicitely, which means the login failed
            return false;
        }
        throw error;
    }
};

export const getInfoForEmail = async (email) => {
    try {
        const data = await sendRequest("getclientsdetails", { email });
        return {
            id: data.id,
            email: data.email,
            firstName: data.firstname,
            lastName: data.lastname,
            company: data.companyname,
            phone: data.phonenumberformatted,
            address: `${data.address1}
${data.address2}
${data.city}`,
            country: data.countryname,
            flags: [
                {
                    key: "DJ",
                    active: data.customfields2 === "on", // DJ tickbox
                    name: "DJ",
                    description: "Advanced radio automation in the cloud",
                },
            ],
        };
    } catch (error) {
        if (error instanceof WHMCSError) {
            throw new Error("Email not in database");
        }
        throw error;
    }
};

export const getProductsForEmail = async (email) => {
    try {
        const user = await getInfoForEmail(email);
        const products = (await sendRequest("getclientsproducts", { clientid: user.id }))
            .products.product || [];
        const eligibleProducts = products.filter((product) => {
            const group = product.groupname.toLowerCase();
            return product.status === "Active"
                && !product.name.toLowerCase().includes("free")
                && (group.includes("servers") || group.includes("nodes"));
        }).map((product) => {
            return {
                id: product.id,
                name: product.name,
                group: product.groupname,
                server: product.servername,
                status: product.status,
                username: product.username,
                password: product.password,
                price: product.recurringamount,
            };
        });
        return eligibleProducts;
    } catch (error) {
        error.message = "Failed to get products: " + error.message;
        throw error;
    }
};

export const getTicket = async (unused, ticketId, withReplies = false) => {
    const response = await sendRequest("getticket", { ticketid: ticketId }, "xml");
    const rawReplies = Array.isArray(response.replies.reply)
        ? response.replies.reply
        : [response.replies.reply];
    const replies = rawReplies.map(reply => ({
        name: reply.admin || reply.name,
        isStaffReply: !!reply.admin,
        date: moment.tz(reply.date, "YYYY-MM-DDHH:mm:ss", "Europe/London"),
        message: reply.message,
    }));
    const ticket = {
        id: response.id,
        date: moment.tz(response.date, "YYYY-MM-DDHH:mm:ss", "Europe/London"),
        department: response.deptname,
        status: response.status,
        subject: response.subject,
        message: replies[0].message,
    };
    if (withReplies) {
        ticket.replies = replies;
    }
    return ticket;
};

const getSupportDepartments = async () => {
    const response = await sendRequest("getsupportdepartments", {}, "xml");
    const departments = Array.isArray(response.departments.department)
        ? response.departments.department
        : [response.departments.department];
    return departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
    }));
};

const refreshSupportDepartments = async () => {
    const cacheKey = "supportDepartments";
    if (Array.isArray(cache.get(cacheKey))) {
        return;
    }
    const departments = await getSupportDepartments();
    cache.add(cacheKey, departments, ONE_SECOND * 120);
};

setInterval(refreshSupportDepartments, ONE_SECOND * 105);
refreshSupportDepartments();

const getSupportDeptName = (id) => {
    const cacheKey = "supportDepartments";
    if (Array.isArray(cache.get(cacheKey))) {
        return cache.get(cacheKey).find((dept) => dept.id === id) || "(unknown)";
    }
    return "(unknown)";
};

export const getTickets = async (email, activeOnly) => {
    const user = await getInfoForEmail(email);
    const args = {
        limitnum: 10000,
        clientid: user.id,
    };
    if (activeOnly) {
        args.status = "All Active Tickets";
    }
    const response = await sendRequest("gettickets", args, "xml");
    const tickets = Array.isArray(response.tickets.ticket)
        ? response.tickets.ticket
        : [response.tickets.ticket];
    return tickets.map((ticket) => ({
        id: ticket.id,
        date: moment.tz(ticket.date, "YYYY-MM-DDHH:mm:ss", "Europe/London"),
        department: getSupportDeptName(ticket.deptid),
        status: ticket.status,
        subject: ticket.subject,
        message: ticket.message,
    }));
};

export const changeStatusForTicket = async (_unused, ticketId, status) => {
    await sendRequest("updateticket", { ticketid: ticketId, status });
};

export const getRepliesForTicket = async (unused, ticketId) => {
    return (await getTicket(unused, ticketId, true)).replies;
};

// This is different from replyTicket, which posts replies as an admin user.
export const postReplyForTicket = async (email, ticketId, message) => {
    await sendRequest("addticketreply", {
        ticketid: ticketId,
        email,
        message,
    });
};

export const openTicket = async ({ email, departmentId, subject, message, sendEmail } = {}) => {
    try {
        const user = await getInfoForEmail(email);
        const response = await sendRequest("openticket", {
            clientid: user.id,
            deptid: departmentId,
            subject,
            message,
            noemail: !sendEmail,
        });
        return response.id;
    } catch (error) {
        error.message = "Failed to open ticket: " + error.message;
        throw error;
    }
};

export const replyTicket = async ({ id, message, status, admin }) => {
    try {
        await sendRequest("addticketreply", {
            ticketid: id,
            message,
            status,
            adminusername: admin || "Maya",
        });
    } catch (error) {
        error.message = "Failed to reply to ticket: " + error.message;
        throw error;
    }
};

const token = "HSGep99kRwe5pUvSYjKBpbsSNhtxxJy7RD5HHC9VaNpWVPjhHCYtZczjDx3Wp4Nw";

export const getProductIdByUsername = (username) => new Promise((resolve, reject) => {
    rest.get(`${config.whmcsURL}/get-product-id-by-username.php?token=${token}&username=${username}`)
        .on("complete", function (productId) {
            if (productId instanceof Error) {
                return reject(productId);
            }
            resolve(productId);
        });
});

/**
 * Convert an amount in GBP to another currency
 * @param  {Integer}  amount         Amount in GBP
 * @param  {String}   targetCurrency Target currency (€, $ or £)
 * @async
 * @return {Number}   Converted amount
 */
export const convertCurrency = (amount, targetCurrency) => new Promise((resolve, reject) => {
    if (["€", "$", "£"].indexOf(targetCurrency) === -1) {
        return reject(new TypeError("Unexpected currency. Valid currencies are €, $ and £."));
    }
    const encoded = {
        "€": "%E2%82%AC",
        "$": "$",
        "£": "%C2%A3",
    };
    const url = `${config.whmcsURL}/convert-currency.php?token=${token}&amount=${amount}&targetCurrency=${encoded[targetCurrency]}`;
    rest.get(url, { timeout: 2000 }).on("complete", function (convertedAmount) {
        if (convertedAmount instanceof Error) {
            return reject(convertedAmount);
        }
        resolve(convertedAmount);
    }).on("timeout", function () {
        reject(new Error("Request to WHMCS timed out"));
    });
});

/**
 * Get a currency rate relative to the base currency rate (GBP)
 * @param  {String}   currency   Target currency (€, $ or £)
 * @async
 * @return {Number}   Target rate
 */
export const getCurrencyRate = (currency) => {
    return convertCurrency(1, currency);
};

export const sendProductEmail = async (emailTemplateName, relatedUsername, customFields = {}) => {
    try {
        const productId = await getProductIdByUsername(relatedUsername);
        await sendRequest("sendemail", {
            id: productId,
            messagename: emailTemplateName,
            customvars: new Buffer(phpSerialize(customFields)).toString("base64"),
        });
    } catch (error) {
        error.message = "Failed to send product email: " + error.message;
        throw error;
    }
};
