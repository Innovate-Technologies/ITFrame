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
    isReturningListener: Boolean,
}, { collection: "cast_sessions" })
SessionsSchema.index({
    username: 1,
    listenerId: 1,
});
const SessionsModel = mongoose.model("cast_sessions", SessionsSchema, "cast_sessions")

export const startSession = (username, listenerId) => {
    const session = new SessionsModel({
        username,
        listenerId,
        startTime: new Date(),
    })
    return session.save()
}

export const endSession = (username, id) => {
    return SessionsModel.update({ _id: new ObjectId(id) }, {endTime: new Date()}).exec()
}

export const getAllSessionsForUsernameSince = (username, since) => {
    return SessionsModel.find({ username }).where("startTime").gt(since).populate("listenerId").exec()
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
