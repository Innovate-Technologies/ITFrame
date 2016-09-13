/* global log */
/* global requireFromRoot */
let cast = {}
let castDB = require("./database.js")
let configHelper = require("./configHelper.js")
let wait = require("wait.for")
let fleet = requireFromRoot("components/coreos/fleet.js")
let _ = require("underscore")
let moduleLogger = log.child({ component: "cast" })
let rest = require("restler")
let randtoken = require("rand-token");

cast.createNode = (username, callback) => {
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

cast.createFleet = (username, callback) => {
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

cast.startNode = (username, callback) => {
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

cast.stopNode = (username, callback) => {
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

cast.startDJ = (username, callback) => {
    fleet.startUnit(`${username}-dj.service`, callback);
}

cast.stopDJ = (username, callback) => {
    fleet.stopUnit(`${username}-dj.service`, callback)
}

cast.destroyDJUnit = (username, callback) => {
    fleet.destroyUnit(`${username}-dj.service`, (fleetErr) => {
        if (fleetErr) {
            return callback(fleetErr)
        }
        setTimeout(callback, 2000)
    })
}

cast.destroyUnit = (username, callback) => {
    castDB.getInfoForUsername(username, (err, conf) => {
        if (err) {
            return callback(err)
        }
        cast.stopNode(username, (stopErr) => {
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

cast.hardRestartNode = (username, callback = () => { }) => {
    cast.stopNode(username, function (err) {
        if (err) {
            callback(err);
            return;
        }
        setTimeout(() => cast.startNode(username, callback), 2000);
    })
}

cast.hardRestartDJ = (username, callback = () => { }) => {
    cast.stopDJ(username, function (err) {
        if (err) {
            callback(err);
            return;
        }
        setTimeout(() => cast.startDJ(username, callback), 2000);
    })
}

cast.softRestartNode = (username, callback = () => { }) => {
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
                cast.hardRestartNode(username, callback)
            })
            .on("error", function () {
                cast.hardRestartNode(username, callback)
            })
    });
}

cast.softRestartDJ = cast.hardRestartDJ // not supported in beta

cast.restartNode = cast.softRestartNode

cast.terminateNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("Terminating node");
    wait.launchFiber(() => {
        try {
            wait.for(cast.stopNode, username)
            wait.for(cast.destroyUnit, username)
            wait.for(castDB.deleteUsername, username)
            cast.destroyDJUnit(username, () => { }) // to do: also destroy tunes in background
            logger.info("Terminated")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
}

cast.upgradeNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("updating node");
    wait.launchFiber(() => {
        try {
            wait.for(castDB.updateVersion, username)
            wait.for(cast.stopNode, username)
            wait.for(cast.destroyUnit, username)
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

cast.upgradeDJ = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("updating DJ");
    wait.launchFiber(() => {
        try {
            let config = wait.for(castDB.getInfoForUsername, username)
            if (config.DJ.enabled) {
                wait.for(castDB.updateDJVersion, username)
                wait.for(cast.stopDJ, username)
                wait.for(cast.destroyDJUnit, username)
                logger.info("Deleted Unit")
                logger.debug("Adding unit file")
                let fleetUnit = configHelper.createDJFleetUnit(username)
                wait.for(fleet.newUnit, fleetUnit.name, fleetUnit)
                logger.info("Created DJ")
            } else {
                wait.for(castDB.updateDJVersion, username)
                wait.for(cast.destroyDJUnit, username)
            }
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
}

cast.unsuspendNode = (username, callback) => {
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

cast.suspendNode = (username, callback) => {
    let logger = moduleLogger.child({ username });
    logger.info("suspending node");
    wait.launchFiber(() => {
        try {
            wait.for(cast.stopNode, username)
            wait.for(cast.destroyUnit, username)
            cast.destroyDJUnit(username, () => { })
            logger.info("Deleted Unit")
            return callback(null, true)
        } catch (err) {
            logger.error(err)
            return callback(err)
        }
    });
};

cast.supportedDirectories = [{
    name: "SHOUTcast.com",
    url: "https://yp.shoutcast.com",
    type: "Icecast",
}, {
        name: "dir.xiph.org",
        url: "http://dir.xiph.org/cgi-bin/yp-cgi",
        type: "Icecast",
    }]

cast.addToDirectory = (username, directory, callback) => {
    delete directory.isEnabled;
    let logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(cast.supportedDirectories, directory)) {
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
            cast.restartNode(username, callback);
        });
    });
}

cast.removeFromDirectory = (username, directory, callback) => {
    delete directory.isEnabled;
    let logger = moduleLogger.child({ username, directory });
    if (!_.findWhere(cast.supportedDirectories, directory)) {
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
        let directories = config.directories[directory.type];
        directories = _.without(directories, directory);
        castDB.updateConfig(username, config, function (error) {
            if (error) {
                logger.error(error);
                callback(error);
                return;
            }
            logger.info("Restarting node");
            cast.restartNode(username, callback);
        });
    });
}

cast.configureStreams = (username, streams = [], callback) => {
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
            cast.restartNode(username, callback);
        });
    })
}


cast.configureDJ = (username, djConfig = {}, callback) => {
    castDB.getInfoForUsername(username, function (err, config) {
        if (err) {
            callback(err);
            return;
        }
        config.DJ.enabled = djConfig.enabled
        config.DJ.fadeLength = djConfig.fadeLength
        config.name = djConfig.name
        config.genre = djConfig.genre

        castDB.updateConfig(username, config, function (error) {
            if (err) {
                callback(error);
                return;
            }
            cast.upgradeDJ(username, callback)
        });
    })
}

cast.getCastStreamUrl = (username, callback) => {
    castDB.getStreamUrl(username, callback);
}

cast.setGeoLock = (username, geolockConfig, callback) => {
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
            cast.restartNode(username, callback);
        });
    });
}

cast.setAntiStreamRipper = (username, isEnabled, callback) => {
    castDB.getInfoForUsername(username, (err, res) => {
        if (err) {
            return callback(err);
        }
        res.antiStreamRipper = isEnabled;
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                return callback(error);
            }
            cast.restartNode(username, callback);
        });
    });
}

cast.setHideListenerCount = (username, isEnabled, callback) => {
    castDB.getInfoForUsername(username, (err, res) => {
        if (err) {
            return callback(err);
        }
        res.hideListenerCount = isEnabled;
        castDB.updateConfig(username, res, function (error) {
            if (error) {
                return callback(error);
            }
            cast.restartNode(username, callback);
        });
    });
}

module.exports = cast;
