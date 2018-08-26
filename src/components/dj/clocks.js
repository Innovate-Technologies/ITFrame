const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const ClocksSchema = new Schema({
    username: String,
    name: String,
    color: String,
    tags: [{
        percent: Number,
        tag: {
            type: Schema.Types.ObjectId,
            ref: "dj_tags",
        },
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


const getClockForDayHourMinute = (clocks, day, hour, minute) => {
    for (let id in clocks) {
        if (clocks.hasOwnProperty(id)) {
            if (clocks[id].start.dayOfWeek < day && clocks[id].end.dayOfWeek > day) {
          // ] day [
                return clocks[id];
            } else if ((clocks[id].start.dayOfWeek === day || clocks[id].end.dayOfWeek === day)) {
          // [ day ]
                if ((clocks[id].start.dayOfWeek === day && clocks[id].start.hour <= hour) || (clocks[id].end.dayOfWeek === day && clocks[id].end.hour >= hour)) {
            // check end minutes
            // [ day ] [ hour ]
                    if (clocks[id].start.hour < hour && clocks[id].end.hour > hour) {
              // ] hour [
                        return clocks[id];
                    } else if ((clocks[id].start.hour === hour && clocks[id].start.minute >= minute) || (clocks[id].end.hour === hour && clocks[id].end.minute >= minute)) {
              // [ day ] [ hour ] [ minute ]
                        return clocks[id];
                    }
                }
            }
        }
    }
    return null;
};

export const hasAllClocks = async (username) => {
    const clocks = await clocksForUsername(username)
    for (let day = 1; day <= 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute++) {
                if (getClockForDayHourMinute(clocks, day, hour, minute) === null) {
                    return false
                }
            }
        }
    }

    return true
}

export const getAllTagsInClocks = async (username) => {
    const clocks = await clocksForUsername(username)
    const tags = []

    for (let clock of clocks) {
        tags.push(...clock.tags)
    }

    return tags
}