const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html'), { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r=>setTimeout(r,400));
  await page.click('#intro-btn');
  await new Promise(r=>setTimeout(r,400));
  await page.click('#btn-spawn-hero');
  await new Promise(r=>setTimeout(r,200));
  await page.click('#btn-spawn-hero'); // should be cooldown-blocked
  await new Promise(r=>setTimeout(r,200));
  const s = await page.evaluate(() => ({
    units: (STATE?.units || []).length,
    heroCdActive: document.getElementById('btn-spawn-hero')?.classList?.contains('cooldown'),
    cdUntil: STATE?.cooldownUntil?.hero,
  }));
  console.log('errors:', errs.length, errs);
  console.log('state:', s);
  await browser.close();
})();
