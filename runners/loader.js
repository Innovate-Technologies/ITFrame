import fs from "fs"
import _ from "underscore"

export default function () {
    var modules = _.without(fs.readdirSync(global.appRoot + "/runners/"), "loader.js")
    for (let module of modules) {
        log.info("Loading runner: " + module)
        try {
            require(`app/runners/${module}/${module}.js`)
        } catch (error) {
            log.fatal(error, `Failed to load ${module}.`);
            process.exit(1);
        }
    }
}
