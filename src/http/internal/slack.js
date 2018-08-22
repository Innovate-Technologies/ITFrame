import { createMessageAdapter } from "@slack/interactive-messages"
import * as alexa from "~/components/alexa/alexa"
import * as slack from "~/components/alexa/slack"

export default ({ app }) => {
    // Create the adapter using the app's signing secret, read from environment variable
    const slackInteractions = createMessageAdapter(global.config.slackAlexaSigningSecret);

    // Attach the adapter to the Express application as a middleware
    // NOTE: The path must match the Request URL and/or Options URL configured in Slack
    app.use("/slack/alexa-review/actions", slackInteractions.expressMiddleware())

    slackInteractions.action({ callbackId: "review" }, async (payload, respond) => {
        if (!payload.actions[0] || !payload.actions[0].name) {
            respond({ text: JSON.stringify(payload) });
            return
        }

        if (payload.actions[0].name === "Reject invocation name") {
            respond(slack.disableButtons(payload.original_message, `:heavy_multiplication_x: rejected by <@${payload.user.id}>`))
            alexa.updateForUsername(payload.actions[0].value, { status: "rejected", rejectReason: "The invocation name text does not comply to Amazon's specifications" })
        }

        if (payload.actions[0].name === "Reject intro") {
            respond(slack.disableButtons(payload.original_message, `:heavy_multiplication_x: rejected by <@${payload.user.id}>`))
            alexa.updateForUsername(payload.actions[0].value, { status: "rejected", rejectReason: "The intro text does not comply to Amazon's specifications" })
        }

        if (payload.actions[0].name === "Reject help") {
            respond(slack.disableButtons(payload.original_message, `:heavy_multiplication_x: rejected by <@${payload.user.id}>`))
            alexa.updateForUsername(payload.actions[0].value, { status: "rejected", rejectReason: "The help text does not comply to Amazon's specifications" })
        }

        if (payload.actions[0].name === "Accept") {
            respond(slack.disableButtons(payload.original_message, `:heavy_check_mark: approved by <@${payload.user.id}>`))
            alexa.updateForUsername(payload.actions[0].value, { status: "approved" })
        }
    });
}
