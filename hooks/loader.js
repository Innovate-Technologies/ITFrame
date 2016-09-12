import fs from "fs";

let handlers = {}; // { event: [function handler (args), …], anotherEvent: … }

function addHook(event, handler) {
    if (!handlers.hasOwnProperty(event)) {
        handlers[event] = [];
    }
    handlers[event].push(handler);
}

export function runHooks(event, ...args) {
    if (!handlers.hasOwnProperty(event)) {
        log.warn(`Tried to run hooks for non-existing event ${event}.`);
        return;
    }
    for (let hookFn of handlers[event]) {
        hookFn(...args);
    }
}

export function loadHooks() {
    var hooks = fs.readdirSync(global.appRoot + "/hooks/action");
    for (let hook of hooks) {
        log.info("Loading hook: " + hook);
        try {
            require("app/hooks/action/" + hook);
        } catch (error) {
            log.fatal(error, `Failed to load hook ${hook}.`);
            process.exit(1);
        }
    }
}

export const add = addHook;
