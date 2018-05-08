FROM node:10.0.0
MAINTAINER Maartje Eyskens <maartje@eyskens.me>

# Update npm packages first to avoid unnecessary rebuilds
COPY ./package.json /opt/itframe/source/package.json
RUN cd /opt/itframe/source/ && npm install --production

COPY ./src /opt/itframe/source
COPY ./bin /opt/itframe/source
COPY ./.git /opt/itframe/source/.git

WORKDIR /opt/itframe/source

RUN mkdir keys

CMD ln -s /run/secrets/itframe-conf config.json &&\
    ln -s /run/secrets/controlPublicKey.pem keys/controlPublicKey.pem &&\
    ln -s /run/secrets/controlSigningKey.pem keys/controlSigningKey.pem &&\
    node app.js
