# PartyBuilder — Game Design Document

**Codename:** PartyBuilder
**Format:** Single-file HTML5 playable ad, portrait 1080×1920
**Target duration:** 30–45 seconds end-to-end (intro → 1st attempt → fail → 2nd attempt → CTA)
**Stack:** Plain HTML / CSS / JS. No frameworks. Bundled into one `.html` with assets as base64. Same toolchain pattern as `HeroSwarm/`.
**Status:** Concept locked (Concept A — "Tavern Draft" from brainstorm).

---

## 1. Pitch

> You walk into a tavern with a coin purse and a problem: a monster is loose. Hire a party, send them in, hope they survive. They never do — not the first time. Now your heroes are *tired* and *expensive*. Spend smart, swap smart, win the second run, install the game.

The hook is the **tired/expensive mechanic**: the second attempt is not a free retry, it's a real economic decision. That tension is what the playable sells.

---

## 2. Core loop

```
SHOP (pick heroes within budget)
   │
   ▼
MISSION (auto-battle plays out, ~10s)
   │
   ├── WIN  → Boss wave → CTA
   │
   └── LOSS → "TIRED" debuff applied to used heroes
              (greyed sprite, ⚡ icon, +50% price)
              │
              ▼
         SHOP again (gold refunded partially, must rebuild)
              │
              ▼
         MISSION 2 (usually wins) → CTA
```

The full playable is two missions max. We **want** the player to lose Mission 1 — it's the moment that teaches the mechanic. Mission 1 is tuned to be unwinnable with the cheapest builds.

---

## 3. Player goal

**Stated goal (on screen):** *Defeat the Demon Lord.*
**Real goal (UA funnel):** Experience the hire → fight → fail → rebuild → win loop and tap **INSTALL**.

---

## 4. Screens

### 4.1 Intro (≈3s, skippable on tap)

- Full-screen panel with a dramatic shot of the Demon Lord and one battered Hero.
- Headline: **"The Demon Lord is here. Hire your party."**
- Sub: "100 GOLD. Choose wisely."
- Tap anywhere → Shop.

### 4.2 Shop / Tavern (the main screen)

Layout (1080×1920 portrait):

```
┌──────────────────────────────┐
│  GOLD: 100 🪙       [GO ▶]   │  ← top bar, GO disabled until ≥1 hero in party
├──────────────────────────────┤
│                              │
│      HEROES FOR HIRE         │
│                              │
│   ┌────┐ ┌────┐ ┌────┐       │
│   │ 🗡️ │ │ 🛡️ │ │ 🏹 │       │  ← 6 hero cards in a 3×2 grid
│   │ 30 │ │ 45 │ │ 35 │       │     each shows: portrait, name, price,
│   └────┘ └────┘ └────┘       │     tiny HP/DMG/SPD icon row
│   ┌────┐ ┌────┐ ┌────┐       │
│   │ 🪓 │ │ ✨ │ │ 👹 │       │
│   │ 25 │ │ 60 │ │ 20 │       │
│   └────┘ └────┘ └────┘       │
│                              │
├──────────────────────────────┤
│      YOUR PARTY (3 slots)    │
│   ┌───┐  ┌───┐  ┌───┐        │
│   │   │  │   │  │   │        │  ← drag heroes here OR tap card to add
│   └───┘  └───┘  └───┘        │
└──────────────────────────────┘
```

- **Tap** a shop card → adds to first empty party slot, deducts gold. (Drag is a stretch goal; tap is MVP.)
- **Tap** a party slot → returns hero to shop, refunds gold.
- **GO** activates when ≥1 hero is in party.
- If a card is unaffordable → it greys out and shows the price in red.
- **Tired heroes** (Mission 2 only) show a ⚡ overlay, grey filter, and a higher price.

### 4.3 Mission / Combat (~8–12s)

