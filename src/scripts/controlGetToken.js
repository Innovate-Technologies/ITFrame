require("colors");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var email = process.argv[2];

if (typeof process.argv[2] === "undefined") {
    console.error("No email specified.".red.bold);
    console.error("Usage: node scripts/controlGetToken.js <email> [ttl in minutes]");
    process.exit(1);
}

if (process.argv[2] === "--help") {
    console.error("Usage: node scripts/controlGetToken.js <email> [ttl in minutes]");
    process.exit(0);
}

try {
    process.chdir("./scripts");
} catch (error) {
    console.error("Please run this script from the repo's root.".red.bold);
    process.exit(1);
}

var ttl = process.argv[3] || "5m";
try {
    var privateKey = fs.readFileSync("../keys/controlSigningKey.pem");
} catch (error) {
    console.error("Could not read the signing key.".red.bold);
    console.error("Make sure it is available at <repo>/keys/controlSigningKey.pem.".red.bold);
    console.error("The error was: " + error.message.grey);
    process.exit(1);
}

var token = jwt.sign({ email: email }, privateKey, {
    expiresIn: ttl,
    audience: "https://itframe.shoutca.st/control",
    algorithm: "RS256",
});

console.log(("Generated a token valid for " + ttl + " minutes.").green.bold);
if (ttl > 5) {
    console.warn("Warning:".yellow.bold, "Do not forget to log out to invalidate the token!".yellow);
}

console.log(token.cyan);

console.log();
console.log("Tip: Set it in the dev tools for Control with: ".blue);
console.log("localStorage.setItem(\"ls.sessionData\", `{\"token\":\"" + token + "\"}`)");
console.log("…then reload the page to use the new token.".blue);
