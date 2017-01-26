const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const nowplayingSchema = new Schema({
    username: String,
    song: String,
    artist: String,
    cover: String,
    wiki: String,
    buy: String,
    createDate: {
        type: Date,
        expires: "1d",
        default: Date.now,
    },
}, { collection: "nowplaying", read: "nearest" })
nowplayingSchema.index({ username: 1, expireAt: 1 }, {
    expireAfterSeconds: 0,
})

const NowPlayingModel = mongoose.model("nowplaying", nowplayingSchema, "nowplaying")

export const getLatestSong = (username) => {
    return NowPlayingModel.findOne({ username: username }).sort("-_id").exec()
};

export const getLatestSongs = (username, num) => {
    return NowPlayingModel.find({ username: username }).sort("-_id").limit(num).exec()
};

export const addSong = (songInfo) => {
    songInfo.createDate = Date.now()
    return new NowPlayingModel(songInfo).save()
}
