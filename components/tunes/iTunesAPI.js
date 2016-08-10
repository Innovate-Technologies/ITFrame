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
    if (res.errorMessage) {
        throw new Error(res.errorMessage)
    }
    return JSON.parse(res).results
}

export const searchAlbum = async (album, num, callback) => {
    const songs = await search({
        media: "music",
        term: album,
        limit: num
    })
    if (res.errorMessage) {
        throw new Error(res.errorMessage)
    }
    return JSON.parse(res).results
}

module.exports.searchTitle = searchSong
module.exports.searchAlbum = searchAlbum
