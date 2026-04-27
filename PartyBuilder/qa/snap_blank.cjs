const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const outDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    defaultViewport: { width: 540, height: 960 }
  });
  const page = await browser.newPage();
  await page.goto(
    'file://' + path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html'),
    { waitUntil: 'networkidle0', timeout: 20000 }
  );
  await new Promise(r => setTimeout(r, 800));
  const out = path.join(outDir, 'phase0_hello.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log('saved', out);
  await browser.close();
})();
