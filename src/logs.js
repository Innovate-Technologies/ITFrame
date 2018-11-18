/**
 * This file sets up the logging system and also sets up the
 * external logs system if enabled in the config.
 *
 * The log module will be called by the whole application a lot
 * during its lifetime and is expected to implement the following methods:
 * child(), trace(), debug(), info(), warn(), error(), fatal(), flushQueue().
 */

let bunyan = require("bunyan");
let gelfStream = require("gelf-stream");
let streams = [{ level: "debug", stream: process.stdout }];
let externalSystem;

if (config.sendLogsToGraylog && config.graylogServer && config.graylogPort) {
    streams.push({
        level: "debug",
        name: "graylog",
        type: "raw",
        stream: gelfStream.forBunyan(config.graylogServer, config.graylogPort),
    });
}

if (config.sendLogsToStackdriver && config.stackdriverProject && config.stackdriverKey) {
    // Imports the Google Cloud client library for Bunyan (Node 6+)
    const {LoggingBunyan} = require('@google-cloud/logging-bunyan');

    // Creates a Bunyan Stackdriver Logging client
    const loggingBunyan = new LoggingBunyan({
        projectId: config.stackdriverProject,
        keyFilename: config.stackdriverKey,
    });
    streams.push(loggingBunyan.stream("debug"));
}


if (config.sendLogsToExternal) {
    externalSystem = require("./logs-external");
    streams.push({
        level: "debug",
        name: "logs-external",
        type: "raw",
        stream: externalSystem,
    });
}

let reqSerializer = (req) => {
    var filteredReq = {
        method: req.method,
        url: req.url,
        ip: req.ip,
    };
    if (req.product) {
        filteredReq.product = {
            id: req.product.id,
            name: req.product.name,
            group: req.product.group,
            server: req.product.server,
            username: req.product.username,
        };
    }
    if (req.user) {
        filteredReq.user = {
            email: req.user.email,
            iat: new Date(req.user.iat * 1000),
            exp: new Date(req.user.exp * 1000),
        };
    }
    return filteredReq;
};

let logger = bunyan.createLogger({
    name: "itframe",
    streams: streams,
    serializers: {
        req: reqSerializer,
        res: bunyan.stdSerializers.res,
        err: bunyan.stdSerializers.err,
    },
});

logger.flushQueue = () => {
    if (externalSystem) {
        externalSystem.flushQueue();
    }
};

module.exports = logger;
