const controlUser = requireFromRoot("components/control/controlUser.js");

export default function ({ app, wrap }) {
    app.post("/control/feedback", wrap(async function (req, res) {
        await controlUser.openTicket({
            email: req.user.email,
            departmentId: 16,
            subject: req.body.subject,
            message: req.body.message,
            sendEmail: false,
        });
        res.json({});
    }));
}
