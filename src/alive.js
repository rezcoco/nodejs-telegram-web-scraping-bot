const { getLink: ping } = require('./api')

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
