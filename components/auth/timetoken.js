var speakeasy = require("speakeasy")
var database = require("./timetokenDatabase.js")

module.exports.generateTokenForService = function (service, callback) {
    database.getAPIKey(service, function (err, res) {
        if (err) {
            callback(err)
            return
        }
        callback(null, speakeasy.hotp({
            key: res.key,
            counter: Math.round((new Date()).getTime() / 1000),
        }))
    })
}

module.exports.validateTokenForService = function (service, token, offset, callback) {
    if (typeof offset === "function") {
        callback = offset
        offset = 1
    }
    database.getAPIKey(service, function (err, res) {
        if (err) {
            callback(err)
            return
        }

        if (token === res.key) { // if server sends the key it is fine too as tokens seem to cause issues sometimes
            return callback(null, true);
        }
        var time = Math.round((new Date()).getTime() / 1000)

        var volidTokens = []

        for (var i = 0; i < (offset + 1); i++) {
            volidTokens.push(speakeasy.hotp({
                key: res.key,
                counter: time + i,
            }))
            volidTokens.push(speakeasy.hotp({
                key: res.key,
                counter: time - i,
            }))
        }

        if (volidTokens.indexOf(token) !== -1) {
            return callback(null, true)
        }
        callback(null, false)
    })
}
