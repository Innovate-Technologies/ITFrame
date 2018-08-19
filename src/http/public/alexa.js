/* global requireFromRoot */
import * as alexa from "~/components/alexa/alexa"
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = ({ app, wrap }) => {
    app.get("/alexa/:username", wrap(async (req, res, next) => {
        if (!req.params.username) {
            return next(new BadRequestError("username is required"));
        }
        const entry = await alexa.entryForUsername(req.params.username)
        if (!entry) {
            return next(new BadRequestError("username is not found"));
        }
        entry.tuneInURL = await alexa.getTuneInURL(req.params.username)
        return res.json(entry)
    }));
};