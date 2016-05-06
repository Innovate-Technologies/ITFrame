module.exports = function ({ app }) {
    app.use(function notFoundHandler(req, res) {
        req.log.debug("Reached the 404 handler");
        res.status(404);
        if (req.accepts("json")) {
            return res.json({
                result: "error",
                error: "Not found",
            });
        }
        return res.send("Not found");
    });
};
