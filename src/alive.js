const https = require('node:https');
const axios = require('axios');
const BASE_URL = process.env.BASE_URL || false

const agent = new https.Agent({  
  rejectUnauthorized: false
});

console.log(BASE_URL)

const keepAlive = () => {
  try {
    const alive = () => {
      const time = new Date()
      const hours = time.getHours(), minutes = time.getMinutes()
      axios.get(BASE_URL, {httpsAgent: agent})
      console.log(`Waked up at: ${hours}:${minutes}`)
    }
    setInterval(alive, 1 * 60 * 1000)
  } catch (err) {
    console.log(err)
  }
}

if (BASE_URL) keepAlive()
