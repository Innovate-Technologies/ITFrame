/**
 * This file sets essential global variables and then bootstraps the app
 * after enabling ES6-syntax using Babel.
 *
 * Only ES5-compatible syntax should be used in this file,
 * as Babel hasn't been loaded yet. Keep this file slim as its sole role
 * is to set up essential globals and bootstrap the app.
 */

if (process.env.COLORS) {
    process.argv = process.argv + " --color=always"; // Force colors
}
require("colors");

if (process.env.DEBUG) {
    require("heapdump");
}

global.appRoot = __dirname;
global.requireFromRoot = function (path) {
    if (log) {
        log.debug("Requiring " + arguments[0]);
    }
    return require(global.appRoot + "/" + path);
};

require("babel-register")
require("babel-polyfill")
require("./itframe.js");
