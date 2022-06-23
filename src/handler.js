const cheerio = require('cheerio');
const urlParse = require('url');
const { exec } = require('node:child_process');
const { getLink } = require('./api');
const { Link } = require('./db')
const IS_DB = process.env.IS_DB || false
const dataUrl = {}

const deleteMessageHandler = async (bot, botMsg) => {
  try {
    const { message_id } = await botMsg
    const msg = await botMsg
    const chatId = msg.chat.id
    bot.deleteMessage(chatId, message_id)
  } catch (err) {
    console.log(err)
  }
}

const grabber = async (bot, chatId, botMsg, baseUrl, start, page) => {
  let totalGrabbed = 0
  let pageNum = start ? start : 1
  let msg
  let toEnd = Number.isNaN(page) ? true : false
 
  if (!IS_DB) return { totalGrabbed, msg: botMsg }

  try {
    var { message_id } = await botMsg
    while (pageNum <= page || toEnd) {
      const url = `${baseUrl}page/${pageNum}/`
      const data = await tagSearch(url)
      if (!data) break
      const res = await scrape(data)
      for (const link of res) {
        totalGrabbed += await insertToDb(link)
      }
      if (!msg) {
        msg = bot.editMessageText(`<i>${totalGrabbed}</i> Data grabbed from page <i>1</i> to <i>${pageNum}</i>`, { chat_id: chatId, message_id, parse_mode: 'HTML' })
      } else {
        var { message_id } = await msg
        msg = bot.editMessageText(`<i>${totalGrabbed}</i> Data grabbed from page <i>1</i> to <i>${pageNum}</i>`, { chat_id: chatId, message_id, parse_mode: 'HTML' })
      }
      pageNum++
    }
    return { totalGrabbed, msg }
  } catch (err) {
    console.log(err)
  }
}

const scrape = async (mainPageUrl) => {
  const terabox = 'a.shortc-button.medium.blue'
  const anonfiles = 'a.shortc-button.medium.black'
  const meganz = 'a.shortc-button.medium.red'
  const mediafire = 'a.shortc-button.medium.green'

  let btnSelector = mediafire
  const titleSelector = 'h1.name.post-title.entry-title'
  const downloadSelector = ($) => {
    const selector = [mediafire, anonfiles, terabox, meganz]
    for (let i = 0; i < selector.length; i++) {
      const check = $(selector[i]).attr('href')
      if (check) {
        btnSelector = selector[i]
        break
      }
    }
  }

  try {
    if (Array.isArray(mainPageUrl)) {
      const arr = []
      for (const element of mainPageUrl) {
        const { data } = await getLink(element.link)
        const $ = cheerio.load(data)
        downloadSelector($)
      
        const isParts = $(btnSelector).length
        const name = $(titleSelector).text()
        const link = $(btnSelector).attr('href')
        
        if (link) {
          if (isParts > 1) {
          const linkNodeList = $(btnSelector)
          const links = []
      
          for (let i = 0; i < isParts; i++) {
            const pageUrl = linkNodeList[i].attribs.href
            const l = isShortlink(pageUrl)
            if (l) {
              const bypassed = await bypass(l)
              links.push(bypassed)
            } else {
              links.push(pageUrl)
            }
          }
          arr.push({ name, link: links })
          } else {
              const l = isShortlink(link)
              if (l) {
                const bypassed = await bypass(l)
                arr.push({ name, link: bypassed })
              } else {
                arr.push({ name, link })
              }
          }
        } else {
          arr.push({ name, link: null })
        }
      }
      return arr
    } else {
      const { data } = await getLink(mainPageUrl)
      const $ = cheerio.load(data)
      downloadSelector($)
      
      const isParts = $(btnSelector).length
      const name = $(titleSelector).text()
      const link = $(btnSelector).attr('href')
      
      if (link) {
        if (isParts > 1) {
          const linkNodeList = $(btnSelector)
          const links = []
      
          for (let i = 0; i < isParts; i++) {
            const pageUrl = linkNodeList[i].attribs.href
            const l = isShortlink(pageUrl)
            if (l) {
              const bypassed = await bypass(l)
              links.push(bypassed)
            } else {
              links.push(pageUrl)
            }
          }
          return { name, link: links }
        } else {
            const l = isShortlink(link)
            if (l) {
              const bypassed = await bypass(l)
              console.log(bypassed)
              return { name, link: bypassed }
            } else {
              return { name, link }
            }
        }
      } else {
         arr.push({ name, link: null })
      }
    }
  } catch (err) {
    console.log(err)
  }
}

////////////////////////// Helper ////////////////////////

const messageBuilder = async (bot, botMsg, context) => {
  const msg = await botMsg
  const chatId = msg.chat.id;
  const { name, link } = context
  let str
  try {
    if (Array.isArray(link)) {
      const rLinks = link.join(`\n\n<b>Another part:</b> `)
      str = `<b>Name:</b> ${name}\n\n<b>Link part 1:</b> ${rLinks}`
      deleteMessageHandler(bot, botMsg)
      bot.sendMessage(chatId, str, opts());
    } else {
      str = `<b>Name:</b> ${name}\n\n<b>Link: </b> ${link}`
      deleteMessageHandler(bot, botMsg)
      bot.sendMessage(chatId, str, opts());
    }
  } catch (err) {
    console.log(err)
  }
}


