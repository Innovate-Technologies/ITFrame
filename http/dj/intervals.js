import * as intervalsDB from "../../components/dj/intervals.js"

export default function ({ app, wrap }) {
    app.get("/dj/:user/:key/all-intervals/", wrap(async (req, res) => {
        res.json(await intervalsDB.intervalsForUsername(req.params.user))
    }))

    app.get("/dj/:user/:key/interval/:id/", wrap(async (req, res) => {
        if (!req.params.id) {
            throw new Error("Missing info")
        }
        res.json(await intervalsDB.intervalForUserAndID(req.params.id, req.params.user))
    }))
}
