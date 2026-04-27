// Render a T1 hero next to a T3 knight on the battlefield to confirm the new
// 30%-smaller / 30%-larger visual scaling.
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(() => {
    // Wipe combat for a clean comparison and place a T1 + T3 in the bottom band.
    STATE.enemies.forEach(e => { e.dead = true; if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); });
    STATE.enemies.length = 0;
    STATE.units.forEach(u => { u.dead = true; if (u.el && u.el.parentNode) u.el.parentNode.removeChild(u.el); });
    STATE.units.length = 0;
    var t1 = createActor('hero',   MERGE_UNIT_TYPES, 360, 555);
    var t3 = createActor('knight', MERGE_UNIT_TYPES, 720, 555);
    STATE.units.push(t1, t3);
  });
  await new Promise(r=>setTimeout(r,250));
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_t1_t3_size.png') });
  await browser.close();
})();
