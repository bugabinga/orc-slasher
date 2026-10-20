# CLAUDE.md — developer & agent guide

Player-facing docs live in README.md; this file is the technical map.

## Performance — read first

`docs/PERFORMANCE.md` holds the rules for the hot loop (no per-frame
allocation, in-place array compaction, spatial hash, cached sprites, how
to drive WebGL). Measure every perf change with `node tools/bench.mjs`
(real rAF loop, not a synchronous sim; `--throttle 4`, `--fx off`,
`--gl force`) and find the cause with `node tools/profile.mjs --scene horde --ops`
(CPU self-time + canvas calls per frame by call site) and put before/after numbers in the
commit message.

## Repo layout

```
index.html             entry point (loads src/assets.js + src/game.js)
src/game.js            the entire game — single file, vanilla JS canvas
src/assets.js          GENERATED — all sprites as base64 data URIs + window.CREDITS
                       (the game is "Zombie Blaster"; repo/dist keep the old name)
assets/sprites/        0x72 DungeonTileset II frames (CC0)
assets/craftpix/       CraftPix 4-direction orcs + hue-shift variants (generated)
assets/custom/         original pixel art (make_custom_art.py; heroes/guns by make_gun_art.py)
assets/zombies/        GENERATED — zombified enemy frames, override same-named sprites
assets/sounds/         GENERATED — CC0 sfx as small MP3s (bundled as window.SOUNDS)
assets/credits.json    source of truth for the in-game credits screen
assets/CREDITS.md      license summary for humans
docs/AUDIO.md          vetted libre audio shortlist
docs/PERFORMANCE.md    perf rules for the game loop (with sources)
tools/                 asset pipeline (see below)
dist/orc-slasher.html  GENERATED — single-file build, committed
```

## Build pipeline (Python 3 + Pillow)

Run from repo root, in this order when art changes:

```
python3 tools/make_custom_art.py     # hand-drawn sprites -> assets/custom/
python3 tools/extract_craftpix.py <pack-dir>  # slice CraftPix sheets (rarely needed)
python3 tools/recolor_variants.py    # frost/night/blood orc recolors
python3 tools/make_gun_art.py        # gunner heroes, guns, rocket/grenade
python3 tools/make_city_art.py       # city tiles + props (city_*)
python3 tools/make_gore_art.py       # font_atlas, gibs, splats, rubble, debris
python3 tools/zombify.py             # every orc/goblin/ogre frame -> assets/zombies/
python3 tools/extract_kenney.py <sheet.png>  # grimed Kenney street props (rarely needed)
python3 tools/build_sounds.py <zombies-dir> <residue-dir>  # CC0 sfx -> assets/sounds/
python3 tools/build_assets.py        # everything + credits.json -> src/assets.js
python3 tools/build_dist.py          # inline all -> dist/orc-slasher.html
```

For code-only changes: `build_dist.py` alone. Always `node --check
src/game.js` before building.

## Architecture of src/game.js (top to bottom)

- **SND / synth / MUSIC** — SFX beeps + procedural ambient loop; `SND`
  toggles persist in localStorage (`orcslasher_sound`)
- **DEV mode** — passphrase-gated (djb2 hash in `DEV.HASH`, phrase NOT in
  repo); key button top-right opens a modal backed by a hidden `<input>`
  (mobile keyboards). Unlocks everything while on; separate from real
  unlock storage
- **NUM_MULT / big()** — display-only x3.3 on every HP/damage number the
  player sees (internal values stay small; balance lives in the raw numbers)
- **ANIM** — frame-name lists; craftpix enemies are 4-directional (`_d/_u/_l/_r`).
  Enemy ANIM keys still use the orc sprite names — zombify.py overrides them
