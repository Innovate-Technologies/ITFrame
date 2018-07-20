const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const SongsSchema = new Schema({
    username: String,
    stream: String,
    song: String,
    title: String,
    artist: String,
    album: String,
    time: {
        type: Date,
        expires: "5y",
        default: Date.now,
    },
}, { collection: "cast_songs" })
SongsSchema.index({
    username: 1,
    stream: 1,
    time: 1,
});
const SongsModel = mongoose.model("cast_songs", SongsSchema, "cast_songs")

export const getAllSongsForUsernameInPeriod = (username, start, end) => {
    return SongsModel.find({
        username,
        time: { $gte: start, $lte: end },
    }).exec()
}

export const addSongsForUsername = (username, song) => {
    song.username = username;
    return (new SongsModel(song)).save()
}
