import BadRequestError from "~/http/classes/BadRequestError"
const nocover = requireFromRoot("components/centova/nocover.js")

module.exports = ({ app, wrap }) => {
    app.get("/centova/nocover/:username", wrap(async (req, res) => {
        if (!req.params.username) {
            throw new BadRequestError("Missing username")
        }
        res.json(await nocover.nocoverForUserame(req.params.username))
    }))
}

