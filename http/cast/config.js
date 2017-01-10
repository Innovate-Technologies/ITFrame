const timetoken = requireFromRoot("components/auth/timetoken.js");
const castDB = requireFromRoot("components/cast/database.js");

import BadRequestError from "~/http/classes/BadRequestError";
import AccessDeniedError from "~/http/classes/AccessDeniedError";

export default ({ app, wrap }) => {
    app.all("/cast/config", wrap(async (req, res, next) => {
        if (!req.body.token) {
            throw new BadRequestError("No token found in the request body.");
        }
        if (!(await timetoken.validateTokenForService, "cast", req.body.token)) {
            throw new AccessDeniedError("Access denied: invalid token.");
        }
        // Everything is fine with the token -- allow the request to continue.
        return next();
    }))

    app.get("/cast/is-valid-domain/:domain", wrap(async (req, res) => {
        const info = await castDB.getDomain(req.body.domain)
        if (info === null) {
            return res.status(404).send()
        }
        res.status(200).send()
    }))

    app.post("/cast/config", wrap(async (req, res) => {
        res.json(await castDB.getInfoForUsername(req.body.username))
    }))
}
