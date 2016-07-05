import rest from "restler";
import crypto from "crypto";

import WHMCSError from "./WHMCSError.js";
import phpSerialize from "./phpSerialize.js";

const moduleLogger = log.child({ component: "legacy/whmcs" });

const sendRequest = (action, data) => new Promise((resolve, reject) => {
    const logger = moduleLogger.child({ action, data });

    data.username = config.whmcsUsername;
    data.password = config.whmcsPassword;
    data.accesskey = config.whmcsKey;
    data.responsetype = "json";
    data.action = action;

    rest.post(`${config.whmcsURL}/includes/api.php`, {
        data,
        rejectUnauthorized: false,
        timeout: 20000,
    }).on("timeout", () => {
        reject(new WHMCSError("Timeout"));
    }).on("complete", (info) => {
        if (info instanceof Error) {
            logger.error(info, "Request to WHMCS failed");
            return reject(info);
        }
        try {
            info = JSON.parse(info);
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
                price: product.recurringamount,
            };
        });
        return eligibleProducts;
    } catch (error) {
        error.message = "Failed to get products: " + error.message;
        throw error;
    }
};

export const openTicket = async ({ email, departmentId, subject, message, sendEmail } = {}) => {
    try {
        const user = await getInfoForEmail(email);
        await sendRequest("openticket", {
            clientid: user.id,
            deptid: departmentId,
            subject,
            message,
            noemail: !sendEmail,
        });
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
