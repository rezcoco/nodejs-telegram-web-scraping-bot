const https = require('node:https');
const axios = require('axios');
const withDNS = require('axios-with-dns');

withDNS(axios)
const agent = new https.Agent({  
  rejectUnauthorized: false
});
const getLink = async url => {
  const promise = await axios.get(url, {dnsServer: '1.1.1.1', httpsAgent: agent})
  return promise
}

module.exports.getLink = getLink
