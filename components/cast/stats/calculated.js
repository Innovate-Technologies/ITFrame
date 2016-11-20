const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const CalculatedSchema = new Schema({
    username: String,
    resulution: {
        type: String,
        enum: ["minute", "hour", "day"],
    },
    totalSessions: Number,
    uniqueListeners: Number,
    averageListeners: Number,
    tlh: Number,
    averageSessionTime: Number,
    clientSpread: [{client: String, percentage: Number}],
    geoSpread: [{country: String, percentage: Number}],
    returningListeners: Number,
    dateAdded: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        expires: "1m",
    },
}, { collection: "cast_calculated" })
CalculatedSchema.index({
    username: 1,
    expiresAt: 1,
    dateAdded: 1,
    resulution: 1,
});
const CalculatedModel = mongoose.model("cast_calculated", CalculatedSchema, "cast_calculated")


const ONE_SECOND = 1000
const ONE_MINUTE = 60
const ONE_HOUR = 60
const ONE_DAY = 24
const ONE_YEAR = 365

const delayForResolution = {
    minute: 90 * ONE_DAY * ONE_HOUR * ONE_MINUTE * ONE_SECOND,
    hour: 90 * ONE_DAY * ONE_HOUR * ONE_MINUTE * ONE_SECOND,
    day: 10 * ONE_YEAR * ONE_DAY * ONE_HOUR * ONE_MINUTE * ONE_SECOND,
}

export const insertDataForUsername = async (username, info) => {
    info.username = username
    info.expiresAt = new Date((new Date()).getTime() + delayForResolution[info.resulution])
    return await new CalculatedModel(info).save()
}

export const getDataForUsername = async (username, resolution, since) => {
    return await CalculatedModel.find({
        username,
        resolution,
        dateAdded: { $gt: since },
    }).exec()
}
