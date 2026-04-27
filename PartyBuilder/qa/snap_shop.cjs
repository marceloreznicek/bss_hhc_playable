// Phase 1 QA — screenshot the shop in 3 states: empty / 1-hired / 3-hired (full party).
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const outDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    defaultViewport: { width: 540, height: 960 }
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(
    'file://' + path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html'),
    { waitUntil: 'networkidle0', timeout: 20000 }
  );
  await new Promise(r => setTimeout(r, 600));

  // 1) empty shop
  await page.screenshot({ path: path.join(outDir, 'phase1_shop_empty.png') });
  console.log('snap empty');

  // 2) hire knight (45g)
  await page.evaluate(() => window.onHire('knight'));
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(outDir, 'phase1_shop_one.png') });
  console.log('snap one-hired');

  // 3) hire 2 more — fill party
  await page.evaluate(() => { window.onHire('lenhador'); window.onHire('squire'); });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(outDir, 'phase1_shop_full.png') });
  console.log('snap full-party');

  // verify state matches
  const state = await page.evaluate(() => ({
    gold: STATE.gold,
    party: STATE.party.slice(),
    goEnabled: !document.getElementById('go-btn').classList.contains('disabled')
  }));
  console.log('state:', JSON.stringify(state));

  await browser.close();
})();
