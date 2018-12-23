let promisify = require("promisify-node");
let cld = promisify("cld")
let whmcs = requireFromRoot("components/legacy/whmcs.js")

module.exports.answerClient = function (ticket) {
    answerClient(ticket)
}

let answerClient = async (ticket) => {
    let cldAnalyse = await cld.detect(ticket.content)
    if (cldAnalyse.languages.length === 1 && ["en", "nl", "fr"].indexOf(cldAnalyse.languages[0].code) === -1) {
        return whmcs.replyTicket({
            id: ticket.id,
            status: "Open",
            message: `
Hi ${ticket.firstname || "there"},

I am afraid we only provide support in English, French and Dutch.
If you are unable to reply in one of these languages, we invite you to use a translator service.

Kindest Regards,
Maya.
Artificial Intelligence | Innovate Technologies
Please ignore this reply if you think this is an error, I am just a robot.`
        })
    }
}
