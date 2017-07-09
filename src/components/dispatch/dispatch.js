import rest from "restler"
const logger = log.child({ component: "Dispatch" });

export class Dispatch {
    URL = ""
    constructor(URL) {
        this.URL = URL;
    }

    newFromTemplate = (template, name, vars = {}) => new Promise((resolve, reject) => {
        rest.post(`${this.URL}/unit/from-template/${template}`, {
            timeout: 10000,
            data: {
                name,
                vars,
            },
        }).on("complete", function (returnData) {
            logger.debug("Create succeeded", returnData);
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
            logger.debug("Destroy succeeded", returnData);
            resolve(returnData);
        }).on("timeout", function () {
            logger.error("Timeout");
            reject(new Error("Timeout"))
        })
    })
}
