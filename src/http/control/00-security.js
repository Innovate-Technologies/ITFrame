import fs from "fs";
import wait from "wait.for";
import _ from "underscore";
const logger = log.child({ component: "Security" });

import BadRequestError from "~/http/classes/BadRequestError";
import redisClient from "~/components/redisClient";

const InvalidatedTokens = requireFromRoot("components/control/invalidatedTokensDatabase.js");
const controlUser = requireFromRoot("components/control/controlUser.js");
const publicKey = fs.readFileSync(global.appRoot + "/keys/controlPublicKey.pem");
const cert = fs.readFileSync(global.appRoot + "/keys/controlSigningKey.pem");

async function invalidateCacheForEmail(email) {
    await redisClient.del("user_products:" + email);
}

async function getProductsForEmail(email) {
    // This is very slow as it involves querying WHMCS, so we cache the product data
    // and invalidate it on a session change or on expiration.
    const cacheKey = "user_products:" + email;
    const cacheData = await redisClient.get(cacheKey);
    logger.debug("Redis lookup", cacheKey, cacheData)
    if (typeof cacheData === "string") {
        return JSON.parse(cacheData);
    }

    const products = await controlUser.getProductsForEmail(email);
    const ONE_DAY = 60 * 60 * 24;
    await redisClient.set(cacheKey, JSON.stringify(products), "EX", ONE_DAY);
    return products;
}

export default function ({ app, expressJwt, jwt, wrap }) {
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
                req.log.info("Found invalidated token, sending 419");
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

    app.all("/control/*", wrap(async (req, res, next) => {
        if (!req.query.username && !req.body.username) {
            return next();
        }

        if (req.query.username && req.body.username) {
            throw new BadRequestError("Only one username was expected.");
        }

        const usernameToCheck = req.query.username || req.body.username;
        const products = await getProductsForEmail(req.user.email);
        const product = products.find(p => p.username === usernameToCheck);
        if (!product) {
            throw new BadRequestError("The service mentioned in the request isn't valid.");
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
    }));

    app.param("username", wrap(async (req, res, next, username) => {
        if (!req.path.includes("/control/")) {
            return next();
        }
        if ((req.query.username && username && req.query.username !== username)
            || (req.body.username && username && req.body.username !== username)) {
            throw new BadRequestError("Only one username was expected.");
        }

        const products = await getProductsForEmail(req.user.email);
        const product = products.find(p => p.username === username);
        if (!product) {
            throw new BadRequestError("The service mentioned in the request isn't valid.");
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
    }));

    app.post("/authenticate", wrap(async (req, res) => {
        if (typeof req.body.email === "undefined" || typeof req.body.password === "undefined") {
            throw new BadRequestError("Missing data");
        }
        const correct = await controlUser.checkLogin(req.body.email, req.body.password);
        if (!correct) {
            return res.status(401).json({
                error: "Wrong login",
                result: "error",
            });
        }

        const token = jwt.sign({
            email: req.body.email,
            test: "ok",
        }, cert, {
            expiresInMinutes: 60,
            audience: "https://itframe.shoutca.st/control",
            algorithm: "RS256",
        });
        await invalidateCacheForEmail(req.body.email);
        res.json({ token });
    }));

    app.post("/control/keep-alive", wrap(async (req, res) => {
        const data = await controlUser.getInfoForEmail(req.user.email);
        const token = jwt.sign({ email: data.email }, cert, {
            expiresInMinutes: 120,
            audience: "https://itframe.shoutca.st/control",
            algorithm: "RS256",
        });
        res.json({ token });
    }));

    app.post("/control/log-out", function (req, res) {
        wait.launchFiber(() => {
            wait.for(InvalidatedTokens.addToken, req.token);
            res.json({});
        });
    });

}
