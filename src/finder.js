const puppeteer = require('puppeteer');
const { dataUrl, isMainPageUrl } = require('./handler');
const { minimal_args } = require('./utilities');

async function search(query) {
  try {
    const url = 'https://mrcong.com/tim-kiem/'
    const browser = await puppeteer.launch({
      args: minimal_args,
      executablePath: '/usr/bin/chromium'
    });
    const page = await browser.newPage();
 
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
    await page.setDefaultNavigationTimeout(0);

    await page.goto(url);

    await page.type('#gsc-i-id1', query);
    await page.click('#___gcse_0 > div > div > form > table > tbody > tr > td.gsc-search-button > button');
 
    await page.waitForTimeout(1000)

    const linksArr = await page.evaluate( () => {
      try {
        const links = document.querySelectorAll('div.gs-title a.gs-title')
        let arr = []
        for (let i = 0; i < links.length; i++) {
          if (links[i].innerText && links[i].href) {
            arr.push({
              name: links[i].innerText,
              link: links[i].href
             })
           }
        }
        return arr
      } catch (e) {
        return undefined
        console.log(e)
      }
    });

    // await page.screenshot({path: 'test.png', fullPage: true})
    await browser.close();

    const found = (result, reason) => {
      return { result, reason }
    }

    // find best result
    if (linksArr) {
      dataUrl.data = linksArr
      return found(linksArr, 'Success')
    }
    return found(undefined, `Your search <i>${query}</i> did not match any results`)
  } catch (error) {
    console.log(error)
  }
};

module.exports.search = search
