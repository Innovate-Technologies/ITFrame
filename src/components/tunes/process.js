import * as dispatch from "../dispatch/dispatch.js"

dispatch.setURL(config.tunesLinkURL)

export const processSong = async ({ id }) => {
    try {
        await dispatch.newFromTempate("tunes-worker-*", id, { id })
    } catch (error) {
        processSong({ id })
    }
}

export const stopContainer = async (id) => {
    try {
        await dispatch.destroy(`tunes-worker-${id}`)
    } catch (error) {
        stopContainer({ id })
    }
}
