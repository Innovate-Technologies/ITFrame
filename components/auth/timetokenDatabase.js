const mongoose = require(global.appRoot + "/components/database/mongodb.js");
const Schema = mongoose.Schema;
const timetokensSchema = new Schema({ service: String, key: String });
const timetokensModel = mongoose.model("time_tokens", timetokensSchema, "time_tokens");
const moduleLogger = log.child({ component: "timetoken" });

export const getAPIKey = async (service) => {
    const logger = moduleLogger.child({ service });
    const info = await timetokensModel.findOne({ service }).exec()
    if (info === null) {
        logger.warn({ result: info }, "No match in the time token model, access denied");
        throw new Error("No entry for the service")
    }
    return info
}
