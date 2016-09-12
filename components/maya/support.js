import cld from "cld"
import wait from "wait.for"

import database from "app/components/maya/supportDatabase.js"
import * as maya from "app/runners/maya/maya";
import * as whmcs from "app/components/legacy/whmcs.js"

export const answerClient = function (ticket) {
    wait.launchFiber(realAnswerClient, ticket)
}

let realAnswerClient = function (ticket) {
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
Please ignore this reply if you think this is an error, I am just a robot.`,
        })
    }
    let question = ticket.content;
    let answer = wait.for(database.lookUpAnswer, question)
    if (answer.length === 0) {
        return maya.sendMessage("#support", "Sorry, I have no idea what that means.")
    }
    // maya.sendMessage("#support", "If I were you I'd reply\n```Hi " + ticket.firstname + ",\n\n" + answer[0].reply + "\n\nKindest Regards\nMaya\nArtificial Intelligence | Innovate Technologies.\nSorry if my reply was inaccurate, I am just a robot trying to help```")
}
