import rest from "restler"

/**
 * Set a DNS record in etcd
 * @param {String}  name  DNS record name
 * @param {String}  type  DNS record type (A, AAAA, etc.)
 * @param {String}  value DNS record value
 * @param {Integer} ttl   DNS record TTL (time-to-live)
 */
export const setRecord = (name, type, value, ttl) => {
    rest.post(`https://${config.etcdLinkUrl}/v2/keys/DNS/${name}/${type}`,
        {
            data: {
                value: JSON.stringify([{
                    "value": value,
                    "ttl": ttl,
                }]),
            },
        })
}
