import BadRequestError from "../classes/BadRequestError";
import AccessDeniedError from "../classes/AccessDeniedError";
import * as listeners from "../../components/cast/stats/listeners.js"
import * as sessions from "../../components/cast/stats/sessions.js"

const cast = require("../../components/cast/database.js")

export default ({ app, wrap }) => {
    app.all("/cast/statistics/:user/:key/*", wrap(async (req, res, next) => {
        if (!req.params.user || !req.params.key) {
            throw new BadRequestError("Missing parameters")
        }
        if (! (await cast.checkStatsKey(req.params.user, req.params.key))) {
            throw new AccessDeniedError("Invalid username and/or key")
        }
        return next()
    }))

    app.post("/cast/statistics/:user/:key/create-session", wrap(async (req, res) => {
        if (!req.params.ip || !req.params.starttime) {
            throw new BadRequestError("Missing parameters")
        }
        let listenerProfile = await listeners.getListenerForInfo(req.params.ip, req.params.client)
        if (!listenerProfile) {
            listenerProfile = await listeners.addListenerProfile(req.params.username, req.params)
        }
        const session = await sessions.startSession(req.params.username, listenerProfile._id)
        res.json({ uid: session._id })
    }))

    app.post("/cast/statistics/:user/:key/close-session", wrap(async (req, res) => {
        if (!req.params.uid) {
            throw new BadRequestError("Missing parameters")
        }
        await sessions.endSession(req.params.username, req.params.uid)
        res.json({status: "ok"})
    }))

    app.post("/cast/statistics/:user/:key/close-all-sessions", wrap(async (req, res) => {
        await sessions.closeAllSessionsForUsername(req.params.username)
        res.json({status: "ok"})
    }))

}
