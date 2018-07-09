import BadRequestError from "~/http/classes/BadRequestError"
const nocover = requireFromRoot("components/tunes/nocover.js")

module.exports = ({ app, wrap }) => {
    app.get("/tunes/nocover/:username", wrap(async (req, res) => {
        if (!req.params.username) {
            throw new BadRequestError("Missing username")
        }
        const entry = await nocover.nocoverForUserame(req.params.username)
        if (!entry) {
            res.status(404)
        }
        res.json(entry)
    }))
}

