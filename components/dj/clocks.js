const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const ClocksSchema = new Schema({
    username: String,
    name: String,
    tags: [{
        percent: Number,
        tag: String,
    }],
    start: {
        dayOfWeek: Number, // monday==1
        hour: Number,
        minute: Number,
    },
    end: {
        dayOfWeek: Number,
        hour: Number,
        minute: Number,
    },
}, { collection: "dj_clocks" })
ClocksSchema.index({
    username: 1,
});
const ClocksModel = mongoose.model("dj_clocks", ClocksSchema, "dj_clocks")

export const clocksForUsername = (username) => new Promise((resolve, reject) => {
    ClocksModel.find({username: username}, (err, res) => { err ? reject(err) : resolve(res)})
})

export const clockForID = (id) => new Promise((resolve, reject) => {
    ClocksModel.findOne({
        _id: new ObjectId(id),
    }, (err, res) => { err ? reject(err) : resolve(res)})
})

export const clockForUserAndID = (id, username) => new Promise((resolve, reject) => {
    ClocksModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, (err, res) => { err ? reject(err) : resolve(res)})
})

export const addClock = (clock) => new Promise((resolve, reject) => {
    return new ClocksModel(clock).save((err) => {
        err ? reject(err) : resolve()
    })
})

export const deleteClockWithID = (id) => new Promise((resolve, reject) => {
    return ClocksModel.remove({ id }, (err) => {
        err ? reject(err) : resolve()
    })
})

export const deleteClockWithUsername = (username) => new Promise((resolve, reject) => {
    return ClocksModel.remove({ username }, (err) => {
        err ? reject(err) : resolve()
    })
})
