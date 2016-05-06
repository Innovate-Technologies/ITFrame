var mongoose = requireFromRoot("components/database/mongodb.js")
var Schema = mongoose.Schema
var ObjectId = mongoose.Types.ObjectId
var separationSchema = new Schema({
    enabled: Boolean,
    username: String,
	separationType: String, // artist, song
    interval: Number,
}, { collection: "dj_separation" })
separationSchema.index({
    username: 1,
});
var separationModel = mongoose.model("dj_separation", separationSchema, "dj_separation")

module.exports.separationForUsername = function (username, callback) {
    separationModel.find({username: username}, callback)
}
