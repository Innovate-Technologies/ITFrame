import * as alexa from "~/components/alexa/alexa"
import * as slack from "~/components/alexa/slack"
import NotFoundError from "~/http/classes/NotFoundError";

export default function ({ app, wrap }) {
    app.get("/control/alexa/settings/:username", wrap(async function (req, res) {
        const entry = await alexa.entryForUsername(req.params.username)
        if (entry === null) {
            throw new NotFoundError("No Slexa app for username found")
        }
        res.json(entry)
    }));

    app.put("/control/alexa/settings/:username", wrap(async function (req, res) {
        let settings = req.body || {};
        const entry = await alexa.entryForUsername(req.params.username)
        if (entry === null) {
            await alexa.newForUsername(req.params.username, settings)

            const newEntry = await alexa.entryForUsername(req.params.username)
            slack.sendForReview(newEntry)
        } else {
            if (entry.status === "rejected" || entry.status === "processing") {
                settings.status = "in-review"
            }
            await alexa.updateForUsername(req.params.username, settings);

            if (settings.status && settings.status === "in-review") {
                const newEntry = await alexa.entryForUsername(req.params.username)
                slack.sendForReview(newEntry)
            }
        }
        res.json({});
    }));

    app.delete("/control/alexa/settings/:username", wrap(async function (req, res) {
        await alexa.deleteForUsername(req.params.username);
        res.json({});
    }));
}
