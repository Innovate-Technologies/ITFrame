var database = require("./nowPlayingDatabase.js")
var tunes = requireFromRoot("components/tunes/lookup.js")
let logger = log.child({ component: "NP Handle" });

module.exports = function (info) {
    database.getLatestSong(info.username, (err, latestSongInDatabase) => {
        if (err) {
            return
        }
        if (latestSongInDatabase.song === info.title && latestSongInDatabase.artist === info.artist) {
            return
        }
        logger.debug(info.username, "Checking tunes")
        tunes.lookUp(info.username, info.title, info.artist, (tunesErr, tunesSongInfo) => {
            if (tunesErr) {
                return
            }
            logger.debug(info.username, "Creating entry")
            var entry = {
                username: info.username,
                song: tunesSongInfo.title || info.title,
                artist: tunesSongInfo.artist || info.artist,
                cover: tunesSongInfo.artwork || "https://cdn.shoutca.st/noalbum.png",
                wiki: "",
                buy: (tunesSongInfo.external_url || {}).iTunes || "",
                time: Math.round((new Date()).getTime() / 1000),
            }
            database.addSong(entry, () => {
                logger.debug(info.username, "Call hooks")
                global.hooks.runHooks("newSong", entry)
            })
        })
    })
    // wait.launchFiber(handleNowPlaying, info);
}
/* var wait = require("wait.for")

module.exports = function (info) {
    // wait.launchFiber(handleNowPlaying, info);
}

var handleNowPlaying = function (info) {
    var latestSongInDatabase = wait.for(database.getLatestSong, info.username)
    if (latestSongInDatabase.song === info.title && latestSongInDatabase.artist === info.artist) {
        return
    }
    var tunesSongInfo = wait.for(tunes.lookUp, info.username, info.title, info.artist)

    var entry = {
        username: info.username,
        song: tunesSongInfo.title || info.title,
        artist: tunesSongInfo.artist || info.artist,
        cover: tunesSongInfo.artwork || "https://cdn.shoutca.st/noalbum.png",
        wiki: "",
        buy: (tunesSongInfo.external_url || {}).iTunes || "",
        time: Math.round((new Date()).getTime() / 1000),
    }

    if (wait.for(database.addSong, entry)) {
        global.hooks.runHooks("newSong", entry)
    }
}*/
