FROM node:16.15.0-stretch

WORKDIR /usr/src/app
 
COPY package.json .
RUN npm install 
RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk-bridge-2.0-0 libdrm libxkbcommon0 libgbm1 libasound2
COPY . .

CMD [ "npm", "start" ]
