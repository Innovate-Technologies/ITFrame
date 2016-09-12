import mongoose from "app/components/database/mongodb.js"
var Schema = mongoose.Schema
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

export const separationForUsername = function (username, callback) {
    separationModel.find({username: username}, callback)
}
