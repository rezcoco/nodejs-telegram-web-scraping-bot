const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const browser = require('./index');

exports.ouo = async (url) => {
  try {
    let u = new URL(url);
    if (u.searchParams.get("s")) return decodeURIComponent(u.searchParams.get("s"));
    
    // setting up plugins
  
    pup.use(stl());
  
    // opening browser
    const options = [ '--no-sandbox', '--disable-setuid-sandbox' ];
    const b = await browser.b
    let p = await b.newPage();
    await p.goto(u.href);
    await p.waitForSelector(".btn-main:not(.btn-disabled)");
    await p.setDefaultNavigationTimeout(0)
  
    // eval code sourced from https://github.com/FastForwardTeam/FastForward/blob/main/src/js/injection_script.js#L1095
  
  
    await p.evaluate(function() {
      if (location.pathname.includes("/go") || location.pathname.includes("/fbc")) {
        document.querySelector("form").submit();
      } else {
        if (document.querySelector("form#form-captcha")) {
          let f = document.querySelector("form#form-captcha");
          f.action = "/xreallcygo" + location.pathname;
          f.submit();
        }
      }
    });
  
    await p.waitForSelector('#downloadButton');
    let a = await p.url();
    await p.close();
  
    return a;
  } catch(err) {
    throw err;
  }
}
