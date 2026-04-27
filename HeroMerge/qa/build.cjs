// Builds three platform variants of HeroSwarm playable from the master HTML.
// AppLovin   : pure window.open
// Unity Ads  : mraid.open with init guard
// Google Ads : ExitApi.exit, ready-state init only, zipped as index.html
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC      = path.resolve(__dirname, '..', 'HeroMerge_playable_v0.1.html');
const OUT_DIR  = path.resolve(__dirname, '..', 'builds');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const master = fs.readFileSync(SRC, 'utf8');

// Master HeroSwarm goToStore() already implements iOS/Android URL detection AND tries
// mraid → ExitApi → window.open in order, so per-variant overrides are no longer needed.
// We just inject Unity-Ads' mraid-ready wait shim.
const VARIANTS = {
  applovin: {
    file: 'bss_hhc_heromerge_v2_AppLovin.html',
    initBefore: ''
  },
  unityads: {
    file: 'bss_hhc_heromerge_v2_UnityAds.html',
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
    file: 'bss_hhc_heromerge_v2_GoogleAds.html',
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
const googleHtml = path.join(OUT_DIR, 'bss_hhc_heromerge_v2_GoogleAds.html');
const googleZipDir = path.join(OUT_DIR, '_google_zip_tmp');
if (fs.existsSync(googleZipDir)) execSync(`rm -rf "${googleZipDir}"`);
fs.mkdirSync(googleZipDir);
fs.copyFileSync(googleHtml, path.join(googleZipDir, 'index.html'));
const zipPath = path.join(OUT_DIR, 'bss_hhc_heromerge_v2_GoogleAds.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execSync(`cd "${googleZipDir}" && zip -q "${zipPath}" index.html`);
execSync(`rm -rf "${googleZipDir}"`);
const zipSizeKB = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`✓ bss_hhc_heromerge_v2_GoogleAds.zip — ${zipSizeKB} KB`);

// Versions readme
const versionsTxt =
`HeroMerge Playable Builds — v2
==============================
bss_hhc_heromerge_v2_AppLovin.html   — AppLovin / generic (window.open)
bss_hhc_heromerge_v2_UnityAds.html   — Unity Ads (mraid.open)
bss_hhc_heromerge_v2_GoogleAds.html  — Google Ads HTML (ExitApi.exit), unzipped
bss_hhc_heromerge_v2_GoogleAds.zip   — Google Ads upload package (contains index.html)

Source: ../HeroMerge_playable_v0.1.html
Real assets are baked in via SPRITES/SOUNDS registries (see qa/bundle_assets.cjs).
Store CTA routes to the live HHC iOS / Android listings (goToStore() in master HTML).
Portrait only (1080×1920).
`;
fs.writeFileSync(path.join(OUT_DIR, 'VERSIONS.txt'), versionsTxt);

console.log('\nBuild output:', OUT_DIR);
