const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const NocoverSchema = new Schema({
    username: String,
    link: String,
}, { collection: "tunes_nocover", read: "nearest" });
NocoverSchema.index({
    username: 1,
});
const NocoverModel = mongoose.model("tunes_nocover", NocoverSchema, "tunes_nocover");

export const nocoverForUserame = (username) => {
    return NocoverModel.findOne({
        username,
    }).exec()
}

export const updateNocoverForUsername = async (username, link) => {
    let entry = await NocoverModel.findOne({ username }).exec()
    if (entry === null) {
        entry = new NocoverModel()
        entry.username = username
    }
    entry.link = link
    return entry.save()
}

export const deleteNocoverForUsername = async (username) => {
    return NocoverModel.remove({ username }).exec()
}
