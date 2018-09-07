import _ from "underscore"
import rest from "restler"
import * as castDB from "./database.js"
import * as configHelper from "./configHelper.js"
import * as tunesDB from "../tunes/personalMusicDatabase.js"
import { HelmetController } from "../helmet/controller.js"

const helmetDJ = new HelmetController(config.djHelmetURL, config.djHelmetKey)
const helmetCast = new HelmetController(config.castHelmetURL, config.castHelmetKey)
const moduleLogger = log.child({ component: "cast" })


export const createNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("Making configuration")
    const config = await configHelper.createConfigForNewUser(username)
    logger.debug("Adding configuration to database")
    await castDB.addConfigForUsername(username, config)
    return createUnit(username)
}

export const createUnit = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("Making configuration")
    const config = await castDB.getInfoForUsername(username, config)
    let customHost = ""
    if (config.hostname != `https://${username}.radioca.st`) {
        customHost = config.hostname.replace("https://", "")
    }
    await helmetCast.create(username, { shoutcastPort: config.input.SHOUTcast.toString(), username, customHost, branch: config.branch, date: "" + (new Date()).getTime() })
}

export const startDJ = (username) => {
    return helmetDJ.create(username, { username, date: "" + (new Date()).getTime() });
}

export const destroyDJ = (username) => {
    return helmetDJ.destroy(username, { username })
}

export const destroyUnit = async (username) => {
    const config = await castDB.getInfoForUsername(username, config)
    return helmetCast.destroy(username, { shoutcastPort: config.input.SHOUTcast.toString(), username })
}

export const hardRestartNode = async (username) => {
    await destroyUnit(username)
    await createUnit(username)
}

export const hardRestartDJ = async (username) => {
    await destroyDJ(username)
    await startDJ(username)
}

export const softRestartNode = (username) => new Promise(async (resolve) => {
    const config = await castDB.getInfoForUsername(username)
    rest.get(config.hostname + "/itframe/restart/?key=" + config.apikey, {
        timeout: 10000,
    }).on("complete", resolve)
    .on("timeout", async () => {
        await hardRestartNode(username)
        resolve()
    }).on("error", async () => {
        await hardRestartNode(username)
        resolve()
    })
})

export const softRestartDJ = hardRestartDJ // not supported in beta

export const restartNode = softRestartNode

export const terminateNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("Terminating node");
    try {
        await destroyDJ(username)
    } catch (error) {
        logger.info(error)
    }
    await destroyUnit(username)
    await castDB.deleteUsername(username)
    await tunesDB.removeUser(username)
    logger.info("Terminated")
}

export const upgradeNode = async (username) => {
    const logger = moduleLogger.child({ username })
    await castDB.updateVersion(username)
    logger.info("updating node");
    try {
        createUnit(username)
    } catch (error) {
        logger.error(error)
    }
}

export const relocateNode = async (username) => {
    const logger = moduleLogger.child({ username })
    logger.info("relocating node");
    try {
        createUnit(username)
    } catch (error) {
        logger.error(error)
    }
}

export const upgradeDJ = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("updating DJ");
    await castDB.updateDJVersion(username)
    const config = await castDB.getInfoForUsername(username)
    if (config.DJ.enabled) {
        try {
            await destroyDJ(username)
        } catch (error) {
            logger.info(error)
        }
        await startDJ(username)
        logger.info("Created DJ")
    } else {
        try {
            await destroyDJ(username)
        } catch (error) {
            logger.info(error)
        }
    }
}

export const unsuspendNode = async (username) => {
    const logger = moduleLogger.child({ username })
    logger.info("unsuspending node")
    await createUnit(username)
    logger.info("Created node")
};

export const suspendNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("suspending node");
    await destroyUnit(username)
    try {
        destroyDJ(username)
    } catch (error) {
        logger.info(error)
    }
    logger.info("Deleted Unit")
};

export const supportedDirectories = [{
    name: "SHOUTcast.com",
    url: "https://yp.shoutcast.com",
    type: "Icecast",
}, {
    name: "dir.xiph.org",
    url: "http://dir.xiph.org/cgi-bin/yp-cgi",
    type: "Icecast",
}, {
    name: "internet-radio.com",
    url: "http://icecast-yp.internet-radio.com",
    type: "Icecast",
}]

