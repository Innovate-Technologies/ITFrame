const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const ClocksSchema = new Schema({
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
});
const ClocksModel = mongoose.model("dj_clocks", ClocksSchema, "dj_clocks")

export const clocksForUsername = (username) => {
    return ClocksModel.find({username: username}).exec()
}

export const clockForID = (id) => {
    return ClocksModel.findOne({
        _id: new ObjectId(id),
    }).exec()
}

export const clockForUserAndID = (id, username) => {
    return ClocksModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }).exec()
}

export const addClock = (username, clock) => {
    clock.username = username
    return new ClocksModel(clock).save()
}

export const deleteClockWithID = (id) => {
    return ClocksModel.remove({ id }).exec()
}

export const deleteClockWithUsername = (username) => {
    return ClocksModel.remove({ username }).exec()
}


export const replaceClocksForUsername = async (username, clocks) => {
    await deleteClockWithUsername(username)
    for (let clock of clocks) {
        await addClock(username, clock)
    }
}
