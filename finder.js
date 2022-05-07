const puppeteer = require('puppeteer');
const { isMainPageUrl } = require('./promiseHandler');

async function search(query) {
  try {
    const url = 'https://mrcong.com/tim-kiem/'
    const minimal_args = [
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
    ];
    const blocked_domains = [
      'googlesyndication.com',
      'adservice.google.com',
    ];

    const browser = await puppeteer.launch({
      args: minimal_args,
      executablePath: '/usr/bin/chromium'
    });
    const page = await browser.newPage();
    
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url()
      if (blocked_domains.some(domain => url.includes(domain))) {
        request.abort();
      } else {
        request.continue();
      }
    })
 
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
    await page.setDefaultNavigationTimeout(0);

    await page.goto(url);

    await page.type('#gsc-i-id1', query);
    await page.click('#___gcse_0 > div > div > form > table > tbody > tr > td.gsc-search-button > button');

    await page.waitForTimeout(3000)

    const linksArr = await page.evaluate( () => {
      const links = document.querySelectorAll('div.gs-title a.gs-title')
      let arr = []
     
      for (let i = 0; i < 5; i++) {
        arr.push({
          name: links[i].innerText,
          link: links[i].href
        })
      }
      return arr
    });

    // await page.screenshot({path: 'test.png', fullPage: true})
    await browser.close();

    const found = (result, reason) => {
      return { result, reason }
    }

    // find best result
    if (linksArr) {
      const args = query.split(' ')
      let linkResult
      for (let i = 0; i < linksArr.length; i++) {
    
        const linkText = linksArr[i].name
        const pageUrl = linksArr[i].link
        const isTrue = []
    
        for (let j = 0; j < args.length; j++) {
          const strRegEx = `${args[j]}`
          const newRegEx = new RegExp(strRegEx, "i")
          
          const isFound = linkText.search(newRegEx)
          if (isFound !== -1) {
            isTrue.push(pageUrl)  
          } else {
            isTrue.push(undefined)
          }
        }
        if (isTrue.every(Boolean)) {
          linkResult = isTrue[i]

          if (isMainPageUrl(linkResult)) {
            return found(linkResult, "Success")
          } else {
            return found(undefined, "Failed to get main page url")
          }
        }
      }
      return found(undefined, `${query} is Not Found`)
    }
    return found(undefined, `Can't find ${query}`)
  } catch (error) {
    console.log(error)
  }
};

module.exports.search = search
