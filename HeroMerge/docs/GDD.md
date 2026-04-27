# HeroMerge — Game Design Document (v0.1)

A merge × auto-battler playable, built on the HeroSwarm engine.
**One screen. One button. One drag gesture.**

---

## 1. Concept (one paragraph)

Tap **SUMMON** to drop weak Recruits onto the battlefield. **Drag** any unit
onto another of the same kind and they merge into a stronger unit. When the
player picks one up, every same-kind unit nearby is **magnetically pulled in**
and the whole cluster fuses in one satisfying poof. Combat is fully automatic
— the player's only job is summon, drag, repeat. Survive three waves and kill
the Demon Lord.

---

## 2. Layout — identical to HeroSwarm

```
┌────────────────────────────────────┐
│        KILL THE HORDE              │   header (unchanged)
├────────────────────────────────────┤
│                                    │
│   BATTLEFIELD                      │   destroyed-city / night / cave
│   • enemies pre-placed (waves)     │   backdrops from HeroSwarm v2
│   • your units roam bottom half    │   units fight + can be dragged
│   • drag-to-merge happens HERE     │   (no separate "tray")
│                                    │
├────────────────────────────────────┤
│        ┌──────────────────┐        │
│        │     SUMMON       │        │   ← single big button (replaces
│        └──────────────────┘        │     HeroSwarm's 3 cards)
│                                    │
│        Level 1 — Kills 0/20        │   wave HUD (unchanged)
└────────────────────────────────────┘
```

Same 1080×1920 portrait canvas. Same banner, wave counter, fail screen, endcard.
The only structural change vs HeroSwarm v2: the bottom 3 unit cards collapse
into one big SUMMON button. Everything else is reused.

---

## 3. Core loop (5 beats, ~30 seconds)

1. **Summon** — Player taps SUMMON. A Tier-1 Recruit spawns at a random open
   spot in the bottom half of the battlefield. Cooldown ~700ms.
2. **Auto-fight** — The Recruit walks toward the nearest enemy and attacks.
3. **Merge** — Player drags one unit onto another of the same tier. Both are
   consumed; one Tier-2 unit appears at the drop point.
4. **Magnetic chain** — The instant the player touches a unit, every other
   same-tier unit within ~350px slides toward the touched unit. On release,
   the whole cluster fuses into ONE next-tier unit. (One drag = one merge
   event, regardless of how many units join.)
5. **Escalate** — Tougher enemies arrive each wave. Player must reach higher
   tiers fast enough to keep the front line alive. Level 3 ends with the
   Demon Lord; killing him = win, dying to him = fail.

The whole loop fits inside the same 30-second video pattern as HeroSwarm.

---

## 4. The signature mechanic — Magnetic Merge

This is the thing that makes HeroMerge feel different from every other merge
playable.

**Behavior:**

- Player touches a unit (pointerdown / touchstart).
- All other units of the **same tier** within a 350px radius begin lerping
  toward the touched unit's position at ~600 px/s.
- The touched unit follows the player's finger.
- The cluster pinches into the finger's position. A circular "merge ring"
  effect plays (reuse `aoe-ring` CSS).
- On release (pointerup), all units in the cluster despawn with a tiny scale
  poof. A single Tier-N+1 unit appears at the release point with a brief
  "spawn" flash.
