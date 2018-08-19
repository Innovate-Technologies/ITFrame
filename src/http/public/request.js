/* global requireFromRoot */
import * as request from "~/components/social/request"
import BadRequestError from "~/http/classes/BadRequestError";
import RateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"
import redis from "redis";

const limiter = new RateLimit({
    store: new RedisStore({
        client: redis.createClient(6379, "redis"),
        prefix: "rate-limit-song-request:",
    }),
    windowMs: 1000, // 1 second
    max: 1, // limit each IP to 1 request per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
});


module.exports = ({ app, wrap }) => {
    app.post("/song-request/:username", limiter, wrap(async (req, res, next) => {
        if (!req.params.username) {
            return next(new BadRequestError("username is required"));
        }
        return res.json(await request.newForUsername(req.params.username, req.body))
    }));
};
