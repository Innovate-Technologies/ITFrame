/* global requireFromRoot */
let castDatabase = {};
let buildinfo = requireFromRoot("components/buildinfo/database.js")
let _ = require("underscore");
let mongoose = requireFromRoot("components/database/mongodb.js");
let Schema = mongoose.Schema;
let castSchema = new Schema({
    "name": {
        type: String,
        default: "",
    },
    "genre": {
        type: String,
        default: "Misc",
    },
    "username": String,
    "httpPort": Number,
    "httpsPort": Number,
    "httpsCert": String,
    "httpsKey": String,
    "hostname": String,
    "apikey": String,
    "input": {
        "SHOUTcast": Number,
        "Icecast": {
            type: Number,
            default: 1000,
        }
    },
    "directories": {
        "Icecast": Object,
    },
    "streams": Object,
    "version": {
        "Cast": {
            type: String,
            default: "0",
        },
        "DJ": {
            type: String,
            default: "0",
        },
    },
    "internal": Object,
    "DJ": {
        "enabled": {
            type: Boolean,
            default: false,
        },
        "fadeLength": {
            type: Number,
            default: 0,
        },
    },
    rateLimiting: {
        type: Boolean,
        default: false,
    },
    geolock: {
        enabled: Boolean,
        countryCodes: [String],
        mode: { type: String, enum: ["blacklist", "whitelist"] },
    },
    antiStreamRipper: {
        type: Boolean,
        default: false,
    },
    hideListenerCount: {
        type: Boolean,
        default: false,
    }
}, { collection: "cast" });
let CastModel = mongoose.model("cast", castSchema, "cast");

castDatabase.getInfoForUsername = castDatabase.getConfig = (username, callback) => {
    CastModel.findOne({ username: username }, function (err, res) {
        if (err) {
            return callback(err);
        }
        if (res === null) {
            return callback(new Error("No such username"));
        }
        return callback(null, res);
    });
}

castDatabase.addConfigForUsername = (username, conf, callback) => {
    conf.username = username;
    buildinfo.buildInfoForName("Cast", function (err, build) {
        if (err) {
            return callback(err)
        }
        if (typeof conf.version !== "object") {
            conf.version = {Cast: 0, DJ: 0}
        }
        conf.version.Cast = build.version
        new CastModel(conf).save(callback);
    })
}

castDatabase.updateVersion = (username, callback) => {
    CastModel.findOne({ username: username }, (err, conf) => {
        if (err) {
            return callback(err)
        }
        if (conf === null) {
            return callback(new Error("No such username"))
        }
        buildinfo.buildInfoForName("Cast", function (buildErr, build) {
            if (buildErr) {
                return callback(buildErr)
            }
            if (typeof conf.version !== "object") {
                conf.version = {Cast: 0, DJ: 0}
            }
            conf.version.Cast = build.version
            conf.save(callback)
        })
    })
}

castDatabase.updateDJVersion = (username, callback) => {
    CastModel.findOne({ username: username }, (err, conf) => {
        if (err) {
            return callback(err)
        }
        if (conf === null) {
            return callback(new Error("No such username"))
        }
        buildinfo.buildInfoForName("DJ", function (buildErr, build) {
            if (buildErr) {
                return callback(buildErr)
            }
            if (typeof conf.version !== "object") {
                conf.version = {Cast: 0, DJ: 0}
            }
            conf.version.DJ = build.version
            conf.save(callback)
        })
    })
}

castDatabase.deleteUsername = (username, callback) => {
    CastModel.remove({ username }, callback);
}

castDatabase.updateConfig = (username, conf, callback) => {
    CastModel.update({ username }, conf, { overwrite: true }, function (error) {
        if (error) {
            return callback(error);
        }
        return callback();
    });
}

castDatabase.getStreamUrl = (username, callback) => {
    CastModel.findOne({ username }, function (err, account) {
        if (err) {
            return callback(err);
        }
        if (account === null) {
            return callback(new Error("No such username"));
        }
        let primaryStream = _.findWhere(account.streams, {
            primary: true,
        });
        let streamUrl = account.hostname + "/streams/" + primaryStream.stream;
        return callback(null, streamUrl);
    });
}

castDatabase.getAll = (callback) => {
    CastModel.find({}, callback)
}

module.exports = castDatabase;
