let users = requireFromRoot("components/legacy/usersDatabase.js");
let castDatabase = requireFromRoot("components/cast/database.js");

module.exports = ({ app, wrap }) => {
    app.get("/tunein/:username", wrap(async (req, res, next) => {
        try {
            const streamUrl = await castDatabase.getStreamUrl(req.params.username);
            res.json({ streamUrl });
        } catch (e) {
            users.getStreamUrl(req.params.username, (err, streamUrl) => {
                if (err) {
                    err.message = "Failed to get the stream URL: " + err.message;
                    return next(err);
                }
                res.json({ streamUrl });
            });
        }
    }));
};