/* global requireFromRoot */
let wait = require("wait.for");
let cast = requireFromRoot("components/cast/manage.js");
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = ({ app }) => {

    app.post("/control/cast/dj/settings/:username", function (req, res, next) {
        if (!req.body.enabled) {
            throw new BadRequestError();
        }
        if (req.body.enabled && (!req.body.fadeLength || !req.body.name || !req.body.name) ) {
            throw new BadRequestError();
        }
        wait.launchFiber(function () {
            try {
                wait.for(cast.configureDJ, req.params.username, {
                    fadeLength: req.body.fadeLength,
                    name: req.body.name,
                    genre: req.body.genre,
                });
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to save the DJ settings");
                error.message = "Failed to save the DJ settings: " + error.message;
                return next(error);
            }
        });
    });
};
