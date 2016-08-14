import rest from "restler"
const logger = log.child({ component: "iTunes" });

const search = (data) => new Promise((resolve, reject) => {
    rest.post("https://itunes.apple.com/search", {
        data: data,
        timeout: 10000,
    }).on("complete", function (returnData) {
        logger.debug("Call succeeded");
        resolve(returnData);
    }).on("timeout", function () {
        logger.error("Timeout");
        reject(new Error("Time-out"))
    })
})

export const searchSong = async (song, artist, num) => {
    const songs = await search({
        media: "music",
        term: song + " " + artist,
        limit: num
    })
    if (songs.errorMessage) {
        throw new Error(songs.errorMessage)
    }
    return JSON.parse(songs).results
}

export const searchAlbum = async (album, num) => {
    const songs = await search({
        media: "music",
        term: album,
        limit: num
    })
    if (songs.errorMessage) {
        throw new Error(songs.errorMessage)
    }
    return JSON.parse(songs).results
}

module.exports.searchTitle = searchSong
module.exports.searchAlbum = searchAlbum
