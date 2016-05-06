let maxmind = require("maxmind");
maxmind.init([
    global.appRoot + "/components/geoip/database/databaseGeoIPCity.dat",
    global.appRoot + "/components/geoip/database/databaseGeoIPCityv6.dat",
]);

module.exports.lookUpLocation = (ip) => maxmind.getLocation(ip);
