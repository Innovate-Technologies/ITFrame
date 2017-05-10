const cast = requireFromRoot("components/cast/database.js")
export default ({ app, wrap }) => {
    app.all("/dj/:user/:key/*", wrap(async (req, res, next) => {
        if (!req.params.user || !req.params.key) {
            return res.status(401).json({
                result: "error",
                error: "Missing info.",
            });
        }
        try {
            const info = await cast.getInfoForUsername(req.params.user)
            if (!info.internal.dj || !info.internal.dj.key) {
                return res.status(500).json({
                    result: "error",
                    error: "DJ is not configured",
                });
            }
            if (info.internal.dj.key !== req.params.key) {
                return res.status(401).json({
                    result: "error",
                    error: "Invalid info.",
                });
            }
        } catch (error) {
            return res.status(500).json({
                result: "error",
                error: error,
            });
        }

        return next(); // allow request to continue
    }));
}
