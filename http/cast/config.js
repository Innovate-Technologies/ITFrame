let timetoken = requireFromRoot("components/auth/timetoken.js");
let castDB = requireFromRoot("components/cast/database.js");
let wait = require("wait.for");

import BadRequestError from "~/http/classes/BadRequestError";
import AccessDeniedError from "~/http/classes/AccessDeniedError";

module.exports = function ({ app }) {
    app.all("/cast/*", function checkToken(req, res, next) {
        wait.launchFiber(() => {
            if (!req.body.token) {
                return next(new BadRequestError("No token found in the request body."));
            }
            try {
                let tokenIsValid = wait.for(timetoken.validateTokenForService, "cast", req.body.token);
                if (!tokenIsValid) {
                    return next(new AccessDeniedError("Access denied: invalid token."));
                }
                // Everything is fine with the token -- allow the request to continue.
                return next();
            } catch (error) {
                error.message = "Failed to validate token: " + error.message;
                return next(error);
            }
        });
    });

    app.post("/cast/config", function (req, res, next) {
        castDB.getInfoForUsername(req.body.username, function (error, config) {
            if (error) {
                return next(error);
            }
            res.json(config);
        });
    });
}
