import _ from "underscore"
import mongoosePaginate from "mongoose-paginate"
const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const TunesPersonalSchema = new Schema({
    type: {
        type: String,
        enum: ["song", "legacy", "default", "error", "invalid"],
        default: "legacy", // legacy means that the song is imported by Connect-Centova
    },
    username: String,
    song: String,
    artist: String,
    album: String,
    externalURL: {
        itunes: String,
    },
    artwork: String,
    genre: String,
    internalURL: String,
    processedURLS: [{
        bitrate: Number,
        url: String,
    }],
    tags: [{
        type: Schema.Types.ObjectId,
        ref: "dj_tags",
    }],
    duration: Number, // in seconds
    available: Boolean, // false if being progressed
    size: Number, // in bytes
    bpm: Number,
    dateAdded: {
        type: Date,
        default: Date.now,
    },
}, { collection: "tunes_personal" })
TunesPersonalSchema.index({
    username: 1,
    song: "text",
    artist: "text",
    album: "text",
    internalURL: 1,
    type: 1,
    processedURLS: 1
});

TunesPersonalSchema.plugin(mongoosePaginate)
const TunesPersonalModel = mongoose.model("TunesPersonal", TunesPersonalSchema, "TunesPersonal")

export const getSongForUsername = (username, song, artist) => {
    return TunesPersonalModel.findOne({
        username: username,
        song: song,
        artist: artist,
    }).exec()
}

export const getSongForID = (id) => {
    return TunesPersonalModel.findOne({
        _id: new ObjectId(id),
    }).exec()
}

export const getSongForUserWithID = (username, id) => {
    return TunesPersonalModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }).exec()
}

export const setSongTagForUserWithID = async (username, id, tags) => {
    const song = await TunesPersonalModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }).populate("tags").exec()
    if (!song) {
        throw new Error("No song found")
    }
    song.tags = []
    for (let tag of tags) {
        song.tags.push(new ObjectId(tag))
    }
    return song.save()
}

export const updateSong = async (username, id, newInfo) => {
    let song = await TunesPersonalModel.findOne({
        username: username,
        _id: new ObjectId(id),
    }).exec()
    if (!song) {
        return
    }
    song = _.extend(song, newInfo)

    song._id = new ObjectId(id)
    return song.save()
}

export const getDefaultForUsername = (username) => {
    return TunesPersonalModel.findOne({
        username: username,
        type: "default",
    }).exec()
}

export const setDefaultForUsername = async (username, info) => {
    let defaultInfo = await TunesPersonalModel.findOne({
        username,
        type: "default",
    }).exec()
    if (!defaultInfo) {
        defaultInfo = new TunesPersonalModel()
    }
    _.extend(defaultInfo, info)
    defaultInfo.type = "default"
    defaultInfo.username = username
    return defaultInfo.save()
}

export const getAllSongsForUser = (username) => {
    return TunesPersonalModel.find({ username }).populate("tags").exec()
}

export const getNumberOfSongPages = async (username, itemsPerPage, page = 1, sortBy) => {
    const result = await TunesPersonalModel.paginate({ username, type: "song" }, { page, limit: itemsPerPage, sort: sortBy })
    return Math.ceil(result.total / itemsPerPage)
}

export const getSongsForUser = async (username, itemsPerPage, page = 1, sortBy) => {
    const result = await TunesPersonalModel.paginate({ username, type: "song" }, { page, limit: itemsPerPage, sort: sortBy, populate: "tags" })
    return result.docs
}

export const getSongsForUserWithTag = (username, tag) => {
    return TunesPersonalModel.find({
        username: username,
        type: "song",
        tags: tag,
        available: true,
    }).populate("tags").exec()
}

export const getSongsForSearch = (username, term) => {
    return TunesPersonalModel.find({
        username: username,
        type: "song",
        available: true,
        $text: { $search: term },
    }, {
        score: { $meta: "textScore" },
    }).sort({ score: { $meta: "textScore" } }).populate("tags").exec()
}

export const addSong = (username, song) => {
    song.username = username
    return new TunesPersonalModel(song).save()
}

export const removeSong = async (username, id) => {
    const song = TunesPersonalModel.findOne({
        username: username,
        _id: new ObjectId(id),
    }).exec()

    if (!song) {
        throw new Error("Song not found")
    }

    return TunesPersonalModel.remove({
        username: username,
        _id: new ObjectId(id),
    })
}

export const removeUser = (username) => {
    return TunesPersonalModel.remove({ username })
}

export const calculateUsedSpace = async (username) => {
    const songs = await TunesPersonalModel.find({
        username: username,
    }).exec()
    let used = 0
    for (let song of songs) {
        used += song.size || 0
    }
    return used
}

export const isLinkInUse = async (link) => {
    const internalURLs = await TunesPersonalModel.find({ type: "song", internalURL: link })
    if (internalURLs.length !== 0) {
        return true
    }
    const processedUrls = await TunesPersonalModel.find({ type: "song", "processedURLS.url": link })
    return processedUrls.length !== 0
}

export const deleteTagOutOfRecords = async (username, id) => {
    const songs = await TunesPersonalModel.find({
        username,
        tags: id,
    }).exec()
    for (let song of songs) {
        song.tags = _.without(song.tags, id)
        await song.save()
    }
}

export const markAllForReprocess = (username) => {
    return TunesPersonalModel.update({
        username,
        type: "song",
        available: true,
    }, { available: false }).exec()
}
