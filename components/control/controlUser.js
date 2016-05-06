let controlUser = {};
let userBackend = require(global.appRoot + config.controlAuthClass);

/**
 * Try to log in with the specified email and password
 * This method calls the authentication class's checkLogin() method to check.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @param  {Function} callback Callback function (err, loginIsCorrect)
 */
controlUser.checkLogin = function (email, password, callback) {
    userBackend.checkLogin(email, password, callback);
};

/**
 * Get user information for a specified email
 * @param  {String}   email    Email address
 * @param  {Function} callback Callback function (err, info)
 */
controlUser.getInfoForEmail = function (email, callback) {
    userBackend.getInfoForEmail(email, callback);
};

/**
 * Get products for a specified email
 * @param  {String}   email    Email address
 * @param  {Function} callback Callback function (err, products)
 */
controlUser.getProductsForEmail = function (email, callback) {
    userBackend.getProductsForEmail(email, callback);
};

/**
 * Open a ticket on behalf of the user
 * @param  {String}   options.email        Client's email address
 * @param  {String}   options.departmentId Support department identifier.
 *                                         This is the support department ID in WHMCS's case.
 * @param  {String}   options.subject      Ticket subject
 * @param  {String}   options.message      Ticket message
 * @param  {Boolean}  options.sendEmail    Send an email about the ticket to the client
 * @param  {Function} callback             Callback function (err)
 */
controlUser.openTicket = function ({ email, departmentId, subject, message, sendEmail }, callback) {
    userBackend.openTicket({
        email,
        departmentId,
        subject,
        message,
        sendEmail,
    }, callback);
};

/**
 * Send an email related to a product
 * @param  {String}   emailTemplateName      Email template name (may not be the email subject)
 * @param  {String}   relatedProductUsername Related product username
 * @param  {Object}   customFields           Custom fields (optional)
 * @param  {Function} cb                     Callback function (err)
 */
controlUser.sendProductEmail = function (emailTemplateName, relatedProductUsername, customFields = {}, cb) {
    userBackend.sendProductEmail(emailTemplateName, relatedProductUsername, customFields, cb);
};

module.exports = controlUser;
