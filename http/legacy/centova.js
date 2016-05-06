let timetoken = requireFromRoot("components/auth/timetoken.js")
let dns = requireFromRoot("components/coreos/dns.js")
let nowPlayingHandler = requireFromRoot("components/nowplaying/handle.js")
import BadRequestError from "~/http/classes/BadRequestError"

module.exports = function ({ app }) {
    app.post("/connect/updateSong/", function (req, res) {
        if (!req.body.token || req.body.token !== config.connectKey) {
            throw new BadRequestError("No token found in the request");
        }
        let data = {
            username: req.body.username,
            title: req.body.song,
            artist: req.body.artist,
        }
        if (process.env.DEBUG) {
            req.log.debug(data, "Updating now playing database")
        }
        nowPlayingHandler(data)
        res.json({ status: "ok" })

    })

    app.post("/connect/addDNS/", function (req, res) {
        if (!req.body.token) {
            throw new BadRequestError("No token found in the request");
        }
        timetoken.validateTokenForService("legacy-centova", req.body.token, 10, function (err, valid) {
            if (err) {
                res.status(500).json({ error: err })
                return
            }
            if (!valid) {
                res.status(400).json({ error: "invalid token" })
                return
            }
            dns.setRecord(req.body.name, req.body.type, req.body.value, req.body.ttl)
            res.json({ status: "ok" })
        })
    })

}
