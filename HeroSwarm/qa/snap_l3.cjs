const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(() => { STATE.level = 2; runLevel3Sequence(); });
  await new Promise(r=>setTimeout(r, 3500));
  const enemyCount = await page.evaluate(() => STATE.enemies.length);
  console.log('L3 enemies pre-placed:', enemyCount);
  await page.screenshot({ path: path.join(__dirname, 'screenshots/topdown_l3_start.png') });
  await browser.close();
})();