- **WEAPONS / CLASSES** — data tables; classes own `weapons: [...]` and a
  `mods(stats)` function. Every weapon is a gun with `clip`/`reload`;
  `kind`: `bullet` (optional `pellets`, `pierce`, `akimbo`), `rocket`
  (explodes on hit), `grenade` (lobbed arc, `fire` leaves a fire patch),
  `flame` (slowing, piercing). `fireGun` spawns, `sysBullets` moves/hits
  (swept segment test from the hand — fast rounds and point-blank both hit),
  `explode(x,y,r,dmg,crit,src)` does AoE + `blastWorld` destruction
- **ECS** — every short-lived object is a pooled entity: `eCreate(comp)` /
  `eKill` (marks `M_DEAD`) / `eFlush` (end of frame) / `eReset`. Data is
  SoA typed arrays (`PX PY VX VY LIFE KIND COL …`, `E_MAX` slots); one
  `SparseSet` per component (`PARTS BULLETS PICKUPS ZOMBIES …` = `SETS[C_*]`),
  iterate `set.dense[0..n)`. Zombies/texts keep a pooled object in
  `ZO[e]`/`TXO[e]` (stable shape). Systems: `sysBullets sysFire sysZombies
  sysEnemyShots sysParticles sysPickups sysTexts`, run by `updatePlay`.
  Zombie neighbour queries go through the spatial hash (`queryEnemies`)
- **Gore** — `damageEnemy(z,dmg,crit,ang,knock,how)` / `killEnemy(z,how)`;
  `how` = `HOW_SHOT/GIB/FIRE/FLUNG` picks the death (ragdoll fling, gib
  burst, charred). Blood/scorch `decal`s are painted into floor chunks and
  logged in `chunkDecals` (ring, `DECAL_CAP`) so repaints replay them
- **Destruction** — props have hp/state (`PS_OK SMOKE FUSE WRECK GONE
  BROKEN`): `damageProp` → `destroyProp`/`blowProp` (cars smoke, burn, then
  explode and chain). Building tiles (`TILE_HP`) take `damageTile` from
  blasts (`blastBuildings`) and bullets (chips) and break into `T_RUBBLE`
  via `destroyTile`; once 25% of a building (`b.bx0..by1`) is gone,
  `collapseBuilding` queues the rest to fall row by row (`updateCollapses`).
  All of it persists in `WORLD`
  (`props`/`tiles`/`cellTiles`), which `genCell` re-applies, so evicted
  cells come back broken. Timed props live in `activeProps`
- **Feel / score** — smoothed player velocity, dash (`DASH_MAX` charges
  refilling every `DASH_CD`, a 4.8×→1.4× burst over `DASH_T`, buffered,
  i-frames, afterimages, "CLOSE CALL" near a zombie extends the combo), `G.trauma`
  shake, `hitStop`, `slowMo`, WASTED. Kills feed `addKillScore`: combo
  (3s window, a hit breaks it), multiplier `1 + combo/6` (max ×10), FRENZY
  in the feed; `META.best` keeps the best score. Desktop: the cursor always
  aims, the left button fires (no auto-aim). Touch: auto-aim at the nearest
  zombie
- **Text** — pixel font `font_atlas` (5×8). `ftext` is a drop-in for
  `fillText` (reads `ctx.font`/`fillStyle`/`textAlign`); `ftx(str,x,y,size,
  col,align,italic)` takes explicit style and leaves ctx untouched;
  `fmeasure(str, size?)`. Strings are baked once per colour atlas
  (`textBitmap`, LRU) — one drawImage per string. Never use `ctx.fillText`
- **HUD** (`renderHUD`) — weapon/ammo panel, segmented HP with lag, `$`
  score counter, multiplier, threat stars, pager (`G.pager`, LCD typewriter,
  bottom centre), `banner()` headlines in a band under the wave counter
  (newest replaces older; only WASTED takes the centre), `feed()` small
  lines under the pause button (multiplier, frenzy, level up, close call),
  King arrow, radar. Keep the middle of the screen clear
- **UN unlocks / META gold** — localStorage `orcslasher_unlocks` +
  `orcslasher_meta`; demo/heavy via 0.1% boss relic roll in `killEnemy`,
  ghost on reaching wave 10, commando (secret) on clearing wave 20, or buy
  any locked class with banked gold (`tryBuyClass`); +25 coin wave bounty
  in `enterCampfire`, run coins banked via `bankCoins()` on death /
  new-run-after-victory
