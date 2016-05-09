let database = require("./supportDatabase.js")
let wait = require("wait.for")
let cld = require("cld")
let maya = requireFromRoot("runners/maya/maya");
let whmcs = requireFromRoot("components/legacy/whmcs.js")

module.exports.answerClient = function (ticket) {
    wait.launchFiber(answerClient, ticket)
}

let answerClient = function (ticket) {
    let cldAnalyse = wait.for(cld.detect, ticket.content)
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
    let question = ticket.content;
    let answer = wait.for(database.lookUpAnswer, question)
    if (answer.length === 0) {
        return maya.sendMessage("#support", "Sorry, I have no idea what that means.")
    }
    // maya.sendMessage("#support", "If I were you I'd reply\n```Hi " + ticket.firstname + ",\n\n" + answer[0].reply + "\n\nKindest Regards\nMaya\nArtificial Intelligence | Innovate Technologies.\nSorry if my reply was inaccurate, I am just a robot trying to help```")
}
