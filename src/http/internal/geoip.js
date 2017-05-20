let geoip = requireFromRoot("components/geoip/lookup.js")

module.exports = function ({ app }) {
    app.get("/intern/geoip/location-for-me", function (req, res, next) {
        var ipInfo = geoip.lookUpLocation(req.ip)
        if (ipInfo === null) {
            return next(new Error("No information for this IP address"))
        }
        res.json(ipInfo)
    })
}
