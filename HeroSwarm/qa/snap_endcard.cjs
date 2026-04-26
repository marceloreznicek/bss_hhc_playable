const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,500));
  await page.evaluate(() => document.getElementById('endcard').classList.add('show'));
  await new Promise(r=>setTimeout(r,700));
  await page.screenshot({ path: path.join(__dirname, 'screenshots/topdown_endcard.png') });
  await browser.close();
})();
