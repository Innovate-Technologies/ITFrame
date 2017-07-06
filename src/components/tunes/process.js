import { Dispatch } from "../dispatch/dispatch.js"

const dispatch = new Dispatch(config.tunesLinkURL)

export const processSong = async ({ id }) => {
    try {
        await dispatch.newFromTemplate("tunes-worker-*", id, { id })
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
