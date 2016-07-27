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

export const intervalsForUsername = async (username) => {
    return IntervalsModel.find({ username: username })
}

export const intervalForID = async (id) => {
    return IntervalsModel.findOne({
        _id: new ObjectId(id),
    })
}

export const intervalForUserAndID = async (id, username) => {
    return IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    })
}

export const addNewIntervalForUsername = async (username, interval) => {
    interval.username = username
    return new IntervalsModel(interval).save()
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
