import * as clocksDB from "../../components/dj/clocks.js"

module.exports = ({ app }) => {
    app.get("/dj/:user/:key/all-clocks/", async (req, res, next) => {
        try {
            res.json(await clocksDB.clocksForUsername(req.params.user))
        } catch (error) {
            return next(error)
        }
    })
    app.get("/dj/:user/:key/clock/:id/", async (req, res, next) => {
        if (!req.params.id) {
            return next(new Error("Missing info"))
        }
        try {
            res.json(await clocksDB.clockForUserAndID(req.params.id, req.params.user))
        } catch (error) {
            return next(error)
        }
    })
}
