let wait = require("wait.for");
let controlUser = requireFromRoot("components/control/controlUser.js");

module.exports = function ({ app }) {
    app.post("/control/feedback", function (req, res) {
        wait.for(controlUser.openTicket, {
            email: req.user.email,
            departmentId: 16,
            subject: req.body.subject,
            message: req.body.message,
            sendEmail: false,
        });
        res.json({});
    });
};
