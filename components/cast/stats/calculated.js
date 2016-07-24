const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const CalculatedSchema = new Schema({
    username: String,
    resulution: {
        type: String,
        emum: ["minute", "hour", "day"],
    },
    totalSessions: Number,
    averageListeners: Number,
    tlh: Number,
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
});
const CalculatedModel = mongoose.model("cast_calculated", CalculatedSchema, "cast_calculated")

export const insertDataForUsername = async (username, info) => {
    info.username = username
    switch (info.resulution) {
        case "minute":
            info.expiresAt = new Date((new Date()).getTime() + (90 * 24 * 60 * 60 * 1000))
            break
        case "hour":
            info.expiresAt = new Date((new Date()).getTime() + (365 * 24 * 60 * 60 * 1000))
            break
        case "year":
            info.expiresAt = new Date((new Date()).getTime() + (10 * 365 * 24 * 60 * 60 * 1000))
            break
        default:
            info.expiresAt = new Date((new Date()).getTime() + (90 * 24 * 60 * 60 * 1000))
    }
    return await new CalculatedModel(info).save()
}

export const getDataForUsername = async (username, resolution, since) => {
    return await CalculatedModel.find({
        username,
        resolution,
    }).where("dateAdded").gt(since).exec()
}
