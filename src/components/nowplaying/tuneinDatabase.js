let tuneinDatabase = {}
let _ = require("underscore")
let mongoose = requireFromRoot("components/database/mongodb.js")
let Schema = mongoose.Schema
let tuneinSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    stationId: {
        type: String,
        required: true,
    },
    partnerId: {
        type: String,
        required: true,
    },
    partnerKey: {
        type: String,
        required: true,
    },
    isEnabled: {
        type: Boolean,
    },
    disableReason: {
        type: String,
    },
}, { collection: "tunein" })
tuneinSchema.index({
    username: 1,
});
let TuneinModel = mongoose.model("tunein", tuneinSchema, "tunein")
let moduleLogger = log.child({ component: "tunein/database" });

/**
 * Get TuneIn AIR integration settings for a given username
 * @param  {String}   username username
 * @return  {Promise}
 */
tuneinDatabase.getInfo = async (username) => {
    const settings = await TuneinModel.findOne({ username }).exec()
    if (settings === null) {
        throw new Error("Username not in database")
    }
    return settings
}

/**
 * Get TuneIn AIR integration settings for all users
 * @return  {Promise}
 */
tuneinDatabase.getAllUsers = () => {
    return TuneinModel.find({}).exec();
}

/**
 * Remove TuneIn AIR integration settings for a given username
 * @param  {String}   username Username
 * @return  {Promise}
 */
tuneinDatabase.remove = async (username) => {
    const doc = await TuneinModel.findOneAndRemove({ username }).exec()
    if (!doc) {
        throw new Error("Username not in database");
    }
};

/**
 * Add TuneIn AIR integration settings to the database
 * @param  {Object}   settings TuneIn AIR integration settings
 * @return  {Promise}
 */
tuneinDatabase.addUser = (settings) => {
    return new TuneinModel(settings).save();
};

/**
 * Update TuneIn AIR integration settings for a given username
 * @param  {String}   username Username
 * @param  {Object}   modifier TuneIn AIR integration settings modifier object
 * @return  {Promise}
 */
tuneinDatabase.update = async (username, modifier, callback) => {
    let doc = await TuneinModel.findOne({ username }).exec()
    if (!doc) {
        return callback(new Error("Username not in database"));
    }
    modifier.username = username
    return TuneinModel.update({ username }, modifier).exec()
};

/**
 * Upsert TuneIn AIR integration settings for a given username
 * Insert if there are no settings associated to the username;
 * update the settings otherwise.
 * @param  {String}   username Username
 * @param  {Object}   settings TuneIn AIR integration settings
 * @return  {Promise}
 */
tuneinDatabase.upsert = async (username, settings) => {
    settings.username = username
    let doc = await TuneinModel.findOne({ username }).exec();
    if (!doc) {
        return (new TuneinModel(settings)).save();
    }

    return TuneinModel.update({ username }, settings).exec()
};

/**
 * Disable TuneIn integration for a given username
 * @param  {String}   username Username
 * @param  {String}   reason   Reason for disabling the integration
 */
tuneinDatabase.disable = async (username, reason) => {
    let doc = TuneinModel.findOne({ username }).exec()
    if (!doc) {
        return;
    }
    return TuneinModel.update({ username }, { disableReason: reason, isEnabled: false }).exec()
};

module.exports = tuneinDatabase;
