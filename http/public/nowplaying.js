import BadRequestError from "app/http/classes/BadRequestError"
import * as nowPlaying from "app/components/nowplaying/nowPlayingDatabase.js"

export default ({ app, wrap }) => {
    app.get("/nowplaying/:username", wrap(async (req, res) => {
        if (!req.params.username) {
            throw new BadRequestError("Missing username")
        }
        res.json(await nowPlaying.getLatestSongs(req.params.username, 10))
    }))
}

