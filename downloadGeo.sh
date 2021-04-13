#!/bin/bash

cd $MAXMIND_DB_DIR
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz || { echo 'Could not download GeoLiteCountry, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz || { echo 'Could not download GeoLiteCity, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCityv6-beta/GeoLiteCityv6.dat.gz || { echo 'Could not download GeoLiteCityv6, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/GeoIPv6.dat.gz || { echo 'Could not download GeoIPv6, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/asnum/GeoIPASNum.dat.gz || { echo 'Could not download GeoIPASNum, exiting.' ; exit 1; }
# wget http://geolite.maxmind.com/download/geoip/database/asnum/GeoIPASNumv6.dat.gz || { echo 'Could not download GeoIPASNumv6, exiting.' ; exit 1; }

wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${GEOLITE_KEY}&suffix=tar.gz || { echo 'Could not download GeoLite2 Country, exiting.' ; exit 1; }
wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${GEOLITE_KEY}&suffix=tar.gz || { echo 'Could not download GeoLite2 City, exiting.' ; exit 1; }
wget https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-ASN&license_key=${GEOLITE_KEY}&suffix=tar.gz || { echo 'Could not download GeoLite2 ASN, exiting.' ; exit 1; }

tar -xzvf *.tar.gz
