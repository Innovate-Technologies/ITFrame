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
                    config.streamUrl = config.alternativeStreamUrl
                    return resolve(config);
                }
                try {
                    const streamUrl = await castDatabase.getStreamUrl(username);
                    config.streamUrl = streamUrl
                    resolve(config);
                } catch (e) {
                    users.getStreamUrl(username, (err, streamUrl) => {
                        if (err) {
                            err.message = "Failed to get the stream URL: " + err.message;
                            return reject(err);
                        }
                        config.streamUrl = streamUrl
                        resolve(config);
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
        return nodeify((async (username, config) => {
            let entry = await PlayerModel.findOne({ username }).exec()
            if (! entry || !entry.username) {
                return (new PlayerModel(config)).save()
            }
            config.username = username
            return PlayerModel.update({ username }, config).exec()
        })(username, config), callback);
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
