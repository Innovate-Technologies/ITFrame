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
        if (!req.body.enabled) {
            throw new BadRequestError();
        }
        if (req.body.enabled && (!req.body.fadeLength || !req.body.name || !req.body.name)) {
            throw new BadRequestError();
        }
        await cast.configureDJ(req.params.username, {
            fadeLength: req.body.fadeLength,
            name: req.body.name,
            genre: req.body.genre,
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
        res.json(await intervals.intervalsForUsername(req.params.username))
    }))

    app.post("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.updateIntervalWithUsernameAndID(req.params.username, req.body._id, req.body)
        // await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.delete("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.removeIntervalForUsernameAndID(req.params.username, req.body._id)
        // await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.put("/control/cast/dj/intervals/:username", wrap(async (req, res) => {
        const interval = await intervals.addNewIntervalForUsername(res.params.username, req.body)
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
