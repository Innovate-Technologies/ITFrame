var cast = requireFromRoot("components/cast/manage.js")
var mayaSupport = requireFromRoot("components/maya/support.js")

module.exports = function (parm) {
    parm.app.post("/whmcs/create", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        cast.createNode(req.body.username, function (err) {
            if (err) {
                return res.status(500).json({
                    result: "error",
                    error: err,
                })
            }
            res.json({ result: "okay" })
        })
    })

    parm.app.post("/whmcs/suspend", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        cast.suspendNode(req.body.username, function (err) {
            if (err) {
                return res.status(500).json({
                    result: "error",
                    error: err,
                })
            }
            res.json({ result: "okay" })
        })
    })

    parm.app.post("/whmcs/unsuspend", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })

        }
        cast.unsuspendNode(req.body.username, function (err) {
            if (err) {
                return res.status(500).json({
                    result: "error",
                    error: err,
                })
            }
            res.json({ result: "okay" })
        })
    })

    parm.app.post("/whmcs/terminate", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.username) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        cast.terminateNode(req.body.username, function (err) {
            if (err) {
                return res.status(500).json({
                    result: "error",
                    error: err,
                })
            }
            res.json({ result: "okay" })
        })
    })

    parm.app.post("/whmcs/support", function (req, res) {
        if (req.body.key !== config.whmcsCastKey || !req.body.content) {
            return res.status(400).json({
                result: "error",
                error: "Missing input",
            })
        }
        mayaSupport.answerClient({
            content: req.body.content,
            firstname: req.body.firstname,
            id: req.body.id
        })
        res.json({ result: "okay" })
    })
}
