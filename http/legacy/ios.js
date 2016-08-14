const iOSDatabase = requireFromRoot("components/iOS/legacyDatabase.js")
const nowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")
const iOS = requireFromRoot("components/iOS/legacy.js")

module.exports = function ({ app, wrap}) {
    app.get("/mobile/iOS/", function (req, res) {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).send("Missing SKU")
        }
        iOSDatabase.getAppForSKU(req.query.sku, function (err, app) {
            if (err) {
                res.status(500).json({ error: err })
                return
            }
            res.json(app)
        })
    });

    app.get("/mobile/iOS/nowplaying/", wrap((req, res) => {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).send("Missing SKU")
        }
        iOSDatabase.getAppForSKU(req.query.sku, async (err, dbres) => {
            if (err) {
                return res.status(500).json({ error: err })
            }
            const np = await nowPlaying.getLatestSongs(dbres.username, 5)
            if (np.length === 0) {
                return res.json([{
                    "song": "Unknown",
                    "artist": "Unknown",
                    "cover": "https://cdn.shoutca.st/noalbum.png",
                    "buy": "",
                    "wiki": "Coming Soon",
                }])
            }
            res.json(np)
        })
    }))

    app.get("/mobile/iOS/tunein/", function (req, res) {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).json({
                error: "Missing parameters",
            })
        }

        iOSDatabase.getAppForSKU(req.query.sku, function (err, appInfo) {
            if (err) {
                return res.status(500).json({ error: err })
            }
            iOS.getPlsForUsername(appInfo.username, function (error, link) {
                if (error) {
                    return res.status(500).json({ error })
                }
                res.json({ link })
            })
        })
    });

    app.get("/mobile/iOS/nowplayingForUser/", wrap(async (req, res) {
        if (typeof req.query.user === "undefined") {
            return res.status(400).send("Missing Username")
        }

        const np = await nowPlaying.getLatestSongs(req.query.user, 6)
            if (np.length === 0) {
                return res.json([{
                    "song": "Unknown",
                    "artist": "Unknown",
                    "cover": "https://cdn.shoutca.st/noalbum.png",
                    "buy": "",
                    "wiki": "Coming Soon",
                }])
            }
            res.json(np)
    }))
}
