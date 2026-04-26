const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,400));
  // Force-unlock Ogre + Knight so we can spam beefy units that survive in tackle state.
  await page.evaluate(() => { unlockUnit('ogre'); unlockUnit('knight'); });
  const start = Date.now();
  while (Date.now() - start < 12000) {
    try { await page.click('#btn-spawn-hero',  {timeout:300}); } catch(e){}
    try { await page.click('#btn-spawn-ogre',  {timeout:300}); } catch(e){}
    try { await page.click('#btn-spawn-knight',{timeout:300}); } catch(e){}
    await new Promise(r=>setTimeout(r,200));
  }
  await page.screenshot({ path: path.join(__dirname, 'screenshots/topdown_combat_lunge.png') });
  // Snapshot tackle state
  const s = await page.evaluate(() => {
    const u = STATE.units.find(x => x.state === 'tackling');
    if (!u) return { tacklers: 0 };
    const t = u.target;
    return {
      tacklers: STATE.units.filter(x => x.state === 'tackling').length,
      sampleDistance: t ? Math.round(Math.hypot(t.x - u.x, t.y - u.y)) : null,
      sampleSumRadii: t ? Math.round(u.r + t.r) : null,
      sampleGap: t ? Math.round(Math.hypot(t.x - u.x, t.y - u.y) - u.r - t.r) : null,
      lungeX: u.el.style.getPropertyValue('--lunge-x'),
      lungeY: u.el.style.getPropertyValue('--lunge-y'),
    };
  });
  console.log(JSON.stringify(s, null, 2));
  await browser.close();
})();
