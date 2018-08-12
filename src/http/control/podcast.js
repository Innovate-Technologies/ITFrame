import * as feedInfo from "../../components/cast/podcast/feedInfo"
import * as defaultInfo from "../../components/cast/podcast/defaultInfo"
import * as episodes from "../../components/cast/podcast/episodes"

module.exports = ({ app, wrap }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Feed Info
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/feed-info", wrap(async (req, res) => {
        res.json(await feedInfo.getForUsername(req.params.username))
    }));

    app.post("/control/cast/:username/podcast/feed-info", wrap(async (req, res) => {
        const current = await feedInfo.getForUsername(req.params.username)
        if (!current) {
            await feedInfo.addForUsername(req.params.username, req.body)
        } else {
            await feedInfo.updateForUsername(req.params.username, req.body)
        }

        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Default Info
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/default-info", wrap(async (req, res) => {
        res.json(await defaultInfo.getForUsername(req.params.username))
    }));

    app.post("/control/cast/:username/podcast/default-info", wrap(async (req, res) => {
        const current = await defaultInfo.getForUsername(req.params.username)
        if (!current) {
            await defaultInfo.addForUsername(req.params.username, req.body)
        } else {
            await defaultInfo.updateForUsername(req.params.username, req.body)
        }

        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Episodes
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/episodes", wrap(async (req, res) => {
        const ep = await episodes.getForUsername(req.params.username)
        if (ep) {
            for (let id in ep) {
                if (ep.hasOwnProperty(id)) {
                    ep[id].internalURL = ""
                }
            }
        }
        res.json(ep)
    }));

    app.post("/control/cast/:username/podcast/episodes", wrap(async (req, res) => {
        delete req.body.internalURL
        if (req.body._id) {
            await episodes.updateForUsernameAndID(req.params.username, req.body._id, req.body)
            return res.json({})
        }
        res.json(await episodes.addForUsername(req.params.username, req.body))
    }));
};
