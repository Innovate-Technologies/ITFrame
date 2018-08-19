const cast = requireFromRoot("components/cast/manage.js");
import * as clocks from "../../components/dj/clocks.js"
import * as intervals from "../../components/dj/intervals.js"
import * as tags from "../../components/dj/tags.js"
import * as dj from "../../components/dj/manage.js"
import BadRequestError from "~/http/classes/BadRequestError";

export default ({ app, wrap }) => {

    //////////////////////////////////////////////////////
    // General settings                                 //
    //////////////////////////////////////////////////////

    app.post("/control/cast/dj/settings/:username", wrap(async (req, res) => {
        await cast.configureDJ(req.params.username, {
            enabled: req.body.enabled || false,
            fadeLength: req.body.fadeLength || 0,
            name: req.body.name || "Unknown",
            genre: req.body.genre || "Misc",
        })
        res.json({})
    }));

    //////////////////////////////////////////////////////
    // Dashboard                                        //
    //////////////////////////////////////////////////////
    app.get("/control/cast/dj/queue/:username", wrap(async (req, res) => {
        res.json(await dj.getQueue(req.params.username))
    }))

    app.post("/control/cast/dj/skip/:username", wrap(async (req, res) => {
        await dj.skipSong(req.params.username)
        res.json({ status: "ok" })
    }))


    //////////////////////////////////////////////////////
    // Clocks                                           //
    //////////////////////////////////////////////////////
    app.get("/control/cast/dj/clocks/:username", wrap(async (req, res) => {
        res.json(await clocks.clocksForUsername(req.params.username))
    }))

    app.put("/control/cast/dj/clocks/:username", wrap(async (req, res) => {
        await clocks.replaceClocksForUsername(req.params.username, req.body)
        // await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))
    //////////////////////////////////////////////////////
    // Intervals                                        //
    //////////////////////////////////////////////////////

    app.get("/control/cast/dj/intervals/:username", wrap(async (req, res) => {
        const intervalsForUser = await intervals.intervalsForUsername(req.params.username)
        for (let id in intervalsForUser) {
            if (intervalsForUser.hasOwnProperty(intervals)) {
                for (let songid in intervalsForUser[id].songs) {
                    if (intervalsForUser[id].songs.hasOwnPropery(songid)) {
                        intervalsForUser[id].songs[songid].internalURL = null
                        intervalsForUser[id].songs[songid].processedURLS = null
                    }
                }
            }
        }
        res.json(intervalsForUser)
    }))

    app.post("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.updateIntervalWithUsernameAndID(req.params.username, req.body._id, req.body)
        // await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.delete("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.removeIntervalForUsernameAndID(req.params.username, req.params.id)
        // await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.put("/control/cast/dj/intervals/:username", wrap(async (req, res) => {
        const interval = await intervals.addNewIntervalForUsername(req.params.username, req.body)
        // await dj.reloadClocks(req.params.username)
        res.json(interval)
    }))

    //////////////////////////////////////////////////////
    // Tags                                             //
    //////////////////////////////////////////////////////

    app.get("/control/cast/dj/tags/:username", wrap(async (req, res) => {
        res.json(await tags.tagsForUsername(req.params.username))
    }))

    app.post("/control/cast/dj/tags/:username/:id", wrap(async (req, res) => {
        await tags.updateTagWithUsernameAndID(req.params.username, req.params.id, req.body)
        res.json({ status: "ok" })
    }))

    app.delete("/control/cast/dj/tags/:username/:id", wrap(async (req, res) => {
        await tags.removeTagForUsernameAndID(req.params.username, req.params.id)
        res.json({ status: "ok" })
    }))

    app.put("/control/cast/dj/tags/:username", wrap(async (req, res) => {
        res.json(await tags.addNewTagForUsername(req.params.username, req.body))
    }))

};
