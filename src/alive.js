const BASE_URL = process.env.BASE_URL || false
const { getLink: ping } = require('./api')

console.log(BASE_URL)

const keepAlive = () => {
  const alive = () => {
    const time = new Date()
    const hours = time.getHours(), minutes = time.getMinutes()
    ping(BASE_URL)
    console.log(`Waked up at: ${hours}:${minutes}`)
  }
  setInterval(alive, 1 * 60 * 1000)
}

module.exports = { keepAlive }
