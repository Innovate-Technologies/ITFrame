var iOS = requireFromRoot("components/iOS/legacyDatabase.js")
var Apps = requireFromRoot("components/apps/api.js")

module.exports = function ({ app }) {
    app.get("/api0/iOS/", function (req, res) {
        if (typeof req.query.sku === "undefined" || typeof req.query.key === "undefined") {
            return res.status(400).send("Error")
        }
        iOS.getAppForSKU(req.query.sku, function (err, data) {
            if (err) {
                return res.status(500).json({ error: err })
            }
            data.description = data.description.split('"').join('"')
            if (typeof data[req.query.key] === "undefined") {
                data[req.query.key] = ""
            }
            res.send(data[req.query.key]);
        })
    })

    app.get("/api0/iOSQueue/", function (req, res) {
        if (req.query.key !== config.iOSKey) {
            return res.status(403).send("Access denied")
        }
        iOS.getAppThatNeedsBuild(function (err, data) {
            if (err) {
                return res.send("error")
            }
            if (data === null) {
                return res.send("none")
            }
            return res.send(data.sku)
        })
    })

    app.get("/api0/iOSQueue/done/", function (req, res) {
        let username = req.query.username;
        if (!username || req.query.key !== config.iOSKey) {
            return res.status(400).send("Error")
        }
        iOS.setAppToBuilt(username)
        Apps.updateRequest("iOS", { username }, { status: "submitted" }).then(() => res.send("OK"), (err) => res.status(500).send("Error: " + err))
    });
}
