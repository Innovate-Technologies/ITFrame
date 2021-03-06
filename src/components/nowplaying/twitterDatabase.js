let twitterDatabase = {};
let _ = require("underscore");
let mongoose = requireFromRoot("components/database/mongodb.js")
let Schema = mongoose.Schema;
let twitterSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    accessTokenSecret: {
        type: String,
        required: true,
    },
    mode: {
        type: String,
        enum: ["interval", "time"],
        required: true,
    },
    tweet: {
        type: String,
        required: true,
    },
    interval: {
        type: Number,
        required: true,
    },
    _count: {
        type: Number,
        required: false,
    },
    isEnabled: Boolean,
    consumerKey: {
        type: String,
        required: true,
    },
    consumerSecret: {
        type: String,
        required: true,
    },
    disableReason: {
        type: String,
        required: false,
    },
}, { collection: "twitter" });
twitterSchema.index({
    username: 1,
});
let TwitterModel = mongoose.model("twitter", twitterSchema, "twitter");
let moduleLogger = log.child({ component: "twitter/database" });

/**
 * Get #NP tweet settings for a given username
 * @param  {String}   username Username
 * @async
 * @return {Object}   #NP settings
 */
twitterDatabase.getSettings = async (username) => {
    let settings = await TwitterModel.findOne({ username }).exec();
    if (settings === null) {
        throw new Error("Username not in database");
    }
    return settings;
};

/**
 * Set count for a given username
 * @param  {String}   username Username
 * @param  {Integer}  count    New count
 * @async
 */
twitterDatabase.setCount = async (username, count) => {
    let logger = moduleLogger.child({ username, count });
    if (isNaN(count)) {
        count = 0;
    }
    try {
        await TwitterModel.update({ username }, { $set: { _count: parseInt(count, 10) }}).exec();
    } catch (err) {
        logger.warn(err, "Failed to set count");
    }
};

/**
 * Remove #NP tweet settings for a given username
 * @param  {String}   username Username
 * @async
 */
twitterDatabase.remove = async (username) => {
    let settings = await TwitterModel.findOneAndRemove({ username }).exec();
    if (!settings) {
        throw new Error("Username not in database");
    }
};

/**
 * Add #NP tweet settings to the database
 * @param  {Object}   settings #NP tweet settings
 * @async
 */
twitterDatabase.addUser = async (settings) => {
    await new TwitterModel(settings).save();
};

/**
 * Update #NP tweet settings for a given username
 * @param  {String}   username Username
 * @param  {Object}   modifier #NP tweet settings modifier object
 * @async
 */
twitterDatabase.update = async (username, modifier) => {
    let settings = await twitterDatabase.getSettings(username);
    modifier.username = username
    return TwitterModel.update( { username }, modifier).exec()
};

/**
 * Upsert #NP tweet settings for a given username
 * Insert if there are no settings associated to the username;
 * update the settings otherwise.
 * @param  {String}   username Username
 * @param  {Object}   settings #NP tweet settings
 * @async
 */
twitterDatabase.upsert = async (username, settings) => {
    settings.username = username
    let doc = await TwitterModel.findOne({ username });
    if (!doc) {
        return (new TwitterModel(settings)).save()
    }
    return TwitterModel.update({ username }, settings).exec()
};

/**
 * Disable #NP tweet integration for a given username
 * @param  {String}   username Username
 * @param  {String}   reason   Reason for disabling the integration
 * @async
 */
twitterDatabase.disable = async (username, reason) => {
    let logger = moduleLogger.child({ username, reason });
    try {
        await twitterDatabase.update(username, { disableReason: reason, isEnabled: false });
        logger.warn("Disabled integration");
    } catch (error) {
        logger.error(error, "Failed to disable integration");
    }
};

export default twitterDatabase;
