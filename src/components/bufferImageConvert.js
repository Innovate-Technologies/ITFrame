const sharp = require("sharp");

/**
 * Convert an image to a PNG image
 * @param  {Buffer}   buffer         Buffer containing the image
 * @param  {String}   format         Image format (png, jpg)
 * @param  {Function} callback       Callback function (err, buffer)
 */
export default function resizeImage(buffer, format, callback) {
    let image = sharp(buffer)
    if (format == "png") {
        image = image.png()
    } else if (format == "jpg") {
        image = image.jpeg()
    }
    return callback(null, image.toBuffer());
}
