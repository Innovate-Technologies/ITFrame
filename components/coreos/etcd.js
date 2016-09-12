import NodeEtcd from "node-etcd"
import wait from "wait.for"

var etcd;

const realConnectEtcd = function () {
    console.log(config.etcdLinkUrl)
    etcd = new NodeEtcd([config.etcdLinkUrl])
}

export const get = function (key, callback) {
    etcd.get(key, function (err, res) {
        if (err) {
            callback(err);
            return;
        }
        var data;
        try {
            // XXX: JSON.parse() on large JSON might block the event loop
            data = JSON.parse(res.node.value);
            if (!data || typeof data !== "object") {
                data = res.node.value;
            }
        } catch (e) {
            data = res.node.value;
        }
        callback(null, data);
    })
}

export const set = function (key, value) {
    etcd.set(key, value)
}

export const connectEtcd = function (discover) {
    wait.launchFiber(realConnectEtcd, discover)
}
