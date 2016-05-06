var intervalsDB = requireFromRoot("components/dj/intervals.js")

module.exports = function ({ app }) {
	app.get("/dj/:user/:key/all-intervals/", (req, res) => {
		intervalsDB.intervalsForUsername(req.params.user, (err, intervals) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			res.json(intervals)
		})
	})

	app.get("/dj/:user/:key/interval/:id/", (req, res) => {
		if (!req.params.id) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}
		intervalsDB.intervalForUserAndID(req.params.id, req.params.user, (err, interval) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			res.json(interval)
		})
	})

}
