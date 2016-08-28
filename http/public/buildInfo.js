import * as buildinfoDatabase from "app/components/buildinfo/database.js";
import * as BadRequestError from "app/http/classes/BadRequestError";

export default ({ app }) => {
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
