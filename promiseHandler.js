const cheerio = require('cheerio');
const { getLink } = require('./api');

const errorHandler = (bot, chatId, opts) => {
  return (err => {
    console.log(err)
    bot.sendMessage(chatId, err.Erorr, opts)
  });
};

const findPromiseHandler = (bot, chatId, opts) => {
  return (url => {
    console.log(`Got: ${url.result}`)
    if (url.result) {
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
        const rLinks = links.join(`\n\n<b>Another part:</b> `)
        str = `<b>Name:</b> ${name}\n\n<b>Link part 1:</b> ${rLinks}`
        bot.sendMessage(chatId, str, opts);
      }else {
        console.log(link)
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

module.exports = { scrapePromiseHandler, findPromiseHandler, errorHandler, isMainPageUrl };
