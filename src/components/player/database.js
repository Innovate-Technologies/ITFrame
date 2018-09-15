let nodeify = require("nodeify");
let _ = require("underscore");

let users = requireFromRoot("components/legacy/usersDatabase.js");
let castDatabase = requireFromRoot("components/cast/database.js");

let mongoose = requireFromRoot("components/database/mongodb.js");
let Schema = mongoose.Schema;
let playerSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    transparentBackground: {
        type: Boolean,
        required: false,
        default: false,
    },
    backgroundColour: {
        type: String,
        required: true,
    },
    tint: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: false,
    },
    autoPlay: {
        type: Boolean,
    },
    buttons: [{
        name: String,
        icon: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    }],
    alternativeStreamUrl: {
        type: String,
        required: false,
    },
}, { collection: "player" });
let PlayerModel = mongoose.model("player", playerSchema, "player");

let playerDatabase = {
    /**
     * Get a Player config for an username
     * This is used for getting only the config (for use in Control for example).
     * @param  {String}   username  Username
     * @param  {Function} callback  Callback function (optional)
     * @return {Promise}
     */
    getConfig(username, callback) {
        return nodeify(new Promise((resolve, reject) => {
            PlayerModel.findOne({ username }).exec((err, config) => {
                if (err) {
                    return reject(err);
                }
                if (!config) {
                    return reject(new Error("Username not in database"));
                }
                resolve(config);
            });
        }), callback);
    },

    /**
     * Get a Player config along with the stream URL for an username
     * This is designed to be used for the public Player API.
     * @param  {String}   username  Username
     * @param  {Function} callback  Callback function (optional)
     * @return {Promise}
     */
    getPlayer(username, callback) {
        return nodeify(new Promise(async (resolve, reject) => {
            try {
                let config = await playerDatabase.getConfig(username);
                if (config.alternativeStreamUrl) {
                    return resolve(_.extend(config, { streamUrl: config.alternativeStreamUrl }));
                }
                try {
                    const streamUrl = await castDatabase.getStreamUrl(username);
                    resolve(_.extend(config, { streamUrl }));
                } catch (e) {
                    users.getStreamUrl(username, (err, streamUrl) => {
                        if (err) {
                            err.message = "Failed to get the stream URL: " + err.message;
                            return reject(err);
                        }
                        resolve(_.extend(config, { streamUrl }));
                    });
                }
            } catch (e) {
                reject(e);
            }

        }), callback);
    },

    /**
     * Upsert Player config for a given username
     * Insert if there are no settings associated to the username;
     * update the settings otherwise.
     * @param  {String}   username Username
     * @param  {Object}   config   Config (object)
     * @param  {Function} callback Callback function (optional)
     * @return {Promise}
     */
    upsertConfig(username, config, callback) {
        return nodeify(new Promise((resolve, reject) => {
            // XXX: As of August 2015, Mongoose still does not support running validators
            // for update() calls properly (despite claiming having support for it since
            // version 4.0), so we have to resort to first getting the document,
            // then creating/updating it and re-saving it. Not ideal but it works.
            PlayerModel.findOne({ username }, (err, doc) => {
                if (err) {
                    return reject(err);
                }
                if (!doc) {
                    doc = new PlayerModel(config);
                } else {
                    doc = _.extend(doc, config);
                }
                PlayerModel.update({ username }, doc).exec((error) => {
                    if (error) {
                        error.message = "Could not update Player config: " + error.message;
                        return reject(error);
                    }
                    return resolve();
                });
            });
        }), callback);
    },

    /**
     * Get a Player config along with the stream URL for an username
     * This is designed to be used for the public Player API.
     * @param  {String}   username  Username
     * @param  {Function} callback  Callback function (optional)
     * @return {Promise}
     */
    removeConfig(username, callback) {
        return nodeify(new Promise((resolve, reject) => {
            PlayerModel.remove({ username }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        }), callback);
    },
};

export default playerDatabase;
