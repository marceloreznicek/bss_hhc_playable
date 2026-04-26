const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  page.on('console', m => console.log('CONSOLE:', m.type(), m.text()));
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { window.STATE.level = 2; window.runLevel3Sequence(); });
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 800));
    const s = await page.evaluate(() => ({
      t: Math.round(performance.now() / 100) / 10,
      level: STATE?.level,
      dragonActor: !!window.dragonActor,
      dragonInUnits: (STATE?.units || []).some(u => u.type === 'dragon'),
      units: (STATE?.units || []).length,
      enemies: (STATE?.enemies || []).length,
      gameActive: STATE?.gameActive,
    }));
    console.log(JSON.stringify(s));
  }
  await browser.close();
})();
