import { Etcd3 } from "etcd3";

const ROOT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDDjCCAfagAwIBAgIURLxLEjctFUE+sb2rnvrXp+GdJ84wDQYJKoZIhvcNAQEL
BQAwDTELMAkGA1UEAxMCQ0EwHhcNMTcwOTI0MTcwODAwWhcNMjIwOTIzMTcwODAw
WjANMQswCQYDVQQDEwJDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
AMMxgFfkL0QlEWuWvyDQHzIirsiaFt+I3Jp/B83Lr3hucKMsKalfwj8qMmbhc6Zc
Vldyh0wWsX0C8GOcm6W44W0EJeQM1F0q58G4U5azKJnMkS3xtPcR+Bk3iQwecfe6
pra0GfihiSjqdZ8YrBdlP/xdGktNhHXYowDe0qZAP3Cr2Ke2vnqlHlQJKNpdBs2t
BmBOMssGLtHDYQRSoSLaszf3fcuemi5LMaSmO/7YLi7Hsvhz4ObJXSWdjmf9JkOt
EXost/cZhLiSQpejCJoqxRzmy4E0mAMVdYyDWl+GKT8sccQtdMAd7S2lih9wLM9X
igQHUTM15MtWMzV5OWeD/ZsCAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIGA1Ud
EwEB/wQIMAYBAf8CAQIwHQYDVR0OBBYEFN+zT5sQo0xRyoHvhDBDmgYADRgKMB8G
A1UdIwQYMBaAFN+zT5sQo0xRyoHvhDBDmgYADRgKMA0GCSqGSIb3DQEBCwUAA4IB
AQA5Cmo5YSJ4KBRmgt8rO/2WaYiRIh7ziOhr5PGKEVCqRSypk/5ENVNNffKpEJ+C
mLjusbtOOp653sC6ELbt/HAuVZ7DNXk9wKTdCxRhwL2ALaxgIu1NKGDIh9W75W+X
Dc+V/vXKxIOuHXGASGQvWQiURYb+H90XqGbJHZQxn4xNUMjD+GzVDPhKins++MwU
cuSdD3kilv1cc683bJNe6mFUA1/GnGZqchz7fMB/WH3SqeUOZHsCGFfeEHNbtDLB
dzrriYPXONAK3ULzSMR4q3A2MHFdwgLBAe5CQJ0cf2GdE/OubCIh1/9w+TqfZxG2
lSwuZce/GpatJxkLPaQDiH32
-----END CERTIFICATE-----`;

const client = new Etcd3({
    hosts: config.etcdUrl,
    credentials: {
        rootCertificate: new Buffer(ROOT_CERTIFICATE),
    },
    auth: {
        username: config.etcdUsername,
        password: config.etcdPassword,
    },
});

export async function get(key, doNotRetry = false) {
    // XXX: Handling auth token errors manually should not be required.
    try {
        return await client.get(key);
    } catch (error) {
        if (doNotRetry || error.message !== "etcdserver: invalid auth token") {
            throw error;
        }
        // XXX: Internal API
        client.auth.client.authenticator.invalidateMetadata();
        return await get(key, true);
    }
}

export async function set(key, value, doNotRetry = false) {
    try {
        return await client.put(key).value(value);
    } catch (error) {
        if (doNotRetry || error.message !== "etcdserver: invalid auth token") {
            throw error;
        }
        // XXX: Internal API
        client.auth.client.authenticator.invalidateMetadata();
        return await set(key, value, true);
    }
}
