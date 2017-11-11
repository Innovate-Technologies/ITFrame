import util from "util"
import randtoken from "rand-token"
import * as castDB from "./database.js"

export const getLeastUsedPort = async () => {
    const services = await castDB.getAll()
    const castPorts = {
        "6000": 0,
        "8000": 0,
        "9000": 0,
        "10000": 0,
        "11000": 0,
        "12000": 0,
        "13000": 0,
        "14000": 0,
        "15000": 0,
        "16000": 0,
        "17000": 0,
        "18000": 0,
        "19000": 0,
        "20000": 0,
    }

    for (let service of services) {
        if (service.input && service.input.SHOUTcast) {
            if (castPorts.hasOwnProperty(service.input.SHOUTcast.toString())) {
                castPorts[service.input.SHOUTcast.toString()] = castPorts[service.input.SHOUTcast.toString()] + 1
            }
        }
    }

    let leastPort = null;
    let leastPortUsage = null;
    for (let port in castPorts) {
        if (castPorts.hasOwnProperty(port)) {
            if (leastPortUsage === null || leastPortUsage > castPorts[port]) {
                leastPort = port
                leastPortUsage = castPorts[port]
            }
        }
    }
    return parseInt(leastPort, 10)
}

export const createConfigForNewUser = async (username) => {
    const port = await getLeastUsedPort()
    return {
        "httpPort": 80,
        "httpsPort": 0,
        "hostname": "https://" + username + ".radioca.st",
        "apikey": randtoken.generate(30),
        "input": {
            "SHOUTcast": port,
        },
        "directories": {
            "Icecast": [],
        },
        "streams": [{
            "stream": "64kbps",
            "password": randtoken.generate(10),
        }, {
            "stream": "128kbps",
            "password": randtoken.generate(10),
            "primary": true,
        }, {
            "stream": "320kbps",
            "password": randtoken.generate(10),
        }],
        "username": username,
    }
}

