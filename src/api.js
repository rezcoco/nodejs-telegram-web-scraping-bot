const https = require('node:https');
const axios = require('axios');

const agent = new https.Agent({  
  rejectUnauthorized: false
});
const getLink = async url => {
  return axios.get(url, {httpsAgent: agent})
}

module.exports.getLink = getLink
