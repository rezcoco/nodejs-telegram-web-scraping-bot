const express = require('express');
const axios = require('axios');
const withDNS = require('axios-with-dns');
const cheerio = require('cheerio');
const fs = require('fs')
const app = express()

const url = 'https://mrcong.com/youmi-vol-753-zhu-ke-er-flora-86-anh/'

const PORT = 8000
withDNS(axios);

const get = (args) => {
  return app.get('/', (req, res) => {
    res.send(args)
  })
}

axios.get(url, {dnsServer: '1.1.1.1'})
  .then( async response => {
    const html = await response.data
    const $ = cheerio.load(html)
    const name = $('#the-post > div > h1 > span').text()
    const link = $('#fukie2 > p:nth-child(4) > a').attr('href')

    fs.readFile('./data.json', 'utf-8', (err, data) => {
      if (err) console.log(err)

      const scrapedData = { name, link }
      const readed = JSON.parse(data)

      // check duplicate data
      for (let i = 0; i < readed.length; i++) {
        if (name === readed[i].name) {
          console.log('data already written')
          get(readed)
          return
        }
      }
      // added to json
      readed.push(scrapedData)

      // write data
      fs.writeFile('./data.json', JSON.stringify(readed), err => {
        if (err) console.log(err)

        console.log("Written")
        get(readed)
      })

    })

  }).catch( e => console.log(e))
app.listen(PORT, () => console.log(`Server running at ${PORT}`))