import _ from "lodash"

const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const TagsSchema = new Schema({
    username: String,
    name: String,
    color: String,
}, { collection: "dj_tags" })
TagsSchema.index({
    username: 1,
});
const TagsModel = mongoose.model("dj_tags", TagsSchema, "dj_tags")

export const tagsForUsername = (username) => {
    return TagsModel.find({ username }).exec()
}

export const addNewTagForUsername = (username, tag) => {
    tag.username = username
    return new TagsModel(tag).save()
}

export const removeTagsForUsername = (username) => {
    return TagsModel.remove({ username }).exec()
}

export const removeTagForUsernameAndID = (username, id) => {
    return TagsModel.remove({
        username,
        _id: id,
    }).exec()
}

export const updateTagWithUsernameAndID = async (username, id, tag) => {
    let oldTag = await TagsModel.findOne({
        _id: new ObjectId(id),
        username,
    })
    if (!oldTag) {
        throw new Error("No matching entry found")
    }
    oldTag = _.extend(oldTag, tag)
    oldTag._id = new ObjectId(id) // force the same id
    oldTag.username = username
    return oldTag.save()
}
