const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId
const RequestSchema = new Schema({
    username: String,
    from: String,
    song: String,
    time: Date,
}, { collection: "request"});
RequestSchema.index({
    username: 1,
});
const RequestModel = mongoose.model("request", RequestSchema, "request");

export const getAllForUsername = async (username) => {
    return RequestModel.find({ username }).exec()
}

export const newForUsername = async (username, info) => {
    info.username = username
    info.time = Date.now()
    return (new RequestModel(info)).save()
}

export const deleteRequest = async (username, id) => {
    return RequestModel.remove({ username, _id: new ObjectId(id) }).exec()
}
