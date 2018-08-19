const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const buildinfoSchema = new Schema({
    name: String,
    version: String,
}, { collection: "build_info" });
const BuildinfoModel = mongoose.model("build_info", buildinfoSchema, "build_info");

export const buildInfoForName = (name) => {
    return BuildinfoModel.findOne({
        name,
    }).exec()
}
export const updateVersionForName = async (name, version) => {
    const info = await BuildinfoModel.findOne({ name }).exec()
    if (info === null) {
        return (new BuildinfoModel({name, version})).save()
    }
    info.version = version
    return info.save()
}
