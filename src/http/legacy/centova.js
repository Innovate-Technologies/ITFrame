import AccessDeniedError from "~/http/classes/AccessDeniedError"
import BadRequestError from "~/http/classes/BadRequestError"
const dns = requireFromRoot("components/coreos/dns.js")
const nowPlayingHandler = requireFromRoot("components/nowplaying/handle.js")
const timetoken = requireFromRoot("components/auth/timetoken.js")


export default ({ app, wrap }) => {
    app.post("/connect/updateSong/", wrap(async (req, res) => {
        if (!req.body.token || req.body.token !== config.connectKey) {
            throw new BadRequestError("No token found in the request");
        }

        const data = {
            username: req.body.username,
            title: req.body.song.replace(/ \[....\]/, ""),
            artist: req.body.artist,
        }
        if (process.env.DEBUG) {
            req.log.debug(data, "Updating now playing database")
        }
        nowPlayingHandler(data)
        res.json({ status: "ok" })

    }))

    app.post("/connect/addDNS/", wrap(async (req, res) => {
        if (!req.body.token) {
            throw new AccessDeniedError("No token found in the request");
        }
        const valid = await timetoken.validateTokenForService("legacy-centova", req.body.token, 10)
        if (!valid) {
            throw new AccessDeniedError("Invalid token");
        }
        if (!/([A-Za-z0-9_]+)\.radioca\.st/.test(req.body.name)) {
            throw new AccessDeniedError("Invalid DNS name");
        }
        dns.setRecord(req.body.name, req.body.type, req.body.value, req.body.ttl)
        res.json({ status: "ok" })

    }))

}
