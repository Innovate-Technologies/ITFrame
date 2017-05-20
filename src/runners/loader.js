var _ = require("underscore")
var fs = require("fs")

module.exports = function () {
    var modules = _.without(fs.readdirSync(global.appRoot + "/runners/"), "loader.js")
    for (let module of modules) {
        log.info("Loading runner: " + module)
        try {
            requireFromRoot(`runners/${module}/${module}.js`)
        } catch (error) {
            log.fatal(error, `Failed to load ${module}.`);
            process.exit(1);
        }
    }
}
