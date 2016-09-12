import Slack from "slack-client";

var token = config.mayaToken
var autoReconnect = true
var autoMark = true
var s = null
let moduleLogger = log.child({ component: "maya" });

module.exports.connect = function () {
    s = new Slack(token, autoReconnect, autoMark)
    s.login()
    s.on("error", error => moduleLogger.error(error, "Slack error"))
    return s
}

module.exports.decodeMessage = function (message) {
    var channel = s.getChannelGroupOrDMByID(message.channel)
    var user = s.getUserByID(message.user)
    var text = message.text
    var channelName = channelName + (channel ? channel.name : "UNKNOWN_CHANNEL")
    var userName = user ? ("@" + user.name) : "UNKNOWN_USER"

    return {
        channel: channelName,
        user: userName,
        text,
        channelClass: channel,
    }
}
