let whmcs = {};

import WHMCSError from "./WHMCSError";

let wait = require("wait.for");
let nodeify = require("nodeify");
let rest = require("restler");
let crypto = require("crypto");
let phpSerialize = require("./phpSerialize.js");
let moduleLogger = log.child({
    component: "legacy/whmcs",
});

let doRequest = (action, data, callback) => {
    let logger = moduleLogger.child({ action, data });
    data.username = config.whmcsUsername;
    data.password = config.whmcsPassword;
    data.accesskey = config.whmcsKey;
    data.responsetype = "json";
    data.action = action;
    rest.post(config.whmcsURL + "/includes/api.php", {
        data: data,
        rejectUnauthorized: false,
        timeout: 20000,
    }).on("timeout", function () {
        return callback(new WHMCSError("Timeout"));
    }).on("complete", function (info) {
        if (info instanceof Error) {
            logger.error(info, "Request to WHMCS failed");
            return callback(info);
        }
        try {
            info = JSON.parse(info);
        } catch (error) {
            logger.error({ info }, "Failed to parse WHMCS API reply");
            return callback(new Error("Failed to parse WHMCS API reply."));
        }
        if (info.result === "error") {
            logger.error({ error: info.message }, "Got an error from WHMCS");
            return callback(new WHMCSError(info.message));
        }
        callback(null, info);
    });
};

whmcs.checkLogin = (email, password, callback) => {
    wait.launchFiber(() => {
        try {
            let [correctHash, salt] = wait.for(doRequest, "getclientpassword", {
                email,
            }).password.split(":");
            let hash = crypto.createHash("md5").update(salt + password).digest("hex");
            return callback(null, (hash === correctHash));
        } catch (error) {
            if (error instanceof WHMCSError) {
                // WHMCS returned an error explicitely, which means the login failed
                return callback(null, false);
            }
            return callback(error);
        }
    });
};

whmcs.getInfoForEmail = (email, callback) => {
    wait.launchFiber(() => {
        try {
            let data = wait.for(doRequest, "getclientsdetails", {
                email,
            });
            return callback(null, {
                id: data.id,
                email: data.email,
                firstName: data.firstname,
                lastName: data.lastname,
                company: data.companyname,
                phone: data.phonenumberformatted,
                address: data.address1 + "\n" + data.address2 + "\n" + data.city,
                country: data.countryname,
                flags: [
                    {
                    "key": "DJ",
                    "active": data.customfields2 === "on", // customfields2 is WHMCS language for the DJ tickbox
                    "name": "DJ",
                    "description": "Advanced radio automation in the cloud",
                    },
                ],
            });
        } catch (error) {
            if (error instanceof WHMCSError) {
                return callback(new Error("Email not in database"));
            }
            return callback(error);
        }
    });
};

whmcs.getProductsForEmail = (email, callback) => {
    wait.launchFiber(() => {
        try {
            let user = wait.for(whmcs.getInfoForEmail, email);
            let products = wait.for(doRequest, "getclientsproducts", {
                clientid: user.id,
            }).products.product || [];
            let eligibleProducts = products.filter((product) => {
                let group = product.groupname.toLowerCase();
                return product.status === "Active" && !product.name.toLowerCase().includes("free") && (group.includes("servers") || group.includes("nodes"));
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
            return callback(null, eligibleProducts);
        } catch (error) {
            error.message = "Failed to get products: " + error.message;
            return callback(error);
        }
    });
};

whmcs.openTicket = (params, callback) => {
    wait.launchFiber(function ({ email, departmentId, subject, message, sendEmail }) {
        try {
            let user = wait.for(whmcs.getInfoForEmail, email);
            wait.for(doRequest, "openticket", {
                clientid: user.id,
                deptid: departmentId,
                subject: subject,
                message: message,
                noemail: !sendEmail,
            });
            return callback();
        } catch (error) {
            error.message = "Failed to open ticket: " + error.message;
            return callback(error);
        }
    }, params);
};

whmcs.replyTicket = (params, callback) => {
    if (typeof callback === "undefined") {
        callback = function () {};
    }
    wait.launchFiber(function ({ id, message, status, admin }) {
        try {
            wait.for(doRequest, "addticketreply", {
                ticketid: id,
                message: message,
                status: status,
                adminusername: admin || "Maya",
            });
            return callback();
        } catch (error) {
            error.message = "Failed to reply to ticket: " + error.message;
            return callback(error);
        }
    }, params);
};

whmcs.getProductIdByUsername = (username, callback) => {
    const token = "HSGep99kRwe5pUvSYjKBpbsSNhtxxJy7RD5HHC9VaNpWVPjhHCYtZczjDx3Wp4Nw";
    rest.get(`${config.whmcsURL}/get-product-id-by-username.php?token=${token}&username=${username}`)
        .on("complete", function (productId) {
            if (productId instanceof Error) {
                return callback(productId);
            }
            return callback(null, productId);
        });
};

/**
 * Convert an amount in GBP to another currency
 * @param  {Integer}  amount         Amount in GBP
 * @param  {String}   targetCurrency Target currency (€, $ or £)
 * @param  {Function} callback       Callback function (err, convertedAmount)
 * @return {Promise}  Returns a promise if no callback is passed.
 */
whmcs.convertCurrency = (amount, targetCurrency, callback) => {
    const token = "HSGep99kRwe5pUvSYjKBpbsSNhtxxJy7RD5HHC9VaNpWVPjhHCYtZczjDx3Wp4Nw";
    return nodeify(new Promise(function (resolve, reject) {
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
            return resolve(convertedAmount);
        }).on("timeout", function () {
            return reject(new Error("Request to WHMCS timed out"));
        });
    }), callback);
};

/**
 * Get a currency rate relative to the base currency rate (GBP)
 * @param  {String}   currency   Target currency (€, $ or £)
 * @param  {Function} callback   Callback function (err, targetRate)
 * @return {Promise}  Returns a promise if no callback is passed.
 */
whmcs.getCurrencyRate = (currency, callback) => {
    return nodeify(new Promise(function (resolve, reject) {
        whmcs.convertCurrency(1, currency).then(resolve, reject);
    }), callback);
};

whmcs.sendProductEmail = (emailTemplateName, relatedProductUsername, customFields = {}, callback) => {
    wait.launchFiber(function () {
        try {
            let productId = wait.for(whmcs.getProductIdByUsername, relatedProductUsername);
            wait.for(doRequest, "sendemail", {
                id: productId,
                messagename: emailTemplateName,
                customvars: new Buffer(phpSerialize(customFields)).toString("base64"),
            });
            return callback();
        } catch (error) {
            error.message = "Failed to send product email: " + error.message;
            return callback(error);
        }
    });
};

module.exports = whmcs;
