var rest = require("restler")
let logger = log.child({ component: "iTunes" });

var search = function (data, callback) {
    rest.post("https://itunes.apple.com/search", {
        data: data,
        rejectUnauthorized: false,
        timeout: 10000,
    }).on("complete", function (returnData) {
        logger.debug("Call succeeded");
        callback(null, returnData);
    }).on("timeout", function () {
        logger.error("Timeout");
        callback(new Error("Time-out"))
    })
}

var searchSong = function (song, artist, num, callback) {
    if (num > 200) {
        num = 200
    }
    search({
        media: "music",
        term: song + " " + artist,
        limit: num,
    }, function (err, res) {
        if (err) {
            callback(err)
            return
        }
        if (typeof res.errorMessage !== "undefined") {
            return callback(new Error(res.errorMessage))
        }
        try {
            return callback(null, JSON.parse(res).results);
        } catch (error) {
            return callback(error);
        }
    })
}

var searchAlbum = function (album, num, callback) {
    if (num > 200) {
        num = 200
    }
    search({
        media: "music",
        term: album,
        limit: num,
    }, function (err, res) {
        if (err) {
            callback(err)
            return
        }
        if (typeof res.errorMessage !== "undefined") {
            return callback(new Error(res.errorMessage))
        }
        try {
            return callback(null, JSON.parse(res).results);
        } catch (error) {
            return callback(error);
        }
    })
}

module.exports.searchTitle = searchSong
module.exports.searchAlbum = searchAlbum
