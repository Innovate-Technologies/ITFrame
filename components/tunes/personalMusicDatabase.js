/* global requireFromRoot,log,config */
var mongoose = requireFromRoot("components/database/mongodb.js")
var Schema = mongoose.Schema
var swift = requireFromRoot("components/openstack/swift.js")
var ObjectId = mongoose.Types.ObjectId
let mongoosePaginate = require("mongoose-paginate")
var TunesPersonalSchema = new Schema({
    type: {
        type: String,
        default: "legacy", // legacy means that the song is imported by Connect-Centova
    }, // song, legacy, default, invalid
    username: String,
    song: String,
    artist: String,
    album: String,
    externalURL: Object, // {itunes:url} (Would have called it buy url but since streaming)
    artwork: String,
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
});
TunesPersonalSchema.plugin(mongoosePaginate)
var TunesPersonalModel = mongoose.model("TunesPersonal", TunesPersonalSchema, "TunesPersonal")

module.exports.getSongForUsername = function (username, song, artist, callback) {
    TunesPersonalModel.findOne({
        username: username,
        song: song,
        artist: artist,
    }, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res)
    })
}

module.exports.getSongForID = function (id, callback) {
    TunesPersonalModel.findOne({
        _id: new ObjectId(id),
    }, callback)
}

module.exports.getSongForUserWithID = function (username, id, callback) {
    TunesPersonalModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, callback)
}

module.exports.setSongTagForUserWithID = function (username, id, tags, callback) {
    TunesPersonalModel.findOne({
        _id: new ObjectId(id),
        username: username,
    }, (err, song) => {
        if (err) {
            return callback(err)
        }
        song.tags = tags
        song.save(callback)
    })
}

module.exports.updateSong = function (username, id, newInfo, callback) {
    TunesPersonalModel.findOne({
        username: username,
        _id: new ObjectId(id),
    }, function (err, res) {
        if (err) {
            return callback(err)
        }
        newInfo._id = new ObjectId(id)
        var oldRes = res
        res.update(newInfo, function (updateErr, updateRes) {
            if (newInfo.internalURL && newInfo.internalURL !== oldRes.internalURL) {
                lookForLonelyInternalLink(oldRes.internalURL)
            }
            if (oldRes.processedURLS && oldRes.processedURLS.length > 0) {
                lookForLonelyProcessedLink(oldRes.processedURLS)
            }
            return callback(updateErr, updateRes);
        })
    });
}

module.exports.getDefaultForUsername = function (username, callback) {
    TunesPersonalModel.findOne({
        username: username,
        type: "default",
    }, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res)
    })
}

module.exports.getAllSongsForUser = function (username, callback) {
    TunesPersonalModel.find({ username: username }, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res)
    })
}

module.exports.getSongsForUser = function (username, itemsPerPage, page, sortBy, callback) {
    TunesPersonalModel.paginate({ username: username }, {page: page, limit: itemsPerPage, sort: sortBy}, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res.docs)
    })
}

module.exports.getSongsForUserWithTag = function (username, tag, callback) {
    TunesPersonalModel.find({
        username: username,
        tags: tag,
        available: true,
    }, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res)
    })
}

module.exports.addSong = function (username, song, callback) {
    song.username = username
    new TunesPersonalModel(song).save(callback)
}

module.exports.removeSong = function (username, id, callback) {
    TunesPersonalModel.findOne({
        username: username,
        _id: new ObjectId(id),
    }, (err, entry) => {
        if (err) {
            return callback(err);
        }
        if (entry === null) {
            return callback(new Error("Song not found"))
        }
        TunesPersonalModel.remove({
            username: username,
            _id: new ObjectId(id),
        }, (remerr, res) => {
            if (remerr) {
                return callback(err)
            }
            callback(err, res)
        })
    })
}

module.exports.removeUser = function (username) {
    TunesPersonalModel.find({ username: username }, function (err, res) {
        if (err) {
            return;
        }
        for (var id in res) {
            if (res.hasOwnProperty(id)) {
                if (typeof res[id].internalURL !== "undefined" && res[id].internalURL !== "") {
                    setTimeout(lookForLonelyInternalLink, 1000, res[id].internalURL)
                }
                if (res[id].processedURLS && res[id].processedURLS.length > 0) {
                    setTimeout(lookForLonelyProcessedLink, 1000, res[id].processedURLS)
                }
                TunesPersonalSchema.remove({
                    _id: res[id]._id,
                })
            }
        }
    })
}

module.exports.calculateUsedSpace = (username, callback) => {
    TunesPersonalModel.find({
        username: username,
    }, function (err, res) {
        if (err) {
            return callback(err)
        }
        let spaceUsed = 0
        for (let song of res) {
            spaceUsed += song.size
        }
        callback(null, spaceUsed)
    })
}

module.exports.isLinkInUse = async (link) => {
    const internalURLs = await TunesPersonalModel.find({ internalURL: link })
    if (internalURLs.length !== 0) {
        return true
    }
    const findArray = []
    for (let bitrate of [32, 64, 98, 128, 192, 265, 320]) {
        const find = {}
        find[`processedURLS.${bitrate}`] = link
        findArray.push(find)
    }
    const processedURLS = await TunesPersonalModel.find({$or: findArray})
    if (processedURLS.length !== 0) {
        return true
    }
    return false
}

