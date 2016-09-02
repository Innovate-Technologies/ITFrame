import fs from "fs";

import _ from "underscore";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import expressJwt from "express-jwt";
import jwt from "jsonwebtoken";
import socketio from "socket.io";

const app = express();
const http = require("http").createServer(app);
const io = socketio.listen(http);

const moduleLogger = log.child({ component: "http" });

export default function () {

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

    app.use(bodyParser.json({ limit: "1024mb" }));
    app.use(bodyParser.urlencoded({
        extended: true,
        limit: "1024mb",
    }));

    http.listen(config.port);

    // Used in route handlers to catch async exceptions as if they were synchronous.
    let wrap = fn => (...args) => fn(...args).catch(args[2]);

    var params = {
        app: app,
        jwt: jwt,
        expressJwt: expressJwt,
        io: io,
        wrap,
    }

    var modules = _.without(
        fs.readdirSync(global.appRoot + "/http"),
        "loader.js", "classes", "error-handlers"
    )
    for (let module of modules) {
        if (module.includes(".")) {
            moduleLogger.info("Loading file: " + module);
            try {
                require("app/http/" + module)(params)
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
                require(`app/http/${file}`)(params);
            } catch (error) {
                moduleLogger.fatal(error, `Failed to load ${file}.`);
                process.exit(1);
            }
        }
    }

    require("app/http/error-handlers/not-found.js")(params);
    require("app/http/error-handlers/all-other-errors.js")(params);

    let humanReadableRoutes = app._router.stack
        .filter((route) => route.route && route.route.methods)
        .map((route) => `${Object.keys(route.route.methods).join(",").toUpperCase()} ${route.route.path}`);
    moduleLogger.info("All defined application routes", humanReadableRoutes);

}
