export default function ({ app }) {
    app.use(function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
        if (err.name === "UnauthorizedError" && err.message === "jwt expired") {
            req.log.debug(err, "Caught an UnauthorizedError (jwt expired), sending 419");
            return res.status(419).json({
                result: "error",
                error: "Your session has expired.",
            });
        }

        if (err.name === "UnauthorizedError") {
            req.log.info(err, "Caught an UnauthorizedError, sending 401");
            return res.status(401).json({
                result: "error",
                error: "You are not authenticated.",
            });
        }

        if (err.name === "NotFoundError") {
            req.log.debug(err, "Caught an NotFoundError, sending 404");
            return res.status(404).json({
                result: "error",
                error: err.message || "Not found",
            });
        }

        if (err.name === "BadRequestError") {
            req.log.info(err, "Caught an BadRequestError, sending 400");
            return res.status(400).json({
                result: "error",
                error: err.message || "Missing information",
            });
        }

        if (err.name === "AccessDeniedError") {
            req.log.warn(err, "Caught an AccessDeniedError, sending 403");
            return res.status(403).json({
                result: "error",
                error: err.message || "Access denied",
            });
        }

        req.log.error(err);
        res.status(500);
        if (req.accepts("json")) {
            return res.json({
                result: "error",
                error: err.message,
            });
        }
        return res.send(err.message);
    });
}
