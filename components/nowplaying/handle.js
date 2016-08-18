var database = require("./nowPlayingDatabase.js")
var tunes = requireFromRoot("components/tunes/lookup.js")
let logger = log.child({ component: "NP Handle" });

export default async (info) => {
    const latestSong = await database.getLatestSong(info.username)
    if (latestSong && latestSong.song === info.title && latestSong.artist === info.artist) {
        return
    }
    logger.debug(info.username, "Checking tunes")
    const tunesInfo = tunes.lookUp(info.username, info.title, info.artist)

    const entry = {
        username: info.username,
        song: tunesInfo.song,
        artist: tunesInfo.artist,
        cover: tunesInfo.artwork,
        wiki: "",
        buy: (tunesInfo.external_url || {}).itunes || "",
        time: Math.round((new Date()).getTime() / 1000),
    }
    logger.debug(info.username, "Saving song", entry)
    await database.addSong(entry)
    logger.debug(info.username, "Triggering hooks")
    global.hooks.runHooks("newSong", entry)
}
