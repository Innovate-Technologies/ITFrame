import rest from "restler"
const logger = log.child({ component: "Helmet Controller" });

export class HelmetController {
    url = ""
    key = ""
    constructor(url, key) {
        this.url = url;
        this.key = key
    }

    create = (name, values = {}) => new Promise((resolve, reject) => {
        rest.putJson(`${this.url}/deployment/${name}`, {
            values,
        }, {
            timeout: 60000,
            headers: {
                "Authorization": `Bearer ${this.key}`,
            },
        }).on("complete", function (returnData) {
            if (returnData instanceof Error || returnData.result !== "success") {
                logger.debug("Create failed", returnData, name, values);
                reject(returnData)
                return
            }
            logger.debug("Create succeeded", returnData, name, values);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })

    destroy = (name, values = {}) => new Promise((resolve, reject) => {
        rest.delJson(`${this.url}/deployment/${name}`, {
            values,
        }, {
            timeout: 30000,
            headers: {
                "Authorization": `Bearer ${this.key}`,
            },
        }).on("complete", function (returnData) {
            if (returnData instanceof Error) {
                logger.debug("Destroy failed", returnData, name);
                reject(returnData)
                return
            }
            logger.debug("Destroy succeeded", returnData, name);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })
}
