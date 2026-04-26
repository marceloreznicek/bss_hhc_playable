const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '..', 'HHC_Playable', 'builds', 'v02', 'HHC_playable_v02_AppLovin.html');
const OUT = path.resolve(__dirname, '..', 'extracted_v02');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const html = fs.readFileSync(SRC, 'utf8');

const wantedIdPattern = /^(intro-hero|intro-btn|btn-|endcard-(btn|icon)|ruby-btn|hud-coin|hud-wood|badge-n|hero-bg|coin-bar-img)/;

// 1) Direct <img id="X" src="data:image…">
const reImgWithId = /<img[^>]*\bid="([^"]+)"[^>]*\bsrc="data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)"/g;
// 2) Wrapper divs (btn-sell, btn-unlock-*, btn-evolve, btn-evolve-cost) whose first <img> is the icon
const reDivWrapper = /<div[^>]*\bid="(btn-sell|btn-unlock-3k|btn-unlock-10k|btn-evolve|btn-evolve-cost)"[^>]*>\s*<img[^>]*\bsrc="data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)"/g;

let count = 0;
const skipped = [];
function save(id, ext, b64) {
  const buf = Buffer.from(b64, 'base64');
  const fileName = id + '.' + (ext === 'jpg' ? 'jpg' : ext);
  fs.writeFileSync(path.join(OUT, fileName), buf);
  console.log('  ✓ ' + fileName + ' — ' + (buf.length / 1024).toFixed(1) + ' KB');
  count++;
}

let m;
while ((m = reImgWithId.exec(html))) {
  const [, id, ext, b64] = m;
  if (!wantedIdPattern.test(id)) { skipped.push(id); continue; }
  save(id, ext, b64);
}
while ((m = reDivWrapper.exec(html))) {
  const [, id, ext, b64] = m;
  save(id, ext, b64);
}
console.log('\nExtracted ' + count + ' assets to ' + OUT);
if (skipped.length) console.log('Skipped (not in pattern):', skipped.join(', '));
