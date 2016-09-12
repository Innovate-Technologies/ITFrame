import _ from "underscore"
import randtoken from "rand-token"
import rest from "restler"
import wait from "wait.for"

import * as castDB from "app/components/cast/database.js"
import * as configHelper from "app/components/cast/configHelper.js"
import fleet from "app/components/coreos/fleet.js"

const moduleLogger = log.child({ component: "cast" })

export const createNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    wait.launchFiber(() => {
        try {
            logger.info("Making configuration")
            let config = wait.for(configHelper.createConfigForNewUser, username)
            logger.debug("Adding configuration to database")
            wait.for(castDB.addConfigForUsername, username, config)
            logger.debug("Adding unit file")
            let fleetUnit = wait.for(configHelper.createFleetUnit, username)
            wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
            logger.info("Created node")
            return callback(null, true)
        } catch (error) {
            logger.error(error)
            return callback(error)
        }
    })
}

export const createFleet = (username, callback) => {
    let logger = moduleLogger.child({ username });
    wait.launchFiber(() => {
        try {
            logger.debug("Adding unit file")
            let fleetUnit = wait.for(configHelper.createFleetUnit, username)
            wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
            logger.info("Created node")
            return callback(null, true)
        } catch (error) {
            logger.error(error)
            return callback(error)
        }
    })
}

export const startNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Starting node");
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err, "Failed to get information for user");
            return callback(err);
        }
        fleet.startUnit(`${username}-${res.input.SHOUTcast.toString()}.service`, callback);
    });
}

export const stopNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Stopping node");
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err, "Failed to get information for user");
            return callback(err)
        }
        fleet.stopUnit(`${username}-${res.input.SHOUTcast.toString()}.service`, callback)
    })
}

export const startDJ = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Starting DJ");
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err, "Failed to get information for user");
            return callback(err);
        }
        fleet.startUnit(`dj-${username}-${res.input.SHOUTcast.toString()}.service`, callback);
    });
}

export const stopDJ = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Stopping DJ");
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err, "Failed to get information for user");
            return callback(err)
        }
        fleet.stopUnit(`dj-${username}-${res.input.SHOUTcast.toString()}.service`, callback)
    })
}

export const destroyDJUnit = (username, callback) => {
    castDB.getInfoForUsername(username, (err, conf) => {
        if (err) {
            return callback(err)
        }
        stopNode(username, (stopErr) => {
            if (stopErr) {
                return callback(stopErr)
            }
            fleet.destroyUnit("dj-" + username + "-" + conf.input.SHOUTcast.toString() + ".service", (fleetErr) => {
                if (fleetErr) {
                    return callback(fleetErr)
                }
                setTimeout(callback, 2000)
            })
        })
    })
}

export const destroyUnit = (username, callback) => {
    castDB.getInfoForUsername(username, (err, conf) => {
        if (err) {
            return callback(err)
        }
        stopNode(username, (stopErr) => {
            if (stopErr) {
                return callback(stopErr)
            }
            fleet.destroyUnit(username + "-" + conf.input.SHOUTcast.toString() + ".service", (fleetErr) => {
                if (fleetErr) {
                    return callback(fleetErr)
                }
                setTimeout(callback, 2000)
            })
        })
    })
}

export const hardRestartNode = (username, callback = () => {}) => {
    stopNode(username, function (err) {
        if (err) {
            callback(err);
            return;
        }
        setTimeout(() => startNode(username, callback), 2000);
    })
}

export const hardRestartDJ = (username, callback = () => {}) => {
    stopDJ(username, function (err) {
        if (err) {
            callback(err);
            return;
        }
        setTimeout(() => startDJ(username, callback), 2000);
    })
}

export const softRestartNode = (username, callback = () => {}) => {
    let logger = moduleLogger.child({ username });
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err, "Failed to get information for user");
            return callback(err);
        }
        rest.get(res.hostname + "/itframe/restart/?key=" + res.apikey, {
            timeout: 10000,
        }).on("complete", function () {
            callback(null, true);
        })
        .on("timeout", function () {
            hardRestartNode(username, callback)
        })
        .on("error", function () {
            hardRestartNode(username, callback)
        })
    });
}

export const softRestartDJ = hardRestartDJ // not supported in beta

export const restartNode = softRestartNode