- Camera tilts down to a battlefield (reuse HeroSwarm's top-down look).
- Player heroes spawn from the LEFT, enemies from the RIGHT.
- Auto-battle. No player input during combat. (Optional polish: a tap-to-cheer that gives a tiny temporary buff — see §10.)
- HUD: small HP bars over each unit. A "WAVE 1/2" header.
- **Mission 1:** ~6 goblins + 1 brute. Tuned so a 100g build cannot quite kill them all.
- **Mission 2 (after rebuild):** same enemy comp. Now the player has either better heroes, or smarter composition, or both.

### 4.4 Result screens

- **Defeat (after Mission 1):** big red banner "YOUR PARTY FELL". Sub: *"Survivors are TIRED. Hire wisely."* Auto-advances to Shop after 1.5s.
- **Victory (after Mission 2):** Demon Lord cinematic burst, "VICTORY!" banner, gold-coin shower. After 1s → CTA.
- **(Optional sad-path) Defeat on Mission 2:** rare. Shows soft fail screen with **PLAY FULL GAME** CTA — losing players still convert.

### 4.5 CTA / End card

- Full screen: game logo, App Store + Play Store buttons (use same `goToStore` URLs as HHC).
- "INSTALL FREE" pulsing button.
- Tap anywhere → store.

---

## 5. Heroes — roster for the playable

We use 6 heroes total in the shop. All sprites already exist in `Herois/`.

| Sprite key | Display name | Price | HP | DMG | SPD | Role |
|---|---|---|---|---|---|---|
| `lenhador` | Lumberjack | **25** | 60 | 8 | 1.0 | Cheap melee fodder |
| `babyorc` | Squire | **30** | 70 | 10 | 1.1 | Balanced melee |
| `cacador` | Hunter | **35** | 45 | 14 | 1.2 | Ranged, glass cannon |
| `igris` | Knight | **45** | 120 | 12 | 0.9 | Tank |
| `magos` | Mage | **60** | 50 | 22 (AoE) | 0.8 | AoE nuker |
| `paladino` | Paladin | **70** | 140 | 18 | 1.0 | Premium all-rounder (out of reach on 1st run) |

**Budget = 100g.** This is deliberately tight:
- Cheapest viable party (Lumberjack + Squire + Squire = 85g) — loses Mission 1.
- 1× Knight + 1× Lumberjack = 70g, 2 slots — loses Mission 1.
- 1× Mage + 1× Lumberjack = 85g — *can* win if the Mage hits AoE perfectly. ~10% of players find this.

Mission 1 is **tuned to lose** for >85% of compositions.

### 5.1 Tired mechanic (the hook)

When a hero participates in a failed mission:
- Sprite gets a **grey filter + ⚡ overlay** in the shop.
- Price increases by **+50%** (rounded up). Lumberjack 25 → 38, Knight 45 → 68, etc.
- HP reduced by **20%** when re-deployed.
- A small tooltip on tap: *"Tired — fought last mission. -20% HP, costs more."*

After Mission 1 loss, the player is given a refund: **gold reset to 110g** (a small +10g "innkeeper's pity"). Just enough to make a smarter rebuild possible — *if* you swap tired heroes for fresh ones.

### 5.2 The intended "aha" path

> Player picks 3 cheap heroes → loses Mission 1 → sees them tired and expensive → realizes hiring tired heroes again is bad value → drops them, hires the Mage or Knight → wins Mission 2 → CTA.

---

## 6. Enemies

Reuse HeroSwarm enemy types (sprites already trimmed):
- **Goblin** (`gon2`) — fast, low HP, low dmg. The Mission 1 fodder (×6).
- **Brute** (`juggermon2`) — slow, high HP, AoE smash. Mission 1 mini-boss (×1).
- **Demon Lord** (`overlord`) — final wave on Mission 2 only. Big sprite, fire-breath visual reused from HeroSwarm.

Two waves per mission:
- **Wave 1:** 4 goblins (spawns from right immediately).
- **Wave 2 (5s later):** 2 goblins + 1 brute. On Mission 2, after brute dies → Demon Lord appears.

---

## 7. Economy tuning table

| Source | Amount |
|---|---|
| Starting gold (Mission 1) | 100g |
| Refund on Mission 1 loss | full refund of unspent + 60% of spent → reset to **110g** total |
| Tired price multiplier | ×1.5 |
| Tired HP penalty | −20% |
| Mission 2 budget feels like | ~70g of "real" buying power if reusing tired heroes; 110g if rebuilding fresh |

This is the lever to pull during QA tuning. Aim: **~75% of players win Mission 2.**

---

## 8. Audio

Reuse from `HHC_Playable/sfx/`:
- Coin pickup → on hire / refund.
- Sword clash → combat hit.
- Crowd cheer → victory.
- Sad horn → defeat.
- Demon Lord roar → reuse from HeroSwarm.

No new audio needed. All 5 SFX already exist as MP3 in HHC's sfx folder.

---

## 9. Technical notes

### 9.1 File budget
- Target master HTML: **< 3 MB** (well under the 5 MB ad-network limit).
- Reuse only the 6 hero sprites + 3 enemy sprites + 1 background → ~10 PNGs total.
- Reuse RifficFree-Bold.ttf (already in HHC).
- Bundler regex must handle base64 commas (see CLAUDE.md non-negotiable #4).

### 9.2 Code structure (one file, mirroring HeroSwarm)
```
<style>
  @font-face Riffic
  ... layout ...
</style>

<script>
  var SPRITES = { ... }            // bundler fills
  var SOUNDS  = { ... }            // bundler fills

  var HEROES = { lenhador: {...}, babyorc: {...}, ... }
  var ENEMIES = { goblin: {...}, brute: {...}, dragon: {...} }

  var STATE = {
    gold: 100,
    party: [],            // array of hero keys
    shop: [...],          // current shop offers
    tiredSet: new Set(),  // hero keys that fought a failed mission
    mission: 1,
  }

  function renderShop()        // builds the 6 cards
  function renderParty()       // builds the 3 slots
  function hireHero(key)       // shop → party
  function dismissHero(key)    // party → shop, refund
  function startMission()      // shop → combat
  function tickCombat()        // copy from HeroSwarm
  function onMissionEnd(won)   // wires fail/win
  function applyTired()        // marks party heroes as tired
  function showCTA()           // store buttons
</script>
```

### 9.3 Reused from HeroSwarm
- `createActor` / `applyActorTransform` — top-down rendering.
- `moveActors` / `acquireTargets` / `findClosestEnemy` — steering.
- `resolveCollisions` / `tickTackles` / `applyAoeDamage` — combat.
- `goToStore`, `STORE_URL_ANDROID`, `STORE_URL_IOS` — CTA.

### 9.4 New code only
- Shop UI (DOM cards, drag/tap handlers).
- Party slot manager + gold counter.
- Tired-state tracker + visual filter.
- Fail-screen → shop transition (instead of HeroSwarm's restart).

---

## 10. Stretch / polish (only after MVP works)
- **Tap-to-cheer:** during combat, taps drop a "rally" pulse that gives nearby heroes +20% speed for 1s.
- **Synergy tags:** "2× melee = +10% DMG"; "Mage + Tank = +HP shield." Adds depth, more reasons to re-comp.
- **Drag-and-drop hire** instead of tap-to-add.
- **Preview-on-hover** showing hero stats in a tooltip.
- **Combo bonus on Mission 2 win** ("FRESH PARTY +50g shown on result").

---

## 11. Build pipeline (mirrors HeroSwarm)

```
PartyBuilder/
├── PartyBuilder_v0.1.html        ← master
├── assets/                        ← 6 hero pngs + 3 enemy pngs + bg
├── qa/
│   ├── bundle_assets.cjs          ← copy from HeroSwarm, retarget paths
│   ├── build.cjs                  ← AppLovin / Unity / Google packages
│   ├── snap_shop.cjs              ← screenshot the shop
│   ├── snap_combat.cjs            ← screenshot mid-mission
│   ├── snap_tired.cjs             ← screenshot the tired-state shop
│   └── syntax_check.cjs           ← smoke test
├── builds/                        ← outputs
└── docs/
    └── GDD.md                     ← this file
```

Bundler reads from:
- `HHC_Playable/art/` for the Riffic font.
- `HHC_Playable/sfx/` for all 5 SFX.
- `PartyBuilder/assets/` for new sprites + bg.

---

## 12. Success metrics (post-launch reference)

| Metric | Target |
|---|---|
| Tutorial / intro completion | ≥ 90% |
| Mission 1 played to end | ≥ 80% |
| Reach Shop again (post-fail) | ≥ 70% |
| Mission 2 won | ≥ 50% of those who reach it |
| CTA tap-through | ≥ 25% overall |

The "reach Shop again" number is the one that proves the tired/expensive hook is working. If players quit on the fail screen instead of rebuilding, the loop is broken — tighten the refund or speed up the transition.

---

## 13. Open questions to resolve in pre-production

1. **Drag vs tap to hire** — start tap-only; revisit if user-test feedback says it feels flat.
2. **Mission 1 must-lose vs winnable** — current plan: tuned so ~10% win the first try. Should we allow it? Yes — those players still see the Demon Lord on Mission 2 and convert.
3. **Tired refund formula** — flat reset to 110g vs. proportional refund. Flat is simpler to communicate.
4. **3 vs 4 party slots** — start with 3 for clarity. 4 if combat feels too sparse.
5. **Skip-to-end button** — every playable spec sheet asks for one. Add a tiny `INSTALL` button in the top corner from frame 1.

---

*End of GDD.*
