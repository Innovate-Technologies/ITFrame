var clocksDB = requireFromRoot("components/dj/clocks.js")

module.exports = function ({ app }) {
	app.get("/dj/:user/:key/all-clocks/", (req, res) => {
		clocksDB.clocksForUsername(req.params.user, (err, clocks) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			res.json(clocks)
		})
	})

	app.get("/dj/:user/:key/clock/:id/", (req, res) => {
		if (!req.params.id) {
			return res.status(500).json({
				result: "error",
                error: "Missing info.",
			})
		}
		clocksDB.clockForUserAndID(req.params.id, req.params.user, (err, clock) => {
			if (err) {
				return res.status(500).json({
					result: "error",
					error: err,
				})
			}
			res.json(clock)
		})
	})

}
