const sharp = require("sharp");

/**
 * Resize a PNG image contained in a Buffer
 * @param  {Buffer}   buffer         Buffer containing the image
 * @param  {String}   format         Image format (png, jpg)
 * @param  {Integer}  options.width  Target width
 * @param  {Integer}  options.height Target height
 * @param  {Function} callback       Callback function (err, buffer)
 */
export default function resizeImage(buffer, format, { width, height }, callback) {
    let image = sharp(buffer)
    if (format == "png") {
        image = image.png()
    } else if (format == "jpg") {
        image = image.jpeg()
    }

    image = image.resize({ width, height })

    image.toBuffer().then(data => { callback(null, data) }).catch(err => { callback(err) });
}
