import rest from "restler"
const castDatabase = requireFromRoot("components/cast/database.js")

export const reloadClocks = (username) => new Promise(async (resolve, reject) => {
    const config = await castDatabase.getConfig(username)
    rest.post(`https://${config.username}-dj.radioca.st/private/${config.internal.dj.key}/clocks/reload`, { timeout: 10000 })
        .on("complete", resolve)
        .on("timeout", () => {
            reject(new Error("timeout"))
        })
})

export const skipSong = (username) => new Promise(async (resolve, reject) => {
    const config = await castDatabase.getConfig(username)
    rest.post(`https://${config.username}-dj.radioca.st/private/${config.internal.dj.key}/song/skip`, { timeout: 10000 })
        .on("complete", (body) => {
            resolve(body)
        })
        .on("timeout", () => {
            reject(new Error("timeout"))
        })
})

export const getQueue = (username) => new Promise(async (resolve, reject) => {
    const config = await castDatabase.getConfig(username)
    rest.get(`https://${config.username}-dj.radioca.st/private/${config.internal.dj.key}/queue`, { timeout: 10000 })
        .on("complete", (body) => {
            resolve(body)
        })
        .on("timeout", () => {
            reject(new Error("timeout"))
        })
})
