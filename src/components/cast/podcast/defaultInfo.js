const mongoose = requireFromRoot("components/database/mongodb.js")

const Schema = mongoose.Schema
const defaultInfoSchema = new Schema({
    username: String,
    title: String,
    description: String,
    url: String,
    categories: [ String ], // optional - array of item categories
    author: String, // optional - defaults to feed author property
    date: Date, // any format that js Date can parse.
    explicit: false,
    subtitle: String,
}, { collection: "cast_podcast_default_info" })
const DefaultInfoModel = mongoose.model("cast_podcast_default_info", defaultInfoSchema, "cast_podcast_default_info")


export const getForUsername = (username) => {
    return DefaultInfoModel.findOne({ username }).exec()
}

export const addForUsername = async (username, object) => {
    object.username = username
    return (new DefaultInfoModel(object)).save()
}

export const updateForUsername = async (username, object) => {
    object.username = username
    return DefaultInfoModel.update({ username }, object).exec()
}
