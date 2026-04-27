// HeroMerge — verify swap-on-drop for different-tier and same-tier-no-partner cases.
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 400));

  const cellRect = (idx) => page.evaluate((i) => {
    const c = document.querySelector('.grid-cell[data-idx="' + i + '"]');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, idx);
  const drag = async (fromIdx, toIdx) => {
    const a = await cellRect(fromIdx), b = await cellRect(toIdx);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8);
      await new Promise(r => setTimeout(r, 25));
    }
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 250));
  };

  // CASE 1 — different tiers swap (T1 at 0, T3 at 5).
  await page.evaluate(() => {
    for (let i = 0; i < STATE.grid.length; i++) STATE.grid[i] = null;
    STATE.grid[0] = { tier: 1 };
    STATE.grid[5] = { tier: 3 };
    renderGrid();
  });
  await drag(0, 5);
  let after = await page.evaluate(() => ({ grid: STATE.grid.map(c => c && c.tier), merges: STATE.mergesCompleted }));
  console.log('case 1 (different tiers swap):', after);

  // CASE 2 — same tier, NO adjacent partner → swap (T2 at 0 alone, T2 at 7 alone).
  await page.evaluate(() => {
    for (let i = 0; i < STATE.grid.length; i++) STATE.grid[i] = null;
    STATE.grid[0] = { tier: 2 };
    STATE.grid[7] = { tier: 2 };
    renderGrid();
  });
  const beforeMerges2 = await page.evaluate(() => STATE.mergesCompleted);
  await drag(0, 7);
  after = await page.evaluate(() => ({ grid: STATE.grid.map(c => c && c.tier), mergesDelta: STATE.mergesCompleted - 0 }));
  const post2Merges = await page.evaluate(() => STATE.mergesCompleted);
  console.log('case 2 (same tier no partner → swap):', after, 'merges?', post2Merges - beforeMerges2);

  // CASE 3 — regression: 3-of-a-kind still merges (T1 at 0/1/2 → drag 2 onto 1).
  await page.evaluate(() => {
    for (let i = 0; i < STATE.grid.length; i++) STATE.grid[i] = null;
    STATE.grid[0] = { tier: 1 };
    STATE.grid[1] = { tier: 1 };
    STATE.grid[2] = { tier: 1 };
    renderGrid();
  });
  const beforeMerges3 = await page.evaluate(() => STATE.mergesCompleted);
  await drag(2, 1);
  after = await page.evaluate(() => ({ grid: STATE.grid.map(c => c && c.tier) }));
  const post3Merges = await page.evaluate(() => STATE.mergesCompleted);
  console.log('case 3 (3-of-a-kind regression):', after, 'merges?', post3Merges - beforeMerges3);

  console.log('errors:', errs.length, errs);
  await browser.close();
})();
