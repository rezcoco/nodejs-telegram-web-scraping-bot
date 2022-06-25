require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');
const app = require('express')();
const puppeteer = require('puppeteer');
const token = process.env.TOKEN
const PORT = process.env.PORT || 8000
const IS_DB = process.env.IS_DB || false
const BASE_URL = process.env.BASE_URL || false
const { isTagUrl, getTagUrl, isMainPageUrl, getPageNumber, inlineKeyboardBuilder, opts, messageBuilder, deleteMessageHandler, tagSearch, tagSearchHelper, scrape, dataUrl, grabber } = require('./handler');
const { tag, minimal_args } = require('./utilities')
const { search } = require('./finder');
const { keepAlive } = require('./alive')
const { getLink } = require('./api');
const { main, Link } = require('./db')

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const htmlParse = { parse_mode: 'HTML' }
// puppeteer
const b = puppeteer.launch({ headless: true, args: minimal_args })
b.then(() => console.log('Puppeteer launched')).catch(e => console.log(e))
  
if (IS_DB) main()
if (BASE_URL) keepAlive(BASE_URL)

// Matches "/find [whatever]"
const findHandler = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const resp = match[1];
  
    const botMsg = bot.sendMessage(chatId, `<b>Finding:</b> <i>${resp}</i>`, htmlParse);
    const { result, reason } = await search(resp)
    if (result) {
      const keyboardBuild = inlineKeyboardBuilder(result)
      deleteMessageHandler(bot, botMsg)
      bot.sendMessage(chatId, keyboardBuild[0], opts(true, keyboardBuild[1]));
    } else {
      deleteMessageHandler(bot, botMsg)
      bot.sendMessage(chatId, reason, opts());
    }
  } catch (err) {
    console.log(err)
  }
}

const tagHandler = async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  const botMsg = bot.sendMessage(chatId, `Getting data of <i>${resp}</i>`, htmlParse)
    
  try {
    const isFound = []
    for (const element of tag) {
      if (element.name.toLowerCase() == resp.toLowerCase()) {
        isFound.push(true)
        dataUrl.url = element.link
        const addPage = getPageNumber(element.link) ? element.link : `${element.link}page/1/`
        const response = tagSearch(addPage)
        tagSearchHelper(bot, botMsg, response)
      } else {
        isFound.push(undefined)
      }
    }
    const { message_id } = await botMsg
    if (isFound.every( (isFalse) => !isFalse )) bot.editMessageText('Not Found', { chat_id: chatId, message_id })
  } catch (err) {
    console.log(err)
  }
}

const scrapeHandler = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const resp = match[1]
  
    const botMsg = bot.sendMessage(chatId, `<b>Scraping:</b> <i>${resp}</i>`, htmlParse);
  
    const res = await scrape(resp)
    messageBuilder(bot, botMsg, res)
  } catch (err) {
    console.log(err)
  }
}

const grabHandler = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const resp = match[1];
    const regExp = resp.match(/start\s\d+/)
    const start = regExp ? Number(regExp[0].split(' ')[1]) : null
    const page = Number(resp.split(' page ')[1])
    const query = resp.split(' ')[0]
    
    const botMsg = bot.sendMessage(chatId, `<b>Grabbing:</b> ${query}`, htmlParse)

    const isFound = []
    for (const element of tag) {
      if (element.name.toLowerCase() == query.toLowerCase()) {
        isFound.push(true)
        const { totalGrabbed, msg: grbMsg } = await grabber(bot, chatId, botMsg, element.link, start, page)
        const { message_id } = await grbMsg
        if (totalGrabbed == 0) return bot.editMessageText(`Done, <i>${totalGrabbed}</i> Data grabbed. All data already inserted`, { chat_id: chatId, message_id, parse_mode: 'HTML' })
        bot.editMessageText(`Done, <i>${totalGrabbed}</i> Data grabbed`, { chat_id: chatId, message_id, parse_mode: 'HTML' })
      } else isFound.push(undefined)
    }
    if (isFound.every( (isFalse) => !isFalse) ) bot.sendMessage(chatId, `Can't grab ${query}/not found`, htmlParse)
  } catch (err) {
    console.log(err)
  }
}

const callbackQueryHandler = async callbackQuery => {
  try {
    const chatId = callbackQuery.message.chat.id
    const { message_id } = callbackQuery.message
    const query = callbackQuery.data
    const { data, nextIndex } = dataUrl
  
    // Next button
    if (query == nextIndex) {
      const keyboardBuild = inlineKeyboardBuilder(data, nextIndex)
      const { reply_markup, parse_mode } = opts(true, keyboardBuild[1])
      bot.editMessageText(keyboardBuild[0], { chat_id: chatId, message_id, reply_markup, parse_mode })
      
    } else if (query == 'prev') { // prev button
      const keyboardBuild = inlineKeyboardBuilder(data, nextIndex - 10)
      const { reply_markup, parse_mode } = opts(true, keyboardBuild[1])
      bot.editMessageText(keyboardBuild[0], { chat_id: chatId, message_id, reply_markup, parse_mode })
  
    } else if (query == 'nextPage') {
      const { url, page } = dataUrl
      const notPage = getTagUrl(url)[0]
      const link = `${notPage}page/${page+1}/`
      
      bot.deleteMessage(chatId, message_id)
      const botMsg = bot.sendMessage(chatId, '<i>Getting next page...</i>', htmlParse)
      const response = tagSearch(link)
      tagSearchHelper(bot, botMsg, response)
      
    } else if (query == 'prevPage') {
      const { url, page } = dataUrl
      const notPage = getTagUrl(url)[0]
      const link = `${notPage}page/${page-1}/`
      
      bot.deleteMessage(chatId, message_id)
      const botMsg = bot.sendMessage(chatId, '<i>Getting previous page...</i>', htmlParse)
      const response = tagSearch(link)
      tagSearchHelper(bot, botMsg, response)
      
    } else {
      bot.deleteMessage(chatId, message_id)
      const botMsg = bot.sendMessage(chatId, '<i>Getting link...</i>', htmlParse)
    
      if (isMainPageUrl(data[query].link)) {
        const response  = await scrape(data[query].link)
        messageBuilder(bot, botMsg, response )
        
      } else if (isTagUrl(data[query].link)) {
        const addPage = getPageNumber(data[query].link) ? data[query].link : `${data[query].link}page/1/`
        dataUrl.url = addPage
        const response = tagSearch(addPage)
        tagSearchHelper(bot, botMsg, response)
        
      } else {
        bot.sendMessage(chatId, '<b>Can\'t continue to find</b>', htmlParse)
      }
    }
  } catch (err) {
    console.log(err)
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.log(error);  // => 'EFATAL'
});
bot.on('error', (error) => {
  console.log(error.code);  // => 'EFATAL'
});

// Server
app.get('/', (req, res) => {
  Link.find((err, docs) => {
    if (err) throw err
    res.json(docs)
  )}
})
app.listen(PORT, () => {
  console.log(`Server listening to port: ${PORT}`)
})

bot.onText(/\/find (.+)/, findHandler)
bot.onText(/\/grab (.+)/, grabHandler)
bot.onText(/\/tag (.+)/, tagHandler)
bot.onText(/\/scrape (.+)/, scrapeHandler)
bot.on('callback_query', callbackQueryHandler)

module.exports.b = b
