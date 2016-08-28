import ExtendableError from "app/components/ExtendableError";

export default class WHMCSError extends ExtendableError {
    /**
     * Constructor for WHMCSError
     * WHMCSError is used when the WHMCS API returns an error
     * @param  {String} message Error message given by the WHMCS API
     */
    constructor(message) {
        super("WHMCS reported an error: " + message);
    }
}
