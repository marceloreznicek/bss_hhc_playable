// Render every tier in the grid so we can visually confirm T3 and T4 sprites.
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], defaultViewport:{width:540,height:960} });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html'), { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,400));
  await page.evaluate(() => {
    STATE.grid[0] = { tier: 1 };  // hero
    STATE.grid[1] = { tier: 2 };  // ogre/lenhador
    STATE.grid[2] = { tier: 3 };  // <-- should now be heroicagadi.png
    STATE.grid[3] = { tier: 4 };  // <-- should now be igris.png (was juggermon2)
    STATE.grid[4] = { tier: 5 };  // dragon/overlord
    renderGrid();
  });
  await new Promise(r=>setTimeout(r,250));
  await page.screenshot({ path: path.join(__dirname, 'screenshots/heromerge_tiers_v5.png') });
  await browser.close();
})();
