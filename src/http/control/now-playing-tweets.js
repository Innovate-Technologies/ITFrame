const twitterDatabase = requireFromRoot("components/nowplaying/twitterDatabase.js");
const twitter = requireFromRoot("components/nowplaying/twitter.js");
const nowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")
import NotFoundError from "~/http/classes/NotFoundError";

export default function ({ app, wrap }) {
    app.get("/control/now-playing-tweets/settings/:username", wrap(async function (req, res) {
        try {
            res.json(await twitterDatabase.getSettings(req.params.username));
        } catch (error) {
            if (error.message !== "Username not in database") {
                throw error;
            }
            throw new NotFoundError("Failed to get #NowPlaying settings: " + error.message);
        }
    }));

    app.put("/control/now-playing-tweets/settings/:username", wrap(async function (req, res) {
        let settings = req.body || {};
        settings.username = req.params.username;
        await twitterDatabase.upsert(req.params.username, settings);
        res.json({});
    }));

    app.delete("/control/now-playing-tweets/settings/:username", wrap(async function (req, res) {
        await twitterDatabase.remove(req.params.username);
        res.json({});
    }));

    app.post("/control/now-playing-tweets/tweet/:username", wrap(async function (req, res) {
        const songs = await nowPlaying.getLatestSongs(req.params.username, 1)
        if (songs.length < 1) {
            throw new NotFoundError("Failed to get current song playing");
        }
        await twitter.sendTweetNow(req.params.username, {
            song: songs[0].song,
            artist: songs[0].artist,
        })
        res.json({});
    }));
}
