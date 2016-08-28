import * as buildInfo from "app/components/buildinfo/database.js"

export default function ({ app }) {
    app.post("/intern/gitlab/:name/build/" + config.gitLabKey, function (req, res, next) {
        if (!req.body.sha) {
            return next(new Error("No sha found"))
        }
        if (req.body.build_status !== "success" || req.body.ref !== "master" || req.body.build_stage !== "deploy") {
            return next(new Error("We won't deploy this build"))
        }
        buildInfo.updateVersionForName(req.params.name, req.body.sha, (err) => {
            if (err) {
                return next(err);
            }
            res.json({result: "success"})
        })
    })
}
