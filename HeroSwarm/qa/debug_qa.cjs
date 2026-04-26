const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 600));

  const start = Date.now();
  while (Date.now() - start < 30000) {
    try { await page.click('#btn-spawn-hero', { timeout: 500 }); } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
    const snap = await page.evaluate(() => ({
      t: Math.round((window.performance.now()/1000)*10)/10,
      kills: window.STATE?.kills,
      enemies: (window.STATE?.enemies || []).map(e => ({ type: e.type, hp: e.hp, state: e.state, target: e.target?.id || null, x: Math.round(e.x), y: Math.round(e.y) })),
      units: (window.STATE?.units || []).length,
      tacklingPlayers: (window.STATE?.units || []).filter(u => u.state === 'tackling').length,
      walkingPlayers:  (window.STATE?.units || []).filter(u => u.state === 'walking').length,
      // sample of player target ids
      sampleTargets: (window.STATE?.units || []).slice(0, 6).map(u => ({ state: u.state, target: u.target?.type || 'none', d: u.target ? Math.round(Math.hypot(u.target.x - u.x, u.target.y - u.y)) : -1 })),
    }));
    console.log(JSON.stringify(snap));
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
