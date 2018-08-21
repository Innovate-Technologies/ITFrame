let users = requireFromRoot("components/legacy/usersDatabase.js");
let castDatabase = requireFromRoot("components/cast/database.js");

const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const AlexaSchema = new Schema({
    username: String,
    status: {
        type: String,
        default: "in-review",
        enum: [ "in-review", "processing", "rejected", "active", "approved" ],
    },
    rejectReason: String,
    name: String,
    logo: String,
    languageEntries: [
        {
            language: {
                type: String,
                enum: ["en", "fr", "es", "de", "jp", "it"],
            },
            invocationName: String,
            intro: String,
            help: String,
            shortDescription: String,
            description: String,
            keywords: [ String ],
        },
    ],
}, { collection: "alexa"});
AlexaSchema.index({
    username: 1,
});
const AlexaModel = mongoose.model("alexa", AlexaSchema, "alexa");

export const entryForUsername = (username) => {
    return AlexaModel.findOne({
        username,
    }).exec()
}

export const getTuneInURL = (username) => new Promise(async (resolve, reject) => {
    try {
        const streamUrl = await castDatabase.getStreamUrl(username);
        resolve(streamUrl);
    } catch (e) {
        users.getStreamUrl(username, (err, streamUrl) => {
            if (err) {
                err.message = "Failed to get the stream URL: " + err.message;
                return reject(err);
            }
            resolve(streamUrl);
        });
    }
})

export const newForUsername = async (username, info) => {
    info.username = username
    return (new AlexaModel(info)).save()
}

export const updateForUsername = async (username, info) => {
    info.username = username
    return AlexaModel.update({
        username: username,
    }, info).exec()
}

export const deleteForUsername = async (username) => {
    return AlexaModel.remove({ username }).exec()
}
