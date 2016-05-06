var etcd;
var wait = require("wait.for");

var connectEtcd = function () {
    var NodeEtcd = require("node-etcd")
    console.log(config.etcdLinkUrl)
    etcd = new NodeEtcd([config.etcdLinkUrl])
}

var get = function (key, callback) {
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

var set = function (key, value) {
    etcd.set(key, value)
}

module.exports.connectEtcd = function (discover) {
    wait.launchFiber(connectEtcd, discover)
}

module.exports.get = get
module.exports.set = set
