let wait = require("wait.for");
let playerDatabase = requireFromRoot("components/player/database.js");
import NotFoundError from "~/http/classes/NotFoundError";
import * as nocover from "~/components/tunes/nocover";

module.exports = ({ app, wrap }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/player/settings/:username", wrap((req, res, next) => {
        wait.launchFiber(async function () {
            try {
                const config = wait.for(playerDatabase.getConfig, req.params.username)
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
    }));

    app.put("/control/player/settings/:username", (req, res, next) => {
        wait.launchFiber(function () {
            try {
                req.body.username = req.params.username;
                wait.for(playerDatabase.upsertConfig, req.params.username, req.body);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to update config");
                error.message = "Failed to update config: " + error.message;
                return next(error);
            }
        });
    });

    app.delete("/control/player/settings/:username", function (req, res, next) {
        wait.launchFiber(function () {
            try {
                wait.for(playerDatabase.removeConfig, req.params.username);
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to delete config");
                error.message = "Failed to delete config: " + error.message;
                return next(error);
            }
        });
    });

};
