import dns from "dns"
import * as cast from "../../components/cast/manage.js"
import * as castDatabase from "../../components/cast/database.js"
import NotFoundError from "~/http/classes/NotFoundError";
import BadRequestError from "~/http/classes/BadRequestError";

const getCname = (hostname) => new Promise((resolve, reject) => {
    dns.resolveCname(hostname, (err, res) => {
        if (err) {
            return reject(err)
        }
        if (res.length === 0) {
            return reject(new Error("No CNAME records found"))
        }
        resolve(res[0])
    })
})

module.exports = ({ app, wrap }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/configuration/:username", wrap(async (req, res) => {
        const castConfig = await castDatabase.getInfoForUsername(req.params.username)
        delete castConfig.internal
        res.json(castConfig)
    }));

    app.post("/control/cast/upgrade/:username", wrap(async (req, res) => {
        await cast.upgradeNode(req.params.username)
        res.json({})
    }));


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Directories
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/directories/get-supported", (req, res) => {
        res.json(cast.supportedDirectories);
    });

    app.post("/control/cast/directories/enable/:username", wrap(async (req, res) => {
        if (!req.body.directory) {
            throw new BadRequestError();
        }
        await cast.addToDirectory(req.params.username, req.body.directory)
        res.json({})
    }));

    app.post("/control/cast/directories/disable/:username", wrap(async (req, res) => {
        if (!req.body.directory) {
            throw new BadRequestError();
        }
        await cast.removeFromDirectory(req.params.username, req.body.directory)
        res.json({})
    }));


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Streams
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/streams/:username", wrap(async (req, res) => {
        await cast.configureStreams(req.params.username, req.body)
        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // GeoLock
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/geolock/:username", wrap(async (req, res) => {
        await cast.setGeoLock(req.params.username, req.body)
        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Extra features
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.put("/control/cast/anti-stream-ripper/:username", wrap(async (req, res) => {
        await cast.setAntiStreamRipper(req.params.username, req.body.isEnabled)
        res.json({})
    }));

    app.put("/control/cast/hide-listener-count/:username", wrap(async (req, res) => {
        await cast.setHideListenerCount(req.params.username, req.body.isEnabled)
        res.json({})
    }));

    app.put("/control/cast/custom-domain/:username", wrap(async (req, res) => {
        const cname = await getCname(req.body.domain)
        if (cname !== `${req.params.username}.radioca.st`) {
            throw new Error(`${cname} doesn't match ${req.params.username}.radioca.st`)
        }
        await cast.setCustomDomain(req.params.username, req.body.domain)
        res.json({})
    }));

};
