var mongoose = requireFromRoot("components/database/mongodb.js");
var mayaSupportSchema = new mongoose.Schema({
    question: String,
    reply: String,
}, { collection: "maya_support" });
mayaSupportSchema.index({ question: "text" });

var mayaSupportModel = mongoose.model("maya_support", mayaSupportSchema);


module.exports.lookUpAnswer = function (keywords, callback) {
    mayaSupportModel
        .find({ $text: {$search: keywords} }, {
            score: {
                $meta: "textScore",
            },
        })
        .sort({ score: {$meta: "textScore"} })
        .exec(callback);
}
