import tunesDatabase from "../../components/tunes/personalMusicDatabase.js"
const cast = requireFromRoot("components/cast/manage.js")
const mayaSupport = requireFromRoot("components/maya/support.js")

export default ({ app, wrap }) => {
    app.post("/whmcs/create", wrap(async (req, res) => {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        await cast.createNode(req.body.username)
        res.json({ result: "okay" })
    }))

    app.post("/whmcs/suspend", wrap(async (req, res) => {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        await cast.suspendNode(req.body.username)
        res.json({ result: "okay" })
    }))

    app.post("/whmcs/unsuspend", wrap(async (req, res) => {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })

        }
        await cast.unsuspendNode(req.body.username)
        res.json({ result: "okay" })
    }))

    app.post("/whmcs/terminate", wrap(async (req, res) => {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        await cast.terminateNode(req.body.username)
        res.json({ result: "okay" })
    }))

    app.post("/whmcs/get-space-used", wrap(async (req, res) => {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            throw new Error("Missing input")
        }
        res.json({ used: await tunesDatabase.calculateUsedSpace(req.body.username) })
    }))

    app.post("/whmcs/support", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.content) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        mayaSupport.answerClient({
            content: req.body.content,
            firstname: req.body.firstname,
            id: req.body.id,
        })
        res.json({ result: "okay" })
    })
}
