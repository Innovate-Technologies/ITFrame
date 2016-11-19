import BadRequestError from "../classes/BadRequestError";
import AccessDeniedError from "../classes/AccessDeniedError";
import * as listeners from "../../components/cast/stats/listeners.js"
import * as sessions from "../../components/cast/stats/sessions.js"
import * as calculated from "../../components/cast/stats/calculated.js"

const cast = requireFromRoot("components/cast/database.js")

export default ({ app, wrap }) => {

    // All routes require to contain both username and key on every request

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
        if (!req.body.ip || !req.body.starttime) {
            throw new BadRequestError("Missing parameters")
        }
        req.body.geo = req.body.location || {}
        req.body.geo.countryCode = req.body.countrycountryCode
        req.body.geo.country = req.body.country
        let listenerProfile = await listeners.getListenerForInfo(req.params.user, req.body.ip, req.body.client)
        if (!listenerProfile) {
            listenerProfile = await listeners.addListenerProfile(req.params.user, req.body)
        }
        const session = await sessions.startSession(req.params.user, listenerProfile._id, req.body.stream)
        res.json({ uid: session._id })
    }))

    app.post("/cast/statistics/:user/:key/close-session", wrap(async (req, res) => {
        if (!req.body.uid) {
            throw new BadRequestError("Missing parameters")
        }
        await sessions.endSession(req.params.user, req.body.uid)
        res.status(204).send()
    }))

    app.post("/cast/statistics/:user/:key/close-all-sessions", wrap(async (req, res) => {
        await sessions.closeAllSessionsForUsername(req.params.user)
        res.status(204).send()
    }))

    app.get("/cast/statistics/:user/:key/get-all-sessions-started-since/:since", wrap(async (req, res) => {
        res.json(await sessions.getAllSessionsForUsernameStartedSince(req.params.user, new Date(req.params.since)))
    }))

    app.get("/cast/statistics/:user/:key/get-all-sessions-for-period/:start/:end", wrap(async (req, res) => {
        res.json(await sessions.getAllSessionsForUsernameInPeriod(req.params.user, new Date(req.params.start), new Date(req.params.end)))
    }))

    app.get("/cast/statistics/:user/:key/get-all-open-sessions/", wrap(async (req, res) => {
        res.json(await sessions.getAllOpenSessionsForUsername(req.params.user))
    }))

    app.get("/cast/statistics/:user/:key/get-calculated-info/:since/:resolution", wrap(async (req, res) => {
        res.json(await calculated.getDataForUsername(req.params.user, req.params.resolution, new Date(req.params.since)))
    }))
}
