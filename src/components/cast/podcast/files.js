const mongoose = requireFromRoot("components/database/mongodb.js")

const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const filesSchema = new Schema({
    username: String,
    url: String,
    size: Number,
    created: Date,
}, { collection: "cast_podcast_files" })
const FilesModel = mongoose.model("cast_podcast_files", filesSchema, "cast_podcast_files")


export const get = (id) => {
    return FilesModel.findOne({ _id: new ObjectId(id) }).exec()
}

export const addForUsername = async (username, object) => {
    object.created = new Date()
    object.username = username
    return (new FilesModel(object)).save()
}

export const calculateUsedSpace = async (username) => {
    let total = 0
    const files = await FilesModel.findOne({ username }).exec()

    for (let file of files) {
        total += file.size || 0
    }

    return total
}