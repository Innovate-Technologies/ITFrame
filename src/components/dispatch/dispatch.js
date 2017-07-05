import rest from "restler"
const logger = log.child({ component: "Dispatch" });

let URL = ""

export const setURL = (url) => {
    this.URL = url
}

export const newFromTemplate = (template, name, vars = {}) => new Promise((resolve, reject) => {
    rest.post(`${URL}/unit/from-template/${template}`, {
        timeout: 10000,
        data: {
            name,
            vars,
        },
    }).on("complete", function (returnData) {
        logger.debug("Create succeeded");
        resolve(returnData);
    }).on("timeout", function () {
        logger.error("Timeout");
        reject(new Error("Timeout"))
    })
})

export const destroy = (name) => new Promise((resolve, reject) => {
    rest.del(`${URL}/unit/${name}`, {
        timeout: 10000,
    }).on("complete", function (returnData) {
        logger.debug("Destroy succeeded");
        resolve(returnData);
    }).on("timeout", function () {
        logger.error("Timeout");
        reject(new Error("Timeout"))
    })
})
