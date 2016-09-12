import crypto from "crypto";
import { PassThrough } from "stream";

import * as swift from "app/components/openstack/swift.js";
import UUID from "app/components/uuid";

let swiftClient = swift.getStorageClient();
let moduleLogger = log.child({ component: "SwiftMulterStorage" });

class SwiftMulterStorage {
    /**
     * Constructor for SwiftMulterStorage
     * @constructor
     * @param  {String}   options.container        Container name to upload the files to
     * @param  {String}   options.defaultExtension Default file extension to append to the file name (optional)
     * @param  {String}   options.fileNameFn       A function to generate a file name (optional).
     *                                             It will be passed (req, stream) (no async!), and
     *                                             it should return a file name.
     *                                             If no file name function is passed, an UUID will be generated.
     * @param  {Boolean}  options.useHashForName   Use the file's hash as file name instead of an UUID
     *                                             (default is false).
     *                                             If a fileName is passed, this option will override it.
     * @param  {Function} options.processFileFn    A function to process the file stream (optional).
     *                                             It will be passed (req, file, callback), and
     *                                             it should return the processed stream.
     */
    constructor({
        container,
        defaultExtension,
        fileNameFn,
        useHashForName = false,
        processFileFn,
    }) {
        if (!container) {
            throw new TypeError("container is required");
        }
        this.defaultExtension = defaultExtension;
        this.container = container;
        if (typeof processFileFn === "function") {
            this.processFile = processFileFn;
        }
        this.fileNameFn = (typeof fileNameFn === "function") ? fileNameFn : UUID.generate;
        this.useHashForName = useHashForName;
        this.streamA = new PassThrough;
        this.streamB = new PassThrough;
        let instanceId = "xxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        this.logger = moduleLogger.child({ container, defaultExtension, instanceId });
    }

    /**
     * Get the file's hash
     * @param  {Stream}   stream   The file stream
     * @param  {Function} callback Callback function (error, hash)
     */
    getHashForFile(stream, callback) {
        let hashStream = crypto.createHash("sha256");
        hashStream.setEncoding("hex");
        hashStream.on("data", function (hash) {
            return callback(null, hash);
        });
        stream.pipe(hashStream);
    }

    /**
     * Get a file name
     * @param  {Object}   req      Standard Express request object
     * @param  {Stream}   stream   The file stream
     * @param  {Function} callback Callback function (error, fileName)
     */
    getFileName(req, stream, callback) {
        let constructFileName = (name) => {
            if (this.defaultExtension && this.defaultExtension.includes(".")) {
                this.logger.warn("defaultExtension needs no dot");
                this.defaultExtension = this.defaultExtension.replace(".", "");
            }
            let fileName = (this.defaultExtension)
                ? name + "." + this.defaultExtension
                : name;
            return fileName;
        };
        if (!this.useHashForName) {
            let fileName = this.fileNameFn(req, stream);
            if (!fileName) {
                fileName = UUID.generate();
            }
            return callback(null, constructFileName(fileName));
        }
        this.logger.info("Calculating the file hash");
        this.getHashForFile(stream, (error, hash) => {
            if (error) {
                return callback(error);
            }
            return callback(null, constructFileName(hash));
        });
    }

    /**
     * Handle a file upload
     * This method is called by Multer.
     * @param  {Object}   req      Standard Express request object
     * @param  {Object}   file     Standard Multer file object
     * @param  {Function} callback Callback function (err, { container, remote, size })
     */
    _handleFile(req, file, callback) {
        let continueUploading = () => {
            this.logger.info("Getting file name");
            this.getFileName(req, this.streamA, (error, fileName) => {
                if (error) {
                    this.logger.error(error, "Failed to get file name");
                    return callback(error);
                }
                this.logger.info("Uploading file");
                swift.uploadStream({
                    container: this.container,
                    name: fileName,
                    stream: this.streamB,
                }, (uploadErr, File) => {
                    if (uploadErr) {
                        return callback(error);
                    }
                    let fileObject = {
                        container: File.container,
                        remote: File.name,
                        size: File.size,
                        link: File.client._serviceUrl + "/" +
                            File.container + "/" +
                            File.name,
                    };
                    this.logger.info({ fileObject }, "Uploaded file");
                    return callback(null, fileObject);
                })
            });
        };
        file.stream.on("error", (error) => {
            this.logger.error(error, "Failed to read from the file stream");
        });
        this.streamA.on("error", (error) => {
            this.logger.error(error, "Failed to read/write from stream A");
        });
        this.streamB.on("error", (error) => {
            this.logger.error(error, "Failed to read/write from stream B");
        });
        if (this.processFile) {
            this.logger.info("Processing file");
            this.processFile(req, file, (error, transformedStream) => {
                if (error) {
                    this.logger.error(error, "processFile() returned an error");
                    return callback(error);
                }
                this.logger.info("Done processing file, piping");
                transformedStream.pipe(this.streamA);
                transformedStream.pipe(this.streamB);
                continueUploading();
            });
        } else {
            this.logger.info("'Piping' the file");
            file.stream.on("data", (data) => {
                this.streamA.write(data);
                this.streamB.write(data);
            });
            file.stream.on("end", () => {
                this.streamA.end();
                this.streamB.end();
            });
            continueUploading();
        }
    }

    /**
     * Remove a file
     * This method is called by Multer.
     * @param  {Object}   req      Standard Express request object
     * @param  {Object}   file     Standard Multer file object
     * @param  {Function} callback Callback function
     */
    _removeFile(req, file, callback) {
        swiftClient.removeFile(file.container, file.remote, callback);
    }
}

export default class SwiftMulterStorageWrapper {
    constructor(params) {
        this.params = params;
    }

    _handleFile(req, file, callback) {
        return new SwiftMulterStorage(this.params)._handleFile(req, file, callback);
    }

    _removeFile(req, file, callback) {
        return new SwiftMulterStorage(this.params)._removeFile(req, file, callback);
    }
}
