const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const SessionsSchema = new Schema({
    username: String,
    listenerId: {
        type: Schema.Types.ObjectId,
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
    isReturningListener: {
        type: Boolean,
        default: false,
    },
    stream: String,
}, { collection: "cast_sessions" })
SessionsSchema.index({
    username: 1,
    listenerId: 1,
    startTime: 1,
    endTime: 1,
});
const SessionsModel = mongoose.model("cast_sessions", SessionsSchema, "cast_sessions")

export const startSession = (username, listenerId, stream, isReturningListener) => {
    const session = new SessionsModel({
        username,
        listenerId,
        startTime: new Date(),
        stream,
        isReturningListener,
    })
    return session.save()
}

export const endSession = (username, id) => {
    return SessionsModel.update({ _id: new ObjectId(id) }, {endTime: new Date()}).exec()
}

export const getAllSessionsForUsernameStartedSince = (username, since) => {
    return SessionsModel.find({
        username,
        $or: [
            { startTime: { $gte: since } },
            { endTime: null },
        ],
    }).populate("listenerId").exec()
}

export const getAllSessionsForUsernameInPeriod = (username, start, end) => {
    return SessionsModel.find({
        username,
        $or: [
            { startTime: { $gte: start, $lte: end } },
            { endTime: { $gte: start, $lte: end } },
            { endTime: null },
        ],
    }).populate("listenerId").exec()
}

export const getAllOpenSessionsForUsername = (username) => {
    return SessionsModel.find({ username, endTime: null }).populate("listenerId").exec()
}

export const closeAllSessionsForUsername = async (username) => {
    return SessionsModel.update({
        username,
        endTime: null,
    }, {
        endTime: new Date(),
    }, {
        multi: true,
    }).exec()
}
