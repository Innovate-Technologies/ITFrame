import _ from "underscore"
import mongoosePaginate from "mongoose-paginate"
const mongoose = requireFromRoot("components/database/mongodb.js")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const TunesPersonalSchema = new Schema({
    type: {
        type: String,
        default: "legacy", // legacy means that the song is imported by Connect-Centova
    }, // song, legacy, default, invalid
    username: String,
    song: String,
    artist: String,
    album: String,
    externalURL: {
        itunes: String,
    },
    artwork: {
        type: String,
        default: "https://photon.shoutca.st/cdn.shoutca.st/noalbum.png",
    },
    genre: String,
    internalURL: String,
    processedURLS: Object,
    tags: Object,
    duration: Number, // in seconds
    available: Boolean, // false if being progressed
    size: Number, // in bytes
    bpm: Number,
}, { collection: "tunes_personal" })
TunesPersonalSchema.index({
    username: 1,
    song: 1,
    artist: 1,
    internalURL: 1,
    type: 1,
    "processedURLS.32": 1,
    "processedURLS.64": 1,
    "processedURLS.96": 1,
    "processedURLS.128": 1,
    "processedURLS.192": 1,
    "processedURLS.265": 1,
    "processedURLS.320": 1,
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
    }).exec()
    if (!song) {
        return
    }
    song.tags = tags
    return song.save()
}

export const updateSong = function (username, id, newInfo) {
    let song = TunesPersonalModel.findOne({
        username: username,
        _id: new ObjectId(id),
    })
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
        username: username,
        type: "default",
    }).exec()
    if (defaultInfo) {
        defaultInfo = new TunesPersonalModel()
    }
    _.extend(defaultInfo, info)
    defaultInfo.type = "default"
    defaultInfo.username = username
    return defaultInfo.save()
}

export const getAllSongsForUser = (username) => {
    return TunesPersonalModel.find({ username }).exec()
}

export const getSongsForUser = async (username, itemsPerPage, page, sortBy) => {
    const result = await TunesPersonalModel.paginate({ username }, { page, limit: itemsPerPage, sort: sortBy })
    return result.docs
}

export const getSongsForUserWithTag = (username, tag) => {
    return TunesPersonalModel.find({
        username: username,
        tags: tag,
        available: true,
    })
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
    return songs.reduce((prev, cur) => prev.size + cur.size, 0);
}

export const isLinkInUse = async (link) => {
    const internalURLs = await TunesPersonalModel.find({ internalURL: link })
    if (internalURLs.length !== 0) {
        return true
    }
    const findArray = []
    for (let bitrate of [32, 64, 96, 128, 192, 265, 320]) {
        const selector = {}
        selector[`processedURLS.${bitrate}`] = link
        findArray.push(selector)
    }
    const processedUrls = await TunesPersonalModel.find({ $or: findArray })
    return processedUrls.length !== 0
}

