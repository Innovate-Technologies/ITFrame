/* global requireFromRoot,log,config */
var mongoose = requireFromRoot("components/database/mongodb.js")
var Schema = mongoose.Schema
var ObjectId = mongoose.Types.ObjectId
var IntervalsSchema = new Schema({
    username: String,
    name: String,
    songs: [],
	intervalType: String, // random, ordered, all
    every: Number,
    intervalMode: String, // songs, seconds
	songsAtOnce: Number,
    start: Date,
    end: Date,
	forever: Boolean,
}, { collection: "dj_intervals" })
IntervalsSchema.index({
    username: 1,
    song: 1,
    artist: 1,
    internalURL: 1,
});
var IntervalsModel = mongoose.model("dj_intervals", IntervalsSchema, "dj_intervals")

module.exports.intervalsForUsername = function (username, callback) {
    IntervalsModel.find({username: username}, callback)
}

module.exports.intervalForID = function (id, callback) {
    IntervalsModel.findOne({
        _id: new ObjectId(id),
    }, callback)
}

module.exports.intervalForUserAndID = function (id, username, callback) {
    IntervalsModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, callback)
}
