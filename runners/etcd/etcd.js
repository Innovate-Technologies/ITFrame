let etcd = requireFromRoot("components/coreos/etcd.js");
etcd.connectEtcd();
module.exports = etcd