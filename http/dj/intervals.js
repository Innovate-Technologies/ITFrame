import * as intervalsDB from "../../components/dj/intervals.js"

module.exports = function ({ app }) {
    app.get("/dj/:user/:key/all-intervals/", async (req, res, next) => {
        try {
            res.json(await intervalsDB.intervalsForUsername(req.params.user))
        } catch (error) {
            return next(error)
        }
    })

    app.get("/dj/:user/:key/interval/:id/", (req, res, next) => {
        if (!req.params.id) {
            return next(new Error("Missing info"))
        }
        try {
            res.json(intervalsDB.intervalForUserAndID(req.params.id, req.params.user))
        } catch (error) {
            return next(error)
        }
    })
}
