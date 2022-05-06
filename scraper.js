const axios = require('axios');
const withDNS = require('axios-with-dns');

withDNS(axios)

const getLink = async url => {
  const promise = await axios.get(url, {dnsServer: '1.1.1.1'})
  return promise
}

module.exports.getLink = getLink