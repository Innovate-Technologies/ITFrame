import _ from "underscore"
import rest from "restler"
import * as castDB from "./database.js"
import * as configHelper from "./configHelper.js"
import * as tunesDB from "../tunes/personalMusicDatabase.js"
import fleet from "../coreos/fleet.js"
const moduleLogger = log.child({ component: "cast" })


export const createNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("Making configuration")
    const config = await configHelper.createConfigForNewUser(username)
    logger.debug("Adding configuration to database")
    await castDB.addConfigForUsername(username, config)
    await createFleet(username)
}

export const createFleet = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.debug("Adding unit file")
    const fleetUnit = await configHelper.createFleetUnit(username)
    logger.debug("Created unit file", fleetUnit)
    await fleet.newUnit(fleetUnit.name, fleetUnit)
    logger.info("Created node")
}

export const startNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("Starting node");
    const config = await castDB.getInfoForUsername(username)
    return fleet.startUnit(`${username}-${config.input.SHOUTcast.toString()}.service`);
}

export const stopNode = async (username) => {
    let logger = moduleLogger.child({ username });
    logger.info("Stopping node");
    const config = await castDB.getInfoForUsername(username)
    return fleet.stopUnit(`${username}-${config.input.SHOUTcast.toString()}.service`);
}

export const startDJ = (username) => {
    return fleet.startUnit(`${username}-dj.service`);
}

export const stopDJ = (username) => {
    return fleet.stopUnit(`${username}-dj.service`)
}

export const destroyDJUnit = (username) => {
    return fleet.destroyUnit(`${username}-dj.service`)
}

export const destroyUnit = async (username) => {
    const config = await castDB.getInfoForUsername(username)
    return fleet.destroyUnit(`${username}-${config.input.SHOUTcast.toString()}.service`);
}

export const hardRestartNode = async (username) => {
    await stopNode(username)
    await startNode(username)
}

export const hardRestartDJ = async (username) => {
    await stopDJ(username)
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
        await stopDJ(username)
        await destroyDJUnit(username)
    } catch (error) {
        logger.info(error)
    }
    await stopNode(username)
    await destroyUnit(username)
    await castDB.deleteUsername(username)
    await tunesDB.removeUser(username)
    logger.info("Terminated")
}

export const upgradeNode = async (username) => {
    const logger = moduleLogger.child({ username })
    logger.info("updating node");
    try { // to fix missing unit file
        await stopNode(username)
        await destroyUnit(username)
    } catch (error) {
        logger.error(error)
    }
    logger.info("Deleted Unit")
    await sleep(2000) // make sure unit has been deleted
    await castDB.updateVersion(username)
    await createFleet(username)
    logger.info("Created node")
}

const sleep = (time) => new Promise((resolve) => {
    setTimeout(resolve, time)
})

export const upgradeDJ = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("updating DJ");
    await castDB.updateDJVersion(username)
    const config = await castDB.getInfoForUsername(username)
    if (config.DJ.enabled) {
        try {
            await stopDJ(username)
            await destroyDJUnit(username)
        } catch (error) {
            logger.info(error)
        }
        const fleetUnit = configHelper.createDJFleetUnit(username)
        await fleet.newUnit(fleetUnit.name, fleetUnit)
        logger.info("Created DJ")
    } else {
        try {
            await destroyDJUnit(username)
        } catch (error) {
            logger.info(error)
        }
    }
}

export const unsuspendNode = async (username) => {
    const logger = moduleLogger.child({ username })
    logger.info("unsuspending node")
    await createFleet(username)
    logger.info("Created node")
};

export const suspendNode = async (username) => {
    const logger = moduleLogger.child({ username });
    logger.info("suspending node");
    await stopNode(username)
    await destroyUnit(username)
    try {
        destroyDJUnit(username)
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
