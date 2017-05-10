let moduleLogger = log.child({ component: "maya" });
let _ = require("underscore");

if (config.mayaHost) {
    load();
} else {
    moduleLogger.info("Not loading Maya since mayaHost is not truthy");
    module.exports.sendMessage = () => {};
}

function load() {
    var db = requireFromRoot("components/maya/database.js")
    var slackAPI = require("./slackBot.js")
    var speak = require("speakeasy-nlp")
    var mood = 0
    moduleLogger.info("Connecting to the Slack API")
    var slack = slackAPI.connect()
    slack.on("message", function (slackmessage) {
        var message = slackAPI.decodeMessage(slackmessage)
        if (typeof message.text !== "undefined" && (message.text.indexOf(config.mayaTrigger) === 0 || message.channel === message.user.replace("@", ""))) {

            var classify = speak.classify(message.text.replace(config.mayaTrigger, ""))
            var analyze = speak.sentiment.analyze(message.text.replace(config.mayaTrigger, ""))

            mood = mood + analyze.score

            db.getFunc(classify.subject, classify.owner, classify.action, classify.verbs, classify.adjectives, classify.nouns, classify.tokens, function (err, func) {
                if (err) {
                    return
                }
                func(classify, mood, function (error, res) {
                    if (error) {
                        return
                    }
                    message.channelClass.send(res)
                })
            })
        }

    })

    let readyToSend = false
    slack.on("open", function () {
        readyToSend = true
        retry()
    })

    const ONE_SECOND = 1000;
    const RETRY_INTERVAL = 5 * ONE_SECOND;
    let retryQueue = [];
    let retry = () => {
        if (readyToSend) {
            retryQueue.forEach((message) => {
                send(message).then(() => {
                    retryQueue = _.without(retryQueue, message);
                });
            });
        }
    };
    setInterval(retry, RETRY_INTERVAL);

    let send = ({ channel, message } = {}) => {
        if (!channel || !message) {
            return;
        }
        var c = slack.getChannelByName(channel)
        if (typeof c !== "undefined") {
            c.send(message)
        }
    };

    module.exports.sendMessage = function (channel, message) {
        if (readyToSend) {
            return send({ channel, message });
        }
        retryQueue.push({ channel, message });
    }

}
