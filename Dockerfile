FROM node:lts-gallium
 
COPY package.json .
RUN npm install
RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 \
libcups2 python3 python-pip
RUN pip install bs4 lxml
COPY . .

CMD [ "npm", "start" ]
