import wait from "wait.for";
import * as tuneinDatabase from "app/components/nowplaying/tuneinDatabase.js";
import * as tuneinModule from "app/components/nowplaying/tunein.js"
import NotFoundError from "app/http/classes/NotFoundError";

export default function ({ app }) {
    app.get("/control/tunein-air-integration/settings/:username", function (req, res, next) {
        wait.launchFiber(function () {
            try {
                res.json(wait.for(tuneinDatabase.getInfo, req.params.username));
            } catch (error) {
                if (error.message !== "Username not in database") {
                    req.log.warn(error, "Failed to get settings");
                }
                return next(new NotFoundError("Failed to get TuneIn AIR settings: " + error.message));
            }
        });
    });

    app.put("/control/tunein-air-integration/settings/:username", function (req, res, next) {
        wait.launchFiber(function () {
            try {
                let settings = req.body || {};
                settings.username = req.params.username;
                wait.for(tuneinModule.testInfo, settings)
                wait.for(tuneinDatabase.upsert, req.params.username, settings);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to update settings");
                return next(error);
            }
        });
    });

    app.delete("/control/tunein-air-integration/settings/:username", function (req, res, next) {
        wait.launchFiber(function () {
            try {
                wait.for(tuneinDatabase.remove, req.params.username);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to remove settings");
                return next(error);
            }
        });
    });
}