- **E_TYPES / waveComposition / BOSS_CYCLE** — zombie stats & spawn tables;
  every 5th wave adds `bossFor(w)` (butcher → patient_zero → necromancer →
  rot_god → bile_king); patient_zero kill at wave 10 = victory, then endless
- **CARD_POOL / RARITY / campfire / shop** — cards have rarities rolled
  by `rollRarity(luck)`; pick 1-of-3 per banked level; `META.wpn` weapon
  levels bought via `tryUpgradeWeapon` on the select screen; shop
  spends `G.coins` (reroll/heal/extra pick), leave via NEXT WAVE
- **Map** — a *virtual* abandoned city (`MAP_W`/`MAP_H`, default
  4096² tiles; tested to 65536²). Nothing is stored map-wide: `buildMap`
  only seeds `SEED` and the sorted road lists `roadX`/`roadY`. A cell =
  one block + its west and north road; `genCell(ci, cj)` builds it
  deterministically (tile types, buildings, props, lamps, spawns,
  manholes, per-tile prop rects) and `getCell` caches it (LRU,
  `CELL_CAP`). Query tiles via `tileType` / `walkAt` / `rectsAt`; never
  loop over the whole map. The floor is painted per 16×16-tile chunk
  (`getChunk`/`paintChunk`, LRU `CHUNK_CAP`, canvases pooled); `chunkWork`
  paints ≤1 chunk/frame — `staleChunk`-marked ones first, then the ring
  outside the view; all floor
  randomness is `hash3`, so repaints match. Props, lamps and spawns come
  from `cellsIn(rect)` around the camera/player. Flow field: BFS in an
  80×80-tile window (`updateFlow` every 0.25s, which also bakes the
  downhill step per tile into `flowNext`); zombies beyond 720px are
  recalled to a nearer manhole. HUD radar samples tiles around the player
  and points at the King. Bump `mapStamp` once per frame (LRU clock)
- **States**: title → credits (optional) → cls → select → play ⇄ campfire
  → gameover/victory. All input goes through `handleKey` / `handleClick`
- **View**: `VW`×`VH` are `let`s set by `fitView` (on resize): a whole
  number `VIEW_K` of device px per game px (crisp pixels; the canvas gets an
  exact CSS size), ≤240 rows on phones / ≤300 on desktop, ≥200; width
  400–640. 960×540 and 1080p stay 480×270. Never cache anything sized by
  VW/VH at load — rebuild it in `fitView` (FX via `fxTargets`, shaders get
  `uRes`/`RES`). `compactUI()` (VH < 250) switches menus to tight layouts
  (small logo, one-line hero cards, slim gun rows, no campfire scene)
- **Sprite atlas** (`buildAtlas`, first frame after load): every sprite +
  its mirror image packed into 2048² pages; tinted copies go on 512² pages
  during play. `im.atl` = slot. Draw sprites with `dimg(g, im, x, y, w?, h?)`
  (or `dimgTop` for a cropped top), never `drawImage(IMG[..])` — plain
  canvases fall through to drawImage
- **Input**: keyboard (`handleKey`; dash fires on the keydown itself), mouse
  (`mouse`: always aims, left = fire, right = dash), touch: a floating run
  `stick` in the lower right (`inStickZone`, `stickHome`, `STICK_R`, output
  `stick.vx/vy`), any other touch = `dashNow()`. `blur` releases everything.
  `usingTouch` switches aim mode, hint texts and tap padding (`tapPad`);
  `buzz(ms)` = haptics. Portrait on a phone shows the `#rotate` card
  (index.html CSS) and pauses
- **Camera** (`camera`): locked to the hero plus a lead (cursor offset on
  desktop, aim/heading on touch); only the lead eases and both are whole
  pixels, so a running hero never jitters against the street
