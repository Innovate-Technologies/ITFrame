let _ = require("underscore");
let EJSON = require("ejson");
let Asteroid = require("asteroid");
let apps = new Asteroid("apps.shoutca.st", true);
let moduleLogger = log.child({ component: "apps" });

if (!config.appsUsername || !config.appsPassword) {
    throw new Error("Please add appsUsername and appsPassword in the config file.")
}

let loggedIn = false;

/**
 * Log in to Apps
 * @async
 */
let logIn = async () => {
    try {
        moduleLogger.info("Logging in");
        await apps.loginWithPassword(config.appsUsername, config.appsPassword);
        loggedIn = true;
        moduleLogger.info("Logged in");
    } catch (err) {
        moduleLogger.fatal(err, "Failed to log in to Apps");
        throw err;
    }
};

/**
 * Ensure that we are logged in to Apps
 * Returns a promise that is immediately fulfilled if we are already logged in,
 * or fulfilled/rejected by logIn().
 * @return {Promise}
 */
let ensureLoggedIn = () => {
    if (loggedIn) {
        return Promise.resolve();
    }
    return logIn();
};

/**
 * Get collection and subscription names for a given platform
 * @param  {String} platform  Platform name ("android" or "iOS")
 * @return {Object}
 */
let getInfoForPlatform = (platform) => {
    switch (platform) {
        case "android":
            return {
                collectionName: "AndroidApps",
                singularSubscriptionName: "AndroidApp",
                pluralSubscriptionName: "AndroidApps",
            };
        case "iOS":
            return {
                collectionName: "iOSApps",
                singularSubscriptionName: "iOSApp",
                pluralSubscriptionName: "iOSApps",
            };
        default:
            throw new Error("Invalid platform. Platform is either 'android' or 'iOS'.");
    }
};


let AppsService = {};

/**
 * Get a request by ID
 * @param  {String} platform  Platform ("android" or "iOS")
 * @param  {Object} selector  App request selector object, or request ID
 * @async
 * @return {Object} App request
 */
AppsService.getRequest = async function (platform, selector) {
    let logger = moduleLogger.child({
        platform,
        selector,
    });
    await ensureLoggedIn();
    try {
        let appRequest = await apps.call("itframeFindOneAppRequest", platform, selector).result;
        return EJSON.fromJSONValue(appRequest);
    } catch (err) {
        logger.error(err, "Couldn't find the app request");
        err.message = "Couldn't find the app request: " + err.message;
        throw err;
    }
};

/**
 * Add an app request
 * _Apps_ will validate it before adding it to its database,
 * so pass anything you want, and Apps will check it.
 * @param  {String}   platform Platform ("android" or "iOS")
 * @param  {Object}   request  App request
 * @async
 * @return {String}   Newly added app request _id
 */
AppsService.addRequest = async function (platform, request = {}) {
    let { collectionName } = getInfoForPlatform(platform);
    let logger = moduleLogger.child({ platform, collectionName, request });
    await ensureLoggedIn();
    try {
        return await apps.call("itframeInsertAppRequest", platform, request).result;
    } catch (err) {
        logger.error(err, "Failed to insert the app request");
        err.message = "Failed to insert the app request: " + err.message;
        throw err;
    }
};

/**
 * Update an app request
 * @param  {String}   platform Platform ("android" or "iOS")
 * @param  {String}   selector App request selector, or request ID
 * @param  {Object}   modifier Modifier object
 * @async
 */
AppsService.updateRequest = async function (platform, selector, modifier = {}) {
    let { collectionName } = getInfoForPlatform(platform);
    let logger = moduleLogger.child({ platform, collectionName, selector, modifier });

    try {
        let request = await AppsService.getRequest(platform, selector);
        let newRequest = _.extend(request, modifier);
        let cleanRequest = await apps.call("cleanAppRequest", platform, newRequest).result;
        await apps.call("itframeUpdateAppRequest", platform, { _id: request._id }, { $set: cleanRequest }).result;
    } catch (err) {
        logger.error(err, "Failed to update the app request");
        err.message = "Failed to update the app request: " + err.message;
        throw err;
    }
};

logIn();
export default AppsService;
