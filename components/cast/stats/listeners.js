const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const ListenersSchema = new Schema({
    username: String,
    ip: String,
    client: String,
    geo: {
        countryCode: String,
        latitude: Number,
        longitude: Number,
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

export const getListenerForInfo = (ip, client) => new Promise((resolve, reject) => {
    ListenersModel.findOne({ip, client}, (err, res) => {
        if (err) {
            reject(err)
        }
        resolve(res)
    })
})

export const addListenerProfile = async (info) => {
    info.lastSeen = new Date()
    return await new ListenersModel(info).save()
}

export const updateLastSeen = async (id) => {
    const listener = ListenersModel.findOne({
        _id: new ObjectId(id),
    })
    listener.lastSeen = new Date()
    return await listener.save()
}
