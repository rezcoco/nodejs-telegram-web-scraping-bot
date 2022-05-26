FROM ubuntu:latest

WORKDIR /usr/src/app
RUN chmod 777 /usr/src/app

RUN apt-get update
RUN apt-get install curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt-get install nodejs 
COPY package*.json .
RUN npm install 
COPY . .

CMD [ "npm", "start" ]
