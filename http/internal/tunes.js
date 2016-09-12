import getFileType from "file-type";
import multer from "multer";
import sbuff from "simple-bufferstream";

import convertImage from "app/components/bufferImageConvert";
import * as db from "app/components/tunes/personalMusicDatabase.js";
import * as processSong from "app/components/tunes/process.js";
import resizeImage from "app/components/bufferImageResize";
import SwiftMulterStorage from "app/components/openstack/SwiftMulterStorage";

const ALLOWED_IMAGE_TYPES = ["jpg", "png", "gif"];
const ONE_MEGABYTE = 1 * Math.pow(10, 6);
const MAX_IMAGE_SIZE = 5 * ONE_MEGABYTE;
const MAX_FILE_SIZE = 1024 * ONE_MEGABYTE;

const moduleLogger = log.child({ component: "tunes-internal" });

let processImageUpload = (req, { stream }, callback) => {
    let logger = moduleLogger.child({ req });
    let targetDimensions = { width: 1024, height: 1024 };
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

let uploadImage = multer({
    storage: new SwiftMulterStorage({
        container: config.appImagesUploadContainer,
        processFileFn: processImageUpload,
        defaultExtension: "png",
    }),
    limits: {
        fileSize: MAX_IMAGE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        let splitFileName = file.originalname.split(".");
        let fileExtension = splitFileName[splitFileName.length - 1];
        cb(null, ALLOWED_IMAGE_TYPES.indexOf(fileExtension) !== -1);
    },
});


let upload = multer({
    storage: new SwiftMulterStorage({
        container: config.tunesUploadContainer,
        fileNameFn: (req) => req.query.name,
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

<<<<<<< HEAD
module.exports = function ({ app, wrap }) {
    app.get("/tunes/getSongForID/" + config.tunesKey, wrap(async (req, res) => {
=======
export default function ({ app, wrap }) {
    app.get("/tunes/getSongForID/" + config.tunesKey, (req, res, next) => {
>>>>>>> d3a70f7fe81f02e8184cefdd49c44ad8839f054f
        if (!req.query.id) {
            throw new Error("No ID provided");
        }
        res.json(await db.getSongForID(req.query.id));
    }));


    app.post("/tunes/upload/" + config.tunesKey, upload.single("song"), (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the song.");
        }
        res.json({
            link: req.file.link,
            name: req.file.name,
        });
    });

    app.post("/tunes/updateInfo/" + config.tunesKey, wrap(async (req, res) => {
        if (!req.body.username || !req.body._id) {
            throw new Error("Missing parameters");
        }
        await db.updateSong(req.body.username, req.body._id, req.body);
        res.json({ status: "ok" });
    }));

    app.delete("/tunes/stopContainer/" + config.tunesKey, (req, res) => {
        if (!req.body.id) {
            throw new Error("Missing parameters");
        }
        processSong.stopContainer(req.body.randomNumber, req.body.id);
        res.json({ status: "ok" }); // if we wait for a callback we will send an okay signal to a server that is already dead
    });

    app.post("/tunes/upload-image/" + config.tunesKey, uploadImage.single("image"), (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the image.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        res.json({
            link: req.file.link,
            name: req.file.name,
        });
    });

    app.get("/tunes/is-link-in-use/" + config.tunesKey, wrap(async (req, res) => {
        if (!req.query.link) {
            throw new Error("No link provided");
        }
        const isInUse = await db.isLinkInUse(req.query.link)
        res.json({ isInUse })
    }));

}
