var wait = require("wait.for");
var controlUser = requireFromRoot("components/control/controlUser.js");
var castDatabase = requireFromRoot("components/cast/database.js");
let legacyUsersDatabase = requireFromRoot("components/legacy/usersDatabase.js");
let profiler = requireFromRoot("profiler.js");

module.exports = function ({ app }) {
    app.get("/control/user-info", function (req, res) {
        wait.launchFiber(function () {
            res.json(wait.for(controlUser.getInfoForEmail, req.user.email));
        });
    });

    app.get("/control/products", function (req, res) {
        wait.launchFiber(function getProducts() {
            let profilerCall = profiler.start("Getting products", { email: req.user.email });
            let products = wait.for(controlUser.getProductsForEmail, req.user.email);

            let tryToSet = (object, property, fn, ...fnArgs) => {
                try {
                    object[property] = fn(...fnArgs);
                } catch (e) {
                    object[property] = {};
                }
            };

            let getStreamUrl = (username, callback) => {
                castDatabase.getStreamUrl(username, function (err, streamUrl) {
                    if (err) {
                        return tryCentovaCastMethod();
                    }
                    return callback(null, streamUrl);
                });
                let tryCentovaCastMethod = () => {
                    legacyUsersDatabase.getStreamUrl(username, (err, streamUrl) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, streamUrl);
                    });
                };
            };

            for (let product of products) {
                legacyUsersDatabase.register(product.username, product.server, product.group);
                tryToSet(product, "streamUrl", wait.for, getStreamUrl, product.username);
            }

            res.json(products);
            profilerCall.end();
        });
    });
};
