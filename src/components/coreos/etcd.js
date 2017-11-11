import { Etcd3 } from "etcd3";

let client;

// Initialise etcd (static instance)
// Must be called prior to using any of the other methods
export function init() {
    if (client) {
        return;
    }
    console.log(config.etcdLinkUrl);
    client = new Etcd3({ hosts: config.etcdLinkUrl });
}

// Returns a Promise
export function get(key) {
    return client.get(key);
}

// Returns a Promise
export function set(key, value) {
    return client.put(key).value(value);
}
