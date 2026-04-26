const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 540, height: 960 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const url = 'file://' + path.resolve(process.argv[2]);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
  await page.click('#intro-btn');
  await new Promise(r => setTimeout(r, 500));
  await page.click('#btn-spawn-hero');
  await new Promise(r => setTimeout(r, 800));
  const status = await page.evaluate(() => ({
    units: (window.STATE?.units || []).length,
    intro: getComputedStyle(document.getElementById('intro')).display,
    storeFnExists: typeof window.goToStore === 'function',
  }));
  console.log(process.argv[2].split('/').pop(), '→', JSON.stringify(status), 'errors:', errors.length);
  await browser.close();
})();
