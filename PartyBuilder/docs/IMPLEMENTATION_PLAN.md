# PartyBuilder — Implementation Plan

Step-by-step build plan, ordered so each stage is playable/testable before moving to the next.

---

## Phase 0 — Scaffold (½ day)

- [ ] Copy `HeroSwarm/qa/bundle_assets.cjs` → `PartyBuilder/qa/bundle_assets.cjs`. Retarget asset paths to `PartyBuilder/assets/` and keep `HHC_Playable/art/` + `HHC_Playable/sfx/` for font + sounds.
- [ ] Copy `HeroSwarm/qa/syntax_check.cjs` → `PartyBuilder/qa/syntax_check.cjs`. Point Puppeteer at the new master HTML path.
- [ ] Create `PartyBuilder/PartyBuilder_v0.1.html` as a stub with: portrait viewport, Riffic font slot, empty `SPRITES`/`SOUNDS` blobs, "Hello Party Builder" h1.
- [ ] Copy 6 hero sprites + 3 enemy sprites + 1 background into `PartyBuilder/assets/`:
  - `lenhador.png`, `babyorc.png`, `cacador.png`, `igris.png`, `magos.png`, `paladino.png`
  - `gon2.png` (goblin), `juggermon2.png` (brute), `overlord.png` (demon lord)
  - `bg_tavern.png` (TBD — for now reuse a HeroSwarm backdrop)
- [ ] Run `node qa/bundle_assets.cjs` → confirm SPRITES populated.
- [ ] Run `node qa/syntax_check.cjs` → confirm no console errors, page loads.

**Exit criteria:** master HTML opens in browser, font loads, 9 sprite blobs present in source.

---

## Phase 1 — Shop UI (1 day)

- [ ] Define `HEROES` table in JS (key, displayName, price, hp, dmg, spd, role).
- [ ] Build static shop layout: top bar (gold + GO button), 3×2 grid of hero cards, 3 party slots at bottom.
- [ ] Render shop cards from `HEROES` data — portrait, name, price, tiny HP/DMG/SPD pips.
- [ ] Implement `STATE.gold`, `STATE.party = []`.
- [ ] Tap-to-hire: clicking a shop card moves hero to first empty party slot, deducts gold, greys the card.
- [ ] Tap-to-dismiss: clicking a party slot returns hero to shop, refunds gold.
- [ ] Disable shop cards player can't afford (red price, no-tap).
- [ ] Enable GO button only when `STATE.party.length >= 1`.
- [ ] Add `qa/snap_shop.cjs` — screenshots the shop with 0 / 1 / 3 heroes hired.

**Exit criteria:** can hire/dismiss heroes within budget, can press GO when ≥1 hero in party.

---

## Phase 2 — Combat port from HeroSwarm (1.5 days)

- [ ] Lift these functions from `HeroSwarm_playable_v0.1.html` into PartyBuilder master:
  - `createActor`, `applyActorTransform`
  - `moveActors`, `acquireTargets`, `findClosestEnemy`
  - `resolveCollisions`, `resolveStacking`, `tickTackles`, `applyAoeDamage`
- [ ] Build `startMission()`: hides shop, shows combat arena, spawns party from left.
- [ ] Build enemy spawner: Wave 1 = 4 goblins, Wave 2 (5s later) = 2 goblins + 1 brute.
- [ ] Add HP bars over each unit (small div, scales with `hp/maxHp`).
- [ ] Detect end conditions: all party dead → `onMissionEnd(false)`; all enemies dead → `onMissionEnd(true)`.
- [ ] `onMissionEnd(won)` shows defeat or victory banner and routes accordingly.
- [ ] Add `qa/snap_combat.cjs` — screenshots mid-combat.

**Exit criteria:** can play full Mission 1 from shop → combat → fail/win banner.

---

## Phase 3 — Tired/expensive loop (½ day)

- [ ] On Mission 1 loss: mark all party hero keys in `STATE.tiredSet`.
- [ ] Reset state for Mission 2: `STATE.party = []`, `STATE.gold = 110`.
- [ ] Re-render shop with tired-state visuals: greyscale filter + ⚡ overlay on tired cards.
- [ ] Apply +50% price to tired heroes in shop and at hire-time.
- [ ] Apply −20% HP to tired heroes when they spawn for Mission 2.
- [ ] Add tooltip (or pressable info row) on tired cards: *"Tired — fought last mission. -20% HP, costs more."*
- [ ] Add `qa/snap_tired.cjs` — screenshots the shop in tired state after auto-losing Mission 1.

