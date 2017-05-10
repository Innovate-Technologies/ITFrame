import NotFoundError from "~/http/classes/NotFoundError"
const tunesDB = requireFromRoot("components/tunes/personalMusicDatabase.js")

module.exports = function ({ app, wrap }) {
    app.get("/dj/:user/:key/song/:id", wrap(async (req, res) => {
        if (!req.params.id) {
            throw new Error("Missing info.")
        }
        const song = await tunesDB.getSongForUserWithID(req.params.user, req.params.id)
        if (song === null) {
            throw new NotFoundError("Song not found.")
        }
        res.json(song)
    }))

    app.get("/dj/:user/:key/songs-with-tag/:tag", wrap(async (req, res) => {
        if (!req.params.tag) {
            throw new Error("Missing info.")
        }

        const songs = await tunesDB.getSongsForUserWithTag(req.params.user, req.params.tag)
        if (songs === null) {
            throw new NotFoundError("Song not found.")
        }
        res.json(songs)
    }))

    app.get("/dj/:user/:key/all-songs/", wrap(async (req, res) => {
        res.json(await tunesDB.getAllSongsForUser(req.params.user))
    }))
}
