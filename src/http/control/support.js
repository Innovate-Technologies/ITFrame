import * as controlUser from "~/components/control/controlUser.js";
import NotFoundError from "~/http/classes/NotFoundError";
import BadRequestError from "~/http/classes/BadRequestError";

export default function ({ app, wrap }) {
    app.all("/control/support/*", wrap(async function (req, res, next) {
        const ticketIdToCheck = req.params.ticketId;
        if (!ticketIdToCheck) {
            next();
            return;
        }
        // TODO: find a better way to ensure a client only has access to their tickets.
        const tickets = await controlUser.getTickets(req.user.email, false);
        if (!tickets.find((t) => t.id === ticketIdToCheck)) {
            throw new NotFoundError("No such ticket ID");
        }
        next();
    }));

    app.get("/control/support/tickets", wrap(async function (req, res) {
        const tickets = await controlUser.getTickets(req.user.email);
        res.json({ tickets });
    }));

    app.post("/control/support/tickets", wrap(async function (req, res) {
        const ticketId = await controlUser.openTicket({
            email: req.user.email,
            departmentId: 2, // TODO: magic numbers!
            subject: req.body.subject,
            message: req.body.message,
            sendEmail: true,
        });
        res.redirect(`/control/support/tickets/${ticketId}`);
    }));

    // IMPORTANT: always use ticketId or client access is not going to be checked
    app.get("/control/support/tickets/:ticketId", wrap(async function (req, res) {
        const ticket = await controlUser.getTicket(req.user.email, req.params.ticketId);
        res.json({ ticket });
    }));

    const ALLOWED_STATUSES = [
        "Open",
        "Customer-Reply",
        "Closed",
    ];
    app.put("/control/support/tickets/:ticketId/status", wrap(async function (req, res) {
        const newStatus = req.body;
        if (!ALLOWED_STATUSES.contains(newStatus)) {
            throw new BadRequestError("Invalid status.");
        }
        await controlUser.changeStatusForTicket(req.user.email, req.params.ticketId, newStatus);
        res.status(204).send();
    }));

    app.get("/control/support/tickets/:ticketId/replies", wrap(async function (req, res) {
        const replies = await controlUser.getRepliesForTicket(req.user.email, req.params.ticketId);
        res.json({ replies });
    }));

    app.post("/control/support/tickets/:ticketId/replies", wrap(async function (req, res) {
        await controlUser.postReplyForTicket(req.user.email, req.params.ticketId, req.body.message);
        res.status(204).send();
    }));

    app.post("/control/feedback", wrap(async function (req, res) {
        const ticketId = await controlUser.openTicket({
            email: req.user.email,
            departmentId: 16,
            subject: req.body.subject,
            message: req.body.message,
            sendEmail: false,
        });
        res.redirect(`/control/support/tickets/${ticketId}`);
    }));
}
