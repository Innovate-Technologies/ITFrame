import * as AppsService from "app/components/apps/api.js";

export default function ({ app, wrap }) {
    app.get("/control/apps/:username", wrap(async function (req, res) {
        let username = req.params.username;
        let apps = {
            android: await AppsService.getRequest("android", { username }),
            iOS: await AppsService.getRequest("iOS", { username }),
        };
        res.json(apps);
    }));

    app.post("/control/apps", wrap(async function (req, res) {
        let username = req.body.username;
        let request = req.body.request || {};
        request.username = username;
        request.reviewed = false;
        request.status = "pending";
        if (req.body.platform === "iOS") {
            request.sku = request.username;
            request.version = "1.0";
            request.whatisnew = "";
        }
        req.log.debug({ request, username }, "Going to add request");
        let requestId = await AppsService.addRequest(req.body.platform, request);
        res.json({ requestId });
    }));

    app.put("/control/apps/:username", wrap(async function (req, res) {
        let username = req.params.username;
        let oldRequest = await AppsService.getRequest(req.body.platform, { username });
        let request = req.body.request || {};
        request.username = username;
        request.reviewed = false;
        request.status = (oldRequest.status === "pending") ? "pending" : "pendingUpdate";
        // removedByGoogle requests were removed completely. They need a new package name,
        // so submitting it as an update isn't going to work. Reset to Pending.
        if (oldRequest.status === "removedByGoogle") {
            request.status === "pending";
        }
        if (req.body.platform === "iOS") {
            request.sku = request.username;
        }
        await AppsService.updateRequest(req.body.platform, { username }, request);
        res.json({});
    }));
}
