import { HelmetController } from "../helmet/controller.js"
const controller = new HelmetController(config.tunesHelmetURL, config.tunesHelmetKey)

export const processSong = async ({ id }) => {
    id = id + "" // make it a string
    try {
        await controller.create(id, { id })
    } catch (error) {
        processSong({ id })
    }
}

export const stopContainer = async (id) => {
    id = id + "" // make it a string
    try {
        await controller.destroy(id, { id })
    } catch (error) {
        stopContainer(id)
    }
}
