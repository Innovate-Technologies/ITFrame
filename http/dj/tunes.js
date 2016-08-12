var tunesDB = requireFromRoot("components/tunes/personalMusicDatabase.js")

module.exports = function ({ app, wrap }) {
	app.get("/dj/:user/:key/song/:id", wrap((req, res) => {
		if (!req.params.id) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}
		const song = tunesDB.getSongForUserWithID(req.params.user, req.params.id)
		if (song === null) {
			return res.status(500).json({
				result: "error",
				error: "Song not found",
			})
		}
		res.json(song)
	}))

	app.get("/dj/:user/:key/songs-with-tag/:tag", wrap((req, res) => {
		if (!req.params.tag) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}

		const songs = tunesDB.getSongsForUserWithTag(req.params.user, req.params.tag)
		if (song === null) {
			return res.status(500).json({
				result: "error",
				error: "Songs not found",
			})
		}
		res.json(song)
	}))

	app.get("/dj/:user/:key/all-songs/", wrap((req, res) => {
		res.json(await tunesDB.getAllSongsForUser(req.params.user))
	}))
}
