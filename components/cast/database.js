import _ from "underscore"
import randtoken from "rand-token"

import * as buildinfo from "app/components/buildinfo/database.js"
import mongoose from "app/components/database/mongodb.js"

const Schema = mongoose.Schema
const castSchema = new Schema({
    name: {
        type: String,
        default: "",
    },
    genre: {
        type: String,
        default: "Misc",
    },
    username: String,
    httpPort: Number,
    httpsPort: Number,
    httpsCert: String,
    httpsKey: String,
    hostname: String,
    apikey: {
        type: String,
        default: () => { return randtoken.generate(30) },
    },
    input: {
        SHOUTcast: Number,
        Icecast: {
            type: Number,
            default: 1000,
        },
    },
    directories: {
        Icecast: Object,
    },
    streams: Object,
    version: {
        Cast: {
            type: String,
            default: "0",
        },
        DJ: {
            type: String,
            default: "0",
        },
    },
    internal: {
        dj: {
            key: {
                type: String,
                default: () => { return randtoken.generate(30) },
            },
        },
        statistics: {
            key: {
                type: String,
                default: () => { return randtoken.generate(30) },
            },
        },
    },
    DJ: {
        enabled: {
            type: Boolean,
            default: false,
        },
        fadeLength: {
            type: Number,
            default: 0,
        },
    },
    rateLimiting: {
        type: Boolean,
        default: false,
    },
    geolock: {
        enabled: Boolean,
        countryCodes: [String],
        mode: {
            type: String,
            enum: ["blacklist", "whitelist"],
        },
    },
    antiStreamRipper: {
        type: Boolean,
        default: false,
    },
    hideListenerCount: {
        type: Boolean,
        default: false,
    },
}, { collection: "cast" })
const CastModel = mongoose.model("cast", castSchema, "cast")


export const getInfoForUsername = (username, callback) => {
    CastModel.findOne({ username: username }, function (err, res) {
        if (err) {
            return callback(err);
        }
        if (res === null) {
            return callback(new Error("No such username"));
        }
        return callback(null, res);
    });
}
export const getConfig = getInfoForUsername

export const addConfigForUsername = (username, conf, callback) => {
    conf.username = username;
    buildinfo.buildInfoForName("Cast", function (err, build) {
        if (err) {
            return callback(err)
        }
        if (typeof conf.version !== "object") {
            conf.version = { Cast: 0, DJ: 0 }
        }
        conf.version.Cast = build.version
        new CastModel(conf).save(callback);
    })
}

export const updateVersion = (username, callback) => {
    buildinfo.buildInfoForName("Cast", function (buildErr, build) {
        if (buildErr) {
            return callback(buildErr)
        }
        CastModel.findOne({ username: username }).lean().exec((err, castInfo) => {
            if (err) {
                return callback(err)
            }
            if (!castInfo) {
                return callback(new Error("username not found"))
            }
            CastModel.remove({ username }, (rerr) => {
                if (rerr) {
                    return callback(err)
                }
                delete castInfo._id
                if (!castInfo.version) {
                    castInfo.version = {}
                }
                castInfo.version.Cast = build.version
                new CastModel(castInfo).save(callback)
            })
        })

    })
}

export const updateDJVersion = (username, callback) => {
    CastModel.findOne({ username: username }, (err, conf) => {
        if (err) {
            return callback(err)
        }
        if (conf === null) {
            return callback(new Error("No such username"))
        }
        buildinfo.buildInfoForName("DJ", function (buildErr, build) {
            if (buildErr) {
                return callback(buildErr)
            }
            if (typeof conf.version !== "object") {
                conf.version = { Cast: 0, DJ: 0 }
            }
            conf.version.DJ = build.version
            conf.save(callback)
        })
    })
}

export const deleteUsername = (username, callback) => {
    CastModel.remove({ username }, callback);
}

export const updateConfig = (username, conf, callback) => {
    CastModel.update({ username }, conf, { overwrite: true }, function (error) {
        if (error) {
            return callback(error);
        }
        return callback();
    });
}

export const getStreamUrl = (username, callback) => {
    CastModel.findOne({ username }, function (err, account) {
        if (err) {
            return callback(err);
        }
        if (account === null) {
            return callback(new Error("No such username"));
        }
        let primaryStream = _.findWhere(account.streams, {
            primary: true,
        });
        let streamUrl = account.hostname + "/streams/" + primaryStream.stream;
        return callback(null, streamUrl);
    });
}

export const checkStatsKey = async (username, key) => {
    const accountInfo = await CastModel.findOne({ username }).exec()

    if (!accountInfo || !accountInfo.internal || !accountInfo.internal.statistics) {
        return false
    }

    return accountInfo.internal.statistics.key === key
}

export const getAll = (callback) => {
    CastModel.find({}, callback)
}
