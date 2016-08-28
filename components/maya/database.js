import _ from "underscore"
import wait from "wait.for"

import mongoose from "app/components/database/mongodb.js";

var Schema = mongoose.Schema;

var mayaSchema = new Schema({
    subjects: Object,
    owners: Object,
    actions: Object,
    verbs: Object,
    nouns: Object,
    adjectives: Object,
    tokens: Object,
    func: Function, // function(classify,analyze,callback)
}, { collection: "maya" });
var maya = mongoose.model("maya", mayaSchema);

var doCall = function (find, callback) {
    maya.find(find).exec(function (err, returnedData) {
        if (err) {
            return callback(err)
        }
        callback(null, returnedData);
    })
}

var getFuncSync = function (subject, owner, action, verb, adjective, noun, token, callbackslack) {
    var replies = {}
    var scores = {}
    var count = 0

    var resForSubjects = wait.for(doCall, { subjects: subject })
    var resForOwners = wait.for(doCall, { owner: owner })
    var resForActions = wait.for(doCall, { actions: action })

    var resForVerbs = []
    for (var id in verb) {
        if (verb.hasOwnProperty(id)) {
            let res = wait.for(doCall, { verbs: verb[id] })
            for (let id2 in res) {
                if (res.hasOwnProperty(id2)) {
                    resForVerbs.push(res[id2])
                }
            }
        }
    }

    var resForAdjectives = []
    for (var id4 in adjective) {
        if (adjective.hasOwnProperty(id4)) {
            let res2 = wait.for(doCall, {
                adjectives: adjective[id4],
            })
            for (let id3 in res2) {
                if (res2.hasOwnProperty(id3)) {
                    resForAdjectives.push(res2[id3])
                }
            }
        }
    }

    var resForNouns = []
    for (var id5 in noun) {
        if (noun.hasOwnProperty(id5)) {
            let res3 = wait.for(doCall, { nouns: noun[id5] })
            for (let id6 in res3) {
                if (res3.hasOwnProperty(id6)) {
                    resForNouns.push(res3[id6])
                }
            }
        }
    }

    var resForTokens = []
    for (var id7 in token) {
        if (token.hasOwnProperty(id7)) {
            let res2 = wait.for(doCall, { tokens: token[id7] })
            for (let id2 in res2) {
                if (res2.hasOwnProperty(id2)) {
                    resForTokens.push(res2[id2])
                }
            }
        }
    }

    var rsc = { replies: replies, scores: scores, count: count }
    rsc = wait.for(calculateScore, rsc, resForSubjects, {
        owners: owner,
        actions: action,
        verbs: verb,
        adjectives: adjective,
        tokens: token,
    })
    rsc = wait.for(calculateScore, rsc, resForOwners, {
        subjects: subject,
        actions: action,
        verbs: verb,
        adjectives: adjective,
        tokens: token,
    })
    rsc = wait.for(calculateScore, rsc, resForActions, {
        subjects: subject,
        owners: owner,
        verbs: verb,
        adjectives: adjective,
        tokens: token,
    })
    rsc = wait.for(calculateScore, rsc, resForVerbs, {
        subjects: subject,
        owners: owner,
        actions: action,
        adjectives: adjective,
        tokens: token,
    })
    rsc = wait.for(calculateScore, rsc, resForAdjectives, {
        subjects: subject,
        owners: owner,
        actions: action,
        verbs: verb,
        tokens: token,
    })
    rsc = wait.for(calculateScore, rsc, resForTokens, {
        subjects: subject,
        owners: owner,
        actions: action,
        adjectives: adjective,
    })
    concludeBestResponse(rsc.replies, rsc.scores, callbackslack)
}

var calculateScore = function (rsc, res, others, callback) {
    var replies = rsc.replies
    var scores = rsc.scores
    var count = rsc.count
    for (var id in res) {
        if (!res.hasOwnProperty(id)) {
            return
        }
        replies[count] = res[id].scores[count] = 0
        for (var id2 in others) {
            if (!others.hasOwnProperty(id2)) {
                return
            }
            if (typeof others[id2] === "string") {
                if (_.contains(res[id][id2], others[id2])) {
                    scores[count] = scores[count] + 2
                }
            } else {
                for (var id3 in others[id2]) {
                    if (others[id2].hasOwnProperty(id3)) {
                        if (_.contains(res[id][id2], others[id2][id3])) {
                            scores[count]++
                        }
                    }
                }
            }
        }
        count++
    }
    callback(null, {
        replies: replies,
        scores: scores,
        count: count,
    })
}

var concludeBestResponse = function (replies, scores, callback) {
    var highestscore = { id: 0, score: 0 }
    for (var id in replies) {
        if (scores[id] > highestscore.score) {
            highestscore.id = id
            highestscore.score = scores[id]
        }
    }
    if (highestscore.score === 0) {
        return callback(null, function (classify, analyze, slackCallback) {
            slackCallback(null, "Sorry, what did you say?")
        })
    }
    callback(null, replies[highestscore.id].func)
}

export const getFunc = function (subject, owner, action, verb, adjective, noun, token, callbackslack) {
    wait.launchFiber(getFuncSync, subject, owner, action, verb, adjective, noun, token, callbackslack)
}
