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

export const intervalsForUsername = (username) => new Promise((resolve, reject) => {
    IntervalsModel.find({ username: username }, (err, res) => { err ? reject(err) : resolve(res)})
})

export const intervalForID = (id) => new Promise((resolve, reject) => {
    IntervalsModel.findOne({
        _id: new ObjectId(id),
    }, (err, res) => { err ? reject(err) : resolve(res)})
})

export const intervalForUserAndID = (id, username) => new Promise((resolve, reject) => {
    IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, (err, res) => { err ? reject(err) : resolve(res) })
})

export const addNewIntervalForUsername = (username, interval) => new Promise((resolve, reject) => {
    interval.username = username
    new IntervalsModel(interval).save((err) =>{ err ? reject(err) : resolve() })
})

export const updateIntervalWithUsernameAndID = (username, id, interval) => new Promise((resolve, reject) => {
    IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, (err, res) => {
        if (err) {
            return reject(err)
        }
        if (!res) {
            return reject(new Error("No matching entry found"))
        }
        res = _.extend(res, interval)
        res.username = username
        res.save((error) => { error ? reject(error) : resolve() })
    })
})