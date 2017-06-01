FROM node:8
MAINTAINER Maartje Eyskens <maartje@eyskens.me>

COPY ./src /opt/itframe/source 

WORKDIR /opt/itframe/source

RUN npm install
RUN mkdir keys

CMD ln -s /run/secrets/itframe-conf config.json &&\
    ln -s /run/secrets/controlPublicKey.pem keys/controlPublicKey.pem &&\
    ln -s /run/secrets/controlSigningKey.pem keys/controlSigningKey.pem &&\
    node app.js