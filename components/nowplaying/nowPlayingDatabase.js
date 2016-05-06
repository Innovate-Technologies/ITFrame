var mongoose = requireFromRoot("components/database/mongodb.js")
let moduleLogger = log.child({ component: "nowplaying/database" })
var Schema = mongoose.Schema
var nowplayingSchema = new Schema({
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
}, { collection: "nowplaying" })
nowplayingSchema.index({ username: 1, expireAt: 1 }, {
    expireAfterSeconds: 0,
})

var NowPlayingModel = mongoose.model("nowplaying", nowplayingSchema, "nowplaying")

module.exports.getLatestSong = function (username, callback) {
    NowPlayingModel.findOne({ username: username }).sort("-_id").exec(function (err, res) {
        if (err) {
            return callback(err)
        }
        if (res === null) {
            return callback(null, { })
        }
        callback(null, res)
    })
};

module.exports.getLatestSongs = function (username, num, callback) {
    let logger = moduleLogger.child({ username, num });
    logger.debug("Looking up songs");
    NowPlayingModel.find({ username: username }).sort("-_id").limit(num).exec(function (err, res) {
        if (err) {
            callback(err)
            return
        }
        if (res === null) {
            callback(null, { })
            return
        }
        logger.debug("Sending songs");
        callback(null, res)
    })
};

module.exports.addSong = function (songInfo, callback) {
    songInfo.createDate = Date.now()
    new NowPlayingModel(songInfo).save(function (err, res) {
        callback(err, res)
    })
}
