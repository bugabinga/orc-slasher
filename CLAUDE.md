# CLAUDE.md — developer & agent guide

Player-facing docs live in README.md; this file is the technical map.

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
assets/credits.json    source of truth for the in-game credits screen
assets/CREDITS.md      license summary for humans
docs/AUDIO.md          vetted libre audio shortlist (not yet integrated)
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
python3 tools/zombify.py             # every orc/goblin/ogre frame -> assets/zombies/
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
  `flame` (slowing, piercing). `fireGun` spawns, `updateShots` moves/hits
  (swept segment test from the hand — fast rounds and point-blank both hit),
  `explode` does AoE
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
  loop over the whole map. The floor is painted per 16×16-tile chunk on
  first sight (`getChunk`/`paintChunk`, LRU `CHUNK_CAP`); all floor
  randomness is `hash3`, so repaints match. Props, lamps and spawns come
  from `cellsIn(rect)` around the camera/player. Flow field: BFS in an
  80×80-tile window (`updateFlow` every 0.25s); zombies beyond 720px are
  recalled to a nearer manhole. HUD radar samples tiles around the player
  and points at the King. Bump `mapStamp` once per frame (LRU clock)
- **States**: title → credits (optional) → cls → select → play ⇄ campfire
  → gameover/victory. All input goes through `handleKey` / `handleClick`
- **Rendering**: 480×270 internal canvas, pixel-perfect (`image-rendering:
  pixelated`), feet-anchored `drawSprite`, y-sorted entities, offscreen
  chunked floor canvases, radar, darkness overlay with radial "punch" lights, screenshake,
  damage-number texts

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
node -e "..."  # see scratchpad pattern: launch chromium with
               # executablePath /opt/pw-browsers/chromium, --no-sandbox,
               # goto file://.../dist/orc-slasher.html, drive via
               # page.keyboard / page.evaluate on the game's globals
```

Useful globals for driving tests: `G` (state/wave/coins), `player`,
`enemies`, `spawnQueue`, `bullets`, `WEAPONS`, `CLASSES`, `UN`, `DEV`,
`pickCard()`, `leaveCampfire()`, `updatePlay(dt)` (call it in a loop for
fast headless balance sims). Jump waves by clearing `enemies`/`spawnQueue` and
setting `G.wave` (set `G.endless = true` when jumping past wave 10).

## Publishing

The playable artifact (claude.ai) is the dist HTML re-wrapped without
doctype/html/body tags; republish by rebuilding and publishing the same
scratchpad file path. Keep `dist/` committed — it's the player download.