export const terminateNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Terminating node");
    wait.launchFiber(() => {
        try {
            wait.for(stopNode, username)
            wait.for(destroyUnit, username)
            wait.for(castDB.deleteUsername, username)
            destroyDJUnit(username, () => {}) // to do: also destroy tunes in background
            logger.info("Terminated")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
}

export const upgradeNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("updating node");
    wait.launchFiber(() => {
        try {
            wait.for(castDB.updateVersion, username)
            wait.for(stopNode, username)
            wait.for(destroyUnit, username)
            logger.info("Deleted Unit")
            logger.debug("Adding unit file")
            let fleetUnit = wait.for(configHelper.createFleetUnit, username)
            wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
            logger.info("Created node")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
}

export const upgradeDJ = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("updating DJ");
    wait.launchFiber(() => {
        try {
            let config = wait.for(castDB.getInfoForUsername, username)
            if (config.DJ.enabled) {
                wait.for(castDB.updateDJVersion, username)
                wait.for(stopDJ, username)
                wait.for(destroyDJUnit, username)
                logger.info("Deleted Unit")
                logger.debug("Adding unit file")
                let fleetUnit = wait.for(configHelper.createDJFleetUnit, username)
                wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
                logger.info("Created DJ")
            } else {
                wait.for(castDB.updateDJVersion, username)
                wait.for(destroyDJUnit, username)
            }
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
}

export const unsuspendNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("unsuspending node");
    wait.launchFiber(() => {
        try {
            logger.debug("Adding unit file")
            let fleetUnit = wait.for(configHelper.createFleetUnit, username)
            wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
            logger.info("Created node")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
};

export const suspendNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("suspending node");
    wait.launchFiber(() => {
        try {
            wait.for(stopNode, username)
            wait.for(destroyUnit, username)
            destroyDJUnit(username, () => {})
            logger.info("Deleted Unit")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
};

export const supportedDirectories = [{
    name: "SHOUTcast.com",
    url: "https://yp.shoutcast.com",
    type: "Icecast",
}, {
    name: "dir.xiph.org",
    url: "http://dir.xiph.org/cgi-bin/yp-cgi",
    type: "Icecast",
}]

export const addToDirectory = (username, directory, callback) => {
    delete directory.isEnabled;
    let logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(supportedDirectories, directory)) {
        logger.warn("Unknown directory, refusing to continue");
        callback(new Error("Unknown directory."));
        return
    }
    castDB.getInfoForUsername(username, function (err, res) {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        }
        if (typeof res.directories[directory.type] === "undefined") {
            res.directories[directory.type] = [];
        }
        res.directories[directory.type].push(directory.url);
        logger.info("Updating config");
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                logger.error(error);
                callback(error);
                return;
            }
            logger.info("Restarting node");
            restartNode(username, callback);
        });
    });
}

export const removeFromDirectory = (username, directory, callback) => {
    delete directory.isEnabled;
    let logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(supportedDirectories, directory)) {
        logger.warn("Unknown directory, refusing to continue");
        callback(new Error("Unknown directory."));
        return
    }
    castDB.getConfig(username, function (err, config) {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        }
        if (typeof config.directories[directory.type] === "undefined") {
            config.directories[directory.type] = [];
        }
        config.directories[directory.type] = _.without(config.directories[directory.type], directory);
        castDB.updateConfig(username, config, function (error) {
            if (error) {
                logger.error(error);
                callback(error);
                return;
            }
            logger.info("Restarting node");
            restartNode(username, callback);
        });
    });
}

export const configureStreams = (username, streams = [], callback) => {
    let logger = moduleLogger.child({ username, castStreams: streams });
    logger.info("Validating and configuring streams");
    let hasPrimary = false
    if (!streams.length) {
        return callback(new Error("You must have at least one stream."));
    }
    if (streams.length > 3) {
        return callback(new Error("You can only have 3 streams for now."));
    }
    for (let stream of streams) {
        if (typeof stream.stream === "undefined" || typeof stream.password === "undefined") {
            callback(new Error("How dare you send incomplete data?"));
            return
        }
        if (!stream.stream.includes("kbps")) {
            callback(new Error("Invalid stream name."));
            return
        }
        if (stream.primary && hasPrimary) {
            callback(new Error("Only one stream can be primary."));
            return
        } else if (typeof stream.primary !== "undefined" && stream.primary) {
            hasPrimary = true
        }
    }
    if (!hasPrimary) {
        callback(new Error("One of your streams must be primary."));
        return
    }

    logger.info("Updating config");

    castDB.getInfoForUsername(username, function (err, config) {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        }
        config.streams = streams
        castDB.updateConfig(username, config, function (error) {
            if (err) {
                logger.error(error);
                callback(error);
                return;
            }
            restartNode(username, callback);
        });
    })
}


export const configureDJ = (username, djConfig = {}, callback) => {
    castDB.getInfoForUsername(username, function (err, config) {
        if (err) {
            callback(err);
            return;
        }
        config.DJ.enabled = djConfig.enabled
        config.DJ.fadeLength = djConfig.fadeLength
        config.name = djConfig.name
        config.genre = djConfig.genre

        if (!config.internal.dj) {
            config.internal.dj = {
                key: randtoken.generate(30),
            }
        }
        castDB.updateConfig(username, config, function (error) {
            if (err) {
                callback(error);
                return;
            }
            upgradeDJ(username, callback)
        });
    })
}

export const getCastStreamUrl = (username, callback) => {
    castDB.getStreamUrl(username, callback);
}

export const setGeoLock = (username, geolockConfig, callback) => {
    let logger = moduleLogger.child({ username, geolockConfig });
    castDB.getInfoForUsername(username, (err, res) => {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        }
        res.geolock = geolockConfig;
        logger.info("Updating config");
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                logger.error(error);
                callback(error);
                return;
            }
            logger.info("Restarting node");
            restartNode(username, callback);
        });
    });
}

export const setAntiStreamRipper = (username, isEnabled, callback) => {
    castDB.getInfoForUsername(username, (err, res) => {
        if (err) {
            return callback(err);
        }
        res.antiStreamRipper = isEnabled;
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                return callback(error);
            }
            restartNode(username, callback);
        });
    });
}

export const setHideListenerCount = (username, isEnabled, callback) => {
    castDB.getInfoForUsername(username, (err, res) => {
        if (err) {
            return callback(err);
        }
        res.hideListenerCount = isEnabled;
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                return callback(error);
            }
            restartNode(username, callback);
        });
    });
}
