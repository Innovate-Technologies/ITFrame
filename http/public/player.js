import BadRequestError from "app/http/classes/BadRequestError";
import * as playerDatabase from "app/components/player/database.js";

export default ({ app }) => {
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