const tagSearch = async url => {
  try {
    const { data } = await getLink(url)
    dataUrl.page = getPageNumber(url)
    const $ = cheerio.load(data)
    const element = $('h2.post-box-title > a')
    const arr = []
    element.each((index, el) => {
      if ($(el).text() && $(el).attr('href')) {
        arr[index] = { name: $(el).text(), link: $(el).attr('href') }
      }
    })
    return arr 
  } catch(err) {
    console.log(err)
  }
};

const tagSearchHelper = async (bot, botMsg, context) => {
  try {
    const response = await context
    const msg = await botMsg
    const chatId = msg.chat.id
    dataUrl.data = response
    const res = inlineKeyboardBuilder(response)
    const options = opts(true, res[1])
    
    deleteMessageHandler(bot, botMsg)
    bot.sendMessage(chatId, res[0], options)
  } catch (err) {
    console.log(err)
  }
}

const inlineKeyboardBuilder = (data, index=0) => {
  const lastPageRoll = data.length % 5
  const totalPageRoll = data.length - lastPageRoll
  let pageRoll = index + 5
  if (index >= totalPageRoll) pageRoll = data.length
  const str = [], keyboardBuilder = []
  for( i = index; i < pageRoll; i++) {
    str.push(`${i+1}. ${data[i].name}`)
    keyboardBuilder.push({
      text: i+1,
      callback_data: i
    })
  }

  const time = new Date()
  const minutes = time.getMinutes(), seconds = time.getSeconds()

  dataUrl.nextIndex = index+5
  const arr = dataUrl.data
  const { page } = dataUrl
  str.push(`\n<i>${minutes}:${seconds}</i>`)
  const textBuilder = str.join('\n\n')

  if (index >= 5) keyboardBuilder.unshift({ text: '<<', callback_data: 'prev' })
  if (index < arr.length-5)keyboardBuilder.push({ text: '>>', callback_data: index+5 })
  if (index == arr.length-5 && page )keyboardBuilder.push({ text: `Page ${page+1}`, callback_data: 'nextPage' })
  if (index == 0 && page > 1) keyboardBuilder.unshift({ text: `Page ${page-1}`, callback_data: 'prevPage' })

  return [textBuilder, keyboardBuilder]
}

const opts = (isKeyboard=false, query=null) => {
  if (isKeyboard) {
    return {
      "reply_markup":{
        "inline_keyboard": [query]
      },
        "parse_mode": "HTML"
    };
  }
  return { "parse_mode": "HTML"}
}

const insertToDb = async ({ name, link }) => {
  try {
    const check = await Link.isDuplicate(name)
    if (!check) {
      if (isDownloadLink(link)) {
        const db = new Link({ name, link })
        const save = await db.save()
        console.log(save.name)
        return 1
      } else {
        console.log(`${link} is not Downloadable`)
        return 0
      }
    } else {
      console.log(`${name} already inserted`)
      return 0
    }
  } catch (err) {
    console.log(err)
  }
}

const bypass = async (url) => {
  return new Promise( (resolve, reject) => {
    (function antiError(x) {
      exec(`python3 extractor/ouo.py ${url}`, { cwd: __dirname }, (error, stdout) => {
        if (error && x == 1) {
          reject(error)
          return 
        } else if (error && x > 1) {
          antiError(x-1)
        } else {
          const trimed = stdout.trim()
          resolve(trimed)
          return
        }
      })
    })(3)
  })
}

const isMainPageUrl = url => {
  return url.match(/.+(anh\/|videos\/|video\/)$/)
};

const isShortlink = (url) => {
  const { protocol, hostname, pathname } = urlParse.parse(url)
  let result
  switch (hostname) {
    case 'ouo.press':
    case 'ouo.io' :
      let sProtocol = protocol.split(':')[0]
      if (protocol === 'http:') sProtocol+='s'
      result = `${sProtocol}://${hostname}${pathname}`
      break
    default:
      result = false
  }
  return result
}

const isDownloadLink = url => {
  if (Array.isArray(url)) {
    const result = url.map((link) => link.match(/.+(mediafire|anonfiles|terabox|mega).+/))
    return result.every(Boolean)
  }
  return url.match(/.+(mediafire|anonfiles|terabox|mega).+/)
}

const isTagUrl = url => {
  return url.match(/.+(\/tag\/).+/)
}

const getPageNumber = url => {
  const regExp = url.match(/(\/\d\/)$/)
  if (regExp) {
    return Number(regExp[0].split('/')[1])
  }
  return regExp
}

const getTagUrl = (url) => {
  return url.match(/.+(?=page\/\d\/)/)
}

module.exports = { grabber, scrape, dataUrl, isMainPageUrl, isTagUrl, getTagUrl, tagSearch, tagSearchHelper, getPageNumber, inlineKeyboardBuilder, opts ,deleteMessageHandler, messageBuilder };
