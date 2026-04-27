// Smoke-test a built package: load it, dismiss intro, hire one hero, press GO,
// verify combat starts without errors. Pass file path as arg.
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const target = process.argv[2];
  if (!target) { console.error('usage: node smoke.cjs <path-to-build.html>'); process.exit(2); }
  const abs = path.resolve(target);
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: {width:540,height:960} });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  await page.goto('file://' + abs, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => { window.dismissIntro && window.dismissIntro(); });
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => { window.onHire && window.onHire('knight'); window.onGo && window.onGo(); });
  await new Promise(r => setTimeout(r, 1500));
  const live = await page.evaluate(() => ({ phase: STATE.phase, units: STATE.units.length, enemies: STATE.enemies.length }));
  console.log('errors:', errs.length, errs);
  console.log('state:', live);
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