**Exit criteria:** lose Mission 1 → return to shop with tired heroes → can hire and play Mission 2.

---

## Phase 4 — Mission 2 + Demon Lord + CTA (½ day)

- [ ] Mission 2 enemy comp: same Wave 1+2, then Demon Lord wave on brute death.
- [ ] Port Demon Lord visuals from HeroSwarm (`spawnDragon`, `triggerDragonFireBreath`).
- [ ] On Mission 2 win: cinematic flash + coin shower + "VICTORY!" → CTA.
- [ ] On Mission 2 loss (rare): soft-fail screen with "PLAY FULL GAME" CTA.
- [ ] Build CTA end card: full-screen, logo, App Store + Play Store buttons. Reuse `STORE_URL_ANDROID` / `STORE_URL_IOS` and `goToStore` from HeroSwarm.
- [ ] Add a small persistent **INSTALL** button top-right from intro onward (every playable QA spec asks for it).

**Exit criteria:** complete end-to-end run: intro → shop → mission1 fail → shop2 → mission2 win → CTA → store tap.

---

## Phase 5 — Tuning + polish (1 day)

- [ ] Playtest 5+ runs. Adjust:
  - Mission 1 difficulty (target ~85% loss rate on first attempt).
  - Mission 2 winnability (target ~75% win on second attempt).
  - Hero prices vs HP/DMG (avoid one dominant strategy).
- [ ] Add intro panel (Demon Lord shot + headline). Skippable on tap.
- [ ] Add coin-pickup SFX on hire, sword SFX on hit, cheer on victory, sad horn on defeat.
- [ ] Polish shop animations: cards bounce when hired, gold counter ticks down with a flash.
- [ ] Polish defeat banner → shop transition (1.5s, no dead air).
- [ ] Verify file size < 3 MB.

**Exit criteria:** playable feels tight, hits the 30–45s target, no console errors, no visual jank.

---

## Phase 6 — Build & ship (½ day)

- [ ] Copy `HeroSwarm/qa/build.cjs` → `PartyBuilder/qa/build.cjs`. Retarget master HTML path + output filenames.
- [ ] Generate AppLovin / Unity Ads / Google Ads packages.
- [ ] Smoke-test each build (`qa/smoke.cjs <build>`).
- [ ] Confirm each build < 5 MB.

**Exit criteria:** three platform packages in `PartyBuilder/builds/`, all smoke-tested.

---

## Critical files (where the work happens)

| File | Role |
|---|---|
| `PartyBuilder/PartyBuilder_v0.1.html` | Master single-file playable. ~90% of the new code lives here. |
| `PartyBuilder/qa/bundle_assets.cjs` | Re-bake sprites/sounds after any asset change. **Run after every asset swap.** |
| `PartyBuilder/qa/build.cjs` | Generate platform packages. **Run before shipping any build.** |
| `PartyBuilder/qa/snap_*.cjs` | Visual QA — every phase has at least one snapshot script. |
| `PartyBuilder/assets/` | New sprites only. Font + audio still come from `HHC_Playable/`. |

---

## Risk register

| Risk | Mitigation |
|---|---|
| Combat port from HeroSwarm has subtle dependencies (e.g., shared CSS classes, globals) | Lift functions one at a time, syntax-check after each. Don't try to copy the whole `<script>` block. |
| Tired multiplier feels punishing → players quit instead of rebuilding | Tune refund up (110g → 120g) before adding new mechanics. |
| File-size creep from carrying full Herois library | Only the 6 hero + 3 enemy PNGs go in `assets/`. The rest stay in `Herois/` (not bundled). |
| Bundler regex bug returns | Same bundler as HeroSwarm — already fixed. Don't rewrite the regex. |

---

## Total estimated effort

**5 working days** for MVP (Phase 0–4). +1 day tuning + ½ day shipping = **~6.5 days end-to-end.**

A solo session with focused scope could compress this to ~3 days by skipping intro polish and accepting placeholder backgrounds.
