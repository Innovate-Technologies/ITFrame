import speakeasy from "speakeasy"
import * as database from "./timetokenDatabase.js"

export const generateTokenForService = async (service) => {
    const info = await database.getAPIKey(service)
    return speakeasy.hotp({
        key: info.key,
        counter: Math.round((new Date()).getTime() / 1000),
    })
}

export const validateTokenForService = async (service, token, offset = 1) => {
    const info = await database.getAPIKey(service)
    if (token === info.key) { // if server sends the key it is fine too as tokens seem to cause issues sometimes
        return true
    }

    const time = Math.round((new Date()).getTime() / 1000)
    const volidTokens = []

    for (let i = 0; i < (offset + 1); i++) {
        volidTokens.push(speakeasy.hotp({
            key: info.key,
            counter: time + i,
        }))
        volidTokens.push(speakeasy.hotp({
            key: info.key,
            counter: time - i,
        }))
    }

    return volidTokens.indexOf(token) !== -1
}
