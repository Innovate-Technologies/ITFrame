import BadRequestError from "app/http/classes/BadRequestError"
import * as iOS from "app/components/iOS/legacy.js"
import * as iOSDatabase from "app/components/iOS/legacyDatabase.js"
import * as nowPlaying from "app/components/nowplaying/nowPlayingDatabase.js"

export default function ({ app, wrap }) {
    app.get("/mobile/iOS/", function (req, res) {
        if (typeof req.query.sku === "undefined") {
            return res.status(400).send("Missing SKU")
        }
        iOSDatabase.getAppForSKU(req.query.sku, function (err, appInfo) {
            if (err) {
                res.status(500).json({ error: err })
                return
            }
            res.json(appInfo)
        })
    });

    app.get("/mobile/iOS/nowplaying/", wrap(async (req, res) => {
        if (typeof req.query.sku === "undefined") {
            throw new BadRequestError("Missing username")
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
            throw new BadRequestError("Missing parameters")
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

    app.get("/mobile/iOS/nowplayingForUser/", wrap(async (req, res) => {
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
