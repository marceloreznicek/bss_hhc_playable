# HeroSwarm — Pending Assets

The playable is **fully functional** with CSS placeholders. To swap in real art, populate the `SPRITES` and `SOUNDS` registries inside `HeroSwarm_playable_v0.1.html` with base64 dataURLs. No other code changes required.

## How to add a real asset

1. Convert the PNG/MP3 to base64:
   ```bash
   base64 -w 0 hero_red.png > hero_red.b64
   ```
2. Edit `HeroSwarm_playable_v0.1.html`, find the `SPRITES` block (or `SOUNDS`), set the key:
   ```js
   var SPRITES = {
     hero: 'data:image/png;base64,iVBORw0KGgo...', // ← paste here
     ...
   };
   ```
3. Reload — placeholder is replaced. No bob/lunge/death anim changes needed (CSS handles that).

## Sprites needed (single static PNG per character, facing right)

| Key | File | Size (px) | Notes |
|---|---|---|---|
| `hero` | `hero_red.png` | ~130×180 | Main character, **red hair**, signature outfit |
| `ogre` | `ogre_crusher.png` | ~160×200 | Bulky, club, green skin |
| `knight` | `knight.png` | ~130×180 | Plate armor, sword |
| `dragon` | `dragon.png` | ~380×280 | Mega-unit, large, breathing fire |
| `goblin` | `enemy_goblin.png` | ~100×140 | Level 1 grunt — most numerous |
| `brute` | `enemy_brute.png` | ~200×240 | Level 1 mini-boss (20 HP) |
| `skeleton` | `enemy_skeleton.png` | ~110×150 | Level 2 grunt |
| `captain` | `enemy_captain.png` | ~130×170 | Level 2 elite |
| `troll` | `enemy_troll.png` | ~220×260 | Level 2 mini-boss |
| `bgL1` | `bg_battlefield_l1.png` | 1080×780 | Level 1 forest background |
| `bgL2` | `bg_battlefield_l2.png` | 1080×780 | Level 2 wasteland/outskirts |
| `bgL3` | `bg_battlefield_l3.png` | 1080×780 | Level 3 horde plain |
| `hand` | `hand_pointer.png` | ~140×140 | Tutorial pointing hand (HHC's `hand_pointer.png` works) |
| `banner` | `banner_level_up.png` | ~700×180 | "LEVEL X" banner art (optional, CSS fallback works) |

**Important:** All sprites should face **right**. Enemies are auto-mirrored via CSS `scaleX(-1)`. Saves you doing both directions.

## Sounds needed (MP3, base64-embedded)

| Key | File | Notes |
|---|---|---|
| `hit` | `hit_1.mp3` | Reuse from HHC `sfx/hit 1.mp3` |
| `hit2` | `hit_2.mp3` | Reuse from HHC `sfx/hit 2.mp3` |
| `hit3` | `hit_3.mp3` | Reuse from HHC `sfx/hit 3.mp3` |
| `coin` | `kaching.mp3` | Reuse from HHC `sfx/2 ka-ching_01.mp3` |
| `unlock` | `power_up.mp3` | Reuse from HHC `sfx/3 power up_01.mp3` |
| `levelup` | `magic_revealed.mp3` | Reuse from HHC `sfx/4 Magic Revealed_01.mp3` |
| `spawn` | `clink.mp3` | Reuse from HHC `sfx/1 clink.mp3` |
| `dragon` | `dragon_roar.mp3` | **NEW — needs creation** (~2s roar/fire-breath) |
| `aoe` | `dragon_aoe.mp3` | **NEW — needs creation** (~0.5s big impact / boom) |
| `cta` | `endcard_btn.wav` | Reuse from HHC `sfx/6 intro button and endcard button.wav` |
| `bgm` | `bgm_loop.mp3` | Reuse from HHC `sfx/0 bgm_01 v2.mp3` |

Until real audio is wired, the game uses **WebAudio synth tones** so each trigger point is audible during dev.

## Priority

1. **Hero, Goblin, Goblin Brute** — needed to make level 1 visually polished (the first ~25s players see).
2. **Ogre, Knight** — round out the player roster.
3. **Skeleton, Captain, Troll** — level 2.
4. **Dragon + 3 backgrounds** — finale impact.
5. **Hand pointer + banner** — tutorial polish.

The placeholders are functional but readable as "boxes with letters" — fine for internal dev/tests, not for ad-network submissions.
