// Mobile-resolution screenshots at 390×844 (iPhone 14 Pro / 15) to validate sprite size + readability.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const outDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(
    'file://' + path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html'),
    { waitUntil: 'networkidle0', timeout: 20000 }
  );
  await new Promise(r => setTimeout(r, 600));
  const shot = (n) => page.screenshot({ path: path.join(outDir, 'mobile_' + n + '.png') });

  await shot('1_intro');
  await page.evaluate(() => window.dismissIntro());
  await new Promise(r => setTimeout(r, 300));
  await shot('2_shop');

  await page.evaluate(() => {
    window.onHire('lenhador');
    window.onHire('squire');
    window.onHire('hunter');
    window.onGo();
  });

  // wave 1 mid
  await new Promise(r => setTimeout(r, 2500));
  await shot('3_m1_wave1');

  // wave 2 mid
  await new Promise(r => setTimeout(r, 7500));
  await shot('4_m1_wave2');

  // wait for defeat banner
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 500));
    const active = await page.evaluate(() => STATE.gameActive);
    if (!active) break;
  }
  await shot('5_m1_defeat');

  // wait for tired shop
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 500));
    const phase = await page.evaluate(() => STATE.phase);
    if (phase === 'shop') break;
  }
  await new Promise(r => setTimeout(r, 300));
  await shot('6_shop_tired');

  // M2 demon lord run (faster path: hire fresh strong + advance)
  await page.evaluate(() => {
    window.onHire('knight');
    window.onHire('hunter');
    window.onHire('squire');
    window.onGo();
  });

  // wave 1
  await new Promise(r => setTimeout(r, 2500));
  await shot('7_m2_wave1');

  // wave 3 (demon lord) — delay 14s
  await new Promise(r => setTimeout(r, 13500));
  await shot('8_m2_demonlord');

  // endcard
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const phase = await page.evaluate(() => STATE.phase);
    if (phase === 'cta') break;
  }
  await new Promise(r => setTimeout(r, 400));
  await shot('9_endcard');

  console.log('done');
  await browser.close();
})();
