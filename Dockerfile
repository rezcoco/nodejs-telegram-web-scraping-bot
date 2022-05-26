FROM ubuntu:latest

WORKDIR /usr/src/app
RUN sudo apt-get install curl && curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN sudo apt-get install nodejs 
COPY package*.json .
RUN npm install 
COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
