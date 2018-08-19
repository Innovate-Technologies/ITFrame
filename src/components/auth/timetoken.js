import * as database from "./tokenDatabase.js"

export const validateTokenForService = async (service, token) => {
    const info = await database.getAPIKey(service)
    if (token === info.key) {
        return true
    }
    return false
}
