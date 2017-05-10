FROM node:6

COPY ./src /opt/itframe/source 

RUN cd /opt/itframe/source && npm install

CMD cd /opt/itframe/source && node app.js