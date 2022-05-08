const https = require('node:https');
const axios = require('axios');

const agent = new https.Agent({  
  rejectUnauthorized: false
});
const getLink = async url => {
  const promise = await axios.get(url, {httpsAgent: agent})
  return promise
}

module.exports.getLink = getLink
