import maxmind from "maxmind";

maxmind.init([
    global.appRoot + "/components/geoip/database/databaseGeoIPCity.dat",
    global.appRoot + "/components/geoip/database/databaseGeoIPCityv6.dat",
]);

export const lookUpLocation = (ip) => maxmind.getLocation(ip);
