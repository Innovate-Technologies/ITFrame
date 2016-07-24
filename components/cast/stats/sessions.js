const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const SessionsSchema = new Schema({
    username: String,
    listenerId: {
        type: ObjectId,
        ref: "cast_listeners",
    },
    startTime: {
        type: Date,
        expires: "1y",
        default: Date.now,
    },
    endTime: {
        type: Date,
        default: null,
    },
}, { collection: "cast_sessions" })
SessionsSchema.index({
    username: 1,
    listenerId: 1,
});
const SessionsModel = mongoose.model("cast_sessions", SessionsSchema, "cast_sessions")

export const startSession = async (username, listenerId) => {
    const session = new SessionsModel({
        username,
        listenerId,
        startTime: new Date(),
    })
    return await session.save()
}

export const endSession = async (username, id) => {
    const session = await SessionsModel.findOne({_id: new ObjectId(id)})
    session.endTime = new Date()
    return await session.save()
}

export const getAllSessionsForUsernameSince = async (username, since) => {
    return await SessionsModel.find({username}).where("startTime").gt(since).populate("listenerId").exec()
}

export const closeAllSessionsForUsername = async (username) => {
    const openSessions = await SessionsModel.find({
        username,
        endTime: null,
    })
    for (let session of openSessions) {
        session.endTime = new Date()
        await session.save()
    }
}