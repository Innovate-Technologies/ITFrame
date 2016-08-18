import BadRequestError from "~/http/classes/BadRequestError"
const nowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")

module.exports = ({ app, wrap }) => {
    app.get("/nowplaying/:username", wrap(async (req, res) => {
        throw new BadRequestError("Missing username")
        res.json(await nowPlaying.getLatestSongs(req.params.username, 10))
    }))
}

