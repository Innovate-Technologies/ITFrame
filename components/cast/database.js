import randtoken from "rand-token"
import _ from "underscore"
const buildinfo = requireFromRoot("components/buildinfo/database.js")
const mongoose = requireFromRoot("components/database/mongodb.js")
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

export const getInfoForUsername = async (username) => {
    const config = await CastModel.findOne({ username }).exec()
    if (config === null) {
        throw new Error("No such username")
    }
    return config
}
export const getConfig = getInfoForUsername


export const addConfigForUsername = async (username, conf) => {
    conf.username = username;
    const build = await buildinfo.buildInfoForName("Cast");
    if (typeof conf.version !== "object") {
        conf.version = { Cast: 0, DJ: 0 }
    }
    conf.version.Cast = build.version
    return new CastModel(conf).save();
}

export const updateVersion = async (username) => {
    const build = await buildinfo.buildInfoForName("Cast");
    const castInfo = await CastModel.findOne({ username }).lean().exec()
    if (!castInfo) {
        throw new Error("username not found")
    }
    await CastModel.remove({ username }).exec()
    delete castInfo._id
    castInfo.version.Cast = build.version
    return new CastModel(castInfo).save()
}

export const updateDJVersion = async (username) => {
    const build = await buildinfo.buildInfoForName("DJ");
    const castInfo = await CastModel.findOne({ username }).lean().exec()
    if (!castInfo) {
        throw new Error("username not found")
    }
    await CastModel.remove({ username }).exec()
    delete castInfo._id
    castInfo.version.DJ = build.version
    return new CastModel(castInfo).save()
}

export const deleteUsername = (username) => {
    return CastModel.remove({ username }).exec()
}

export const updateConfig = (username, conf) => {
    return CastModel.update({ username }, conf, { overwrite: true }).exec()
}

export const getStreamUrl = async (username) => {
    const account = await CastModel.findOne({ username }).exec()
    if (account === null) {
        throw new Error("No such username");
    }
    const primaryStream = _.findWhere(account.streams, { primary: true });
    return `${account.hostname}/streams/${primaryStream.stream}`
}

export const checkStatsKey = async (username, key) => {
    const accountInfo = await CastModel.findOne({ username }).exec()
    if (!accountInfo || !accountInfo.internal || !accountInfo.internal.statistics) {
        return false
    }
    return accountInfo.internal.statistics.key === key
}

export const getAll = () => {
    return CastModel.find({}).exec()
}

