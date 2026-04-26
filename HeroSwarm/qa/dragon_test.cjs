const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,400));
  // Jump straight to L3 (skip L1+L2 normal flow)
  await page.evaluate(() => { STATE.level = 2; runLevel3Sequence(); });
  // Spam-tap hero throughout. Hero is fragile so dragon should land kills fast.
  const tapInterval = setInterval(async () => {
    try { await page.click('#btn-spawn-hero', { timeout: 200 }); } catch (e) {}
  }, 200);
  await new Promise(r=>setTimeout(r, 9000));
  // Snapshot mid-fight
  const mid = await page.evaluate(() => ({
    enemies: (STATE?.enemies || []).map(e => ({ type: e.type, hp: e.hp, state: e.state })),
    unitCount: (STATE?.units || []).length,
    dragonKills: STATE?.dragonKillCount,
    failed: STATE?.failed,
  }));
  console.log('MID:', JSON.stringify(mid, null, 2));
  await page.screenshot({ path: 'screenshots/dragon_uber_mid.png' });

  // Wait long enough for dragon to rack up 10 kills (or get killed)
  await new Promise(r=>setTimeout(r, 22000));
  const end = await page.evaluate(() => ({
    failed: STATE?.failed,
    failVisible: getComputedStyle(document.getElementById('fail-screen')).display,
    endcardVisible: getComputedStyle(document.getElementById('endcard')).display,
    dragonHP: (STATE?.enemies || []).find(e => e.type === 'dragon')?.hp,
    dragonKills: STATE?.dragonKillCount,
  }));
  console.log('END:', JSON.stringify(end, null, 2));
  await page.screenshot({ path: 'screenshots/dragon_uber_end.png' });
  console.log('errors:', errs);
  clearInterval(tapInterval);
  await browser.close();
})();
