/* global Buffer */
/* global requireFromRoot,config */
let multer = require("multer");
let wait = require("wait.for");
let tunesDB = requireFromRoot("components/tunes/personalMusicDatabase.js");
let processingWorker = requireFromRoot("components/tunes/process.js");
let castDatabase = requireFromRoot("components/cast/database.js");
let moduleLogger = log.child({ component: "control-tunes" });
let getFileType = require("file-type");
let sbuff = require("simple-bufferstream");
import SwiftMulterStorage from "~/components/openstack/SwiftMulterStorage";
import convertImage from "~/components/bufferImageConvert";
const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif"];

const ONE_MEGABYTE = 1 * Math.pow(10, 6);
const MAX_FILE_SIZE = 1024 * ONE_MEGABYTE;

let upload = multer({
    storage: new SwiftMulterStorage({
        container: config.tunesUploadContainer,
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});


let processImageUpload = (req, { stream }, callback) => {
    let logger = moduleLogger.child({ req });
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
        logger.info("Converting image to PNG");
        convertImage(buffer, type.ext, (convertError, convertedBuffer) => {
            if (convertError) {
                logger.error(convertError, "Failed to resize the image");
                return callback(convertError);
            }
            logger.info("Successfully converted the image")
            return callback(null, sbuff(convertedBuffer));
        });
    });
};
let uploadImage = multer({
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

module.exports = function ({ app, wrap }) {
    app.post("/control/cast/tunes/upload", upload.single("song"), wrap(async (req, res, next) => {
        if (!req.file) {
            throw new Error("Failed to upload the song.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        castDatabase.getInfoForUsername(req.body.username, (castErr, cast) => {
            if (castErr) {
                return next(castErr);
            }
            let processedURLS = {}
            for (var stream of cast.streams) {
                processedURLS[stream.stream.replace("kbps", "")] = ""
            }
            const entry = await tunesDB.addSong(req.body.username, {
                type: "song",
                song: "",
                artist: "",
                album: "",
                externalURL: {},
                artwork: "",
                genre: "",
                internalURL: req.file.link,
                processedURLS: processedURLS,
                tags: req.body.tags || [],
                length: 0,
                size: 0,
                available: false,
            })
            processingWorker.processSong({
                id: entry._id,
            })
            res.json({ id: entry._id });
        })
    }))

    app.get("/control/cast/tunes/get-songs/:page", wrap(async (req, res, next) => {
        wait.launchFiber(function () {
            let songs = await tunesDB.getSongsForUser(req.body.username, 100, req.params.page || 0, req.body.sortBy)
            for (let song of songs) {
                song.internalURL = "";
                song.processedURLS = "";
            }
            res.json(songs)
        });
    }))

    app.post("/control/cast/tunes/set-tags/:song", wrap(async (req, res, next) => {
        await tunesDB.setSongTagForUserWithID(req.body.username, req.params.song, req.body.tags)
        res.json({})
    }))

    app.delete("/control/cast/tunes/delete/:song", wrap(async (req, res, next) => {
        await tunesDB.removeSong(req.body.username, req.params.song)
        res.json({})
    }))

    app.post("/control/cast/tunes/update-artwork/:song", uploadImage.single("image"), wrap(async (req, res, next) => {
        if (!req.file) {
            throw new Error("Failed to upload the image.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        await tunesDB.updateSong(req.body.username, req.params.song, { artwork: req.file.link })
        res.json({})
    }))
};
