const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 600));
  // Spam-tap for ~3s, then snapshot
  for (let i = 0; i < 8; i++) {
    await page.click('#btn-spawn-hero');
    await new Promise(r => setTimeout(r, 350));
  }
  await page.screenshot({ path: path.join(__dirname, 'screenshots/topdown_l1_combat.png') });
  await browser.close();
})();
