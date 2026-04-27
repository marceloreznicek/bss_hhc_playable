// Phase 2 QA — drive shop → mission, screenshot mid-combat AND end banner.
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
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.goto(
    'file://' + path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html'),
    { waitUntil: 'networkidle0', timeout: 20000 }
  );
  await new Promise(r => setTimeout(r, 600));

  // hire a balanced strong-ish party (knight + lumberjack + squire = 100g, fits budget)
  await page.evaluate(() => {
    window.onHire('knight');
    window.onHire('lenhador');
    window.onHire('squire');
    window.onGo();
  });

  // mid-combat: wait until enemies are engaged
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(outDir, 'phase2_combat_mid.png') });
  console.log('snap mid-combat (wave 1 engaged)');

  // wait through wave 2 + brute
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: path.join(outDir, 'phase2_combat_wave2.png') });
  console.log('snap wave2');

  // poll for end (max ~25s)
  let ended = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const active = await page.evaluate(() => STATE.gameActive);
    if (!active) { ended = true; break; }
  }
  await page.screenshot({ path: path.join(outDir, 'phase2_combat_end.png') });
  const endState = await page.evaluate(() => ({
    gameActive: STATE.gameActive,
    aliveUnits: STATE.units.filter(u => !u.dead).length,
    aliveEnemies: STATE.enemies.filter(e => !e.dead).length,
    bannerKind: document.getElementById('banner').className
  }));
  console.log('end-state:', JSON.stringify(endState), 'ended:', ended);

  await browser.close();
})();
