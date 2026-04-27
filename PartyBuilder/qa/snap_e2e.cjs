// QA — full E2E walkthrough through the 3-mission Hire → Fight loop.
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

  const shot = (name) => page.screenshot({ path: path.join(outDir, 'e2e_' + name + '.png') });

  async function waitForPhase(phase, attempts) {
    for (let i = 0; i < (attempts || 40); i++) {
      await new Promise(r => setTimeout(r, 500));
      const cur = await page.evaluate(() => STATE.phase);
      if (cur === phase) return true;
    }
    return false;
  }
  async function waitForGameInactive(attempts) {
    for (let i = 0; i < (attempts || 40); i++) {
      await new Promise(r => setTimeout(r, 500));
      const active = await page.evaluate(() => STATE.gameActive);
      if (!active) return true;
    }
    return false;
  }
  async function hireParty(picks) {
    await page.evaluate((picks) => {
      picks.forEach((k) => window.onHire(k));
    }, picks);
  }

  // === WAVE 1 ===
  await shot('01_shop_w1');
  console.log('• shop wave 1');

  await hireParty(['knight', 'hunter', 'lenhador']); // 45 + 35 + 25 = 105 — over 100 by 5; try alt
  // If above failed, fall back to cheap trio:
  let party = await page.evaluate(() => STATE.party);
  if (party.length < 3) {
    await page.evaluate(() => { STATE.party = []; STATE.gold = 100; });
    await hireParty(['lenhador', 'squire', 'hunter']); // 25 + 30 + 35 = 90
  }
  await new Promise(r => setTimeout(r, 200));
  await shot('02_w1_party');
  console.log('• wave 1 party hired');

  await page.evaluate(() => window.onGo());
  await new Promise(r => setTimeout(r, 2500));
  await shot('03_w1_combat');
  console.log('• wave 1 combat');

  await waitForGameInactive();
  await shot('04_w1_banner');
  console.log('• wave 1 banner');

  // === WAVE 2 ===
  await waitForPhase('shop');
  await new Promise(r => setTimeout(r, 400));
  await shot('05_shop_w2');
  console.log('• shop wave 2');

  await hireParty(['paladin', 'knight']); // 70 + 45 = 115 (over budget if fresh-priced; try smaller)
  party = await page.evaluate(() => STATE.party);
  if (party.length < 2) {
    await page.evaluate(() => { STATE.party = []; STATE.gold = 110; });
    await hireParty(['knight', 'mage']); // 45 + 60 = 105
  }
  await new Promise(r => setTimeout(r, 200));
  await shot('06_w2_party');
  console.log('• wave 2 party hired');

  await page.evaluate(() => window.onGo());
  await new Promise(r => setTimeout(r, 3000));
  await shot('07_w2_combat');
  console.log('• wave 2 combat');

  await waitForGameInactive();
  await shot('08_w2_banner');
  console.log('• wave 2 banner');

  // === WAVE 3 ===
  const reached = await waitForPhase('shop', 40);
  if (reached) {
    await new Promise(r => setTimeout(r, 400));
    await shot('09_shop_w3');
    console.log('• shop wave 3');

    await hireParty(['paladin', 'mage']);
    party = await page.evaluate(() => STATE.party);
    if (party.length < 2) {
      await page.evaluate(() => { STATE.party = []; STATE.gold = 110; });
      await hireParty(['knight', 'paladin']);
    }
    await new Promise(r => setTimeout(r, 200));
    await shot('10_w3_party');
    console.log('• wave 3 party hired');

    await page.evaluate(() => window.onGo());
    await new Promise(r => setTimeout(r, 3000));
    await shot('11_w3_combat');
    console.log('• wave 3 combat (demon lord)');

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const phase = await page.evaluate(() => STATE.phase);
      if (phase === 'cta') break;
    }
    await new Promise(r => setTimeout(r, 600));
    await shot('12_endcard');
    console.log('• endcard');
  }

  const endState = await page.evaluate(() => ({
    phase: STATE.phase,
    mission: STATE.mission,
    tired: Object.keys(STATE.tiredSet)
  }));
  console.log('end-state:', JSON.stringify(endState));

  await browser.close();
})();
