import rest from "restler"
const logger = log.child({ component: "Dispatch" });

export class Dispatch {
    URL = ""
    constructor(URL) {
        this.URL = URL;
    }

    newFromTemplate = (template, name, vars = {}, ports = []) => new Promise((resolve, reject) => {
        rest.postJson(`${this.URL}/unit/from-template/${template}`, {
            name,
            vars,
            ports,
        }, {
            timeout: 10000,
        }).on("complete", function (returnData) {
            if (returnData instanceof Error || returnData.status !== "ok") {
                logger.debug("Create failed", returnData, template, name, vars, ports);
                reject(returnData)
            }
            logger.debug("Create succeeded", returnData, template, name, vars, ports);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })

    destroy = (name) => new Promise((resolve, reject) => {
        rest.del(`${this.URL}/unit/${name}`, {
            timeout: 10000,
        }).on("complete", function (returnData) {
            if (returnData instanceof Error || returnData.status !== "ok") {
                logger.debug("Destroy failed", returnData, name);
                reject(returnData)
            }
            logger.debug("Destroy succeeded", returnData, name);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })

    start = (name) => new Promise((resolve, reject) => {
        rest.put(`${this.URL}/unit/${name}/start`, {
            timeout: 10000,
        }).on("complete", function (returnData) {
            if (returnData instanceof Error || returnData.status !== "ok") {
                logger.debug("Unit start failed", returnData);
                reject(returnData)
            }
            logger.debug("Unit start succeeded", returnData);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })

    stop = (name) => new Promise((resolve, reject) => {
        rest.put(`${this.URL}/unit/${name}/stop`, {
            timeout: 10000,
        }).on("complete", function (returnData) {
            if (returnData instanceof Error || returnData.status !== "ok") {
                logger.debug("Unit stop failed", returnData);
                reject(returnData)
            }
            logger.debug("Unit stop succeeded", returnData);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })
}
