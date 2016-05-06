let rest = require("restler");
let getPageInfo = function (username, callback) {
    rest.get("https://graph.facebook.com/" + username)
        .on("complete", function (info) {
            if (info instanceof Error) {
                return callback(info)
            }
            callback(null, info)
        })
        .on("timeout", function () {
            callback(new Error("Request to Facebook's graph API timed out"))
        });
}

module.exports.getPageInfo = getPageInfo;
