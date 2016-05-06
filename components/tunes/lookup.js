var iTunes = require("./iTunesAPI.js")
var personalDB = require("./personalMusicDatabase.js")


var lookUp = function (username, song, artist, callback) {
    personalDB.getSongForUsername(username, song, artist, function (err, res) {
        if (err) {
            callback(err)
            return
        }
        if (res !== null) {
            callback(null, res)
            return
        }
        iTunes.searchTitle(song, artist, 1, function (searchErr, searchRes) {
            if (searchErr) {
                return callback(null, {
                    song: song,
                    artist: artist,
                    externalURL: {}
                })
            }
            var info;
            if (searchRes.length === 0) {
                info = {
                    song: song,
                    artist: artist,
                    externalURL: {}
                }
                personalDB.addSong(username, info)
                return callback(null, info)
            }
            info = {
                song: song,
                artist: artist,
                album: searchRes[0].collectionName,
                externalURL: {
                    "iTunes": searchRes[0].trackViewUrl
                }, //{itunes:url} (Would have called it buy url but since streaming)
                artwork: "https://photon.shoutca.st/" + ((searchRes[0].artworkUrl100 || "").replace("100x100", "1200x1200")).replace("https://", "").replace("http://", ""),
                genre: searchRes[0].primaryGenreName
            }
            personalDB.addSong(username, info)
            return callback(null, info)
        })
    })
}

module.exports.lookUp = lookUp
