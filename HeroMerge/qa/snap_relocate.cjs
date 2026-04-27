// HeroMerge v0.4 — verify cell relocation (drag filled cell onto empty cell)
// AND no-cooldown SUMMON (rapid taps fill grid).
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 400));

  // Rapid SUMMON taps with NO delays — used to be 4× 750 ms = 3 s; v0.4 should be near-instant.
  const t0 = Date.now();
  for (let i = 0; i < 4; i++) await page.click('#btn-summon');
  const elapsed = Date.now() - t0;
  const afterSummons = await page.evaluate(() => ({
    grid: STATE.grid.map(c => c && c.tier),
    elapsed: 'see js'
  }));
  console.log('after rapid 4 summons (' + elapsed + 'ms wall):', afterSummons);

  // Force-place a single Tier-2 in cell 0 to test pure relocation (no merge).
  await page.evaluate(() => {
    for (let i = 0; i < STATE.grid.length; i++) STATE.grid[i] = null;
    STATE.grid[0] = { tier: 2 };
    renderGrid();
  });
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v4_relocate_pre.png') });

  // Drag cell 0 to cell 7 (empty).
  const cellRect = (idx) => page.evaluate((i) => {
    const c = document.querySelector('.grid-cell[data-idx="' + i + '"]');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, idx);
  const a = await cellRect(0);
  const b = await cellRect(7);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8);
    await new Promise(r => setTimeout(r, 30));
  }
  // Snapshot mid-drag — confirm ghost is ABOVE the finger (translate offset -110px).
  const ghost = await page.evaluate(() => ({
    show: document.getElementById('drag-ghost').classList.contains('show'),
    left: parseFloat(document.getElementById('drag-ghost').style.left),
    top:  parseFloat(document.getElementById('drag-ghost').style.top),
    tx: getComputedStyle(document.getElementById('drag-ghost')).transform
  }));
  console.log('ghost mid-drag:', ghost);
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v4_relocate_mid.png') });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 200));

  const post = await page.evaluate(() => ({
    grid: STATE.grid.map(c => c && c.tier),
    merges: STATE.mergesCompleted
  }));
  console.log('after relocate:', post);
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v4_relocate_post.png') });

  console.log('errors:', errs.length, errs);
  await browser.close();
})();
