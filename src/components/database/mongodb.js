/* global config,log */
var fs = require("fs");
let moduleLogger = log.child({ component: "mongodb" });
var mongoose = require("mongoose");
require("mongoose-function")(mongoose);
mongoose.set("debug", false);
var options = {
    db: {
        "native_parser": true,
        ssl: config.mongoSSL || false,
    },
    server: {
        poolSize: 5,
    },
    user: config.mongoUsername,
    pass: config.mongoPassword,
    auth: {
        authdb: config.mongoDatabase,
    },
};

if (config.mongoCA) {
    options.db.sslValidate = true
    options.db.sslCA = [fs.readFileSync(config.mongoCA)]
}

if (config.mongoAuthMechanism) {
    options.auth.authMechanism = config.mongoAuthMechanism;
}

moduleLogger.info("Connecting to the database");
mongoose.connect(`mongodb://${config.mongoHost}/${config.mongoDatabase}?replicaSet=rs0`, options);
mongoose.connection.on("connected", function () {
    clearInterval(connectedCheck);
    moduleLogger.info("Connected to the database");
});
mongoose.connection.on("error", function dbErrorHandler(err) {
    clearInterval(connectedCheck);
    moduleLogger.fatal(err, "Failed to connect to the database");
    process.exit(1);
});

let seconds = 0;
let connectedCheck = setInterval(function showStillNotConnected() {
    seconds += 10;
    moduleLogger.warn(`We still haven't connected to the DB after ${seconds}s.`);
}, 10000);

module.exports = mongoose;
