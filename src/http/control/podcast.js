import multer from "multer"
import * as feedInfo from "../../components/cast/podcast/feedInfo"
import * as defaultInfo from "../../components/cast/podcast/defaultInfo"
import * as episodes from "../../components/cast/podcast/episodes"
import * as files from "../../components/cast/podcast/files"
const getFileType = require("file-type");
const sbuff = require("simple-bufferstream");
import S3MulterStorage from "~/components/storage/S3MulterStorage";
import convertImage from "~/components/bufferImageConvert";
const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif"];
const moduleLogger = log.child({ component: "control-podcasts" });

const ONE_MEGABYTE = 1 * Math.pow(10, 6);
const MAX_FILE_SIZE = 1024 * ONE_MEGABYTE;

let upload = multer({
    storage: new S3MulterStorage({
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

module.exports = ({ app, wrap }) => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Feed Info
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/feed-info", wrap(async (req, res) => {
        res.json(await feedInfo.getForUsername(req.params.username))
    }));

    app.post("/control/cast/:username/podcast/feed-info", wrap(async (req, res) => {
        const current = await feedInfo.getForUsername(req.params.username)
        if (!current) {
            await feedInfo.addForUsername(req.params.username, req.body)
        } else {
            await feedInfo.updateForUsername(req.params.username, req.body)
        }

        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Default Info
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/default-info", wrap(async (req, res) => {
        res.json(await defaultInfo.getForUsername(req.params.username))
    }));

    app.post("/control/cast/:username/podcast/default-info", wrap(async (req, res) => {
        const current = await defaultInfo.getForUsername(req.params.username)
        if (!current) {
            await defaultInfo.addForUsername(req.params.username, req.body)
        } else {
            await defaultInfo.updateForUsername(req.params.username, req.body)
        }

        res.json({})
    }));

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Episodes
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/control/cast/:username/podcast/episodes", wrap(async (req, res) => {
        const ep = await episodes.getForUsername(req.params.username)
        if (ep) {
            for (let id in ep) {
                if (ep.hasOwnProperty(id)) {
                    ep[id].internalURL = ""
                }
            }
        }
        res.json(ep)
    }));

    app.post("/control/cast/:username/podcast/episodes", wrap(async (req, res) => {
        delete req.body.internalURL
        if (req.body._id) {
            await episodes.updateForUsernameAndID(req.params.username, req.body._id, req.body)
            return res.json({})
        }
        res.json(await episodes.addForUsername(req.params.username, req.body))
    }));

    app.post("/control/cast/:username/podcast/episodes/upload", upload.single("episode"), wrap(async (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the episode.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        const entry = await files.addForUsername(req.params.username, {
            url: req.file.link,
            size: req.file.size,
        })
        res.json({ id: entry._id });
    }))

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Images
    ///////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/control/cast/:username/podcast/image", uploadImage.single("image"), wrap(async (req, res) => {
        if (!req.file) {
            throw new Error("Failed to upload the image.");
        }
        req.log.info({ link: req.file.link }, "Uploaded file");
        res.json({ url: `https://photon.shoutca.st/images.shoutca.st/${req.file.name}` })
    }))
};
