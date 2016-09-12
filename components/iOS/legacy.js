import _ from "underscore"
import * as castDB from "app/components/cast/database.js"
import * as usersDB from "app/components/legacy/usersDatabase.js";

export const getPlsForUsername = function (username, callback) {
    castDB.getInfoForUsername(username, function (err, res) {
        if (err || typeof res === "undefined") {
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
