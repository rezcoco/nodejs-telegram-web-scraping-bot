const https = require('node:https');
const axios = require('axios');
const BASE_URL = process.env.BASE_URL || false

const agent = new https.Agent({  
  rejectUnauthorized: false
});

if (BASE_URL) {
  while (true) {
    try {
      const alive = () => {
        axios.get(BASE_URL, {httpsAgent: agent})
      }
      setInterval(alive, 600000)
    } catch (err) {
      console.log(err)
    }
  }
}
