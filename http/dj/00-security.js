import wait from "wait.for"

import * as cast from "app/components/cast/database.js"

export default function ({ app }) {
    app.all("/dj/:user/:key/*", function checkDJKey(req, res, next) {
        wait.launchFiber(() => {
            if (!req.params.user || !req.params.key) {
                return res.status(401).json({
                    result: "error",
                    error: "Missing info.",
                });
            }
            try {
                var info = wait.for(cast.getInfoForUsername, req.params.user)
                if (!info.internal.dj || !info.internal.dj.key) {
                    return res.status(500).json({
                        result: "error",
                        error: "DJ is not configured",
                    });
                }
                if (info.internal.dj.key !== req.params.key) {
                    return res.status(401).json({
                        result: "error",
                        error: "Invalid info.",
                    });
                }
            } catch (error) {
                return res.status(500).json({
                    result: "error",
                    error: error,
                });
            }

            return next(); // allow request to continue
        });
    });
}