- If the player holds for >0.6s without moving, the merge auto-fires (so
  beginners aren't punished for not knowing they need to release).

**Why it's the right mechanic for a 30-sec playable:**

- Teaches itself: the moment you touch a unit, you SEE same-kind units flying
  toward your finger. The merge rule is communicated through animation, not
  text.
- One gesture = one merge = one big new unit. No fiddly multi-pair drag.
- Reads great in UA video creatives — the "swoosh + poof + bigger unit" beat
  is exactly the "watch number go up" satisfaction merge games sell.
- Forgiving on touch: even a sloppy drag works because everything snaps to
  the finger.

**Tunables:**

| Knob | Start value | Notes |
|---|---|---|
| Magnetic radius | 350 px | Bigger = easier; smaller = more strategic |
| Pull speed | 600 px/s | Should land in ~0.4s from edge of radius |
| Hold-to-fire delay | 600 ms | Auto-fires if player just holds still |
| Min cluster size | 2 | Single unit + 1+ pulled-in units |

---

## 5. Tier ladder (reuses HeroSwarm sprites)

| Tier | Name | Sprite (existing) | HP | Damage | Speed |
|---|---|---|---|---|---|
| 1 | Recruit | hero (intro-hero.png) | 60 | 8 | 220 |
| 2 | Lumberjack | ogre (lenhador.png) | 140 | 18 | 180 |
| 3 | Knight | knight (igris.png) | 280 | 32 | 160 |
| 4 | Brute | brute (juggermon2.png) | 520 | 55 | 130 |
| 5 | Champion | dragon (overlord.png) | 1200 | 120 (AoE) | 110 |

Stats lifted from HeroSwarm's existing UNIT_TYPES / ENEMY_TYPES tables —
already balanced, already feel right.

**Merge cost:** 2 of tier N → 1 of tier N+1. Magnetic chain can fuse more
than 2 at once (e.g. 5 Recruits → 1 Lumberjack), but the result is always
exactly **one** unit one tier higher. Excess units are "consumed" — that's the
strategic cost of the magnetic shortcut.

---

## 6. Enemies + waves — reuse HeroSwarm

| Wave | Source | Enemies |
|---|---|---|
| Level 1 | `WAVES[1]` | 20 Goblins + 1 Brute, destroyed-city backdrop |
| Level 2 | `WAVES[2]` | 16 Skeletons + 4 Captains + 1 Troll, night backdrop |
| Level 3 | `LEVEL3_MOBS` | 30 mixed mobs + Demon Lord, cave backdrop |

Same `bottomHalfY()` remap so all enemies live in the player's working area.
Same `DRAGON_KILL_LIMIT = 10` Fire Breath fail trigger.

---

## 7. Tutorial — 3 steps, magnetic teaches itself

| Step | Trigger | Bubble | Guide hand |
|---|---|---|---|
| 1 | Intro closed | "TAP SUMMON!" | Pulses on the SUMMON button |
| 2 | After 2nd Recruit spawned | "DRAG TO MERGE!" | Demonstrates a drag from one Recruit to another → magnetic effect plays → first Lumberjack appears |
| 3 | First merge complete | (silent — let the player play) | hidden |

After step 2, the magnetic pull animation does all the teaching. Players see
that touching a unit pulls others in, and they intuit the rest.

---

## 8. Win / fail / endcard

- **Win:** Demon Lord killed → endcard.
- **Fail:** Demon Lord lands the Fire Breath (10 player units killed) → fail
  screen → endcard.
- **Endcard:** reuse HeroSwarm v2's intro-hero portrait + green PLAY NOW
  button. Text: **"PLAY NOW TO BUILD YOUR ARMY"** (or A/B-test against
  "MERGE TO SAVE THE KINGDOM").

---

## 9. Player tension — what makes it strategic, not just spammy

Every Recruit on the field is **simultaneously**:
- a fighter (they auto-attack)
- a merge ingredient (they're a Tier-1 you can fuse)

Merging is destructive — you trade 5 Recruits for 1 Lumberjack. The
Lumberjack is much stronger, but you just lost 4 bodies on the front line.
Spam-merging too early = enemies break through while your Lumberjack is
walking out. Hoarding low-tier units = the Brute boss one-shots them.

**The interesting decision every 3 seconds:** *"Do I summon more bodies, or
fuse what I have?"* That tension is what makes the loop replayable in a
30-second window.

---

## 10. Asset reuse — net new art = zero

| Asset | Source | Used as |
|---|---|---|
| `hero` (intro-hero.png) | HeroSwarm/assets/ | Tier 1 Recruit + endcard portrait |
| `ogre` (lenhador.png) | HeroSwarm/assets/ | Tier 2 Lumberjack |
| `knight` (igris.png) | HeroSwarm/assets/ | Tier 3 Knight |
| `brute` (juggermon2.png) | HeroSwarm/assets/ | Tier 4 Brute |
| `dragon` (overlord.png) | HeroSwarm/assets/ | Tier 5 Champion |
| 3 backdrops | sprites/backgrounds/ | L1 / L2 / L3 |
| All SFX | HHC_Playable/sfx/ | unchanged |
| Riffic font | HHC_Playable/art/ | unchanged |

Reuse `power up_01.mp3` for the merge poof. Reuse `clink.mp3` for summon.

---

## 11. Code budget — estimate

| System | LoC | Notes |
|---|---|---|
| Drag-to-merge interaction | ~120 | Pointer events on actors; track held actor + drop target |
| Magnetic attraction (per frame lerp) | ~60 | Inside `moveActors`; same-tier units within R lerp toward held actor |
| Merge resolution | ~40 | On release: despawn cluster, spawn next tier at touch point, play flash |
| SUMMON button + cooldown | ~30 | Replaces the 3-card UI |
| Tutorial swap | ~40 | New 3-step flow |
| Layout edits | ~20 | Remove 3-card row, insert single SUMMON |
| **Total** | **~310 LoC** | One-file edit, no new build pipeline |

Everything else (auto-combat, waves, backdrops, fail screen, endcard, store
CTA, build script) is **reused unchanged** from HeroSwarm v2.

---

## 12. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Drag on tiny mobile sprites is fiddly | Hit area = sprite bounds + 30px halo. Auto-fire on hold-still as a fallback. |
| Magnetic radius too big = trivial; too small = feels broken | Start 350px, tune from playtest. Knob in CSS variable so non-engineers can adjust. |
| Players don't realise they should merge | Tutorial step 2 demonstrates the drag. Magnetic preview the moment they touch a unit teaches "oh, these go together." |
| Spamming SUMMON drowns the field | Cap field at ~25 player units; SUMMON button greys out + plays "locked" SFX when full. |
| Merge-on-tap conflicts with battlefield taps | HeroSwarm doesn't use battlefield taps for anything else, so no conflict. |

---

## 13. Build plan — 1 week to playable prototype

| Day | Deliverable |
|---|---|
| 1 | Copy HeroSwarm v2 → `HeroMerge/HeroMerge_playable_v0.1.html`. Strip 3-card UI. Add SUMMON button. |
| 2 | Drag-to-merge with no magnetic effect (simple drop-on-target). |
| 3 | Magnetic attraction during drag + chain-merge resolution. |
| 4 | Tutorial 3-step flow. Tune merge animation timing. |
| 5 | First playtest, tune radius / pull speed / cooldown. Generate first builds via `qa/build.cjs` clone. |

End of week 1: shippable AppLovin / Unity Ads / Google Ads packages under 5 MB
(should be ~3.5 MB given the same asset set as HeroSwarm v2 + ~310 LoC).

---

## 14. Out of scope for v0.1

- No coin / currency economy. No upgrades between waves.
- No multiple unit families (e.g. melee vs ranged tiers). Just one ladder.
- No special abilities triggered by tier 5 — Champion just does AoE like the
  current Dragon.
- No multiplayer / async PvP framing in the playable.
- No portrait of "your kingdom growing" between waves.

These belong in the actual full game on the App Store, not the 30-second
playable ad.
