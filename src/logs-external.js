/**
 * This file sends logs to an external service.
 * It is required by logs.js while setting up logging
 * only if sendLogsToExternal is truthy in the config.
 */

if (!config.logsUsername
    || !config.logsPassword
    || !config.logsHostname) {
    throw new Error("Logs: Please configure logsUsername, logsPassword and logsHostname.")
}

let Asteroid = require("asteroid");
let useSsl = !config.logsUnsecure;
let logs = new Asteroid(config.logsHostname, useSsl);
let _ = require("underscore");

let loggedIn = false;
let logIn = () => {
    return logs.loginWithPassword(config.logsUsername, config.logsPassword).then(() => {
        loggedIn = true;
    }, (err) => {
        throw new Error(err);
    });
};
logIn();

let ensureLoggedIn = () => {
    if (loggedIn) {
        return new Promise(function (resolve) {
            resolve();
        });
    }
    return logIn();
};

const ONE_SECOND = 1000;
const RETRY_INTERVAL = 5 * ONE_SECOND;
let retryQueue = [];
let retry = () => {
    if (loggedIn) {
        if (retryQueue.length > 0) {
            console.error(`Logs: ${retryQueue.length} records in the retry queue, sending`.yellow);
        }
        retryQueue.forEach((record) => {
            send(record).then(() => {
                retryQueue = _.without(retryQueue, record);
            });
        });
        return;
    }
    if (retryQueue.length > 0) {
        console.error(`Logs: ${retryQueue.length} records in the retry queue, waiting for login`.yellow);
    }
};
setInterval(retry, RETRY_INTERVAL);

let send = (record = {}) => {
    return ensureLoggedIn()
        .then(() => logs.getCollection("Records").insert(record).remote)
        .then(() => {}, (err) => {
            console.error("Logs: Failed to send log record, will retry soon".yellow);
            console.error(err);
            retryQueue.push(record);
        });
};

module.exports.write = (record = {}) => {
    if (loggedIn) {
        return send(record);
    }
    retryQueue.push(record);
};
module.exports.flushQueue = retry;
