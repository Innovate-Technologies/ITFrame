import colorspaces from "colorspaces"

import * as facebookAPI from "app/components/iOS/facebookGraph.js"
import mongoose from "app/components/database/mongodb.js"

let hexToRgb = colorspaces.converter("hex", "sRGB")
var Schema = mongoose.Schema
var iosSchema = new Schema({
    name: String,
    sku: String,
    website: String,
    facebook: String,
    twitter: String,
    panel: String,
    username: String,
    background: {
        red: Number,
        green: Number,
        blue: Number,
    },
    backgroundimage: String,
    tintcolor: {
        red: Number,
        green: Number,
        blue: Number,
    },
    logo: String,
    lightstatusbar: String,
    icon: String,
    buttons: {
        Facebook: String,
        Twitter: String,
        Website: String,
    },
    "buttons-alt": {
        Facebook: String,
        Twitter: String,
        Website: String,
    },
    alternativeStreamURL: String,
    bgHex: String,
    tintHex: String,
    description: String,
    keywords: String,
    version: String,
    whatisnew: String,
    needsBuild: Boolean,
}, { collection: "ios" })
var iosModel = mongoose.model("ios", iosSchema, "ios")

export const getAppForSKU = function (sku, callback) {
    iosModel.findOne({ sku: sku }, function (err, res) {
        if (err) {
            return callback(err);
        }
        if (res === null) {
            return callback(new Error("SKU not in database"));
        }

        callback(null, res)
    })
}

export const setCount = function (username, count) {
    iosModel.findOne({ username: String }, function (err, res) {
        if (err || res === null) {
            return
        }
        res.count = count
        res.save()
    })
}

export const getAppThatNeedsBuild = function (callback) {
    iosModel.findOne({ needsBuild: true }, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res)
    })
}

export const setAppToBuilt = function (username, callback) {
    iosModel.findOne({ username: username }, function (err, res) {
        if (err) {
            return callback(err)
        }
        res.needsBuild = false
        res.save(callback)
    })
}

export const insert = (request, callback) => {
    // Taken straight from the old ITFrame without major changes,
    // so this piece of code is a bit messy.
    iosModel.findOne({ username: request.username }, function (err, app) {
        if (err) {
            return callback(err)
        }
        let sku = request.sku
        let needsNewBuild = false;
        if (app) {
            sku = app.sku
        }
        if ((app && app.version !== request.version) || app === null || (app && app.needsBuild)) {
            needsNewBuild = true
        }
        var iosTabs = {};
        for (let tab of request.tabs) {
            iosTabs[tab.type] = tab.value
        }
        facebookAPI.getPageInfo(iosTabs.facebook, function () {
            if (iosTabs.facebook && !iosTabs.facebook.includes("http")) {
                iosTabs.facebookURL = "https://facebook.com/" + iosTabs.facebook
            } else {
                iosTabs.facebook = null;
                iosTabs.facebookURL = null;
                delete iosTabs.facebook
                delete iosTabs.facebookURL
            }
            if (iosTabs.twitter) {
                iosTabs.twitterURL = "https://twitter.com/" + iosTabs.twitter
            }

            var rgbBG = hexToRgb(request.backgroundColour);
            var rgbTint = hexToRgb(request.tint);

            var whatisnew = ""
            if (request.whatisnew) {
                whatisnew = request.whatisnew
            }

            var entry = {
                name: request.name,
                sku: sku,
                panel: "ITFrame",
                username: request.username,
                background: {
                    red: rgbBG[0] * 255,
                    green: rgbBG[1] * 255,
                    blue: rgbBG[2] * 255,
                    hex: request.backgroundColour,
                },
                tintcolor: {
                    red: rgbTint[0] * 255,
                    green: rgbTint[1] * 255,
                    blue: rgbTint[2] * 255,
                    hex: request.tint,
                },
                logo: request.logo,
                lightstatusbar: true,
                icon: request.icon,
                buttons: {
                    Facebook: iosTabs.facebookURL,
                    Twitter: iosTabs.twitter,
                    Website: iosTabs.website,
                },
                "buttons-alt": {
                    Facebook: iosTabs.facebookURL,
                    Twitter: iosTabs.twitterURL,
                    Website: iosTabs.website,
                },
                alternativeStreamURL: request.alternativeStreamURL,
                bgHex: request.backgroundColour,
                tintHex: request.tint,
                description: request.description,
                keywords: request.keywords,
                version: request.version,
                whatisnew: whatisnew,
                needsBuild: needsNewBuild,
            };
            if (!app) {
                var newApp = new iosModel(entry); // eslint-disable-line new-cap
                newApp.save(callback)
            } else {
                iosModel.remove({ username: request.username }, function (innerErr) {
                    if (innerErr) {
                        return callback(innerErr);
                    }
                    new iosModel(entry).save(callback); // eslint-disable-line new-cap
                })
            }
        })
    })
};
