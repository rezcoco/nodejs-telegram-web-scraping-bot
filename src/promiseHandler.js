const cheerio = require('cheerio');
const { getLink } = require('./api');
const { writeData } = require('./createData');

const errorHandler = (bot, chatId, opts) => {
  return (err => {
    console.log(err)
    bot.sendMessage(chatId, err.Erorr, opts)
  });
};

const findPromiseHandler = (bot, chatId, opts) => {
  return (url => {
    if (url.result) {
      console.log(`Got: ${url.result}`)
      getLink(url.result)
        .then(scrapePromiseHandler(bot, chatId, opts, url.result))
        .catch(errorHandler(bot, chatId, opts))
    }else {
      bot.sendMessage(chatId, url.reason, opts);
    }
  });
};

const scrapePromiseHandler = (bot, chatId, opts, url) => {
  const mainPageCheck = isMainPageUrl(url)
  const isCreateData = process.env.CREATE_DATA || false
  let str
  if (mainPageCheck) {
    return (response => {
      const html = response.data
      const $ = cheerio.load(html)
    
      const isParts = $('a.shortc-button.medium.green').length
    
      const name = $('h1.name.post-title.entry-title').text()
      const link = $('a.shortc-button.medium.green').attr('href')
      
      if (isParts > 1) {
        const linkNodeList = $('a.shortc-button.medium.green')
        const links = []
    
        for (let i = 0; i < isParts; i++) {
          const pageUrl = linkNodeList[i].attribs.href
          links.push(pageUrl)
        }
        console.log(links)
        toWriteData(name, links, isCreateData)
        const rLinks = links.join(`\n\n<b>Another part:</b> `)
        str = `<b>Name:</b> ${name}\n\n<b>Link part 1:</b> ${rLinks}`
        bot.sendMessage(chatId, str, opts);
      }else {
        console.log(link)
        toWriteData(name, link, isCreateData)
        str = `<b>Name:</b> ${name}\n\n<b>Link:</b> ${link}`
        bot.sendMessage(chatId, str, opts);
      }
    })
  }else {
    str = `${url} is not main page`
    bot.sendMessage(chatId, str, opts);
  }
};

const isMainPageUrl = url => {
  return url.match(/.+(anh\/|videos\/|video\/)$/i)
};

const toWriteData = (name, link, isCreateData) => {
  if (isCreateData) {
   return writeData({name, link})
  }
  return
}

module.exports = { scrapePromiseHandler, findPromiseHandler, errorHandler, isMainPageUrl };
