#!/bin/bash

cd $MAXMIND_DB_DIR
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz || { echo 'Could not download GeoLiteCountry, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz || { echo 'Could not download GeoLiteCity, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCityv6-beta/GeoLiteCityv6.dat.gz || { echo 'Could not download GeoLiteCityv6, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoIPv6.dat.gz || { echo 'Could not download GeoIPv6, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/asnum/GeoIPASNum.dat.gz || { echo 'Could not download GeoIPASNum, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/asnum/GeoIPASNumv6.dat.gz || { echo 'Could not download GeoIPASNumv6, exiting.' ; exit 1; }

wget http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.mmdb.gz || { echo 'Could not download GeoLite2 Country, exiting.' ; exit 1; }
wget http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz || { echo 'Could not download GeoLite2 City, exiting.' ; exit 1; }
wget http://geolite.maxmind.com/download/geoip/database/GeoLite2-ASN.tar.gz|| { echo 'Could not download GeoLite2 ASN, exiting.' ; exit 1; }

gunzip -f *.gz