# Project context — bss_hhc_playable

Two playable ads in the same repo:

- **HeroSwarm/** — new tap-to-summon top-down auto-battler (active development)
- **HHC_Playable/** — original *Hero Hero Clicker* playable (reference & asset source)

Stack is plain HTML / CSS / JS bundled into a single `.html` file with all images, sounds, and the font embedded as base64. No frameworks, no build pipeline beyond a small Node bundler.

---

## About the user

- Marketing professional focused on mobile games & User Acquisition.
- **Beginner in programming.** Explanations should be clear, practical, step-by-step. Don't assume technical fluency.
- Communicates in Portuguese; **all code stays in English.**

---

## Folder layout

```
Playable/                                 ← repo root (= bss_hhc_playable)
├── CLAUDE.md                             this file
├── .gitignore                            ignores node_modules, screenshots, *.rar/*.zip
│
├── HeroSwarm/                            ← active project
│   ├── HeroSwarm_playable_v0.1.html      master single-file playable (~2.3 MB)
│   ├── assets/                           trimmed Herois sprites in active use
│   │   ├── intro-hero.png  (Hero in-battle + intro panel — comes from HHC v02)
│   │   ├── player.png      (Hero CARD round portrait only)
│   │   ├── lenhador.png    (Manly Lumberjack — was Ogre)
│   │   ├── igris.png       (Knight)
│   │   ├── babyorc.png     (Goblin grunt — flipped)
│   │   ├── juggermon2.png  (Brute mini-boss — flipped)
│   │   ├── gon2.png        (Skeleton — flipped)
│   │   ├── gon3.png        (Captain — flipped)
│   │   ├── ogro.png        (Troll mini-boss — flipped)
│   │   └── overlord.png    (Demon Lord uber-boss — flipped)
│   ├── extracted_v02/                    PNGs pulled from HHC v02 build (intro-hero, buttons, icons)
│   ├── qa/                               puppeteer harness + bundler + build script
│   │   ├── bundle_assets.cjs             ★ inject sprites/sounds into master HTML
│   │   ├── build.cjs                     ★ generate AppLovin / Unity Ads / Google Ads packages
│   │   ├── extract_v02_assets.cjs        re-extract assets from HHC v02
│   │   ├── snap_l1.cjs / snap_l3.cjs / snap_combat.cjs / snap_intro.cjs / snap_dragon.cjs
│   │   ├── qa.cjs / redesign_check.cjs / dragon_test.cjs / syntax_check.cjs
│   │   ├── dbg_dragon.cjs / debug_qa.cjs (ad-hoc debug)
│   │   └── screenshots/                  generated; gitignored
│   ├── builds/                           output: AppLovin html / Unity Ads html / Google Ads html+zip
│   └── docs/
│       ├── GDD.md                        original concept & game-design notes
│       └── ASSETS_PENDING.md             art that still needs creating (mostly stale; most slots now filled)
│
├── HHC_Playable/                         ← original reference, do not edit
│   ├── HHC_playable_v0.9*.html           portrait / landscape / merged source HTMLs
│   ├── art/                               ★ source PNGs + RifficFree-Bold.ttf — bundler reads these
│   ├── sfx/                               ★ source MP3s + WAV — bundler reads these
│   ├── builds/v01,v02,v03/               original platform packages
│   ├── CLAUDE.md / CONTEXTO.md           HHC project notes (Portuguese)
│   └── (footage)/                        Illustrator source files
│
└── Herois/                               full sprite library (88 PNGs) shared between projects
```

The bundler points at:
- `HHC_Playable/art/` for HHC art + the RifficFree font
- `HHC_Playable/sfx/` for all audio
- `HeroSwarm/assets/` for the trimmed Herois sprites we actively use

---

## Workflow — common commands

All run from `HeroSwarm/`:

| Need | Command |
|---|---|
| Inject latest assets into master HTML | `node qa/bundle_assets.cjs` |
| Take an L1 mid-combat screenshot | `node qa/snap_l1.cjs` |
| Take an L3 horde screenshot | `node qa/snap_l3.cjs` |
| Take a tackle / lunge screenshot | `node qa/snap_combat.cjs` |
| Take an intro-screen screenshot | `node qa/snap_intro.cjs` |
| Test Dragon (Demon Lord) flow + FAIL screen | `node qa/dragon_test.cjs` |
| Quick smoke (no errors, intro closes, hero spawns) | `node qa/syntax_check.cjs` |
| Re-extract HHC v02 button/icon PNGs | `node qa/extract_v02_assets.cjs` |
| Generate platform packages (AppLovin / Unity / Google) | `node qa/build.cjs` |
| Smoke-test a built package | `node qa/smoke.cjs builds/HeroSwarm_v01_AppLovin.html` |

After **any** asset swap (sprite, sfx, font), always run `node qa/bundle_assets.cjs` so the changes are baked into the master HTML.

After **any** master-HTML change you want to ship, run `node qa/build.cjs` to regenerate the three platform packages in `builds/`.

---

## Master HTML — code map

`HeroSwarm/HeroSwarm_playable_v0.1.html` is one file. Key blocks (line numbers drift; search by name):

| Block | What it is |
|---|---|
| `@font-face Riffic` | injected at top of `<style>` by bundler |
| `var SPRITES = { ... }` | base64 PNGs slot — populated by bundler |
| `var SOUNDS = { ... }` | base64 audio slot — populated by bundler |
| `var UNIT_TYPES`, `var ENEMY_TYPES` | stats: `w h hp dmg speed aoe`. Internal type keys: `hero ogre knight goblin brute skeleton captain troll dragon` |
| `var SPAWN_COOLDOWN` | `{ hero: 750, ogre: 2000, knight: 3000 }` ms |
| `var SPRITE_VISUAL_SCALE` | per-type visual upscale factor (currently 1.89× for all Herois sprites) |
| `var COMBAT_GAP`, `var LUNGE_AMOUNT` | combat spacing + tackle lunge amplitude |
| `var DRAGON_KILL_LIMIT` | 10 — Demon Lord triggers FAIL after this many kills |
| `var WAVES = { 1: [...], 2: [...] }` | enemy formations (instant-spawn at level start) |
| `var LEVEL3_MOBS = [...]` | 30 pre-placed enemies for L3 + Demon Lord |
| `function createActor` | builds DOM actor with object-fit: contain (preserves PNG aspect) |
| `function applyActorTransform` | sets translate3d + z-index = floor(y) for top-down depth |
| `function moveActors` / `acquireTargets` / `findClosestEnemy` | top-down steering |
| `function resolveStacking` | rigid-body separation (player↔player 50/50, player↔enemy one-way) |
| `function resolveCollisions` / `tickTackles` / `applyAoeDamage` | combat |
| `function unlockUnit` | Ogre at 3 kills, Knight at 20 (Level 1 clear) |
| `function spawnDragon` / `triggerDragonFireBreath` / `showFailScreen` | L3 finale |
| `goToStore`, `STORE_URL_ANDROID`, `STORE_URL_IOS` | install CTA — same URLs as original HHC playable |

---

## Naming gotchas (USER-FACING vs INTERNAL)

| Internal type-key (don't rename) | User-facing label |
|---|---|
| `ogre` | "MANLY LUMBERJACK" |
| `dragon` | "DEMON LORD" |
| `goblin` | "GOB" placeholder text (or just the sprite) |

Don't rename the internal keys — many functions reference them by string.

---

## Naming / style conventions

- ES5-ish JS (var, function expressions). One file, no modules. Don't introduce ES6 modules or transpilation.
- All names in English. Comments may be brief Portuguese hints if the user asked, but new code should be English by default.
- CSS: lots of inline-block flex layouts, no preprocessor.
- File-size budget: target **under 5 MB** per built HTML (ad networks limit). Currently ~2.3 MB master, ~2.3 MB per platform package.
- File is portrait 1080×1920 only.

---

## Running git

- Branch: `main` tracking `origin/main`.
- Author identity in repo: `marceloreznicek <marceloreznicek@users.noreply.github.com>` (no-reply form for privacy — never let the real gmail land in commits).
- The user's GitHub email-privacy setting blocks pushes containing the real address; if it surfaces again, amend with `git commit --amend --reset-author` after `git config user.email "marceloreznicek@users.noreply.github.com"`.

---

## Non-negotiable

1. **Never commit** `marcelo.reznicek@gmail.com` to git history.
2. **Don't edit** `HHC_Playable/*.html` — that's a frozen reference build.
3. **Always re-run `node qa/bundle_assets.cjs`** after touching `assets/` or `HHC_Playable/sfx/`.
4. The bundler regex must match the **whole** quoted value (`'[^'\n]*'`), not stop at the first comma — base64 data URLs contain `,` after `base64`. Stopping at the first comma was a real bug that ballooned the file from 2 MB → 7 MB. The fix is in `qa/bundle_assets.cjs`; don't regress it.
