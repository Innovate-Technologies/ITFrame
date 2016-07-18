const controlUser = requireFromRoot("components/control/controlUser.js");
const castDatabase = requireFromRoot("components/cast/database.js");
const legacyUsersDatabase = requireFromRoot("components/legacy/usersDatabase.js");
const profiler = requireFromRoot("profiler.js");

const getStreamUrl = (username) => new Promise((resolve, reject) => {
    castDatabase.getStreamUrl(username, function (err, streamUrl) {
        if (err) {
            return tryCentovaCastMethod();
        }
        resolve(streamUrl);
    });
    const tryCentovaCastMethod = () => {
        legacyUsersDatabase.getStreamUrl(username, (err, streamUrl) => {
            if (err) {
                return reject(err);
            }
            resolve(streamUrl);
        });
    };
});

export default function ({ app, wrap }) {
    app.get("/control/user-info", wrap(async (req, res) => {
        res.json(await controlUser.getInfoForEmail(req.user.email));
    }));

    app.get("/control/products", wrap(async (req, res) => {
        const profilerCall = profiler.start("Getting products", { email: req.user.email });
        const products = await controlUser.getProductsForEmail(req.user.email);

        for (let product of products) {
            legacyUsersDatabase.register(product.username, product.server, product.group);
            try {
                product.streamUrl = await getStreamUrl(product.username);
            } catch (_) { /* who cares? */ }
        }

        res.json(products);
        profilerCall.end();
    }));
}
