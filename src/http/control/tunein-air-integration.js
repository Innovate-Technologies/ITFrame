let tuneinDatabase = requireFromRoot("components/nowplaying/tuneinDatabase.js");
let tuneinModule = requireFromRoot("components/nowplaying/tunein.js")
import NotFoundError from "~/http/classes/NotFoundError";

module.exports = function ({ app }) {
    app.get("/control/tunein-air-integration/settings/:username", async (req, res, next) => {
        try {
            res.json(await tuneinDatabase.getInfo(req.params.username));
        } catch (error) {
            if (error.message !== "Username not in database") {
                req.log.warn(error, "Failed to get settings");
            }
            return next(new NotFoundError("Failed to get TuneIn AIR settings: " + error.message));
        }
    });

    app.put("/control/tunein-air-integration/settings/:username", async (req, res, next) => {
        try {
            let settings = req.body || {};
            settings.username = req.params.username;
            await tuneinModule.testInfo(settings)
            await tuneinDatabase.upsert(req.params.username, settings);
            res.json({});
        } catch (error) {
            req.log.warn(error, "Failed to update settings");
            return next(error);
        }
    });

    app.delete("/control/tunein-air-integration/settings/:username", async (req, res, next) => {
        try {
            await tuneinDatabase.remove(req.params.username);
            res.json({});
        } catch (error) {
            req.log.warn(error, "Failed to remove settings");
            return next(error);
        }
    });
};
