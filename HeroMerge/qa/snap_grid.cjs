// HeroMerge v0.3 — 3-of-a-kind merge with adjacency + over-consume guard.
// Tests:
//   (a) 4 Tier-1s in cells 0,1,2,3 (top row, all adjacent neighbours).
//       Drag cell 3 onto cell 1 → cluster = [3,1,0]  (drop 1, partner 0).
//       Expected: cells 0+3 empty, cell 1 = Tier-2, cell 2 still Tier-1
//       (4th unit untouched — exactly 3 consumed, 1 left).
//   (b) BATTLE deploys remaining grid (1× Tier-2 + 1× Tier-1 → 2 units on field).
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 400));

  // Force-fill cells 0..3 with Tier-1 directly (skip 700 ms cooldown × 4).
  await page.evaluate(() => {
    for (let i = 0; i < 4; i++) STATE.grid[i] = { tier: 1 };
    renderGrid();
  });
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v3_filled.png') });

  // Drag cell 3 onto cell 1.
  const cellRect = (idx) => page.evaluate((i) => {
    const c = document.querySelector('.grid-cell[data-idx="' + i + '"]');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, idx);
  const a = await cellRect(3);
  const b = await cellRect(1);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  // Step the mouse so updatePullPreview runs and the .pulling cluster paints.
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(a.x + (b.x - a.x) * i / 10, a.y + (b.y - a.y) * i / 10);
    await new Promise(r => setTimeout(r, 30));
  }
  // Snapshot mid-drag to verify pulling cluster + ghost-under-finger.
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v3_pulling.png') });
  const midDrag = await page.evaluate(() => ({
    pulling: Array.from(document.querySelectorAll('.grid-cell.pulling')).map(c => parseInt(c.dataset.idx, 10)).sort(),
    ghostShown: document.getElementById('drag-ghost').classList.contains('show'),
    ghostLeft: parseFloat(document.getElementById('drag-ghost').style.left),
    ghostTop:  parseFloat(document.getElementById('drag-ghost').style.top)
  }));
  console.log('mid-drag:', midDrag);

  await page.mouse.up();
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_v3_merged.png') });

  const post = await page.evaluate(() => ({
    grid: STATE.grid.map(c => c && c.tier),
    merges: STATE.mergesCompleted
  }));
  console.log('post-merge:', post);

  // Tap BATTLE → grid units deploy onto the field.
  await page.click('#btn-battle');
  await new Promise(r => setTimeout(r, 600));
  const battle = await page.evaluate(() => ({
    grid: STATE.grid.map(c => c && c.tier),
    unitsByTier: STATE.units.reduce((acc,u)=>{ acc[u.tier]=(acc[u.tier]||0)+1; return acc; }, {})
  }));
  console.log('after BATTLE:', battle);

  console.log('errors:', errs.length, errs);
  await browser.close();
})();
