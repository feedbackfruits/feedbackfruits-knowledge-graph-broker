FROM node:latest
MAINTAINER Steffan Sluis <steffan@feedbackfruits.com>

COPY . /app
WORKDIR /app

RUN npm install

CMD npm start
