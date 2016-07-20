import rest from "restler"
const castDatabase = requireFromRoot("modules/cast/database.js")

export const reloadClocks = (username) => new Promise((resolve, reject) => {
    castDatabase.getConfig(username, (err, res) => {
        if (err) {
            return reject(err)
        }
        rest.post(`https://${res.username}-dj.radioca.st/private/${res.internal.dj.key}/clocks/reload`, {timeout: 10000})
        .on("complete", (body) => {
            resolve(body)
        })
        .on("timeout", () => {
            reject(new Error("timeout"))
        })
    })
})