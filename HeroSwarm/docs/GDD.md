# GDD — Tap-to-Spawn Auto-Battler Playable (Portrait)

**Version:** 0.1
**Format:** Single HTML file, portrait 1080×1920, base64 assets
**Targets:** Unity Ads, Google Ads, AppLovin (same pipeline as HHC v2)
**Working title:** `HeroSwarm_Playable_v0.1`

---

## 1. High-Level Concept

A 3-level tap-to-spawn auto-battler playable. The player taps the **Hero** (red-haired main character) to spawn copies of him into a battlefield strip. Other unit types auto-spawn on a timer once unlocked. Units walk left→right, tackle enemies, drop coins. After clearing a wave, the camera pans/zooms to reveal the next level. On level 3, a final horde reveal + mega-unit beat triggers the endcard.

**Time-to-fun:** under 5s (first tap spawns Hero, first kill in ~3s).
**Total playthrough:** 45–75s before endcard.
**Hook:** infinite tap satisfaction + escalating horde anxiety.

---

## 2. Core Loop

1. Player taps **Hero card** → 1 Hero spawns on left edge of battlefield.
2. Hero walks right, tackles first enemy (2–3 hit exchanges), kills it, coins fly to counter.
3. After **3 kills** → **Ogre Crusher** unlocks with a "NEW UNIT!" burst. Auto-spawns every 4s. No tap needed.
4. After **8 kills** → **Knight** unlocks. Auto-spawns every 3s.
5. After **15 kills** → wave 1 cleared → camera pans left + zooms out → **Level 2** reveal (more enemies, including a 20-hit mini-boss).
6. Level 2 plays out (kills reset to 0, same units, new enemies).
7. After level 2 cleared → Level 3 reveal (massive horde, 100+ enemies on screen).
8. Player taps Hero a few times → **mega-unit (Dragon)** auto-spawns once → 1 final tap on Dragon → **Endcard CTA** "Play Now to Save the Kingdom."

**Failure mode:** Hero/units can be KO'd in combat (visual stakes), but Hero respawns on next tap, auto-spawned units keep coming. Player cannot "lose."

---

## 3. Screen Layout (1080×1920 portrait)

```
┌──────────────────────────────────┐  y=0
│  HUD wood bar (1080×120)         │
│  [coin counter top-right]        │
├──────────────────────────────────┤  y=120
│                                  │
│   BATTLEFIELD STRIP              │
│   (forest/dungeon parallax bg)   │
│   units walk left→right          │
│   y_lane: ~y=400                 │
│                                  │
├──────────────────────────────────┤  y=900
│  WAVE COUNTER                    │
│  "Level 1 — Kills: 7 / 15"       │
├──────────────────────────────────┤  y=1000
│                                  │
│  CARD STACK (3 cards)            │
│                                  │
│  ┌──────────────────────────┐    │
│  │ HERO (red hair) — TAP    │    │
│  │ avatar | name | TAP btn  │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ OGRE CRUSHER — auto 4s   │    │
│  │ (locked until 3 kills)   │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ KNIGHT — auto 3s         │    │
│  │ (locked until 8 kills)   │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘  y=1920
```

- **Battlefield strip:** y=120 to y=900 (780px tall). Single horizontal lane at y≈500 (units walk on this y).
- **Card stack:** y=1000 to y=1900. 3 cards stacked vertically, ~280px tall each.
- **HUD:** wood bar top, coin counter top-right (same asset as HHC).

---

## 4. Units (player side)

| Unit | Spawn type | Cooldown | HP | DMG/tackle | Speed | Look |
|---|---|---|---|---|---|---|
| **Hero (red hair)** | Tap-only | manual (no cooldown, button always active) | 6 HP | 2 | medium | Main character, red hair, signature outfit |
| **Ogre Crusher** | Auto | every 4s | 10 HP | 3 | slow | Bulky, club, green skin |
| **Knight** | Auto | every 3s | 8 HP | 2 | fast | Plate armor, sword |
| **Dragon (mega)** | Auto, level 3 only, spawns 1x | once | 50 HP | 10 | medium | Final reveal, full-screen impact |

- Player units always face right.
- When KO'd: brief death anim (fade + tilt), removed from scene.
- Visual hit feedback: white flash + recoil 8px on tackle.

---

## 5. Enemies

### Level 1 — "First World"
- **Goblin Grunt** — 2 HP, 1 DMG, fast. ~12 spawned across the wave.
- **Goblin Brute (mini-boss)** — 20 HP, 2 DMG, slow. **1** spawned mid-wave.
- Total enemies: ~13. Player needs 15 kills to clear → some Hero solo-kills before unlocks plus all wave enemies.

### Level 2 — "Forest Outskirts"
- **Skeleton** — 3 HP, 1 DMG, medium. ~15 spawned.
- **Skeleton Captain** — 5 HP, 2 DMG, medium. ~3 spawned.
- **Forest Troll (mini-boss)** — 25 HP, 3 DMG, slow. **1** spawned at end.
- Total enemies: ~19. Kills needed: 18.

