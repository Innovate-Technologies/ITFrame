import { HelmetController } from "../helmet/controller.js"
const controller = new HelmetController(config.tunesHelmetURL, config.tunesHelmetKey)

export const processSong = async ({ id }, attempt = 0) => {
    id = id + "" // make it a string
    try {
        await controller.create(id, { id })
    } catch (error) {
        attempt++
        if (attempt > 5) {
            throw error
        }
        await processSong({ id }, attempt)
    }
}

export const stopContainer = async (id, attempt = 0) => {
    id = id + "" // make it a string
    try {
        await controller.destroy(id, { id })
    } catch (error) {
        attempt++
        if (attempt > 5) {
            throw error
        }
        await stopContainer(id, attempt)
    }
}
