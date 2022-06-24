FROM node:lts-gallium

WORKDIR /root/app
RUN chmod 777 /root/app
 
COPY package.json .
RUN npm install
RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 \
libcups2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 python3 python3-pip
RUN pip3 install bs4 lxml requests
COPY . .

CMD [ "npm", "start" ]
