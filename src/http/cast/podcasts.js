import BadRequestError from "../classes/BadRequestError";
import AccessDeniedError from "../classes/AccessDeniedError";
import * as feedInfo from "../../components/cast/podcast/feedInfo"
import * as episodes from "../../components/cast/podcast/episodes"

const cast = requireFromRoot("components/cast/database.js")

export default ({ app, wrap }) => {

    // All routes require to contain both username and key on every request

    app.all("/cast/podcasts/:user/:key/*", wrap(async (req, res, next) => {
        if (!req.params.user || !req.params.key) {
            throw new BadRequestError("Missing parameters")
        }
        if (! (await cast.checkStatsKey(req.params.user, req.params.key))) {
            throw new AccessDeniedError("Invalid username and/or key")
        }
        return next()
    }))

    app.get("/cast/podcasts/:user/:key/feed-info", wrap(async (req, res) => {
        res.json(feedInfo.getForUsername(req.params.user))
    }))

    app.get("/cast/podcasts/:user/:key/episodes", wrap(async (req, res) => {
        res.json(episodes.getForUsername(req.params.user))
    }))

}
