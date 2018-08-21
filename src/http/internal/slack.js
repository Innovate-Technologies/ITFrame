import { createMessageAdapter } from "@slack/interactive-messages"
import * as alexa from "~/components/alexa/alexa"

export default ({ app }) => {
    // Create the adapter using the app's signing secret, read from environment variable
    const slackInteractions = createMessageAdapter(global.config.slackAlexaSigningSecret);

    // Attach the adapter to the Express application as a middleware
    // NOTE: The path must match the Request URL and/or Options URL configured in Slack
    app.use("/slack/alexa-review/actions", slackInteractions.expressMiddleware())

    slackInteractions.action({ callbackId: "review", type: "message_action" }, (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].name) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        if (payload.actions[0].name === "Reject invocation name") {
            alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The invocation name text does not comply to Amazon's specifications" })
            return respond({ text: `The app for ${payload.actions[0].value} has been rejected!` })
        }

        if (payload.actions[0].name === "Reject intro") {
            alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The intro text does not comply to Amazon's specifications" })
            return respond({ text: `The app for ${payload.actions[0].value} has been rejected!` });
        }

        if (payload.actions[0].name === "Reject help") {
            alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The help text does not comply to Amazon's specifications" })
            return respond({ text: `The app for ${payload.actions[0].value} has been rejected!` });
        }

        if (payload.actions[0].name === "Accept") {
            alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "approved" })
            return respond({ text: `The app for ${payload.actions[0].value} has been approved!` })
        }
    });
}
