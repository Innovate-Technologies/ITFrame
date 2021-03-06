let playerDatabase = requireFromRoot("components/player/database.js");
import NotFoundError from "~/http/classes/NotFoundError";
import * as nocover from "~/components/tunes/nocover";

module.exports = ({ app, wrap }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/player/settings/:username", async (req, res, next) => {
        try {
            const config = await playerDatabase.getConfig(req.params.username)
            if (config) {
                const nocoverEntry = await nocover.nocoverForUserame(req.params.username)
                if (nocoverEntry) {
                    config.nocover = nocoverEntry.link
                }
            }
            res.json(config);
        } catch (error) {
            if (error.message !== "Username not in database") {
                req.log.warn(error, "Failed to get settings");
            }
            return next(new NotFoundError("Failed to get settings: " + error.message));
        }
    });

    app.put("/control/player/settings/:username", async (req, res, next) => {
        try {
            req.body.username = req.params.username;
            await playerDatabase.upsertConfig(req.params.username, req.body);
            res.json({});
        } catch (error) {
            req.log.warn(error, "Failed to update config");
            error.message = "Failed to update config: " + error.message;
            return next(error);
        }
    });

    app.delete("/control/player/settings/:username", async (req, res, next) => {
        try {
            await playerDatabase.removeConfig(req.params.username);
            res.json({});
        } catch (error) {
            req.log.warn(error, "Failed to delete config");
            error.message = "Failed to delete config: " + error.message;
            return next(error);
        }
    });

};