### Level 3 — "The Horde"
- **Massive horde reveal** — 100+ enemies filling the screen (sprite repeated with y/scale variance for depth).
- After ~5s of player tapping the Hero card with units pouring in, **Dragon mega-unit** auto-spawns once (full-width, scaled, fire-breath SFX).
- 1 tap on Dragon → flies forward, AoE kills 30 enemies in flash → **Endcard.**

### Enemy behavior
- Spawn from right edge, walk left toward player units.
- When colliding with a player unit: stop, exchange tackles every 0.6s.
- Cannot pass player units (one-on-one combat in lane order).
- KO anim: red flash + fall-back + fade. Drops 1 coin (auto-flies to counter).

---

## 6. Tutorial Sequence (mãozinha guides)

| Step | Trigger | Hand position | Bubble text |
|---|---|---|---|
| 1 | Game start | Hand on Hero TAP button | "TAP to spawn your hero!" |
| 2 | After 1st tap | Coin counter top-right | "Defeat enemies for coins!" |
| 3 | After 3 kills (Ogre unlock burst) | On Ogre card | "Ogre Crusher joins the fight!" |
| 4 | After 8 kills (Knight unlock burst) | On Knight card | "Knight unlocked!" |
| 5 | After 15 kills (wave clear) | None — camera pans/zooms automatically | "LEVEL 2!" banner |
| 6 | Level 2 start | Hand back on Hero | "Keep tapping!" |
| 7 | Level 2 cleared | Camera pan/zoom | "LEVEL 3 — THE HORDE!" |
| 8 | Dragon auto-spawn | Hand on Dragon | "TAP THE DRAGON!" |
| 9 | After Dragon tap | Endcard | "Play Now to Save the Kingdom" + CTA button |

Hand asset reused from HHC (`hand_pointer.png`).

---

## 7. Camera / Transitions

### Wave clear transition (between levels)
- Battlefield container scales down (`transform: scale(0.6)`) and pans (translate-x +400px) over 1.2s.
- "LEVEL X" banner slides in over center for 0.8s.
- Battlefield resets to default scale, new enemies spawn from right.
- SFX: power_up_01.mp3 (reused from HHC).

### Level 3 horde reveal
- Camera zooms further out (scale 0.45), shows 100+ enemies.
- Slight shake (anxiety hook).
- BGM swap or filter (low-pass) for tension.
- Hero remains tappable; units keep auto-spawning at faster rate.

---

## 8. Economy / Numbers (tunable)

| Param | Value |
|---|---|
| Coins per goblin grunt | 5 |
| Coins per goblin brute | 50 |
| Coins per skeleton | 8 |
| Coins per troll | 75 |
| Hero tap cooldown | 0ms (spam-tappable) |
| Ogre auto-spawn cooldown | 4000ms |
| Knight auto-spawn cooldown | 3000ms |
| Tackle interval | 600ms |
| Walk speed (medium) | 80 px/s |
| Walk speed (fast) | 120 px/s |
| Walk speed (slow) | 50 px/s |
| Unlock thresholds | 3 / 8 kills (Ogre / Knight) |
| Wave 1 kills to clear | 15 |
| Wave 2 kills to clear | 18 |

Coins are visual-only (no shop in this playable). Counter exists for satisfaction/progression feel.

---

## 9. Asset List

### Reuse from HHC (already in `art/`)
- `hud_wood_bar.png`, `hud_coin_bar.png`, `single_coin.png`
- `hand_pointer.png`
- `bg_card_blue.png`, `bg_card_purple.png`, `bg_card_red.png`, `bg_card_4.png`
- `badge_normal.png`, `badge_rare.png`, `badge_super_rare.png`, `badge_ultra_rare.png`
- `bg_parchment.png`, `forest_back.png`
- `btn_endcard.png`, `icon_hhc.png` (replace with new game icon)
- `RifficFree-Bold.ttf`
- `bar_track.png`, `bar_fill.png` (for HP bars on units)

### New art needed
| Asset | Notes |
|---|---|
| `hero_red_idle.png` | Main character, red hair, idle pose |
| `hero_red_walk.png` (or sheet) | 2–4 frame walk cycle |
| `hero_red_attack.png` | Lunge/tackle pose |
| `ogre_crusher.png` (idle/walk/attack) | Reuse HHC ogre_avatar style if matches |
| `knight.png` (idle/walk/attack) | Reuse HHC knight_avatar style |
| `dragon.png` | Mega-unit, large, breathing fire |
| `enemy_goblin_grunt.png` | + walk/attack |
| `enemy_goblin_brute.png` | Mini-boss, larger |
| `enemy_skeleton.png` | + captain variant |
| `enemy_troll.png` | Forest mini-boss |
| `bg_battlefield_l1.png` | Forest path (parallax, can layer with `forest_back.png`) |
| `bg_battlefield_l2.png` | Outskirts/darker forest |
| `bg_battlefield_l3.png` | Battle plain with horde silhouettes |
| `banner_level_up.png` | "LEVEL 2 / 3" banner |

