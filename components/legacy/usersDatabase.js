/**
 * Legacy users database
 * This database stores account information for users on Centova Cast servers.
 */

import _ from "underscore";
import pls from "pls";
import rest from "restler";

import mongoose from "app/components/database/mongodb.js";

let Schema = mongoose.Schema;
let usersSchema = new Schema({
    username: String,
    type: String,
    server: String,
}, { collection: "users" });
let UsersModel = mongoose.model("users", usersSchema, "users");
let moduleLogger = log.child({ component: "legacy/users/database" });

export const getInfoForUsername = (username, callback) => {
    UsersModel.findOne({ username: username }, function (err, res) {
        if (err) {
            return callback(err);
        }
        if (res === null) {
            return callback(new Error("No such username"));
        }
        return callback(null, res);
    });
}

export const upsert = async (username, updatedDocument) => {
    let doc = await UsersModel.findOne({ username });
    doc = doc
        ? _.extend(doc, updatedDocument)
        : new UsersModel(_.extend({ username }, updatedDocument));
    await doc.save();
}

export const register = (username, server, groupName, callback = () => {}) => {
    let logger = moduleLogger.child({ username, server, groupName });
    getInfoForUsername(username, function (err, info) {
        if (err && err.message !== "No such username") {
            return callback(err);
        }
        if (info) {
            logger.debug({ userInfo: info }, "Record already exists, not registering");
            return callback();
        }
        let type = "unknown";
        if (groupName.includes("SHOUTcast v2 Servers")) {
            type = "shoutcast2";
        } else if (groupName.includes("SHOUTcast v1 Servers")) {
            type = "shoutcast1";
        } else if (groupName.includes("Icecast")) {
            type = "icecast";
        }

        if (type === "unknown") {
            logger.debug("Server unknown, not registering");
            return callback();
        }

        new UsersModel({ username, server, type }).save(function (error) {
            if (error) {
                logger.error(error, "Failed to register new user");
                return callback(error);
            }
            logger.info("Registered");
            return callback();
        });
    });
};

export const getStreamUrl = (username, callback) => {
    if (!username) {
        return callback(new Error("No username specified"));
    }
    getInfoForUsername(username, (err, { server } = {}) => {
        if (err) {
            return callback(err);
        }
        server = server.toLowerCase();
        if (server === "cast") {
            return callback(new Error("Server is Cast? What do you expect this legacy method to do?"));
        }
        let plsFileUrl = `http://${server}.shoutca.st/tunein/${username}.pls`;
        rest.get(plsFileUrl, { timeout: 5000 })
            .on("complete", function (data) {
                if (data instanceof Error) {
                    return callback(data);
                }
                let tracks = pls.parse(data);
                if (typeof tracks[0] === "undefined" || typeof tracks[0].uri === "undefined") {
                    log.error({ data, username, plsFileUrl }, "Failed to parse PLS file");
                    return callback(new Error("Could not parse the pls file."));
                }
                let streamUrlArray = tracks[0].uri.split(":");
                streamUrlArray[1] = "//" + server + ".shoutca.st";
                var streamURL = streamUrlArray.join(":");
                if (streamURL.charAt(streamURL.length - 1) === "/") { // Centova is too lazy to serve propper SHOUTcast v1 links
                    streamURL += ";"
                }
                return callback(null, streamURL);
            })
            .on("timeout", function () {
                log.error({ server, plsFileUrl, component: "legacy/users-db" }, "Request timed out");
                return callback(new Error(`Request to ${server} timed out`));
            });
    });
};
