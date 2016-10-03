const buildinfoDatabase = requireFromRoot("components/buildinfo/database.js");
import BadRequestError from "~/http/classes/BadRequestError";

export default ({ app, wrap }) => {
    app.get("/buildinfo/:name", wrap(async (req, res) => {
        if (!req.params.name) {
            throw new BadRequestError("Name is required")
        }
        res.json(await buildinfoDatabase.buildInfoForName(req.params.name))
    }))
};
