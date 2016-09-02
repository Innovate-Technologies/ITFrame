import wait from "wait.for"

import BadRequestError from "app/http/classes/BadRequestError";
import * as cast from "app/components/cast/manage.js";
import * as clocks from "../../components/dj/clocks.js"
import * as intervals from "../../components/dj/intervals.js"
import * as dj from "../../components/dj/manage.js"

export default ({ app, wrap }) => {

    //////////////////////////////////////////////////////
    // General settings                                 //
    //////////////////////////////////////////////////////

    app.post("/control/cast/dj/settings/:username", function (req, res, next) {
        if (!req.body.enabled) {
            throw new BadRequestError();
        }
        if (req.body.enabled && (!req.body.fadeLength || !req.body.name || !req.body.name) ) {
            throw new BadRequestError();
        }
        wait.launchFiber(function () {
            try {
                wait.for(cast.configureDJ, req.params.username, {
                    fadeLength: req.body.fadeLength,
                    name: req.body.name,
                    genre: req.body.genre,
                });
                res.json({});
            } catch (error) {
                req.log.warn(error, "Failed to save the DJ settings");
                error.message = "Failed to save the DJ settings: " + error.message;
                return next(error);
            }
        });
    });

    //////////////////////////////////////////////////////
    // Dashboard                                        //
    //////////////////////////////////////////////////////
    app.get("/control/cast/dj/queue/:username", wrap(async (req, res) => {
        res.json(await dj.getQueue(req.params.username))
    }))

    app.post("/control/cast/dj/skip/:username", wrap(async (req, res) => {
        dj.skipSong(req.params.username)
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
        await dj.reloadClocks(req.params.username)
        res.json({status: "ok"})
    }))
    //////////////////////////////////////////////////////
    // Intervals                                        //
    //////////////////////////////////////////////////////

    app.get("/control/cast/dj/intervals/:username", wrap(async (req, res) => {
        res.json(await intervals.intervalsForUsername(req.params.username))
    }))

    app.patch("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.updateIntervalWithUsernameAndID(req.params.username, req.body._id, req.body)
        await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.delete("/control/cast/dj/intervals/:username/:id", wrap(async (req, res) => {
        await intervals.removeIntervalForUsernameAndID(req.params.username, req.body._id)
        await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

    app.put("/control/cast/dj/intervals/:username", wrap(async (req, res) => {
        await intervals.addNewIntervalForUsername(res.params.username, req.body)
        await dj.reloadClocks(req.params.username)
        res.json({ status: "ok" })
    }))

};
