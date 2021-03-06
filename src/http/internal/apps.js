
import BadRequestError from "~/http/classes/BadRequestError";
import AccessDeniedError from "~/http/classes/AccessDeniedError";
import timeout from "connect-timeout";
const users = requireFromRoot("components/legacy/usersDatabase.js");
const controlUser = requireFromRoot("components/control/controlUser.js");
const legacyiOSDatabase = requireFromRoot("components/iOS/legacyDatabase.js");
const castDatabase = requireFromRoot("components/cast/database.js");
const nowPlayingDatabase = requireFromRoot("components/nowplaying/nowPlayingDatabase.js");

const moduleLogger = log.child({ component: "internal/apps" });

export default ({ app, wrap }) => {
    const appsToken = config.appsToken;
    if (!appsToken) {
        throw new Error("Please set config.appsToken");
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Servers, streams
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/internal/apps/get-server", function (req, res, next) {
        if (!req.query.username) {
            throw new BadRequestError("Missing username");
        }
        users.getInfoForUsername(req.query.username, function (err, data) {
            if (err) {
                return next(err);
            }
            return res.json(data);
        });
    });

    app.post("/internal/apps/set-server", wrap(async function (req, res) {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        await users.upsert(req.body.username, { server: req.body.serverName });
        res.json({});
    }));

    app.get("/internal/apps/get-stream-url/:username", wrap(async (req, res, next) => {
        let username = req.params.username;
        if (!username) {
            throw new BadRequestError("Missing username");
        }

        let tryCentovaCastMethod = () => {
            users.getStreamUrl(req.params.username, (err, streamUrl) => {
                if (err) {
                    err.message = "Failed to get the stream URL: " + err.message;
                    return next(err);
                }
                return res.json({
                    username: req.params.username,
                    streamUrl: encodeURI(streamUrl),
                });
            });
        };

        try {
            const streamUrl = await castDatabase.getStreamUrl(username)
            return res.json({
                username: req.params.username,
                streamUrl: encodeURI(streamUrl),
            });
        } catch (error) {
            tryCentovaCastMethod()
        }
    }));

    app.get("/internal/apps/get-now-playing/:username", timeout('5s'), wrap(async function (req, res) {
        let username = req.params.username;
        if (!username) {
            throw new BadRequestError("Missing username");
        }

        let song = await nowPlayingDatabase.getLatestSong(username);
        let songInfo = {
            title: "",
            artist: "",
            streamTitle: "Now Playing",
            album: "",
        };
        try {
            songInfo.title = song.song.trim();
            songInfo.artist = song.artist.trim();
            songInfo.album = song.cover;
        } catch (_) {
            // moduleLogger.info("Found nothing in DB, replying with empty info");
        }
        //moduleLogger.debug({ username }, "Sending response");
        return res.json(songInfo);
    }));


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Notification emails
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/internal/apps/notify-client-android-app-done", wrap(async (req, res) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        await controlUser.sendProductEmail("Android App Submitted", req.body.username, {});
        res.json({});
    }));

    app.post("/internal/apps/notify-client-iOS-app-done", wrap(async (req, res) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        await controlUser.sendProductEmail("iOS App Submitted", req.body.username, {});
        res.json({});
    }));

    app.post("/internal/apps/notify-client-iOS-app-approved", wrap(async (req, res) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        await controlUser.sendProductEmail("iOS App Approved", req.body.username, {});
        res.json({});
    }));

    app.post("/internal/apps/notify-client-app-rejected", wrap(async (req, res) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username || !req.body.reason) {
            throw new BadRequestError("Missing username and/or reason");
        }
        await controlUser.sendProductEmail("App Request Rejected", req.body.username, {
            reason: req.body.reason,
        });
        res.json({});
    }));


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Apps ===> Legacy iOS DB link
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/internal/apps/update-ios-app", (req, res, next) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.app) {
            throw new BadRequestError("Empty req.body.app?");
        }
        legacyiOSDatabase.insert(req.body.app, (err) => {
            if (err) {
                return next("Failed to insert app request into legacy iOS DB: " + err);
            }
            res.json({});
        });
    });

};
