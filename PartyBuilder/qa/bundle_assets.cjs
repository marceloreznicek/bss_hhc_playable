// Bundles sprites/sounds/font into PartyBuilder master HTML as base64 data URLs.
// Idempotent — re-run after edits. Mirrors the HeroMerge bundler regex (handles base64 commas).
const fs   = require('fs');
const path = require('path');

const ART     = path.resolve(__dirname, '..', '..', 'HHC_Playable', 'art');
const SFX     = path.resolve(__dirname, '..', '..', 'HHC_Playable', 'sfx');
const PBASSET = path.resolve(__dirname, '..', 'assets');
const BG      = path.resolve(__dirname, '..', '..', 'sprites', 'backgrounds');
const HTML    = path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html');

function dataUrl(file, mime) {
  const buf = fs.readFileSync(file);
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

const SPRITE_MAP = {
  // heroes (shop + battle)
  lenhador:  ['lenhador.png',   'image/png', PBASSET],
  squire:    ['andarilho.png',  'image/png', PBASSET],
  hunter:    ['cacador.png',    'image/png', PBASSET],
  knight:    ['igris.png',      'image/png', PBASSET],
  mage:      ['magos.png',      'image/png', PBASSET],
  paladin:   ['paladino.png',   'image/png', PBASSET],
  duelist:   ['duelista.png',   'image/png', PBASSET],
  rogue:     ['dante.png',      'image/png', PBASSET],
  berserker: ['saitama.png',    'image/png', PBASSET],
  // round avatar fallback for shop card
  avatar:    ['player.png',     'image/png', PBASSET],
  // enemies
  goblin:    ['babyorc.png',    'image/png', PBASSET],
  brute:     ['juggermon2.png', 'image/png', PBASSET],
  demonlord: ['overlord.png',   'image/png', PBASSET],
  // backgrounds
  bgTavern:  ['dentro do bar 21 por 9.png', 'image/png', BG],
  bgBattle:  ['Cidade Destruida 21 por 9.png', 'image/png', BG]
};

const SOUND_MAP = {
  hit:     ['hit 1.mp3',                            'audio/mpeg'],
  hit2:    ['hit 2.mp3',                            'audio/mpeg'],
  coin:    ['2 ka-ching_01.mp3',                    'audio/mpeg'],
  unlock:  ['3 power up_01.mp3',                    'audio/mpeg'],
  cheer:   ['4 Magic Revealed_01.mp3',              'audio/mpeg'],
  spawn:   ['1 clink.mp3',                          'audio/mpeg'],
  locked:  ['5 button locked.mp3',                  'audio/mpeg'],
  cta:     ['6 intro button and endcard button.wav','audio/wav']
};

let html = fs.readFileSync(HTML, 'utf8');

function injectBlock(html, blockName, fallbackDir, map) {
  const re = new RegExp('(var\\s+' + blockName + '\\s*=\\s*\\{)([\\s\\S]*?)(\\n\\};)', 'm');
  const m  = html.match(re);
  if (!m) throw new Error('Could not find ' + blockName + ' block');
  const head = m[1], body = m[2], tail = m[3];

  // Match: leading-ws  key:  ('...'  |  "..."  | null)  optional-comma  optional-rest-of-line-comment
  const lineRe = /^([ \t]*)([a-zA-Z0-9_]+)\s*:\s*('[^'\n]*'|"[^"\n]*"|null)\s*(,)?[^\n]*$/gm;

  const newBody = body.replace(lineRe, (full, indent, key, _val, trailComma) => {
    if (!(key in map)) return full;
    const [file, mime, srcDir] = map[key];
    const baseDir  = srcDir || fallbackDir;
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn('  ! missing ' + filePath + ' — leaving slot as-is');
      return full;
    }
    const url   = dataUrl(filePath, mime);
    const trail = trailComma ? ',' : '';
    return indent + key + ': \'' + url + '\'' + trail + ' // ' + file;
  });

  return html.replace(re, head + newBody + tail);
}

console.log('[bundle] injecting SPRITES…');
html = injectBlock(html, 'SPRITES', ART, SPRITE_MAP);
console.log('[bundle] injecting SOUNDS…');
html = injectBlock(html, 'SOUNDS', SFX, SOUND_MAP);

const fontPath = path.join(ART, 'RifficFree-Bold.ttf');
if (fs.existsSync(fontPath) && !html.includes("font-family: 'Riffic'")) {
  const fontUrl = dataUrl(fontPath, 'font/truetype');
  const faceCss = `\n@font-face { font-family: 'Riffic'; font-weight: bold; src: url('${fontUrl}') format('truetype'); }\n`;
  html = html.replace('<style>', '<style>' + faceCss);
  console.log('[bundle] embedded RifficFree font');
}

fs.writeFileSync(HTML, html);
const sizeMB = (fs.statSync(HTML).size / 1024 / 1024).toFixed(2);
console.log('[bundle] done — file is now ' + sizeMB + ' MB');
