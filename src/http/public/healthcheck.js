export default function ({ app }) {
    app.get("/health_check", function (req, res) {
        res.send({healthy: true});
    });
}
