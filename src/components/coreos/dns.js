import etcd from "~/components/coreos/etcd.js";

/**
 * Set a DNS record in etcd
 * Note that any previous value is overwritten.
 * @param {String}  name  DNS record name
 * @param {String}  type  DNS record type (A, AAAA, etc.)
 * @param {String}  value DNS record value
 * @param {Integer} ttl   DNS record TTL (time-to-live)
 */
export const setRecord = (name, type, value, ttl) => {
    return etcd.set(`/DNS/${name}/${type}`, JSON.stringify([{ value, ttl }]))
}
