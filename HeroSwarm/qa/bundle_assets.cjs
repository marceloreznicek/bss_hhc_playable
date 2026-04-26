// Reads HHC art/sfx, base64-encodes, and writes the values into the SPRITES / SOUNDS
// blocks of the HeroSwarm master HTML. Idempotent — re-run after edits.
const fs   = require('fs');
const path = require('path');

const ART     = path.resolve(__dirname, '..', '..', 'HHC_Playable', 'art');
const SFX     = path.resolve(__dirname, '..', '..', 'HHC_Playable', 'sfx');
const HSASSET = path.resolve(__dirname, '..', 'assets'); // trimmed sprites (no dead space)
const BG      = path.resolve(__dirname, '..', '..', 'sprites', 'backgrounds');
const HTML    = path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html');

function dataUrl(file, mime) {
  const buf = fs.readFileSync(file);
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

// Each entry: [filename, mime, sourceDir].  Mixes HHC art and Herois sprites.
const SPRITE_MAP = {
  hero:        ['intro-hero.png',   'image/png', HSASSET],  // in-battle Hero + intro panel
  heroAvatar:  ['player.png',       'image/png', HSASSET],  // round card portrait (unchanged)
  ogre:        ['lenhador.png',     'image/png', HSASSET],
  knight:      ['igris.png',        'image/png', HSASSET],
  goblin:      ['babyorc.png',      'image/png', HSASSET],
  brute:       ['juggermon2.png',   'image/png', HSASSET],
  skeleton:    ['gon2.png',         'image/png', HSASSET],
  captain:     ['gon3.png',         'image/png', HSASSET],
  troll:       ['ogro.png',         'image/png', HSASSET],
  dragon:      ['overlord.png',     'image/png', HSASSET],
  hand:        ['hand_pointer.png', 'image/png', ART],
  bgL1:        ['forest_back.png',  'image/png', ART],
  bgCity:      ['Cidade Destruida 21 por 9.png', 'image/png', BG],  // L1
  bgNight:     ['Cidade a noite 21 por 9.png',   'image/png', BG],  // L2
  bgCave:      ['cave 21 por 9.png',             'image/png', BG]   // L3
};
const SOUND_MAP = {
  hit:     ['hit 1.mp3',                            'audio/mpeg'],
  hit2:    ['hit 2.mp3',                            'audio/mpeg'],
  hit3:    ['hit 3.mp3',                            'audio/mpeg'],
  coin:    ['2 ka-ching_01.mp3',                    'audio/mpeg'],
  unlock:  ['3 power up_01.mp3',                    'audio/mpeg'],
  levelup: ['4 Magic Revealed_01.mp3',              'audio/mpeg'],
  spawn:   ['1 clink.mp3',                          'audio/mpeg'],
  locked:  ['5 button locked.mp3',                  'audio/mpeg'],
  cta:     ['6 intro button and endcard button.wav','audio/wav'],
  bgm:     ['0 bgm_01 v2.mp3',                      'audio/mpeg']
};

let html = fs.readFileSync(HTML, 'utf8');

// `map[key]` may be either [file, mime] (uses fallback baseDir) or [file, mime, sourceDir].
// The regex matches the WHOLE value (string or null) on the line, so data URLs containing
// commas (the `data:...;base64,...` separator) don't trick us into replacing only the prefix.
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

// Embed RifficFree font + define @font-face if not already present
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
