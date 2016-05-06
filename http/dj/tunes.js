var tunesDB = requireFromRoot("components/tunes/personalMusicDatabase.js")

module.exports = function ({ app }) {
	app.get("/dj/:user/:key/song/:id", (req, res) => {
		if (!req.params.id) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}

		tunesDB.getSongForUserWithID(req.params.user, req.params.id, (err, song) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			if (song === null) {
				return res.status(500).json({
					result: "error",
					error: "Song not found",
				})
			}
			res.json(song)
		})

	})

	app.get("/dj/:user/:key/songs-with-tag/:tag", (req, res) => {
		if (!req.params.tag) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}

		tunesDB.getSongsForUserWithTag(req.params.user, req.params.tag, (err, song) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			if (song === null) {
				return res.status(500).json({
					result: "error",
					error: "Songs not found",
				})
			}
			res.json(song)
		})

	})

	app.get("/dj/:user/:key/all-songs/", (req, res) => {
		tunesDB.getAllSongsForUser(req.params.user, (err, songs) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			res.json(songs)
		})

	})
}
