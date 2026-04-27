// HeroMerge — drag-merge validation. Summons several recruits, then drags one
// onto the cluster centroid to trigger the magnetic merge into a tier-2 unit.
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

  // Controlled scenario: clear enemies + cooldown, then spawn 4 recruits in a tight cluster
  // so the drag-merge mechanic can be tested without combat interference.
  await page.evaluate(() => {
    STATE.enemies.forEach(e => { e.dead = true; if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); });
    STATE.enemies.length = 0;
    STATE.cooldownUntil.summon = 0;
    for (let i = 0; i < 4; i++) {
      const x = 540 + (i % 2) * 80 - 40;
      const y = 555 + Math.floor(i / 2) * 80 - 40;
      const a = createActor('hero', MERGE_UNIT_TYPES, x, y);
      STATE.units.push(a);
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Pre-merge snapshot
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_pre.png') });

  // Read first two units' positions in game coords + #game's bounding rect.
  const probe = await page.evaluate(() => {
    const game = document.getElementById('game');
    const rect = game.getBoundingClientRect();
    const sx = rect.width / 1080;
    const sy = rect.height / 1920;
    const us = STATE.units.filter(u => !u.dead && u.tier === 1);
    if (us.length < 2) return { ok: false, count: us.length };
    const a = us[0], b = us[1];
    const battleTop = 120; // master HTML offset
    return {
      ok: true,
      total: STATE.units.length,
      tier1: us.length,
      // Convert game coords (lane-local) → screen coords for puppeteer.mouse
      ax: rect.left + a.x * sx,
      ay: rect.top + (a.y + battleTop) * sy,
      bx: rect.left + b.x * sx,
      by: rect.top + (b.y + battleTop) * sy
    };
  });
  console.log('probe:', probe);

  if (probe.ok) {
    // Drag unit A onto unit B's location.
    await page.mouse.move(probe.ax, probe.ay);
    await page.mouse.down();
    // Animate the move across multiple steps so magnetic pull can engage.
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await page.mouse.move(probe.ax + (probe.bx - probe.ax) * t, probe.ay + (probe.by - probe.ay) * t);
      await new Promise(r => setTimeout(r, 25));
    }
    await new Promise(r => setTimeout(r, 200));
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 700));
  }

  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_post.png') });

  const post = await page.evaluate(() => ({
    total: STATE.units.length,
    byTier: STATE.units.reduce((acc,u)=>{ acc[u.tier]=(acc[u.tier]||0)+1; return acc; }, {}),
    merges: STATE.mergesCompleted
  }));
  console.log('post:', post);
  console.log('errors:', errs.length, errs);
  await browser.close();
})();
