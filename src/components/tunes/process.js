const fleet = requireFromRoot("components/coreos/fleet.js")

export const processSong = async ({ id }) => {
    const randomNumber = Math.floor(Math.random() * 4)
    try {
        await createUnit(randomNumber, id)
    } catch (error) {
        processSong({ id })
    }
}

const createUnit = (randomNumber, id) => new Promise((resolve, reject) => {
    fleet.newUnit(`tunes-worker-${randomNumber}-${id}.service`, {
        desiredState: "launched",
        name: `tunes-worker-${randomNumber}-${id}.service`,
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
            value: `/bin/bash -c "/usr/bin/docker run --name 'tunes-${id}' -e ID='${id}' -e randomNumber='${randomNumber}' docker.innovatete.ch/tunes-worker:$(dpkg --print-architecture)-latest"`,
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
        }, {
            "name": "MachineMetadata",
            "section": "X-Fleet",
            "value": "zone=ams1",
        }, {
            "name": "Conflicts",
            "section": "X-Fleet",
            "value": `tunes-worker-${randomNumber}*`,
        }],
    }, (err) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    })
})

export const stopContainer = (randomNumber, id) => {
    fleet.destroyUnit(`tunes-worker-${randomNumber}-${id}.service`, Function.prototype)
}
