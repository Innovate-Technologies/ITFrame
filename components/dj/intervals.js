import _ from "underscore"

const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const IntervalsSchema = new Schema({
    username: String,
    name: String,
    songs: [],
    intervalType: {
        type: String,
        enum: ["random", "ordered", "all"],
    },
    every: Number,
    intervalMode: {
        type: String,
        enum: ["songs", "seconds"],
    },
    songsAtOnce: Number,
    start: Date,
    end: Date,
    forever: Boolean,
}, { collection: "dj_intervals" })
IntervalsSchema.index({
    username: 1,
});
const IntervalsModel = mongoose.model("dj_intervals", IntervalsSchema, "dj_intervals")

export const intervalsForUsername = (username) => {
    return IntervalsModel.find({ username: username }).exec()
}

export const intervalForID = (id) => {
    return IntervalsModel.findOne({
        _id: new ObjectId(id),
    }).exec()
}

export const intervalForUserAndID = (id, username) => {
    return IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }).exec()
}

export const addNewIntervalForUsername = (username, interval) => {
    interval.username = username
    return new IntervalsModel(interval).save()
}

export const removeIntervalForUsername = (username) => {
    return IntervalsModel.remove({ username }).exec()
}

export const removeIntervalForUsernameAndID = (username, id) => {
    return IntervalsModel.remove({
        username,
        _id: id,
    }).exec()
}

export const updateIntervalWithUsernameAndID = async (username, id, interval) => {
    let oldInterval = await IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    })
    if (!oldInterval) {
        throw new Error("No matching entry found")
    }
    oldInterval = _.extend(oldInterval, interval)
    oldInterval.username = username
    return oldInterval.save()
}
