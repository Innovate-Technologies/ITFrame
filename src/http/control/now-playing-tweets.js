let twitterDatabase = requireFromRoot("components/nowplaying/twitterDatabase.js");
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
}
