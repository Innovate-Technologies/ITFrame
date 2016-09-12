import _ from "underscore"
import mongoose from "app/components/database/mongodb.js"
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
 * @param  {Function} callback Callback function (err, settings)
 */
export const getInfo = function (username, callback) {
    TuneinModel.findOne({ username }, function (err, settings) {
        if (err) {
            return callback(err)
        }
        if (settings === null) {
            return callback(new Error("Username not in database"))
        }
        return callback(null, settings)
    })
}

/**
 * Get TuneIn AIR integration settings for all users
 * @param  {Function} callback Callback function (err, arrayOfSettings)
 */
export const getAllUsers = function (callback) {
    TuneinModel.find({}, callback);
}

/**
 * Remove TuneIn AIR integration settings for a given username
 * @param  {String}   username Username
 * @param  {Function} callback Callback function (err)
 */
export const remove = (username, callback) => {
    TuneinModel.findOneAndRemove({ username }, function (err, doc) {
        if (err) {
            err.message = "Could not remove TuneIn AIR settings: " + err.message;
            return callback(err);
        }
        if (!doc) {
            return callback(new Error("Username not in database"));
        }
        return callback();
    });
};

/**
 * Add TuneIn AIR integration settings to the database
 * @param  {Object}   settings TuneIn AIR integration settings
 * @param  {Function} callback Callback function (err)
 */
export const addUser = (settings, callback) => {
    new TuneinModel(settings).save(function (err) {
        if (err) {
            err.message = "Could not add TuneIn AIR settings: " + err.message;
            return callback(err);
        }
        return callback();
    });
};

/**
 * Update TuneIn AIR integration settings for a given username
 * @param  {String}   username Username
 * @param  {Object}   modifier TuneIn AIR integration settings modifier object
 * @param  {Function} callback Callback function (err)
 */
export const update = (username, modifier, callback) => {
    TuneinModel.findOne({ username }, function (err, doc) {
        if (err) {
            return callback(err);
        }
        if (!doc) {
            return callback(new Error("Username not in database"));
        }
        doc = _.extend(doc, modifier);
        doc.save((error) => {
            if (error) {
                error.message = "Could not update TuneIn AIR settings: " + error.message;
                return callback(error);
            }
            return callback();
        });
    });
};

/**
 * Upsert TuneIn AIR integration settings for a given username
 * Insert if there are no settings associated to the username;
 * update the settings otherwise.
 * @param  {String}   username Username
 * @param  {Object}   settings TuneIn AIR integration settings
 * @param  {Function} callback Callback function (err)
 */
export const upsert = (username, settings, callback) => {
    // XXX: As of August 2015, Mongoose still does not support running validators
    // for update() calls properly (despite claiming having support for it since
    // version 4.0), so we have to resort to first getting the document,
    // then creating/updating it and re-saving it. Not ideal but it works.
    TuneinModel.findOne({ username }, function (err, doc) {
        if (err) {
            return callback(err);
        }
        if (!doc) {
            doc = new TuneinModel(settings);
        } else {
            doc = _.extend(doc, settings);
        }
        doc.save((error) => {
            if (error) {
                error.message = "Could not update TuneIn AIR settings: " + error.message;
                return callback(error);
            }
            return callback();
        });
    });
};

/**
 * Disable TuneIn integration for a given username
 * @param  {String}   username Username
 * @param  {String}   reason   Reason for disabling the integration
 */
export const disable = (username, reason) => {
    let logger = moduleLogger.child({ username, reason });
    TuneinModel.findOne({ username }, function (err, doc) {
        if (err) {
            return;
        }
        if (!doc) {
            return;
        }
        doc = _.extend(doc, { disableReason: reason, isEnabled: false });
        doc.save((error) => {
            if (error) {
                logger.error(error, "Failed to disable integration");
                return;
            }
            logger.warn("Disabled integration");
        });
    });
};
