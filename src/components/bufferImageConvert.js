let lwip = require("pajk-lwip");

/**
 * Convert an image to a PNG image
 * @param  {Buffer}   buffer         Buffer containing the image
 * @param  {String}   format         Image format (png, jpg, gif)
 * @param  {Function} callback       Callback function (err, buffer)
 */
export default function resizeImage(buffer, format, callback) {
    let openCallback = (err, image) => {
        if (err) {
            return callback("Failed to open the image: " + err);
        }
        image.toBuffer("png", toBufferCallback);
    };

    let toBufferCallback = (err, resizedBuffer) => {
        if (err) {
            return callback("Failed to get the resized image: " + err);
        }
        return callback(null, resizedBuffer);
    };

    lwip.open(buffer, format, openCallback);
}
