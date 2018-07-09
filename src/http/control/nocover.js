const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif"];
let moduleLogger = log.child({ component: "centova-nocover" });
let multer = require("multer");
let sbuff = require("simple-bufferstream");
let getFileType = require("file-type");
import S3MulterStorage from "~/components/storage/S3MulterStorage";
import resizeImage from "~/components/bufferImageResize";
import * as nocover from "~/components/tunes/nocover";


let processImageUpload = (req, { stream }, callback) => {
    let logger = moduleLogger.child({ req });
    let targetDimensions = { width: 2048, height: 2048 };
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
        logger.info("Resizing image and converting it to PNG");
        resizeImage(buffer, type.ext, targetDimensions, (resizeError, resizedBuffer) => {
            if (resizeError) {
                logger.error(resizeError, "Failed to resize the image");
                return callback(resizeError);
            }
            logger.info("Successfully resized the image")
            return callback(null, sbuff(resizedBuffer));
        });
    });
};
const ONE_MEGABYTE = 1 * Math.pow(10, 6);
const MAX_FILE_SIZE = 5 * ONE_MEGABYTE;
let upload = multer({
    storage: new S3MulterStorage({
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

module.exports = function ({ app, wrap }) {
    app.post("/control/tunes/upload-nocover/:username", upload.single("nocover"), wrap(async (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the image.");
        }
        const link = `https://images.shoutca.st/${req.file.name}`
        await nocover.updateNocoverForUsername(req.params.username, link)
        res.json({
            link,
            name: req.file.name,
        });
    }));

    app.delete("/control/tunes/nocover/:username", wrap(async (req, res) => {
        await nocover.delteNocoverForUsername(req.params.username, link)
        res.json({
            resulr: "ok",
        });
    }));
};
