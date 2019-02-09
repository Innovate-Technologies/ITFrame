var database = require("./nowPlayingDatabase.js")
var tunes = requireFromRoot("components/tunes/lookup.js")
let logger = log.child({ component: "NP Handle" });

export default async (info) => {
    const latestSong = await database.getLatestSong(info.username)
    if (latestSong && latestSong.song === info.title && latestSong.artist === info.artist) {
        return
    }
    const tunesInfo = await tunes.lookUp(info.username, info.title, info.artist)

    const entry = {
        username: info.username,
        song: tunesInfo.song,
        artist: tunesInfo.artist,
        cover: tunesInfo.artwork || "https://photon.shoutca.st/cdn.shoutca.st/noalbum.png",
        wiki: "",
        buy: (tunesInfo.external_url || {}).itunes || "",
        time: Math.round((new Date()).getTime() / 1000),
    }
    await database.addSong(entry)
    global.hooks.runHooks("newSong", entry)
}
