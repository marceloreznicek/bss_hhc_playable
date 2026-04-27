// Phase 4 QA — drive a guaranteed Mission-1 loss, hire a Mission-2 strong party,
// screenshot Demon Lord engagement and final CTA endcard.
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

  // Mission 1: lose with a single weak hero
  await page.evaluate(() => { window.onHire('lenhador'); window.onGo(); });

  // Wait for return-to-shop
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const phase = await page.evaluate(() => STATE.phase);
    if (phase === 'shop') break;
  }
  await new Promise(r => setTimeout(r, 200));

  // Mission 2: hire a strong fresh party (no tired heroes used)
  // gold = 110. Mage (60) + Knight (45) = 105 → 5 left. Or Knight + Hunter + Squire = 110.
  await page.evaluate(() => {
    window.onHire('knight');   // 45
    window.onHire('hunter');   // 35
    window.onHire('squire');   // 30 → total 110
    window.onGo();
  });

  // Wait for demonlord wave (delay 9.5s) + engagement
  await new Promise(r => setTimeout(r, 11000));
  await page.screenshot({ path: path.join(outDir, 'phase4_demonlord.png') });
  console.log('snap demonlord engaged');

  // Wait for end + CTA
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const phase = await page.evaluate(() => STATE.phase);
    if (phase === 'cta') break;
  }
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, 'phase4_endcard.png') });
  const phase = await page.evaluate(() => STATE.phase);
  console.log('final phase:', phase);

  await browser.close();
})();
