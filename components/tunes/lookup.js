import * as iTunes from "./iTunesAPI.js"
import * as personalDB from "./personalMusicDatabase.js"

export const lookUp = async (username, song, artist) => {
    const songInDatabase = await personalDB.getSongForUsername(username, song, artist)
    if (songInDatabase) {
        return songInDatabase
    }

    const songInfo = {
                    song: song,
                    artist: artist,
                    externalURL: {}
                }

    if (song && artist) {
        const iTunesResults = await iTunes.searchTitle(song, artist, 1)
        if (iTunesResults.length !== 0) {
            songInfo.album = searchRes[0].collectionName
            songInfo.externalURL = { "itunes": searchRes[0].trackViewUrl }
            songInfo.artwork =  "https://photon.shoutca.st/" + ((searchRes[0].artworkUrl100 || "").replace("100x100", "1200x1200")).replace("https://", "").replace("http://", "")
            songInfo.genre = searchRes[0].primaryGenreName
        }
    }

    const defaultInfo = await personalDB.getDefaultForUsername(username)

    if (defaultInfo) {
        if (!songInfo.artwork && defaultInfo.artwork) {
            songInfo.artwork = defaultInfo.artwork
        }
        if (!songInfo.genre && defaultInfo.genre) {
            songInfo.genre = defaultInfo.genre
        }
    }

    await personalDB.addSong(username, info)
    return info
}
