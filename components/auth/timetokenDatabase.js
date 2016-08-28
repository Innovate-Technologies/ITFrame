import mongoose from "app/components/database/mongodb.js";
let Schema = mongoose.Schema;
let timetokensSchema = new Schema({ service: String, key: String });
let timetokensModel = mongoose.model("time_tokens", timetokensSchema, "time_tokens");
let moduleLogger = log.child({ component: "timetoken" });

export const getAPIKey = function (service, callback) {
    let logger = moduleLogger.child({ service });
    timetokensModel.findOne({ service }, function (err, res) {
        if (err) {
            logger.error(err);
            callback(err)
            return
        }
        if (res === null) {
            logger.warn({ result: res }, "No match in the time token model, access denied");
            callback(new Error("No entry for the service"))
            return
        }
        callback(null, res)
    })
};