### Reuse from HHC (`sfx/`)
- `hit 1.mp3`, `hit 2.mp3`, `hit 3.mp3` — tackle hits
- `2 ka-ching_01.mp3` — coin pickup
- `3 power up_01.mp3` — unit unlock
- `4 Magic Revealed_01.mp3` — level up reveal
- `0 bgm_01 v2.mp3` — background music
- `6 intro button and endcard button.wav` — endcard CTA

### New SFX needed
- Dragon roar / fire breath (level 3 reveal)
- Horde ambience / tension drone (level 3)

---

## 10. Code Structure (single HTML)

Same pattern as `HHC_playable_v0.9.html`:

```
<!DOCTYPE html>
<html><head>
  <style>/* all CSS, base64 fonts */</style>
</head><body>
  <div id="game">
    <div id="hud">...</div>
    <div id="battlefield">
      <div class="lane">
        <!-- units injected here -->
      </div>
    </div>
    <div id="wave-info">...</div>
    <div id="card-stack">
      <div id="card-hero">...</div>
      <div id="card-ogre">...</div>
      <div id="card-knight">...</div>
    </div>
    <div id="intro">...</div>
    <div id="endcard">...</div>
  </div>
  <script>
    // game state
    const STATE = { level: 1, kills: 0, coins: 0, units: [], enemies: [], unlocks: {} };

    // spawn loops
    function spawnHero() { /* on tap */ }
    function autoSpawnLoop(unitType, cooldown) { /* setInterval */ }

    // battle tick (60fps)
    function gameTick(dt) {
      moveUnits(dt);
      resolveCollisions();
      tickTackles(dt);
      checkUnlocks();
      checkWaveClear();
    }

    // transitions
    function panToNextLevel() { /* CSS transform animation */ }
    function showHordeAndDragon() { /* level 3 sequence */ }

    // tutorial
    function showGuideHand(x, y) { /* reuse from HHC */ }
  </script>
</body></html>
```

### Key functions to write
- `spawnUnit(type, side)` — creates DOM element, adds to `STATE.units`
- `moveUnits(dt)` — translate-x each unit by speed × dt
- `resolveCollisions()` — when player unit overlaps enemy in lane, lock both, start tackle interval
- `tickTackles(dt)` — every 600ms apply DMG, white flash, recoil; on HP=0 → die anim
- `onEnemyKilled()` — STATE.kills++, drop coin, check unlocks, check wave clear
- `panToNextLevel()` — CSS scale + translate transition
- `showEndcard()` — same as HHC

---

## 11. Build / Delivery

| Platform | File | Notes |
|---|---|---|
| AppLovin | `HeroSwarm_v01_AppLovin.html` | Standard, no special init |
| Unity Ads | `HeroSwarm_v01_UnityAds.html` | `mraid.open(url)` for CTA |
| Google Ads | `HeroSwarm_v01_GoogleAds.zip` | `ExitApi.exit()` for CTA, zip with index.html |

Single-file HTML, all assets base64. Target size: under 5 MB per platform (HHC v2 is ~3.7 MB — should fit).

---

## 12. Development Order (suggested)

1. **Skeleton HTML/CSS** — layout, card stack, HUD, battlefield container.
2. **Hero spawn on tap** — manual spawn, walk right, basic DOM unit.
3. **Single enemy type** — spawn from right, walk left, basic collision + tackle loop.
4. **Coin drop + counter** — kill → coin flies to top-right (reuse HHC `animateCoinsBurst`).
5. **Unlock system** — Ogre at 3 kills, Knight at 8 kills, with burst animation.
6. **Auto-spawn loops** — Ogre/Knight setInterval spawners.
7. **Multiple enemy types** — goblin grunt, brute mini-boss with 20 HP.
8. **Wave clear + level transition** — pan/zoom CSS, banner, level 2 enemies.
9. **Level 2 full play** — different enemies, troll mini-boss.
10. **Level 3 horde reveal** — 100+ enemy sprites, camera zoom out, Dragon mega-spawn.
11. **Tutorial mãozinhas** — all 9 steps wired.
12. **SFX integration** — base64 mp3s, trigger points.
13. **Polish** — particles, hit flashes, coin trails, screen shake on big kills.
14. **Builds** — three platform exports.
15. **Test on real devices** — phone portrait.

---

## 13. Open Questions for Future Iteration

- Should the Hero have an **evolve/upgrade mechanic** mid-playable (e.g. after level 2, Hero gains red glow + 2x DMG)? Could mirror HHC's evolve-button satisfaction.
- Should unit unlocks show a **stars-fill animation** like HHC's evolve stars? Strong visual reuse.
- Per-level **BGM swap** or just filter changes for tension?
- Localization: any text needs PT/ES/etc variants for different ad networks?
