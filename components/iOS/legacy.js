var castDB = require(global.appRoot + "/components/cast/database");
var usersDB = require(global.appRoot + "/components/legacy/usersDatabase.js")
var _ = require("underscore")

module.exports.getPlsForUsername = function (username, callback) {
    castDB.getInfoForUsername(username).then(function (res) {
        if (!res) {
            // This might a Centova Cast account
            usersDB.getInfoForUsername(username, function (udbErr, udbRes) {
                if (udbErr) {
                    return callback(udbErr)
                }
                return callback(null, `http://${udbRes.server.toLowerCase()}.shoutca.st/tunein/${username}.pls`)
            });
        } else {
            var stream = _.findWhere(res.streams, { primary: true })
            return callback(null, res.hostname + "/streams/" + stream.stream + ".pls")
        }
    })
}
