let promisify = require("promisify-node");
let users = requireFromRoot("components/legacy/usersDatabase.js");
let controlUser = requireFromRoot("components/control/controlUser.js");
let legacyiOSDatabase = requireFromRoot("components/iOS/legacyDatabase.js");
let castDatabase = requireFromRoot("components/cast/database.js");
let nowPlayingDatabase = promisify(requireFromRoot("components/nowplaying/nowPlayingDatabase.js"), undefined, true);
let legacyNowPlaying = promisify(requireFromRoot("components/nowplaying/legacyNowPlaying.js"), undefined, true);
let AppsService = requireFromRoot("components/apps/api.js");
let profiler = requireFromRoot("profiler");

import BadRequestError from "~/http/classes/BadRequestError";
import AccessDeniedError from "~/http/classes/AccessDeniedError";

let moduleLogger = log.child({ component: "internal/apps" });

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

    app.get("/internal/apps/get-stream-url/:username", function (req, res, next) {
        let username = req.params.username;
        if (!username) {
            throw new BadRequestError("Missing username");
        }

        castDatabase.getStreamUrl(username, function (err, streamUrl) {
            if (err) {
                return tryCentovaCastMethod();
            }
            return res.json({
                username: req.params.username,
                streamUrl: encodeURI(streamUrl),
            });
        });

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
    });

    app.get("/internal/apps/get-now-playing/:username", wrap(async function (req, res) {
        let username = req.params.username;
        if (!username) {
            throw new BadRequestError("Missing username");
        }
        let profilerCall = profiler.start("Getting app request from Apps", { username });
        let appConfig;
        try {
            appConfig = await AppsService.getRequest("android", { username });
        } catch (error) {
            appConfig = { useInternalNowPlaying: true };
            log.warn(error, "Failed to get request from Apps.");
        }
        profilerCall.end();

        let tryNowPlayingDatabase = async () => {
            profilerCall = profiler.start("Getting now playing info from DB", { username });
            let song = await nowPlayingDatabase.getLatestSong(username);
            profilerCall.end();
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
                moduleLogger.info("Found nothing in DB, replying with empty info");
            }
            moduleLogger.debug({ username }, "Sending response");
            return res.json(songInfo);
        };

        if (appConfig.useInternalNowPlaying) {
            moduleLogger.debug({ username }, "Trying now playing database");
            return tryNowPlayingDatabase();
        }
        moduleLogger.debug({ username }, "Trying Centova Cast");
        try {
            profilerCall = profiler.start("Getting now playing info from Centova Cast", { username });
            let response = await legacyNowPlaying.getNowPlayingInfo(username);
            profilerCall.end();
            moduleLogger.debug({ username }, "Sending response");
            return res.json(response);
        } catch (err) {
            moduleLogger.debug({ username }, "Trying now playing database");
            return tryNowPlayingDatabase();
        }
    }));


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Notification emails
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/internal/apps/notify-client-android-app-done", (req, res, next) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        controlUser.sendProductEmail("Android App Submitted", req.body.username, {}, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({});
        });
    });

    app.post("/internal/apps/notify-client-iOS-app-done", (req, res, next) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        controlUser.sendProductEmail("iOS App Submitted", req.body.username, {}, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({});
        });
    });

    app.post("/internal/apps/notify-client-iOS-app-approved", (req, res, next) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username) {
            throw new BadRequestError("Missing username");
        }
        controlUser.sendProductEmail("iOS App Approved", req.body.username, {}, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({});
        });
    });

    app.post("/internal/apps/notify-client-app-rejected", (req, res, next) => {
        if (req.body.token !== appsToken) {
            throw new AccessDeniedError();
        }
        if (!req.body.username || !req.body.reason) {
            throw new BadRequestError("Missing username and/or reason");
        }
        controlUser.sendProductEmail("App Request Rejected", req.body.username, {
            reason: req.body.reason,
        }, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({});
        });
    });


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
