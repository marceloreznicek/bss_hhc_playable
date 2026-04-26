// Headless QA harness for HeroSwarm playable
// Usage: node qa/qa.cjs <phase_number>
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PHASE = parseInt(process.argv[2] || '0', 10);
const FILE  = path.resolve(__dirname, '..', 'HeroSwarm_playable_v0.1.html');
const URL   = 'file://' + FILE;

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 540, height: 960 } // half-resolution portrait
  });
  const page = await browser.newPage();

  const errors = [];
  const consoleMsgs = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('error',     e => errors.push('CRASH: ' + e.message));
  page.on('console',   m => consoleMsgs.push('[' + m.type() + '] ' + m.text()));

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 600)); // let CSS animations settle

  // Common checks
  const layout = await page.evaluate(() => {
    function rect(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: getComputedStyle(el).display };
    }
    return {
      game:        rect('game'),
      hud:         rect('hud'),
      battlefield: rect('battlefield'),
      waveInfo:    rect('wave-info'),
      cardStack:   rect('card-stack'),
      cardHero:    rect('card-hero'),
      cardOgre:    rect('card-ogre'),
      cardKnight:  rect('card-knight'),
      intro:       rect('intro'),
      endcard:     rect('endcard'),
      coinsVal:    document.getElementById('coins-val')?.textContent,
      waveText:    document.getElementById('wave-info-text')?.textContent,
    };
  });

  // Take baseline screenshot
  const screenshotDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_intro.png') });

  // Click intro START to dismiss it
  const introBtn = await page.$('#intro-btn');
  if (introBtn) {
    await introBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_game.png') });

  // After-intro state
  const afterIntro = await page.evaluate(() => ({
    introDisplay: getComputedStyle(document.getElementById('intro')).display,
    introOpacity: getComputedStyle(document.getElementById('intro')).opacity,
    gameActive:   window.STATE?.gameActive,
    introClosed:  window.STATE?.introClosed,
  }));

  // Phase-specific checks
  let phaseChecks = {};

  // Tutorial check #1 — captured immediately after intro close (before any taps)
  if (PHASE >= 7) {
    phaseChecks.tutAfterIntro = await page.evaluate(() => ({
      step: window.STATE?.guideStep,
      bubbleDisplay: getComputedStyle(document.getElementById('tut-bubble')).display,
      bubbleText:    document.getElementById('tut-bubble-text')?.textContent,
      handDisplay:   getComputedStyle(document.getElementById('guide-hand')).display,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_tut_intro.png') });
  }

  if (PHASE >= 1) {
    // Phase 1: tap Hero card, expect a unit DOM element to appear
    await page.click('#btn-spawn-hero');
    await new Promise(r => setTimeout(r, 200));

    // Tutorial check #2 — should now be on step 2 ("Defeat enemies for COINS")
    if (PHASE >= 7) {
      phaseChecks.tutAfterFirstTap = await page.evaluate(() => ({
        step: window.STATE?.guideStep,
        bubbleText: document.getElementById('tut-bubble-text')?.textContent,
        bubbleDisplay: getComputedStyle(document.getElementById('tut-bubble')).display,
      }));
      await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_tut_firsttap.png') });
    }
    phaseChecks.unitsAfterTap = await page.evaluate(() => ({
      stateUnits: (window.STATE?.units || []).length,
      laneChildren: document.getElementById('lane')?.children?.length || 0,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_after_tap.png') });

    // Wait and check if unit moved
    await new Promise(r => setTimeout(r, 1500));
    phaseChecks.unitsAfterWalk = await page.evaluate(() => ({
      stateUnits: (window.STATE?.units || []).length,
      laneChildren: document.getElementById('lane')?.children?.length || 0,
      firstUnitX: window.STATE?.units?.[0]?.x,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_after_walk.png') });
  }

  if (PHASE >= 2) {
    // Spam-tap Hero so units stack up to fight test wave of 5 goblins
    for (let k = 0; k < 8; k++) {
      await page.click('#btn-spawn-hero');
      await new Promise(r => setTimeout(r, 200));
    }
    // Test wave spawns 5 goblins every 2s starting after intro close.
    // Wait ~14s total so spawns + tackles can resolve.
    await new Promise(r => setTimeout(r, 14000));
    phaseChecks.combat = await page.evaluate(() => ({
      kills:      window.STATE?.kills,
      coins:      window.STATE?.coins,
      units:      (window.STATE?.units   || []).length,
      enemies:    (window.STATE?.enemies || []).length,
      laneKids:   document.getElementById('lane')?.children?.length,
      coinsText:  document.getElementById('coins-val')?.textContent,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_combat.png') });
  }

  if (PHASE >= 3 && PHASE < 4) {
    // Phase 3-only checks (skipped in P4+ since the scripted wave replaces the test wave)
    phaseChecks.unlocksAfterTestWave = await page.evaluate(() => ({
      ogre:    window.STATE?.unitsUnlocked?.ogre,
      knight:  window.STATE?.unitsUnlocked?.knight,
    }));
  }

  if (PHASE >= 4) {
    // Run for up to ~32s with hero spam, breaking out when wave 1 clears
    let logL1 = [];
    const start = Date.now();
    let waveClearedAt = null;
    while (Date.now() - start < 75000) {
      try { await page.click('#btn-spawn-hero', { timeout: 500 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
      const snap = await page.evaluate(() => ({
        t: Math.round((window.performance.now() / 1000) * 10) / 10,
        level: window.STATE?.level,
        kills: window.STATE?.kills,
        klv: window.STATE?.killsThisLevel,
        enemies: (window.STATE?.enemies || []).length,
        wave: window.waveActive,
        spawned: window.waveSpawnedCount,
        total: window.waveTotalCount,
      }));
      logL1.push(snap);
      if (snap.level === 1 && !snap.wave && snap.spawned >= snap.total && snap.enemies === 0) {
        waveClearedAt = snap.t;
        break;
      }
    }
    phaseChecks.l1Final = logL1[logL1.length - 1];
    phaseChecks.l1ClearedAt = waveClearedAt;
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l1_done.png') });
  }

  if (PHASE === 5) {
    // Wait through L1→L2 transition then snapshot Level 2 starting
    await new Promise(r => setTimeout(r, 3000));
    phaseChecks.l2Start = await page.evaluate(() => ({
      level: window.STATE?.level,
      klv:   window.STATE?.killsThisLevel,
      bfClasses: document.getElementById('battlefield')?.className,
      enemies: (window.STATE?.enemies || []).length,
      units:   (window.STATE?.units || []).length,
      enemyTypes: (window.STATE?.enemies || []).map(e => e.type),
      waveActive: window.waveActive,
      waveText: document.getElementById('wave-info-text')?.textContent,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l2_start.png') });

    const t2start = Date.now();
    while (Date.now() - t2start < 10000) {
      try { await page.click('#btn-spawn-hero', { timeout: 500 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }
    phaseChecks.l2Mid = await page.evaluate(() => ({
      level: window.STATE?.level,
      klv:   window.STATE?.killsThisLevel,
      enemies: (window.STATE?.enemies || []).length,
      enemyTypes: Array.from(new Set((window.STATE?.enemies || []).map(e => e.type))),
      units: (window.STATE?.units || []).length,
      coins: window.STATE?.coins,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l2_mid.png') });
  }

  if (PHASE >= 7) {
    // Right after intro close: tutorial step 1 should show "TAP to spawn your HERO!"
    phaseChecks.tutStep1 = await page.evaluate(() => ({
      step: window.STATE?.guideStep,
      bubbleVisible: getComputedStyle(document.getElementById('tut-bubble')).display,
      bubbleText:    document.getElementById('tut-bubble-text')?.textContent,
      handVisible:   getComputedStyle(document.getElementById('guide-hand')).display,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_tut1_taphero.png') });
    // Wait for ogre unlock (3 kills) — manually drive 3 quick spawns + enemy fights via spawnEnemy
    // Actually we have a real wave running; just spam-tap and wait until ogre unlock fires
    const tStart = Date.now();
    let tutStep3 = null;
    while (Date.now() - tStart < 25000) {
      try { await page.click('#btn-spawn-hero', { timeout: 500 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
      const s = await page.evaluate(() => ({
        step: window.STATE?.guideStep,
        bubbleText: document.getElementById('tut-bubble-text')?.textContent,
        ogre:   window.STATE?.unitsUnlocked?.ogre,
        knight: window.STATE?.unitsUnlocked?.knight,
      }));
      if (s.step === 3 && !tutStep3) {
        tutStep3 = s;
        await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_tut3_ogre.png') });
      }
      if (s.knight) break;
    }
    phaseChecks.tutStep3 = tutStep3;
    phaseChecks.tutStep4 = await page.evaluate(() => ({
      step: window.STATE?.guideStep,
      bubbleText: document.getElementById('tut-bubble-text')?.textContent,
      knight: window.STATE?.unitsUnlocked?.knight,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_tut4_knight.png') });
  }

  if (PHASE === 6) {
    // Skip past L1+L2 by jumping STATE forward and triggering L3 directly
    // (transitions already verified in earlier phases)
    await page.evaluate(() => {
      window.STATE.level = 2;
      window.runLevel3Sequence();
    });
    // Wait for horde to populate (transition starts in ~900ms)
    await new Promise(r => setTimeout(r, 1500));
    phaseChecks.l3Horde = await page.evaluate(() => ({
      level: window.STATE?.level,
      hordeCount: document.querySelectorAll('#horde-layer .horde-mob').length,
      hordeShown: document.getElementById('horde-layer')?.classList?.contains('show'),
      bfClasses: document.getElementById('battlefield')?.className,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l3_horde.png') });

    // Wait for Dragon spawn (~7.2s after runLevel3Sequence start; we waited 1.5s, so ~5.7s more)
    await new Promise(r => setTimeout(r, 6500));
    phaseChecks.l3Dragon = await page.evaluate(() => {
      const dragon = (window.STATE?.units || []).find(u => u.type === 'dragon');
      return {
        dragonExists: !!dragon,
        dragonState:  dragon?.state,
        dragonX:      dragon?.x,
      };
    });
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l3_dragon.png') });

    // Tap the Dragon (the actor element). We'll click via JS since pointer events on transformed elements can be flaky.
    await page.evaluate(() => {
      const dragon = (window.STATE?.units || []).find(u => u.type === 'dragon');
      if (dragon && dragon.el) dragon.el.click();
    });
    // Wait for AoE + endcard (350ms windup + 1800ms to endcard)
    await new Promise(r => setTimeout(r, 2500));
    phaseChecks.l3Finale = await page.evaluate(() => ({
      enemies: (window.STATE?.enemies || []).length,
      endcardDisplay: getComputedStyle(document.getElementById('endcard')).display,
      gameEnded: window.STATE?.gameEnded,
    }));
    await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_l3_endcard.png') });
  }

  // Test endcard via key 'E'
  await page.keyboard.press('E');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, 'phase' + PHASE + '_endcard.png') });
  const endcardState = await page.evaluate(() =>
    getComputedStyle(document.getElementById('endcard')).display
  );

  console.log(JSON.stringify({
    phase: PHASE,
    file: FILE,
    layout,
    afterIntro,
    phaseChecks,
    endcardDisplay: endcardState,
    errors,
    consoleMsgs: consoleMsgs.slice(-20),
  }, null, 2));

  await browser.close();
})().catch(err => {
  console.error('QA HARNESS FAILED:', err);
  process.exit(1);
});
