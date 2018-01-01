import { Dispatch } from "../dispatch/dispatch.js"

const dispatch = new Dispatch(config.tunesLinkURL)

export const processSong = async ({ id }) => {
    id = id + "" // make it a string
    try {
        await dispatch.newFromTemplate("tunes-worker-*.service", id, {})
    } catch (error) {
        processSong({ id })
    }
}

export const stopContainer = async (id) => {
    try {
        await dispatch.destroy(`tunes-worker-${id}.service`)
    } catch (error) {
        stopContainer(id)
    }
}
