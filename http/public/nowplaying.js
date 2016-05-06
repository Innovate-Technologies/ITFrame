/* global requireFromRoot */
let NowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")

module.exports = ({ app }) => {
    app.get("/nowplaying/:username", function (req, res) {
        if (typeof req.params.username === "undefined") {
            return res.status(400).send("Missing Username")
        }

        NowPlaying.getLatestSongs(req.params.username, 10, function (error, np) {
            if (error) {
                return res.status(500).json({ error: error })
            }
            res.json(np)
        })
    });
};
