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
 * Get a ticket by ticket ID
 * @param  {String} email         Email address
 * @param  {String} ticketId
 * @return {Object} Ticket object
 */
export const getTicket = (email, ticketId) => {
    if (!ticketId) {
        return Promise.reject("No ticket ID");
    }
    return userBackend.getTicket(email, ticketId);
};

/**
 * Get all tickets for an user
 * @param  {String}  email         Email address
 * @param  {Boolean} activeOnly    Get active tickets only
 * @return {Array}   Array of ticket objects
 */
export const getTickets = (email, activeOnly = false) => {
    return userBackend.getTickets(email, activeOnly);
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
    if (!departmentId || !subject || !message) {
        return Promise.reject("Missing fields");
    }
    return userBackend.openTicket({
        email,
        departmentId,
        subject,
        message,
        sendEmail,
    });
};

/**
 * Change a ticket status by ticket ID
 * @param  {String}   email
 * @param  {String}   ticketId     Ticket ID
 * @param  {String}   status       New status
 */
export const changeStatusForTicket = function (email, ticketId, status) {
    if (!ticketId) {
        return Promise.reject("No ticket ID");
    }
    if (!status || ["closed", "open"].indexOf(status) === -1) {
        return Promise.reject("No status, or invalid status");
    }
    return userBackend.changeStatusForTicket(email, ticketId, status);
};


/**
 * Get replies for a ticket by ticket ID
 * @param  {String} email
 * @param  {String} ticketId
 * @return {Array}  Array of replies object
 */
export const getRepliesForTicket = (email, ticketId) => {
    if (!ticketId) {
        return Promise.reject("No ticket ID");
    }
    return userBackend.getRepliesForTicket(email, ticketId);
};

/**
 * Post a reply on a ticket on behalf of the user
 * @param  {String}   email
 * @param  {String}   ticketId     Ticket ID
 * @param  {String}   message      Reply message
 */
export const postReplyForTicket = (email, ticketId, message) => {
    if (!ticketId || !message) {
        return Promise.reject("No ticket ID or message");
    }
    return userBackend.postReplyForTicket(email, ticketId, message);
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
