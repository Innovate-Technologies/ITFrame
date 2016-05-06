/* global requireFromRoot */
let fleet = requireFromRoot("components/coreos/fleet.js")

module.exports.processSong = function ({ id }) {
    fleet.newUnit("tunes-" + id + ".service", {
        desiredState: "launched",
        name: "tunes-" + id + ".service",
        options: [{
            name: "Description",
            section: "Unit",
            value: "Tunes Worker for " + id,
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
            "value": "-/bin/bash -c \"/usr/bin/docker pull docker.innovatete.ch/tunes-worker:`dpkg --print-architecture`-latest\"",
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker kill tunes-" + id,
        }, {
            "name": "ExecStartPre",
            "section": "Service",
            "value": "-/usr/bin/docker rm tunes-" + id,
        }, {
            "name": "ExecStart",
            "section": "Service",
            value: "/bin/bash -c \"/usr/bin/docker run --name 'tunes-" + id + "' -e ID=" + id + " docker.innovatete.ch/tunes-worker:`dpkg --print-architecture`-latest\"",
        }, {
            "name": "ExecStop",
            "section": "Service",
            "value": "/usr/bin/docker kill tunes-" + id,
        }, {
            "name": "ExecStopPost",
            "section": "Service",
            "value": "/usr/bin/docker rm tunes-" + id,
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
            "value": "model=C2S",
        }],
    }, () => {})
}

module.exports.stopContainer = (id) => {
    fleet.destroyUnit("tunes-" + id + ".service", () => {})
}
