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

export const addListenerProfile = (info) => new Promise((resolve, reject) => {
    info.lastSeen = new Date()
    new ListenersModel(info).save((err) => {err ? reject(err) : resolve()})
})

export const updateLastSeen = (id) => new Promise((resolve, reject) => {
    ListenersModel.findOne({
        _id: new ObjectId(id)
    }, (err, res) => {
        if (err) {
            return reject(err)
        }
        res.lastSeen = new Date()
        res.save((error) => {error ? reject(error) : resolve()})
    })
})