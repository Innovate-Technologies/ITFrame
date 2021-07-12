const mongoose = requireFromRoot("components/database/mongodb.js")

const Schema = mongoose.Schema
const feedSchema = new Schema({
    username: String,
    title: String,
    subTite: String,
    description: String,
    site: String,
    image: String,
    author: String,
    managingEditor: String,
    webMaster: String,
    copyright: String,
    language: String,
    categories: [String],
    ownerName: String,
    ownerEmail: String,
    explicit: Boolean,
    itunesCategory: Object,
}, { collection: "cast_podcast_feed" })
const FeedModel = mongoose.model("cast_podcast_feed", feedSchema, "cast_podcast_feed")

export const getForUsername = (username) => {
    return FeedModel.findOne({ username }).exec()
}

export const addForUsername = async (username, object) => {
    object.username = username
    return (new FeedModel(object)).save()
}

export const updateForUsername = async (username, object) => {
    object.username = username
    return FeedModel.update({ username }, object).exec()
}
