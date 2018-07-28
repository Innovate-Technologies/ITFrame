const mongoose = requireFromRoot("components/database/mongodb.js");
const Schema = mongoose.Schema;
const AlexaSchema = new Schema({
    username: String,
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
