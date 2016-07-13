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
    }, (err, res) => { err ? reject(err) : resolve(res)})
})
