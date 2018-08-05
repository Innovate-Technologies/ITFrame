const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const buildinfoSchema = new Schema({
    name: String,
    version: String,
}, { collection: "build_info" });
const buildinfoModel = mongoose.model("build_info", buildinfoSchema, "build_info");

export const buildInfoForName = (name) => {
    return buildinfoModel.findOne({
        name,
    }).exec()
}
export const updateVersionForName = async (name, version) => {
    const info = await buildinfoModel.findOne({ name }).exec()
    if (info === null) {
        throw new Error("Name not found")
    }
    info.version = version
    return info.save()
}
