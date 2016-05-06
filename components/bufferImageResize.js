let lwip = require("lwip");

/**
 * Resize a PNG image contained in a Buffer
 * @param  {Buffer}   buffer         Buffer containing the image
 * @param  {String}   format         Image format (png, jpg, gif)
 * @param  {Integer}  options.width  Target width
 * @param  {Integer}  options.height Target height
 * @param  {Function} callback       Callback function (err, buffer)
 */
export default function resizeImage(buffer, format, { width, height }, callback) {
    let openCallback = (err, image) => {
        if (err) {
            return callback("Failed to open the image: " + err);
        }
        image.resize(width, height, resizeCallback);
    };

    let resizeCallback = (err, image) => {
        if (err) {
            return callback("Failed to resize the image: " + err);
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
