import * as iTunes from "./iTunesAPI.js"
import * as personalDB from "./personalMusicDatabase.js"

export const lookUp = async (username, song, artist) => {
    const songInDatabase = await personalDB.getSongForUsername(username, song, artist)
    if (songInDatabase) {
        return songInDatabase
    }

    const songInfo = {
        song,
        artist,
        externalURL: {},
    }

    if (song && artist) {
        const iTunesResults = await iTunes.searchSong(song, artist, 1)
        if (iTunesResults.length !== 0) {
            songInfo.album = iTunesResults[0].collectionName
            songInfo.externalURL = { "itunes": iTunesResults[0].trackViewUrl }
            songInfo.artwork = "https://photon.shoutca.st/" + ((iTunesResults[0].artworkUrl100 || "").replace("100x100", "1200x1200")).replace("https://", "").replace("http://", "")
            songInfo.genre = iTunesResults[0].primaryGenreName
        }
    }

    await personalDB.addSong(username, songInfo)

    const defaultInfo = await personalDB.getDefaultForUsername(username)

    if (defaultInfo) {
        if (!songInfo.artwork && defaultInfo.artwork) {
            songInfo.artwork = defaultInfo.artwork
        }
        if (!songInfo.genre && defaultInfo.genre) {
            songInfo.genre = defaultInfo.genre
        }
    }

    return songInfo
}
