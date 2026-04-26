const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,300));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,300));

  // Wave 1 enemy count check
  const l1 = await page.evaluate(() => ({
    enemyCount: STATE?.enemies?.length,
    enemyTypes: (STATE?.enemies || []).reduce((m,e)=>{m[e.type]=(m[e.type]||0)+1;return m;},{}),
    heroCD: SPAWN_COOLDOWN.hero,
    ogreCD: SPAWN_COOLDOWN.ogre,
    knightCD: SPAWN_COOLDOWN.knight,
    knightHP: UNIT_TYPES.knight.hp,
    knightDmg: UNIT_TYPES.knight.dmg,
    dragonSpeed: ENEMY_TYPES.dragon.speed
  }));
  console.log('L1:', JSON.stringify(l1, null, 2));

  // Tap hero twice — second should be CD-blocked
  await page.click('#btn-spawn-hero');
  await new Promise(r=>setTimeout(r,150));
  await page.click('#btn-spawn-hero');
  await new Promise(r=>setTimeout(r,150));
  const heroTaps = await page.evaluate(() => STATE.units.filter(u => u.type==='hero').length);
  console.log('hero taps result:', heroTaps);

  // Wait 800ms (>750 cd) and tap again — should succeed
  await new Promise(r=>setTimeout(r,700));
  await page.click('#btn-spawn-hero');
  await new Promise(r=>setTimeout(r,150));
  const heroTaps2 = await page.evaluate(() => STATE.units.filter(u => u.type==='hero').length);
  console.log('hero taps after CD:', heroTaps2);

  // Jump to L3 to verify dragon is immobile
  await page.evaluate(() => { STATE.level = 2; runLevel3Sequence(); });
  await new Promise(r=>setTimeout(r,9000));
  const dragonStart = await page.evaluate(() => {
    const d = STATE.enemies.find(e => e.type === 'dragon');
    return d ? { x: Math.round(d.x), y: Math.round(d.y), speed: d.speed } : null;
  });
  await new Promise(r=>setTimeout(r,4000));
  const dragonLater = await page.evaluate(() => {
    const d = STATE.enemies.find(e => e.type === 'dragon');
    return d ? { x: Math.round(d.x), y: Math.round(d.y) } : null;
  });
  console.log('dragon start:', dragonStart, '→ later:', dragonLater);

  console.log('errors:', errs);
  await browser.close();
})();
