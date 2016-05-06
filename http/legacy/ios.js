var iOSDatabase = requireFromRoot("components/iOS/legacyDatabase.js")
var NowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")
var iOS = requireFromRoot("components/iOS/legacy.js")

module.exports = function (parm) {
    parm.app.get("/mobile/iOS/", function (req, res) {
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

    parm.app.get("/mobile/iOS/nowplaying/", function (req, res) {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).send("Missing SKU")
        }
        iOSDatabase.getAppForSKU(req.query.sku, function (err, dbres) {
            if (err) {
                return res.status(500).json({ error: err })
            }
            NowPlaying.getLatestSongs(dbres.username, 5, function (error, np) {
                if (error) {
                    return res.status(500).json({ error: error })
                }
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
        })
    })

    parm.app.get("/mobile/iOS/tunein/", function (req, res) {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).json({
                error: "Missing parameters",
            })
        }

        iOSDatabase.getAppForSKU(req.query.sku, function (err, app) {
            if (err) {
                return res.status(500).json({ error: err })
            }
            iOS.getPlsForUsername(app.username, function (error, link) {
                if (error) {
                    return res.status(500).json({ error })
                }
                res.json({ link })
            })
        })
    });

    parm.app.get("/mobile/iOS/nowplayingForUser/", function (req, res) {
        if (typeof req.query.user === "undefined") {
            return res.status(400).send("Missing Username")
        }

        NowPlaying.getLatestSongs(req.query.user, 6, function (error, np) {
            if (error) {
                return res.status(500).json({ error: error })
            }
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
    })


}
