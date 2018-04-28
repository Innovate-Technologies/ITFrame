/**
 * This file loads the rest of the application and sets up logging.
 *
 * Only ES5-compatible syntax should be used in this file,
 * so that starting ITFrame with this script directly prints a clear
 * error message instead of a confusing SyntaxError (caused by ES6 syntax).
 *
 * Again, this file should be kept slim. In most cases,
 * changes or additions should be made in another file.
 */

require("colors");

if (typeof global.appRoot === "undefined") {
    console.error("Please start the app with `app.js`.".red.bold);
    console.error("You seem to have started ITFrame with itframe.js directly.".red);
    console.error("Use `app.js` to bootstrap ITFrame.".red);
    process.exit(1);
}

var shell = require("shelljs");
shell.config.silent = true;
global.ITFrame = {
    version: shell.exec("git describe --always --tags --abbrev=20").output.replace("\n", ""),
    branch: shell.exec("git rev-parse --abbrev-ref HEAD").output.replace("\n", ""),
};

///////////////////////////////////////////////////////////////////////////////////////////////////
var fs = require("fs");
try {
    global.config = JSON.parse(fs.readFileSync(global.appRoot + "/config.json", "utf8"));
} catch (error) {
    console.error("Failed to load the config file. Are you sure you have a valid config.json?".red.bold);
    console.error("The error was:", error.message.grey);
    process.exit(1);
}

if (!config.debug) {
    config.debug = {};
}

///////////////////////////////////////////////////////////////////////////////////////////////////

global.log = require("./logs");

process.on("uncaughtException", function (error) {
    console.error("UNCAUGHT EXCEPTION".bold.red, error);
    log.fatal(error);
    log.flushQueue();
    console.error("Crashing in 5 seconds (to allow for logs to be sent)".bold.red);
    setTimeout(function () {
        process.exit(1);
    }, 5000);
});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.error("ITFrame CE (revision " + global.ITFrame.version + ", branch " + global.ITFrame.branch + ")");
console.error("Copyright © 2015 Innovate Technologies");
log.info({
    version: global.ITFrame.version,
    branch: global.ITFrame.branch,
}, "Starting the app");

log.info("Loading HTTP handlers");
requireFromRoot("http/loader.js")();
log.info("Loading runners");
requireFromRoot("runners/loader.js")();

log.info("Loading hooks");
global.hooks = requireFromRoot("hooks/loader.js");
global.hooks.loadHooks();

log.info("Startup completed");
