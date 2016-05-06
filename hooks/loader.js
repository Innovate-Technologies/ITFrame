let handlers = {}; // { event: [function handler (args), …], anotherEvent: … }
let fs = require("fs");

function addHook(event, handler) {
    if (!handlers.hasOwnProperty(event)) {
        handlers[event] = [];
    }
    handlers[event].push(handler);
}

function runHooks(event, ...args) {
    if (!handlers.hasOwnProperty(event)) {
        log.warn(`Tried to run hooks for non-existing event ${event}.`);
        return;
    }
    for (let hookFn of handlers[event]) {
        hookFn(...args);
    }
}

function loadHooks() {
    var hooks = fs.readdirSync(global.appRoot + "/hooks/action");
    for (let hook of hooks) {
        log.info("Loading hook: " + hook);
        try {
            require(global.appRoot + "/hooks/action/" + hook);
        } catch (error) {
            log.fatal(error, `Failed to load hook ${hook}.`);
            process.exit(1);
        }
    }
}

module.exports.add = addHook;
module.exports.runHooks = runHooks;
module.exports.loadHooks = loadHooks;