export const addToDirectory = async (username, directory) => {
    delete directory.isEnabled;
    const logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(supportedDirectories, directory)) {
        logger.warn("Unknown directory, refusing to continue");
        throw new Error("Unknown directory.");
    }
    const config = await castDB.getInfoForUsername(username)
    if (!config.directories[directory.type]) {
        config.directories[directory.type] = [];
    }
    if (config.directories[directory.type].indexOf(directory.url) === -1) {
        config.directories[directory.type].push(directory.url);
    }
    logger.info("Updating config");
    await castDB.updateConfig(username, config)
    logger.info("Restarting node");
    await softRestartNode(username)
}

export const removeFromDirectory = async (username, directory) => {
    delete directory.isEnabled;
    const logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(supportedDirectories, directory)) {
        logger.warn("Unknown directory, refusing to continue");
        throw new Error("Unknown directory.");
    }
    const config = await castDB.getConfig(username)
    if (!config.directories[directory.type]) {
        config.directories[directory.type] = [];
    }
    config.directories[directory.type] = _.without(config.directories[directory.type], directory);
    await castDB.updateConfig(username, config)
    await softRestartNode(username)
}

export const configureStreams = async (username, streams = []) => {
    const logger = moduleLogger.child({ username, castStreams: streams })
    logger.info("Validating and configuring streams")
    let hasPrimary = false
    if (!streams.length) {
        throw new Error("You must have at least one stream.")
    }
    if (streams.length > 3) {
        throw new Error("You can only have 3 streams for now.")
    }
    for (let stream of streams) {
        if (!stream.stream || !stream.password) {
            throw new Error("How dare you send incomplete data?")
        }
        if (!stream.stream.includes("kbps")) {
            throw new Error("Invalid stream name.")
        }
        if (stream.primary && hasPrimary) {
            throw new Error("Only one stream can be primary.")
        } else if (typeof stream.primary !== "undefined" && stream.primary) {
            hasPrimary = true
        }
    }
    if (!hasPrimary) {
        throw new Error("One of your streams must be primary.");
    }

    logger.info("Updating config");

    const config = await castDB.getInfoForUsername(username)
    config.streams = streams
    await castDB.updateConfig(username, config)
    await softRestartNode(username)
}


export const configureDJ = async (username, djConfig = {}) => {
    const config = await castDB.getInfoForUsername(username)
    config.DJ.enabled = djConfig.enabled
    config.DJ.fadeLength = djConfig.fadeLength
    config.name = djConfig.name
    config.genre = djConfig.genre
    config.timezone = djConfig.timezone

    await castDB.updateConfig(username, config)
    await upgradeDJ(username)
}

export const getCastStreamUrl = castDB.getStreamUrl

export const setGeoLock = async (username, geolockConfig) => {
    const logger = moduleLogger.child({ username, geolockConfig })
    const config = await castDB.getInfoForUsername(username)
    config.geolock = geolockConfig;
    logger.info("Updating config");
    await castDB.updateConfig(username, config)
    await softRestartNode(username)
}

export const setAntiStreamRipper = async (username, isEnabled) => {
    const config = await castDB.getInfoForUsername(username)
    config.antiStreamRipper = isEnabled;
    await castDB.updateConfig(username, config)
    await softRestartNode(username)
}

export const setHideListenerCount = async (username, isEnabled) => {
    const config = await castDB.getInfoForUsername(username)
    config.hideListenerCount = isEnabled;
    await castDB.updateConfig(username, config)
    await softRestartNode(username)
}

export const setCustomDomain = async (username, domain) => {
    const config = await castDB.getInfoForUsername(username)
    config.hostname = `https://${domain}`;
    await castDB.updateConfig(username, config)
    return upgradeNode(username)
}

export const setBranch = async (username, branch) => {
    const config = await castDB.getInfoForUsername(username)
    config.branch = branch;
    await castDB.updateConfig(username, config)
    upgradeNode(username)
}
