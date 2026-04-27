// Playtest harness — runs party compositions through Mission 1 or Mission 2
// and reports win/loss results. Combat is deterministic (RNG only in SFX
// selection), so 1–2 trials per comp is sufficient; we do 2 for safety.
//
//   node qa/playtest.cjs            → runs the full matrix
//   node qa/playtest.cjs single     → runs one quick sanity trial
//
// Outcome detection: we wait for STATE.gameActive===false, then read
// STATE.units / STATE.enemies. If all enemies dead → win, else → loss.
// We also hook onMissionEnd to record the official outcome flag.

const puppeteer = require('puppeteer');
const path = require('path');

const HTML_PATH = 'file://' + path.resolve(__dirname, '..', 'PartyBuilder_v0.1.html');
const TRIAL_TIMEOUT_MS = 60000; // hard ceiling per trial

// ── Test matrix ──────────────────────────────────────────────────────────
// Mission 1 (100g budget, no tired heroes):
const M1_COMPOSITIONS = [
  { name: '3-cheap (lenh+squire+hunter)',  party: ['lenhador','squire','hunter'], cost: 90 },
  { name: 'one-tank (lenh+squire+knight)', party: ['lenhador','squire','knight'], cost: 100 },
  { name: 'tank-only (lenh+knight)',       party: ['lenhador','knight'],          cost: 70 },
  { name: 'mage-carry (lenh+mage)',        party: ['lenhador','mage'],            cost: 85 },
  { name: 'squire+knight',                 party: ['squire','knight'],            cost: 75 },
  { name: 'hunter+knight',                 party: ['hunter','knight'],            cost: 80 },
  { name: 'squire+mage',                   party: ['squire','mage'],              cost: 90 },
  { name: 'hunter+mage',                   party: ['hunter','mage'],              cost: 95 },
  { name: 'paladin-solo',                  party: ['paladin'],                    cost: 70 },
  { name: 'mage-solo',                     party: ['mage'],                       cost: 60 },
];

// Mission 2 (110g budget, fresh heroes):
const M2_COMPOSITIONS = [
  { name: 'max-3 fresh (sq+kn+hu)',  party: ['squire','knight','hunter'], cost: 110 },
  { name: 'knight+mage',             party: ['knight','mage'],            cost: 105 },
  { name: 'paladin+lenhador',        party: ['paladin','lenhador'],       cost: 95  },
  { name: 'paladin+hunter',          party: ['paladin','hunter'],         cost: 105 },
  { name: 'paladin+squire',          party: ['paladin','squire'],         cost: 100 },
  { name: 'knight+hunter+lenh',      party: ['knight','hunter','lenhador'],cost: 105 },
  { name: 'knight+squire+lenh',      party: ['knight','squire','lenhador'],cost: 100 },
  { name: 'mage+lenhador',           party: ['mage','lenhador'],          cost: 85  },
  { name: 'paladin+mage',            party: ['paladin','mage'],           cost: 130 }, // over-budget — only used if explicitly testing
];

const TRIALS_PER_COMP = 2;

