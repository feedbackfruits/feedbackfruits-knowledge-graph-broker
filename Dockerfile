FROM node:7.2.0-alpine

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install dependencies
COPY package.json /opt/app
RUN npm install

# Bundle app source
COPY . /opt/app

ENV INPUT_TOPIC=quad_update_requests
ENV OUTPUT_TOPIC=quad_updates

CMD ["npm", "start"]
