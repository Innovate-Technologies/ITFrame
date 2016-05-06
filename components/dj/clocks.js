/* global requireFromRoot,log,config */
var mongoose = requireFromRoot("components/database/mongodb.js")
var Schema = mongoose.Schema
var ObjectId = mongoose.Types.ObjectId
var ClocksSchema = new Schema({
    username: String,
    name: String,
    tags: [{
        percent: Number,
        tag: String,
    }],
    start: {
        dayOfWeek: Number, // monday==1
        hour: Number,
        minute: Number,
    },
    end: {
        dayOfWeek: Number,
        hour: Number,
        minute: Number,
    },
}, { collection: "dj_clocks" })
ClocksSchema.index({
    username: 1,
    song: 1,
    artist: 1,
    internalURL: 1,
});
var ClocksModel = mongoose.model("dj_clocks", ClocksSchema, "dj_clocks")

module.exports.clocksForUsername = function (username, callback) {
    ClocksModel.find({username: username}, callback)
}

module.exports.clockForID = function (id, callback) {
    ClocksModel.findOne({
        _id: new ObjectId(id),
    }, callback)
}

module.exports.clockForUserAndID = function (id, username, callback) {
    ClocksModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, callback)
}
