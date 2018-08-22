import { WebClient } from "@slack/client"

const web = new WebClient(global.config.slackAlexaToken);

export const sendForReview = (entry) => {

    const languages = []

    if (entry.languageEntries.length === 0) {
        return
    }

    for (let lang of entry.languageEntries) {
        languages.push({
            "title": lang.lanuage,
            "fields": [
                {
                    "title": "Invocation name",
                    "value": lang.invocationName,
                },
                {
                    "title": "Intro",
                    "value": lang.intro,
                },
                {
                    "title": "Help",
                    "value": lang.help,
                },
                {
                    "title": "Description",
                    "value": lang.description,
                },
                {
                    "title": "Short desctiption",
                    "value": lang.shortDescription,
                },
                {
                    "title": "Keywords",
                    "value": lang.keywords.join(","),
                },
            ],
        })
    }

    web.chat.postMessage({
        channel: "#alexa-review",
        text: "A new skill is ready for review",
        attachments: [
            {
                "title": "Name",
                "text": entry.name,
            },
            {
                "title": "logo",
                "image_url": entry.logo,
            },
            ...languages,
            {
                "fallback": "Review",
                "title": "Review",
                "callback_id": "review",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "Reject invocation name",
                        "text": "Reject invocation name",
                        "type": "button",
                        "value": entry.username,
                    },
                    {
                        "name": "Reject intro",
                        "text": "Reject intro",
                        "type": "button",
                        "value": entry.username,
                    },
                    {
                        "name": "Reject help",
                        "text": "Reject help",
                        "type": "button",
                        "value": entry.username,
                    },
                    {
                        "name": "Accept",
                        "text": "Accept",
                        "type": "button",
                        "value": entry.username,
                    },
                ],
            },
        ],
    })
    .catch(console.error);
}

export const disableButtons = (original, newMesage) => {
    for (let id in original.attachments) {
        if (original.attachments.hasOwnProperty(id) && original.attachments[id].title === "Review") {
            original.attachments[id].actions = []
            original.attachments[id].text = newMesage
        }
    }
    //return web.chat.update(original)
    return original
}
