const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif"];
const DIMENSIONS = {
    icon: { width: 1024, height: 1024 },
    featureGraphic: { width: 1024, height: 500 },
};

let moduleLogger = log.child({ component: "apps-image-uploads" });
let multer = require("multer");
let sbuff = require("simple-bufferstream");
let getFileType = require("file-type");
import SwiftMulterStorage from "~/components/openstack/SwiftMulterStorage";
import convertImage from "~/components/bufferImageConvert";
import resizeImage from "~/components/bufferImageResize";

let processImageUpload = (req, { stream }, callback) => {
    let logger = moduleLogger.child({ req });
    let targetDimensions = DIMENSIONS[req.query.imageType];
    let chunks = [];
    stream.on("data", (data) => chunks.push(data));
    stream.on("end", () => {
        let buffer = Buffer.concat(chunks);
        let type = getFileType(buffer);
        if (!type) {
            return callback(new Error("Unknown file."));
        }
        if (type.ext && ALLOWED_IMAGE_TYPES.indexOf(type.ext) === -1) {
            return callback(new Error("Invalid file."));
        }
        if (!targetDimensions) {
            logger.info("Converting image to PNG");
            convertImage(buffer, type.ext, (convertError, convertedBuffer) => {
                if (convertError) {
                    logger.error(convertError, "Failed to resize the image");
                    return callback(convertError);
                }
                logger.info("Successfully converted the image")
                return callback(null, sbuff(convertedBuffer));
            });
        } else {
            logger.info("Resizing image and converting it to PNG");
            resizeImage(buffer, type.ext, targetDimensions, (resizeError, resizedBuffer) => {
                if (resizeError) {
                    logger.error(resizeError, "Failed to resize the image");
                    return callback(resizeError);
                }
                logger.info("Successfully resized the image")
                return callback(null, sbuff(resizedBuffer));
            });
        }
    });
};
const ONE_MEGABYTE = 1 * Math.pow(10, 6);
const MAX_FILE_SIZE = 5 * ONE_MEGABYTE;
let upload = multer({
    storage: new SwiftMulterStorage({
        container: config.appImagesUploadContainer,
        processFileFn: processImageUpload,
        defaultExtension: "png",
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        let splitFileName = file.originalname.split(".");
        let fileExtension = splitFileName[splitFileName.length - 1];
        cb(null, ALLOWED_IMAGE_TYPES.indexOf(fileExtension) !== -1);
    },
});

module.exports = function ({ app }) {
    app.post("/control/apps/upload-image", upload.single("image"), (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the image.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        res.json({
            link: req.file.link,
            name: req.file.name,
        });
    });
};
