var wait = require("wait.for")
var fs = require("fs")
var _ = require("underscore")

import BadRequestError from "~/http/classes/BadRequestError"

var InvalidatedTokens = requireFromRoot("components/control/invalidatedTokensDatabase.js")
var controlUser = requireFromRoot("components/control/controlUser.js")
var publicKey = fs.readFileSync(global.appRoot + "/keys/controlPublicKey.pem")
var cert = fs.readFileSync(global.appRoot + "/keys/controlSigningKey.pem")

module.exports = function ({ app, expressJwt, jwt }) {
    app.use("/control", expressJwt({
        secret: publicKey,
        audience: "https://itframe.shoutca.st/control",
    }));

    app.all("/control/*", function checkToken(req, res, next) {
        wait.launchFiber(() => {
            let [scheme, token] = req.headers.authorization.split(" ");
            if (!/^Bearer$/i.test(scheme)) {
                return next(new BadRequestError("No token was found in the Authorization header."));
            }
            if (wait.for(InvalidatedTokens.isTokenInvalidated, token)) {
                req.log.info(`Found invalidated token, sending 419`);
                return res.status(419).json({
                    result: "error",
                    error: "The token has been invalidated.",
                });
            }

            // The keep-alive route was once bugged and generated tokens without an
            // email property in the token information.
            // As ITFrame expects the token to always hold the user's email, this obviously
            // causes issues, and in this case, a major one since it crashes the whole app.
            // The following checks for such invalid tokens and stops the request.
            if (!req.user.email) {
                req.log.warn(`Found an invalid token for ${req.user.email}, sending 401`);
                return res.status(401).json({
                    result: "error",
                    error: "Invalid token. Please log in again.",
                });
            }

            req.token = token;
            req.log = req.log.child({
                req: {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    user: req.user,
                },
            });
            return next(); // allow request to continue
        });
    });

    app.all("/control/*", function checkService(req, res, next) {
        wait.launchFiber(() => {
            if (!req.query.username && !req.body.username) {
                return next();
            }

            if (req.query.username && req.body.username) {
                return next(new BadRequestError("Only one username was expected."));
            }

            let usernameToCheck = req.query.username || req.body.username;
            let products = wait.for(controlUser.getProductsForEmail, req.user.email);
            let product = _.findWhere(products, {
                username: usernameToCheck,
            });
            if (!product) {
                return next(new BadRequestError("The service mentioned in the request isn't valid."));
            }
            req.log = req.log.child({
                req: {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    user: req.user,
                    product,
                },
            });
            req.product = product;
            return next(); // allow request to continue
        });
    });

    app.param("username", function (req, res, next, username) {
        if (!req.path.includes("/control/")) {
            return next();
        }
        wait.launchFiber(() => {
            if ((req.query.username && username && req.query.username !== username)
                || (req.body.username && username && req.body.username !== username)) {
                return next(new BadRequestError("Only one username was expected."));
            }

            let products = wait.for(controlUser.getProductsForEmail, req.user.email);
            let product = _.findWhere(products, { username });
            if (!product) {
                return next(new BadRequestError("The service mentioned in the request isn't valid."));
            }
            req.log = req.log.child({
                req: {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    user: req.user,
                    product,
                },
            });
            req.product = product;
            return next(); // allow request to continue
        });
    });

    app.post("/authenticate", function (req, res) {
        wait.launchFiber(() => {
            if (typeof req.body.email === "undefined" || typeof req.body.password === "undefined") {
                throw new BadRequestError("Missing data");
            }
            let correct = wait.for(controlUser.checkLogin, req.body.email, req.body.password);
            if (!correct) {
                return res.status(401).json({
                    error: "Wrong login",
                    result: "error",
                });
            }

            let token = jwt.sign({
                email: req.body.email,
                test: "ok",
            }, cert, {
                expiresInMinutes: 60,
                audience: "https://itframe.shoutca.st/control",
                algorithm: "RS256",
            });
            res.json({ token });
        });
    })

    app.post("/control/keep-alive", function (req, res) {
        wait.launchFiber(() => {
            let data = wait.for(controlUser.getInfoForEmail, req.user.email);
            let token = jwt.sign({ email: data.email }, cert, {
                expiresInMinutes: 120,
                audience: "https://itframe.shoutca.st/control",
                algorithm: "RS256",
            });
            res.json({ token });
        });
    });

    app.post("/control/log-out", function (req, res) {
        wait.launchFiber(() => {
            wait.for(InvalidatedTokens.addToken, req.token);
            res.json({});
        });
    });

}
