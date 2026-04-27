// Verify the L1 → L2 transition fires when all enemies die.
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  page.on('console', m => { if (m.text().startsWith('[wave]')) console.log('captured>', m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,400));

  const pre = await page.evaluate(() => ({
    level: STATE.level,
    enemies: STATE.enemies.length,
    waveTotalCount: window.waveTotalCount,
    waveSpawnedCount: window.waveSpawnedCount,
    waveActive: window.waveActive
  }));
  console.log('pre-clear:', pre);

  // Mass-kill all L1 enemies via the engine's killActor path.
  await page.evaluate(() => {
    STATE.enemies.slice().forEach(e => killActor(e));
  });
  // killActor uses setTimeout(440ms) for the dying animation; wait for transition.
  await new Promise(r => setTimeout(r, 1300));

  const mid = await page.evaluate(() => ({
    level: STATE.level,
    enemies: STATE.enemies.length,
    waveActive: window.waveActive
  }));
  console.log('after kills + 1.3s:', mid);

  // The transition kicks off camera-zoom, then 900ms later swaps level + applyLevelBg(2),
  // then 2000ms later starts L2 wave. Wait a generous 3s.
  await new Promise(r => setTimeout(r, 3000));
  const post = await page.evaluate(() => ({
    level: STATE.level,
    enemies: STATE.enemies.length,
    waveActive: window.waveActive
  }));
  console.log('after +3s more:', post);

  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_l1_clear.png') });
  console.log('errors:', errs.length, errs);
  await browser.close();
})();
