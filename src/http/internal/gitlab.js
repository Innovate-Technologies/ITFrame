const buildInfo = requireFromRoot("components/buildinfo/database.js")

export default ({ app, wrap }) => {
    app.post("/intern/gitlab/:name/build/" + config.gitLabKey, wrap(async (req, res) => {
        if (!req.body.sha) {
            throw new Error("No sha found")
        }
        if (req.body.build_status !== "success" || req.body.build_stage !== "deploy") {
            throw new Error("We won't deploy this build")
        }

        if (req.body.ref === "master") {
            await buildInfo.updateVersionForName(req.params.name, req.body.sha)
        } else if (req.body.ref === "beta") {
            await buildInfo.updateVersionForName(req.params.name = "-beta", req.body.sha)
        } else {
            throw new Error("We won't deploy this ref")
        }
        res.json({result: "success"})
    }))
}
