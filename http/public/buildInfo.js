/* global requireFromRoot */
let buildinfoDatabase = requireFromRoot("components/buildinfo/database.js");
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = ({ app }) => {
    app.get("/buildinfo/:name", function (req, res, next) {
        if (!req.params.name) {
            return next(new BadRequestError("Name is required"));
        }

        buildinfoDatabase.buildInfoForName(req.params.name, function (error, build) {
            if (error) {
                return next(error);
            }
            res.json(build);
        });
    });
};
