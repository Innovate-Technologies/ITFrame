const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const nocoverSchema = new Schema({
    username: String,
    link: String,
}, { collection: "centova_nocover", read: "nearest" });
const nocoverModel = mongoose.model("centova_nocover", nocoverSchema, "centova_nocover");

export const nocoverForUserame = (username) => {
    return nocoverModel.findOne({
        username,
    }).exec()
}
export const updateNocoverForUsername = async (username, link) => {
    let entry = await nocoverModel.findOne({ username }).exec()
    if (entry === null) {
        entry = new nocoverModel()
        entry.username = username
    }
    entry.link = link
    return entry.save()
}
