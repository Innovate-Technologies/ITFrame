import wait from "wait.for"

import mongoose from "app/components/database/mongodb.js";
let Schema = mongoose.Schema;
let InvalidatedTokensSchema = new Schema({ token: String });
let InvalidatedTokensModel = mongoose.model("invalidated_tokens", InvalidatedTokensSchema, "invalidated_tokens");

/**
 * Check if a token is invalidated
 * @param  {String}   token    Token to check
 * @param  {Function} callback Callback function (err, isInvalidated (bool))
 */
export const isTokenInvalidated = (token, callback) => {
    wait.launchFiber(() => {
        let result = wait.forMethod(InvalidatedTokensModel, "findOne", {
            token,
        });
        return callback(null, !!result);
    });
};

/**
 * Add a token to the invalidated token database
 * @param  {String}   token    Token to add
 * @param  {Function} callback Callback function (err)
 */
export const addToken = (token, callback) => {
    new InvalidatedTokensModel({ token }).save(callback);
}