- **Intro / hints**: `startIntro()` on `newRun` = 0.35s hero drop
  (`player.dropZ`, `heroLands`); `introLocked()` holds the world and HUD
  for it; any input → `skipIntro()`. Hints: one plain line at the bottom
  (`HINTS_DESK` / `HINTS_TOUCH`); `learn(LEARN_MOVE|AIM|DASH)` greens a part
  and saves per input type in localStorage `orcslasher_learned`; the line
  goes when all are learned or after 10s. Bench/profile call `skipIntro()`
  and set `usingTouch` so the scene keeps shooting
- **Rendering**: the game draws VW×270 into two layers — `sceneCtx`
  (world) and `uiCtx` (HUD, damage numbers, overlays; never lit). `ctx`
  points at the current one; `frame()` switches it. Feet-anchored
  `drawSprite` (cached flipped / tinted copies, no `ctx.filter`), y-sorted
  draw list, chunked floor, radar, text-bitmap cache. Lights are collected
  once per frame into `LIGHTS` (`addLight`/`collectLights`).
- **FX** (`initFX` / `present`): WebGL2 passes — light (coloured lights,
  flashlight cone, fog, pixel rain, lightning) → bloom (½ res) → final
  (CRT curve, sharp scaling, chromatic aberration, `fxShock` shockwaves,
  grading, scanlines, vignette, grain, hurt/low-HP). `fxWarp` maps clicks
  through the curve. Toggle: `SND.fx` (menu FX button). Without WebGL2, or
  on a software rasteriser (SwiftShader/llvmpipe; `?gl=force` overrides),
  both layers are the visible 2D canvas and `renderDarkness` draws the
  night instead. `fxPerf` halves the output resolution if frames stay slow

## Conventions

- 16px tile grid; humanoids ~16–20px, bosses drawn at `scale: 2`
- Sprite names in assets.js = filename minus `.png`, with `_anim_f` → `_f`
- New enemy: add E_TYPES entry + waveComposition line (+ ANIM if new frames)
- New card: CARD_POOL entry only (icon = any sprite name; `need: "blast"`
  restricts it to guns with that property)
- New gun: WEAPONS entry + a `gun_*` grid in make_gun_art.py (grip at (2, h-3))
- New credit: edit assets/credits.json, run build_assets.py
- Comments only where the code can't say it; match existing density

## Testing

Playwright smoke tests against the dist build (Chromium is preinstalled):

```
node tools/mobile_test.mjs [--shots dir]   # phone: menus by tap, run stick, tap /
                                           # 2nd-finger dash, auto-aim, portrait card
node -e "..."  # ad-hoc: launch chromium with
               # executablePath /opt/pw-browsers/chromium, --no-sandbox,
               # goto file://.../dist/orc-slasher.html, drive via
               # page.keyboard / page.evaluate on the game's globals
```

Useful globals for driving tests: `G` (state/wave/coins/score), `player`,
`ZOMBIES` (`.n`, `.dense`) + `ZO[e]`, `clearZombies()`, `spawnEnemy(type,
pos)`, `spawnQueue`, `BULLETS`, `WORLD`, `damageProp`, `WEAPONS`, `CLASSES`, `UN`, `DEV`,
`pickCard()`, `leaveCampfire()`, `updatePlay(dt)` (call it in a loop for
fast headless balance sims). Jump waves with `clearZombies()`, `spawnQueue = []` and
setting `G.wave` (set `G.endless = true` when jumping past wave 10).

## Publishing

Playable artifact: https://claude.ai/artifact/Kn513C5J2S3ecaDFe7Ks2a (private
to its owner until shared). The page is `dist/orc-slasher.html` without the
doctype/html/head/body tags (the host adds its own skeleton and pads `:root`
for safe areas), prefixed with `<title>Zombie Blaster</title>` and a small
style block: `:root` dark + `height:100%; box-sizing:border-box`, `body`
`height:100%` and side-only safe-area padding. From a new session publish
with that `url` (read it first). Keep `dist/` committed — it's the player
download.
