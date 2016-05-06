let whmcs = requireFromRoot("components/legacy/whmcs.js");
import BadRequestError from "~/http/classes/BadRequestError";

module.exports = function ({ app }) {
    const ONE_SECOND = 1000;
    const ONE_MINUTE = 60 * ONE_SECOND;
    const TTL = 60 * ONE_MINUTE;
    let cachedRates = {};

    app.get("/internal/get-currency-rate/:currency", function (req, res, next) {
        let currency = req.params.currency;
        if (!currency) {
            return next(new BadRequestError("No currency found"));
        }
        let cachedEntry = cachedRates[currency];
        if (cachedEntry
            && new Date().getTime() < cachedEntry.validUntil.getTime()) {
            return res.json(cachedEntry);
        }
        whmcs.getCurrencyRate(currency).then(function (rate) {
            cachedRates[currency] = cachedEntry = {
                rate,
                date: new Date(),
                validUntil: new Date(new Date().getTime() + TTL),
            };
            res.json(cachedEntry);
        }, next);
    });
};
