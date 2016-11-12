import util from "util"
import randtoken from "rand-token"
import * as castDB from "./database.js"
const fleet = requireFromRoot("components/coreos/fleet.js")


export const getLeastUsedPort = async () => {
    const units = (await fleet.getAllUnits()).units
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
    for (let unit of units) {
        if (unit.name.split("-").length > 1) {
            const port = unit.name.split("-")[1].split(".service")[0]
            if (typeof castPorts[port] !== "undefined") {
                castPorts[port] = castPorts[port] + 1
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

export const createFleetUnit = async (username) => {
    const config = await castDB.getInfoForUsername(username)
    return {
        desiredState: "launched",
        name: `${username}-${config.input.SHOUTcast.toString()}.service`,
        options: [{
            name: "Description",
            section: "Unit",
            value: "Cast",
        }, {
            "name": "After",
            "section": "Unit",
            "value": "docker.service",
        }, {
            "name": "EnvironmentFile",
            "section": "Service",
            "value": "/etc/environment",
        }, {
            "name": "TimeoutStartSec",
            "section": "Service",
            "value": "1m",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/bin/bash -c '/usr/bin/docker pull docker.innovatete.ch/cast:$(dpkg --print-architecture)-latest'",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            value: util.format('/bin/bash -c "/usr/bin/etcdctl set \'/DNS/%s.radioca.st/A/\' \'[{\\"value\\":\\"\'$(curl myip.ninja)\'\\",\\"ttl\\":10}]\'"', username),
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            value: util.format('-/bin/bash -c "/usr/bin/etcdctl set \'/DNS/%s.radioca.st/AAAA/\' \'[{\\"value\\":\\"\'$(curl -f v6.myip.ninja)\'\\",\\"ttl\\":10}]\'"', username),
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker kill " + username,
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/bin/bash -c \"docker kill `docker ps | grep 0.0.0.0:" + config.input.SHOUTcast.toString() + " | awk '{print $1}'`\"",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker rm " + username,
        }, {
            "name": "ExecStart",
            "section": "Service",
            value: `/bin/bash -c "/usr/bin/docker run -p ${config.input.SHOUTcast.toString()}:${(config.input.SHOUTcast).toString()} -p ${(config.input.SHOUTcast + 1).toString()}:${(config.input.SHOUTcast + 1).toString()} --name ${username} -e username=${username} docker.innovatete.ch/cast:$(dpkg --print-architecture)-latest"`,
        }, {
            "name": "ExecStartPost",
            "section": "Service",
            "value": util.format('/bin/bash -c "sleep 2 && /usr/bin/etcdctl set \'/DNS/%s-int.radioca.st/A/\' \'[{\\"value\\":\\"\'$(docker inspect --format \'{{ .NetworkSettings.IPAddress }}\' %s)\'\\",\\"ttl\\":10}]\'"', username, username),
        }, {
            "name": "ExecStartPost",
            "section": "Service",
            "value": util.format('/bin/bash -c "sleep 10 && /usr/bin/etcdctl set \'/DNS/%s-int.radioca.st/A/\' \'[{\\"value\\":\\"\'$(docker inspect --format \'{{ .NetworkSettings.IPAddress }}\' %s)\'\\",\\"ttl\\":10}]\'"', username, username),
        }, {
            "name": "ExecStop",
            "section": "Service",
            "value": "/usr/bin/docker kill " + username,
        }, {
            "name": "ExecStopPost",
            "section": "Service",
            "value": "/usr/bin/docker rm " + username,
        }, {
            "name": "Restart",
            "section": "Service",
            "value": "always",
        }, {
            "name": "RestartSec",
            "section": "Service",
            "value": "5",
        }, {
            "name": "WantedBy",
            "section": "Install",
            "value": "multi-user.target",
        }, {
            "name": "Conflicts",
            "section": "X-Fleet",
            "value": "*-" + config.input.SHOUTcast.toString() + ".service",
        }, {
            "name": "MachineMetadata",
            "section": "X-Fleet",
            "value": "model=C2M",
        }],
    }
}

export const createDJFleetUnit = (username) => {
    return {
        desiredState: "launched",
        name: `${username}-dj.service`,
        options: [{
            name: "Description",
            section: "Unit",
            value: "DJ",
        }, {
            "name": "After",
            "section": "Unit",
            "value": "docker.service",
        }, {
            "name": "EnvironmentFile",
            "section": "Service",
            "value": "/etc/environment",
        }, {
            "name": "TimeoutStartSec",
            "section": "Service",
            "value": "1m",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/bin/bash -c '/usr/bin/docker pull docker.innovatete.ch/dj:$(dpkg --print-architecture)-latest'",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            value: util.format('/bin/bash -c "/usr/bin/etcdctl set \'/DNS/%s-dj.radioca.st/A/\' \'[{\\"value\\":\\"\'$(curl myip.ninja)\'\\",\\"ttl\\":10}]\'"', username),
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker kill " + username + "-dj",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker rm " + username + "-dj",
        }, {
            "name": "ExecStart",
            "section": "Service",
            value: `/bin/bash -c "/usr/bin/docker run --name ${username}-dj -e username=${username} --privileged docker.innovatete.ch/dj:$(dpkg --print-architecture)-latest"`,
        }, {
            "name": "ExecStartPost",
            "section": "Service",
            "value": util.format('/bin/bash -c "sleep 2 && /usr/bin/etcdctl set \'/DNS/%s-dj-int.radioca.st/A/\' \'[{\\"value\\":\\"\'$(docker inspect --format \'{{ .NetworkSettings.IPAddress }}\' %s-dj)\'\\",\\"ttl\\":10}]\'"', username, username),
        }, {
            "name": "ExecStartPost",
            "section": "Service",
            "value": util.format('/bin/bash -c "sleep 10 && /usr/bin/etcdctl set \'/DNS/%s-dj-int.radioca.st/A/\' \'[{\\"value\\":\\"\'$(docker inspect --format \'{{ .NetworkSettings.IPAddress }}\' %s-dj)\'\\",\\"ttl\\":10}]\'"', username, username),
        }, {
            "name": "ExecStop",
            "section": "Service",
            "value": "/usr/bin/docker kill " + username + "-dj",
        }, {
            "name": "ExecStopPost",
            "section": "Service",
            "value": "/usr/bin/docker rm " + username + "-dj",
        }, {
            "name": "Restart",
            "section": "Service",
            "value": "always",
        }, {
            "name": "RestartSec",
            "section": "Service",
            "value": "5",
        }, {
            "name": "WantedBy",
            "section": "Install",
            "value": "multi-user.target",
        }, {
            "name": "MachineMetadata",
            "section": "X-Fleet",
            "value": "model=C1",
        }],
    }
}
