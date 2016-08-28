import wait from "wait.for";

import BadRequestError from "app/http/classes/BadRequestError";
import * as cast from "app/components/cast/manage.js";
import * as castDatabase from "app/components/cast/database.js";
import NotFoundError from "app/http/classes/NotFoundError";

export default ({ app }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/configuration/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                let castConfig = wait.for(castDatabase.getInfoForUsername, req.params.username);
                castConfig.internal = {};
                res.json(castConfig);
            } catch (error) {
                req.log.warn(error, "Failed to get config");
                return next(new NotFoundError("Failed to get config: " + error.message));
            }
        });
    });

    app.post("/control/cast/upgrade/:username", function (req, res, next) {
        wait.launchFiber(function () {
            try {
                wait.for(cast.upgradeNode, req.params.username);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to upgrade");
                error.message = "Failed to upgrade: " + error.message;
                return next(error);
            }
        });
    });


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Directories
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/directories/get-supported", function (req, res) {
        res.json(cast.supportedDirectories);
    });

    app.post("/control/cast/directories/enable/:username", function (req, res, next) {
        if (!req.body.directory) {
            throw new BadRequestError();
        }
        wait.launchFiber(function () {
            try {
                wait.for(cast.addToDirectory, req.params.username, req.body.directory);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to enable directory");
                error.message = "Failed to enable directory: " + error.message;
                return next(error);
            }
        });
    });

    app.post("/control/cast/directories/disable/:username", function (req, res, next) {
        if (!req.body.directory) {
            throw new BadRequestError();
        }
        wait.launchFiber(function () {
            try {
                wait.for(cast.removeFromDirectory, req.params.username, req.body.directory);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to disable directory");
                error.message = "Failed to disable directory: " + error.message;
                return next(error);
            }
        });
    });


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Streams
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/streams/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                wait.for(cast.configureStreams, req.params.username, req.body);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to configure streams");
                error.message = "Failed to configure streams: " + error.message;
                return next(error);
            }
        });
    });

    app.put("/control/cast/configure-dj/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                /*
                    {
                        enabled: Boolean,
                        name: String,
                        genre: String,
                        fadeLength: Number,
                    }
                */
                wait.for(cast.configureDJ, req.params.username, req.body);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to configure DJ");
                error.message = "Failed to configure DJ: " + error.message;
                return next(error);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // GeoLock
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/geolock/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                wait.for(cast.setGeoLock, req.params.username, req.body);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to configure streams");
                error.message = "Failed to configure streams: " + error.message;
                return next(error);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Extra features
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/anti-stream-ripper/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                wait.for(cast.setAntiStreamRipper, req.params.username, req.body.isEnabled);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to configure streams");
                error.message = "Failed to configure streams: " + error.message;
                return next(error);
            }
        });
    });

    app.put("/control/cast/hide-listener-count/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                wait.for(cast.setHideListenerCount, req.params.username, req.body.isEnabled);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to configure streams");
                error.message = "Failed to configure streams: " + error.message;
                return next(error);
            }
        });
    });

};
