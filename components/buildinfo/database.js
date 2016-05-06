/* global requireFromRoot */
let mongoose = requireFromRoot("components/database/mongodb.js");
let Schema = mongoose.Schema;
let buildinfoSchema = new Schema({
    "name": String,
	"version": String,
}, { collection: "build_info" });
let buildinfoModel = mongoose.model("build_info", buildinfoSchema, "build_info");

module.exports.buildInfoForName = function (name, callback) {
	buildinfoModel.findOne({
		name: name,
	}, callback)
}
module.exports.updateVersionForName = function (name, version, callback) {
	buildinfoModel.findOne({name: name}, function (err, res) {
		if (err) {
			return callback(err)
		}
		if (res === null) {
			return callback(new Error("Name not found"))
		}
		res.version = version
		res.save(callback)
	})
}
