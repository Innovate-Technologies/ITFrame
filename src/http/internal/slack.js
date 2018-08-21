import { createMessageAdapter } from "@slack/interactive-messages"
import * as alexa from "~/components/alexa/alexa"

export default ({ app }) => {
    // Create the adapter using the app's signing secret, read from environment variable
    const slackInteractions = createMessageAdapter(global.config.slackAlexaSigningSecret);

    // Attach the adapter to the Express application as a middleware
    // NOTE: The path must match the Request URL and/or Options URL configured in Slack
    app.use("/slack/alexa-review/actions", slackInteractions.expressMiddleware())

    slackInteractions.action({ callbackId: "review", type: "accept" }, (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].selected_options[0] || !payload.actions[0].selected_options[0].value) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "approved" })

        respond({ text: "The app has been approved!" });
    });

    slackInteractions.action({ callbackId: "review", type: "reject_invocation" }, (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].selected_options[0] || !payload.actions[0].selected_options[0].value) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The invocation name text does not comply to Amazon's specifications" })

        respond({ text: "The app has been rejected!" });
    });

    slackInteractions.action({ callbackId: "review", type: "reject_intro" }, (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].selected_options[0] || !payload.actions[0].selected_options[0].value) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The intro text does not comply to Amazon's specifications" })

        respond({ text: "The app has been rejected!" });
    });

    slackInteractions.action({ callbackId: "review", type: "reject_help" }, (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].selected_options[0] || !payload.actions[0].selected_options[0].value) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        alexa.updateForUsername(payload.actions[0].selected_options[0].value, { status: "rejected", rejectReason: "The help text does not comply to Amazon's specifications" })

        respond({ text: "The app has been rejected!" });
    });
}
