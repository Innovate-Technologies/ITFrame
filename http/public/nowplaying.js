const nowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")

module.exports = ({ app, wrap }) => {
    app.get("/nowplaying/:username", wrap(async (req, res) => {
        if (typeof req.params.username === "undefined") {
            return res.status(400).send("Missing Username")
        }
        res.json(await nowPlaying.getLatestSongs(req.params.username, 10))
    })
}

