const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { window.STATE.level = 2; window.runLevel3Sequence(); });
  // Wait long enough for dragon to spawn (7.2s after runLevel3Sequence) + buffer
  await new Promise(r => setTimeout(r, 9500));
  // Spam a few hero taps to populate the field
  for (let i = 0; i < 5; i++) { await page.click('#btn-spawn-hero'); await new Promise(r=>setTimeout(r,200)); }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'screenshots/topdown_l3_dragon.png') });
  await browser.close();
})();
