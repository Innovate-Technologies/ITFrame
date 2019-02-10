var bodyParser = require("body-parser");
var fs = require("fs");
var express = require("express");
const Sentry = require('@sentry/node');
var expressJwt = require("express-jwt");
var jwt = require("jsonwebtoken");
var app = express();
var http = require("http").createServer(app);
var _ = require("underscore");
var cors = require("cors");
let moduleLogger = log.child({ component: "http" });

const filterSlack = (fn) => { // Slack is not a fan of body parsers so we should not use them on those
    return (req, res, next) => {
        if (req.path.indexOf("/slack") === 0) {
            return next();
        }

        return fn(req, res, next);
    }
}

const controlCors = (req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Headers", "DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization")
    res.setHeader("Access-Control-Allow-Method", "GET, POST, OPTIONS, PUT, DELETE")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Max-Age", "1728000")

    if (req.method == "OPTIONS") {
        res.setHeader("Content-Type", "text/plain charset=UTF-8")
        res.setHeader("Content-Length", "0")
        return res.status(204).send()
    }

    next();
}

module.exports = function () {

    if (global.config.sentryDSN) {
        Sentry.init({ dsn: global.config.sentryDSN })
        app.use(Sentry.Handlers.requestHandler())
    }

    app.use(controlCors)

    app.use(function (req, res, next) {
        let requestId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        req.log = log.child({
            "req_id": requestId,
            req: {
                method: req.method,
                url: req.url,
                ip: req.ip,
            },
        });
        next();
    });

    if (config.trustXFF) {
        moduleLogger.info("Trusting the XFF header");
        app.enable("trust proxy");
    }

    app.use(function (req, res, next) {
        res.setHeader("X-Powered-By", "ITFrame " + global.ITFrame.version)
        next();
    });

    if (config.enableCORS) {
        moduleLogger.info("Enabling CORS");
        app.use(cors());
        app.options("*", cors());
    }

    app.use(filterSlack(bodyParser.json({ limit: "1024mb" })));
    app.use(filterSlack(bodyParser.urlencoded({
        extended: true,
        limit: "1024mb",
    })));

    http.listen(config.port);

    // Used in route handlers to catch async exceptions as if they were synchronous.
    let wrap = fn => (...args) => fn(...args).catch(args[2]);

    var params = {
        app: app,
        jwt: jwt,
        expressJwt: expressJwt,
        wrap,
    }

    const disabledModules = global.config.disabledModules || []

    var modules = _.without(
        fs.readdirSync(global.appRoot + "/http"),
        "loader.js", "classes", "error-handlers"
    )
    for (let module of modules) {
        if (disabledModules.indexOf(module) >= 0) {
            continue
        }
        if (module.includes(".")) {
            moduleLogger.info("Loading file: " + module);
            try {
                require(global.appRoot + "/http/" + module)(params)
            } catch (error) {
                moduleLogger.fatal(error, `Failed to load ${module}.`);
                process.exit(1);
            }
            continue;
        }

        moduleLogger.info("Loading module: " + module);
        var submodules = fs.readdirSync(global.appRoot + "/http/" + module)
        for (let submodule of submodules) {
            let file = `${module}/${submodule}`;
            moduleLogger.info("Loading file: " + file);
            try {
                requireFromRoot(`http/${file}`)(params);
            } catch (error) {
                moduleLogger.fatal(error, `Failed to load ${file}.`);
                process.exit(1);
            }
        }
    }

    requireFromRoot("http/error-handlers/not-found.js")(params);
    requireFromRoot("http/error-handlers/all-other-errors.js")(params);

    let humanReadableRoutes = app._router.stack
        .filter((route) => route.route && route.route.methods)
        .map((route) => `${Object.keys(route.route.methods).join(",").toUpperCase()} ${route.route.path}`);
    moduleLogger.info("All defined application routes", humanReadableRoutes);
    if (global.config.sentryDSN) {
        app.use(Sentry.Handlers.errorHandler());
    }
}
