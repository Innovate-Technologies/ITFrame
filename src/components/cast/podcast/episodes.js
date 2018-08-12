const mongoose = requireFromRoot("components/database/mongodb.js")

const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const episodeSchema = new Schema({
    username: String,
    title: String,
    description: String,
    file: String,
    internalURL: String,
    categories: [ String ], // optional - array of item categories
    author: String, // optional - defaults to feed author property
    date: Date, // can be in future, should not publish before date
    explicit: false,
    subtitle: String,
}, { collection: "cast_podcast_episodes" })
const EpisodeModel = mongoose.model("cast_podcast_episodes", episodeSchema, "cast_podcast_episodes")


export const getForUsername = (username) => {
    return EpisodeModel.findOne({ username }).exec()
}

export const getPublishedForUsername = (username) => {
    return EpisodeModel.findOne({
        username,
        date: { lte: (new Date())},
    }).exec()
}


export const addForUsername = async (username, object) => {
    object.username = username
    return (new EpisodeModel(object)).save()
}

export const updateForUsername = async (username, object) => {
    object.username = username
    return EpisodeModel.update({ username }, object).exec()
}

export const updateForUsernameAndID = async (username, id, object) => {
    object.username = username
    return EpisodeModel.update({ username, _id: new ObjectId(id) }, object).exec()
}

