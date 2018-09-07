const maxmind = require("maxmind").openSync(global.appRoot + "/components/geoip/database/GeoLite2-City.mmdb")

module.exports.lookUpLocation = (ip) => maxmind.get(ip);
