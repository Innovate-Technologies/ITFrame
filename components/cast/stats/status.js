const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const StatusSchema = new Schema({
    username: String,
    listenerCount: Number,
    stream: String,
    time: {
        type: Date,
        expires: "2y",
        default: Date.now,
    },
}, { collection: "cast_status" })
StatusSchema.index({
    username: 1,
    stream: 1,
    time: 1,
});
const StatusModel = mongoose.model("cast_status", StatusSchema, "cast_status")

export const getAllStatusesForUsernameInPeriod = (username, start, end) => {
    return StatusModel.find({
        username,
        time: { $gte: start, $lte: end }
    }).exec()
}

export const addStatusForUsername = (username, status) => {
    status.username = username;
    return (new StatusModel(status)).save()
}