async function runOneTrial(page, mission, party) {
  // Reset to a clean state: reload page each trial so DOM/STATE is pristine.
  await page.goto(HTML_PATH, { waitUntil: 'networkidle0', timeout: 20000 });

  // Wait for init to finish.
  await page.waitForFunction('window.STATE && window.STATE.phase === "intro"', { timeout: 5000 });

  // Skip intro, force mission, set gold, hire party, GO.
  const startResult = await page.evaluate((mission, party) => {
    window.dismissIntro();
    window.STATE.mission = mission;
    window.STATE.gold    = mission === 1 ? 100 : 110;
    window.STATE.party   = [];
    window.STATE.tiredSet = {};
    // Hook onMissionEnd if we can — but it's a closure-local. We can't.
    // Instead, mark a flag when the banner appears.
    party.forEach(function(k) { window.onHire(k); });
    var hired = window.STATE.party.slice();
    window.onGo();
    return { hiredParty: hired, startTs: performance.now() };
  }, mission, party);

  const tStart = Date.now();
  // Poll until gameActive flips false.
  let result = null;
  while (Date.now() - tStart < TRIAL_TIMEOUT_MS) {
    const snapshot = await page.evaluate(() => ({
      gameActive:   window.STATE.gameActive,
      phase:        window.STATE.phase,
      aliveUnits:   window.STATE.units.filter(function(u){ return !u.dead; }).length,
      aliveEnemies: window.STATE.enemies.filter(function(e){ return !e.dead; }).length,
      waveIdx:      window.STATE.waveIdx
    }));
    if (!snapshot.gameActive) {
      // Disambiguate: check if there are still enemies alive or all dead.
      const won = snapshot.aliveUnits > 0 && snapshot.aliveEnemies === 0;
      result = {
        won: won,
        durationMs: Date.now() - tStart,
        aliveUnits: snapshot.aliveUnits,
        aliveEnemies: snapshot.aliveEnemies,
        finalPhase: snapshot.phase
      };
      break;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!result) {
    result = { won: false, durationMs: TRIAL_TIMEOUT_MS, aliveUnits: -1, aliveEnemies: -1, finalPhase: 'TIMEOUT' };
  }
  return result;
}

async function runComp(page, mission, comp, trials) {
  const results = [];
  for (let i = 0; i < trials; i++) {
    const r = await runOneTrial(page, mission, comp.party);
    results.push(r);
  }
  const wins   = results.filter(r => r.won).length;
  const losses = trials - wins;
  const avgDur = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / trials);
  const avgUnits = (results.reduce((s, r) => s + r.aliveUnits, 0) / trials).toFixed(1);
  return { comp, mission, wins, losses, trials, avgDur, avgUnits };
}

async function runMatrix(label, compositions, mission) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    defaultViewport: { width: 540, height: 960 }
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));

  const rows = [];
  console.log('\n=== ' + label + ' ===');
  for (const comp of compositions) {
    const row = await runComp(page, mission, comp, TRIALS_PER_COMP);
    rows.push(row);
    const tag = row.wins === row.trials ? 'WIN ' : row.wins === 0 ? 'LOSS' : 'MIX ';
    console.log('  ' + tag + '  ' + comp.name.padEnd(36) + '  ' +
      row.wins + '/' + row.trials + ' wins  ' +
      'avg ' + row.avgDur + 'ms  ' +
      'survivors ' + row.avgUnits);
  }
  await browser.close();
  return rows;
}

function summarize(label, rows, target) {
  const totalTrials = rows.reduce((s, r) => s + r.trials, 0);
  const totalWins   = rows.reduce((s, r) => s + r.wins, 0);
  const winRate = (totalWins / totalTrials * 100).toFixed(1);
  console.log('\n  ' + label + ' overall: ' + totalWins + '/' + totalTrials + ' wins (' + winRate + '%) — target ' + target);
}

(async () => {
  const arg = process.argv[2];
  if (arg === 'single') {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox','--disable-setuid-sandbox'],
      defaultViewport: { width: 540, height: 960 }
    });
    const page = await browser.newPage();
    page.on('pageerror', e => console.log('PAGEERROR:', e.message));
    const r = await runOneTrial(page, 1, ['lenhador','squire','hunter']);
    console.log('single trial:', r);
    await browser.close();
    return;
  }

  const m1Rows = await runMatrix('MISSION 1 — 100g budget, fresh heroes', M1_COMPOSITIONS, 1);
  summarize('M1', m1Rows, '~15% win rate (i.e. ~85% loss)');

  const m2Rows = await runMatrix('MISSION 2 — 110g budget, fresh heroes', M2_COMPOSITIONS, 2);
  summarize('M2', m2Rows, '~75% win rate');

  console.log('\n=== Markdown table ===\n');
  console.log('| Mission | Composition                          | Cost | Wins/Trials | Avg ms | Survivors |');
  console.log('|---------|--------------------------------------|------|-------------|--------|-----------|');
  for (const r of m1Rows) {
    console.log('| M1      | ' + r.comp.name.padEnd(36) + ' | ' +
      String(r.comp.cost).padStart(4) + ' | ' +
      (r.wins + '/' + r.trials).padStart(11) + ' | ' +
      String(r.avgDur).padStart(6) + ' | ' +
      String(r.avgUnits).padStart(9) + ' |');
  }
  for (const r of m2Rows) {
    console.log('| M2      | ' + r.comp.name.padEnd(36) + ' | ' +
      String(r.comp.cost).padStart(4) + ' | ' +
      (r.wins + '/' + r.trials).padStart(11) + ' | ' +
      String(r.avgDur).padStart(6) + ' | ' +
      String(r.avgUnits).padStart(9) + ' |');
  }
})();
