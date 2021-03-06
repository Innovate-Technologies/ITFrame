FROM node:10
MAINTAINER Maartje Eyskens <maartje@eyskens.me>

# Update npm packages first to avoid unnecessary rebuilds
COPY ./src/package.json /opt/itframe/source/package.json
COPY ./src/package-lock.json /opt/itframe/source/package-lock.json
RUN cd /opt/itframe/source/ && npm install

COPY ./src /opt/itframe/source
COPY ./bin /opt/itframe/source
COPY ./.git /opt/itframe/source/.git

WORKDIR /opt/itframe/source

RUN mkdir keys

CMD ln -s /run/secrets/itframe-conf config.json &&\
    ln -s /run/secrets/controlPublicKey.pem keys/controlPublicKey.pem &&\
    ln -s /run/secrets/controlSigningKey.pem keys/controlSigningKey.pem &&\
    node app.js
