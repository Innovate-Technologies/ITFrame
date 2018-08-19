/* global requireFromRoot */
import * as alexa from "~/components/alexa/alexa"
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = ({ app, wrap }) => {
    app.get("/alexa/:username", wrap(async (req, res, next) => {
        if (!req.params.username) {
            return next(new BadRequestError("username is required"));
        }
        return res.json(await alexa.entryForUsername(req.params.username))
    }));
};
