const userBackend = requireFromRoot(config.controlAuthClass);

/**
 * Try to log in with the specified email and password
 * This method calls the authentication class's checkLogin() method to check.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @return {Boolean}  Whether credentials are correct
 */
export const checkLogin = (email, password) => {
    return userBackend.checkLogin(email, password);
};

/**
 * Get user information for a specified email
 * @param  {String}   email    Email address
 * @return {Object}   Info
 */
export const getInfoForEmail = function (email) {
    return userBackend.getInfoForEmail(email);
};

/**
 * Get products for a specified email
 * @param  {String}   email    Email address
 * @return {Array}    Array of product objects
 */
export const getProductsForEmail = function (email) {
    return userBackend.getProductsForEmail(email);
};

/**
 * Open a ticket on behalf of the user
 * @param  {String}   options.email        Client's email address
 * @param  {String}   options.departmentId Support department identifier.
 *                                         This is the support department ID in WHMCS's case.
 * @param  {String}   options.subject      Ticket subject
 * @param  {String}   options.message      Ticket message
 * @param  {Boolean}  options.sendEmail    Send an email about the ticket to the client
 */
export const openTicket = function ({ email, departmentId, subject, message, sendEmail } = {}) {
    return userBackend.openTicket({
        email,
        departmentId,
        subject,
        message,
        sendEmail,
    });
};

/**
 * Send an email related to a product
 * @param  {String}   emailTemplateName      Email template name (may not be the email subject)
 * @param  {String}   relatedUsername        Related product username
 * @param  {Object}   customFields           Custom fields (optional)
 */
export const sendProductEmail = function (emailTemplateName, relatedUsername, customFields = {}) {
    return userBackend.sendProductEmail(emailTemplateName, relatedUsername, customFields);
};
