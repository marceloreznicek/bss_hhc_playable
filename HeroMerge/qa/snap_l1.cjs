const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 600));
  // Tap SUMMON ~6 times respecting the 700ms cooldown.
  for (let i = 0; i < 6; i++) {
    await page.click('#btn-summon');
    await new Promise(r => setTimeout(r, 750));
  }
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_l1.png') });
  await browser.close();
})();
