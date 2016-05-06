export default function ({ app }) {
    app.get("/", function (req, res) {
        res.send("Welcome to ITFrame " + global.ITFrame.version);
    });
}
