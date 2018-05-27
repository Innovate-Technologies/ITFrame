let s3 = { }
let sbuff = require("simple-bufferstream")
let client = require("pkgcloud").storage.createClient({
    provider: "amazon",
    keyId: config.s3AccessKey,
    key: config.s3SecretKey,
    region: config.s3Region,
    forcePathBucket: true,
    endpoint: config.s3Endpoint,
})
let moduleLogger = log.child({ component: "s3" })

if (process.env.OPENSTACK_DEBUG) {
    client.on("log::*", function (message, object) {
        moduleLogger.debug(this.event.split("::")[1] + " − " + message)
        if (object) {
            moduleLogger.debug(object)
        }
    })
}

/**
 * Get the OpenStack storage client
 * @return OpenStack storage client
 */
s3.getStorageClient = () => client

/**
 * Upload a buffer to Swift and return a File with a `name`
 * @param  {String}   options.container Name or instance of a container
 * @param  {String}   options.name      Name of the new file
 * @param  {Buffer}   options.buffer    Buffer to upload
 * @param  {Function} callback          Callback function (err, File)
 */
s3.uploadBuffer = function ({ container, name, buffer }, callback) {
    let logger = moduleLogger.child({ container, newFileName: name });
    if (!container || !name || !buffer || !callback) {
        throw new TypeError("container, name, buffer and callback are required")
    }
    let writeStream = client.upload({ container, remote: name });
    writeStream.on("error", function (err) {
        logger.error(err, "Failed to upload file");
        callback(err)
    });
    writeStream.on("success", function (file) {
        logger.info({ file }, "Uploaded file");
        callback(null, file)
    });
    sbuff(buffer).pipe(writeStream)
}

/**
 * Upload a stream to Swift and return a File with a `name`
 * @param  {String}   options.container Name or instance of a container
 * @param  {String}   options.name      Name of the new file
 * @param  {Buffer}   options.stream    Stream to upload
 * @param  {Function} callback          Callback function (err, File)
 */
s3.uploadStream = function ({ container, name, stream }, callback) {
    let logger = moduleLogger.child({ container, newFileName: name });
    if (!container || !name || !stream || !callback) {
        throw new TypeError("container, name, stream and callback are required")
    }
    let writeStream = client.upload({ container, remote: name }).on("error", function (err) {
        logger.error(err, "Failed to upload file");
        callback(err)
    }).on("success", function (file) {
        logger.info({ file }, "Uploaded file");
        callback(null, file)
    })
    stream.pipe(writeStream)
}

s3.deleteFile = function ({ container, name }, callback) {
    if (!container || !name || !callback) {
        throw new TypeError("container, name and callback are required")
    }
    client.removeFile(container, name, callback);
}

module.exports = s3
