// Builds three platform variants of HeroSwarm playable from the master HTML.
// AppLovin   : pure window.open
// Unity Ads  : mraid.open with init guard
// Google Ads : ExitApi.exit, ready-state init only, zipped as index.html
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC      = path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html');
const OUT_DIR  = path.resolve(__dirname, '..', 'builds');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const master = fs.readFileSync(SRC, 'utf8');

// Master HeroSwarm goToStore() already implements iOS/Android URL detection AND tries
// mraid → ExitApi → window.open in order, so per-variant overrides are no longer needed.
// We just inject Unity-Ads' mraid-ready wait shim.
const VARIANTS = {
  applovin: {
    file: 'HeroSwarm_v01_AppLovin.html',
    initBefore: ''
  },
  unityads: {
    file: 'HeroSwarm_v01_UnityAds.html',
    initBefore: `(function(){
      function ready(){ /* harness already runs scaleGame on load */ }
      if (window.mraid) {
        if (mraid.getState && mraid.getState() === 'loading') {
          mraid.addEventListener('ready', ready);
        } else { ready(); }
      } else if (document.readyState !== 'loading') { ready(); }
        else { document.addEventListener('DOMContentLoaded', ready); }
    })();`
  },
  googleads: {
    file: 'HeroSwarm_v01_GoogleAds.html',
    initBefore: `(function(){
      // Google Ads expects the document.readyState path only — no mraid.
    })();`
  }
};

function buildVariant(name, opts) {
  let html = master;
  if (opts.initBefore) {
    html = html.replace(
      '// ─────────────────────────────────────────────────────────\n// SCALE GAME TO VIEWPORT',
      opts.initBefore + '\n// ─────────────────────────────────────────────────────────\n// SCALE GAME TO VIEWPORT'
    );
  }
  // Strip dev helpers (keydown 'E' shortcut + window.STATE export)
  html = html.replace(/\/\/ Dev helpers[\s\S]*?showEndcard\(\); \}\);/m,
    '// (dev helpers stripped in build)');
  return html;
}

for (const [name, opts] of Object.entries(VARIANTS)) {
  const html = buildVariant(name, opts);
  const out  = path.join(OUT_DIR, opts.file);
  fs.writeFileSync(out, html, 'utf8');
  const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`✓ ${opts.file} — ${sizeKB} KB`);
}

// Google Ads zip: index.html + zip
const googleHtml = path.join(OUT_DIR, 'HeroSwarm_v01_GoogleAds.html');
const googleZipDir = path.join(OUT_DIR, '_google_zip_tmp');
if (fs.existsSync(googleZipDir)) execSync(`rm -rf "${googleZipDir}"`);
fs.mkdirSync(googleZipDir);
fs.copyFileSync(googleHtml, path.join(googleZipDir, 'index.html'));
const zipPath = path.join(OUT_DIR, 'HeroSwarm_v01_GoogleAds.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execSync(`cd "${googleZipDir}" && zip -q "${zipPath}" index.html`);
execSync(`rm -rf "${googleZipDir}"`);
const zipSizeKB = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`✓ HeroSwarm_v01_GoogleAds.zip — ${zipSizeKB} KB`);

// Versions readme
const versionsTxt =
`HeroSwarm Playable Builds — v0.1
=================================
HeroSwarm_v01_AppLovin.html   — AppLovin / generic (window.open)
HeroSwarm_v01_UnityAds.html   — Unity Ads (mraid.open)
HeroSwarm_v01_GoogleAds.html  — Google Ads HTML (ExitApi.exit), unzipped
HeroSwarm_v01_GoogleAds.zip   — Google Ads upload package (contains index.html)

Source: ../HeroSwarm_playable_v0.1.html
Notes:
- Portrait only (1080×1920).
- Placeholder sprites still in place. Real art is swapped via SPRITES/SOUNDS registries
  in the source — re-run this build script after dropping in base64 dataURLs.
- Replace STORE_URL (currently https://example.com) with the real app store link before shipping.
`;
fs.writeFileSync(path.join(OUT_DIR, 'VERSIONS.txt'), versionsTxt);

console.log('\nBuild output:', OUT_DIR);
