const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const ListenersSchema = new Schema({
    username: String,
    ip: String,
    client: String,
    geo: {
        country: String,
        latitude: Number,
        longitude: Number,
        countryCode: String,
    },
    lastSeen: {
        type: Date,
        expires: "2y",
        default: Date.now,
    },
}, { collection: "cast_listeners" })
ListenersSchema.index({
    username: 1,
});
const ListenersModel = mongoose.model("cast_listeners", ListenersSchema, "cast_listeners")

export const getListenerForInfo = (username, ip, client) => {
    return ListenersModel.findOne({ username, ip, client }).exec()
}

export const addListenerProfile = (username, info) => {
    info.username = username
    info.lastSeen = new Date()
    return new ListenersModel(info).save()
}

export const updateLastSeen = (id) => {
    return ListenersModel.update({
        _id: new ObjectId(id),
    }, {
        lastSeen: new Date(),
    }).exec()
}
