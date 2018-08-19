let InvalidatedTokens = {};
let mongoose = requireFromRoot("components/database/mongodb.js");
let Schema = mongoose.Schema;
let InvalidatedTokensSchema = new Schema({ token: String });
let InvalidatedTokensModel = mongoose.model("invalidated_tokens", InvalidatedTokensSchema, "invalidated_tokens");

/**
 * Check if a token is invalidated
 * @param  {String}   token    Token to check
 * @return {Promise}
 */
InvalidatedTokens.isTokenInvalidated = async (token) => {
    const result = await InvalidatedTokensModel.findOne({ token }).exec()
    return !!result
};

/**
 * Add a token to the invalidated token database
 * @param  {String}   token    Token to add
 * @return {Promise}
 */
InvalidatedTokens.addToken = (token) => {
    return new InvalidatedTokensModel({ token }).save();
}

module.exports = InvalidatedTokens;
