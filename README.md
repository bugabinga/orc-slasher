# ⚔️ ORC SLASHER

A Brotato-style 2D pixel roguelike: one knight, a dark cave, endless waves of
orcs. Auto-attack combat, XP gems, and card-based level-ups at a campfire
between waves. Survive to wave 10 and slay the **Orc Warchief**.

![genre](https://img.shields.io/badge/genre-cave%20roguelike-8a2be2)
![engine](https://img.shields.io/badge/engine-vanilla%20JS%20canvas-f7df1e)
![license](https://img.shields.io/badge/code-MIT-green)

## Play

- **Zero build:** just open `dist/orc-slasher.html` in any browser (single
  self-contained file, works offline).
- **From source:** open `index.html` (assets are embedded in `src/assets.js`,
  so `file://` works), or serve with `python3 -m http.server`.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | move |
| — | attack (auto-aims nearest orc) |
| Space / Shift | dash (i-frames, 2s cooldown) |
| 1-5 / click | choose your hero: Knight & Quasimodo (default), Barbarian & Nun (0.1% relic drop from bosses), Reaper (reach wave 10) |
| 1-3 / click | class arsenal — Knight: sword/spear/bow · Barbarian: knives/spear/whip · Nun: whip/bow · Quasimodo: molotov/small knife · Reaper: scythe/knives |
| 1·2·3 / click | pick upgrade card at the campfire |
| touch drag | virtual joystick (mobile) |

## The horde

| Orc | Behavior |
|---|---|
| Goblin | fast, weak, swarms |
| Orc grunt | standard chaser (CraftPix, 4-direction) |
| Orc blademaster | very fast flanker (CraftPix) |
| Masked orc | quick skirmisher |
| Orc shaman | keeps distance, lobs green bolts |
| Orc berserker | enrages below 50% HP (custom recolor) |
| Frost orc | slow, tanky bruiser (blue variant) |
| Orc general | armored elite (CraftPix) |
| Night stalker | very fast ambusher (purple variant) |
| Blood general | heavy red-armor elite (late waves) |
| Ogre | tanky miniboss every 5 waves |
| **Orc Warchief** | wave-10 boss, summons goblins (original sprite) |

Between waves you rest at a campfire and pick 1 card per level gained
(damage, attack speed, lifesteal, crit, regen, …, 12 upgrades). The gold
that orcs drop is spent at the campfire shop: reroll the card offer (3g,
price climbs per use), heal 50% (5g), or buy an extra card pick (10g+).
Leave for the next wave whenever you're ready.
After the Warchief falls: endless mode.

## Project layout

```
index.html          entry point
src/game.js         the whole game (input, waves, AI, combat, cards, render)
src/assets.js       generated: all sprites as base64 data URIs
assets/sprites/     0x72 DungeonTileset II frames (CC0)
assets/craftpix/    CraftPix top-down orcs, sliced by tools/extract_craftpix.py
assets/custom/      original art (warchief, campfire, gems, fx, card)
tools/              asset pipeline (make_custom_art, extract_craftpix,
                    build_assets, build_dist)
dist/orc-slasher.html  single-file build
```

Rebuild pipeline: `python3 tools/make_custom_art.py && python3
tools/build_assets.py && python3 tools/build_dist.py` (needs Pillow).

## Credits

Sprites: [0x72 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)
(CC0) and [CraftPix free top-down orcs](https://craftpix.net/freebies/free-top-down-orc-game-character-pixel-art/)
(CraftPix free license), plus original art — see `assets/CREDITS.md`.
Sound is generated at runtime with WebAudio. Code: MIT.
