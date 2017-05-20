/* global requireFromRoot */
let playerDatabase = requireFromRoot("components/player/database.js");
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = ({ app }) => {
    app.get("/player/:username", function (req, res, next) {
        if (!req.params.username) {
            return next(new BadRequestError("username is required"));
        }

        playerDatabase.getPlayer(req.params.username, function (error, player) {
            if (error) {
                return next(error);
            }
            res.json(player);
        });
    });
};
