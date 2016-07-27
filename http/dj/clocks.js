import * as clocksDB from "../../components/dj/clocks.js"

export default ({ app, wrap }) => {
    app.get("/dj/:user/:key/all-clocks/", wrap(async (req, res) => {
        res.json(await clocksDB.clocksForUsername(req.params.user))
    }))

    app.get("/dj/:user/:key/clock/:id/", wrap(async (req, res) => {
        if (!req.params.id) {
            throw new Error("Missing info")
        }
        res.json(await clocksDB.clockForUserAndID(req.params.id, req.params.user))
    }))
}
