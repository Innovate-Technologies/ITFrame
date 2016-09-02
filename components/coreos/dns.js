import etcd from "app/runners/etcd/etcd";

/**
 * Set a DNS record in etcd
 * @param {String}  name  DNS record name
 * @param {String}  type  DNS record type (A, AAAA, etc.)
 * @param {String}  value DNS record value
 * @param {Integer} ttl   DNS record TTL (time-to-live)
 */
export const setRecord = function (name, type, value, ttl) {
    etcd.set(`/DNS/${name}/${type}/`, JSON.stringify([{
        "value": value,
        "ttl": ttl,
    }]))
}
