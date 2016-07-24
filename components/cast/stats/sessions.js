const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const SessionsSchema = new Schema({
    username: String,
    listenerId: {
        type: ObjectId,
        ref: "cast_listeners",
    },
    startTime: Date,
    endTime: {
        type: Date,
        expires: "1y",
        default: Date.now,
    },
}, { collection: "cast_sessions" })
SessionsSchema.index({
    username: 1,
    listenerId: 1,
});
const SessionsModel = mongoose.model("cast_sessions", SessionsSchema, "cast_sessions")

export const startSession = (username, listenerId) => new Promise((resolve, reject) => {
    new SessionsModel({
        username,
        listenerId,
        startTime: new Date(),
    }).save((error, res) => {error ? reject(error) : resolve(res)})
})

export const endSession = (username, id) => new Promise((resolve, reject) => {
    SessionsModel.findOne({_id: new ObjectId(id)}, (err, res) => {
        if (err) {
            return reject(err)
        }
        res.endTime = new Date()
        res.save((error) => {error ? reject(error) : resolve()})
    })
})

export const getAllSessionsForUsernameSince = (username, since) => new Promise((resolve, reject) => {
    SessionsModel.find({username})
    .where("startTime").gt(since)
    .populate("listenerId")
    .exec((err, res) => {err ? reject(err) : resolve(res)})
})
