# Libre audio candidates for Orc Slasher

Currently all audio is synthesized at runtime (WebAudio): tiny SFX beeps and
the ambient cave loop in `src/game.js`. These libre packs are vetted
replacements/upgrades that fit the dark-cave orc theme. Nothing here is
integrated yet — this is the shortlist.

## SFX

| Pack | Author | License | Fits |
|---|---|---|---|
| [512 Sound Effects (8-bit style)](https://opengameart.org/content/512-sound-effects-8-bit-style) | Juhani Junkala | CC0 | huge organized retro set: hits, pickups, UI, explosions — matches the pixel look 1:1 |
| [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx) | rubberduck | CC0 | orc grunts/growls/death vocals for the horde |
| [Monster Sound Pack, Volume 1](https://opengameart.org/content/monster-sound-pack-volume-1) | — (see page) | see page | boss roars (Butcher/Warchief) |
| [Monster Sound Effects Pack](https://opengameart.org/content/monster-sound-effects-pack) | — (see page) | see page | alternative creature vocals |
| Kenney [Audio packs](https://kenney.nl/assets?q=audio) (Impact/RPG/Digital) | Kenney | CC0 | clean generic impacts & UI |

## Music

| Track / pack | Author | License | Fits |
|---|---|---|---|
| [Dark Cavern Ambient](https://opengameart.org/content/dark-cavern-ambient) | — (see page) | CC0 | menu / campfire underscore |
| [Loopable Dungeon Ambience](https://opengameart.org/content/loopable-dungeon-ambience) | — (see page) | CC0 | wind + water drips, perfect cave bed layer |
| [Dungeon Ambience](https://opengameart.org/content/dungeon-ambience) | — (see page) | CC0 | exploration underscore |
| [5 Chiptunes (Action)](https://opengameart.org/content/5-chiptunes-action) | Juhani Junkala | CC0 | wave-combat energy, boss themes |
| [Fantasy Music and Drum Loops Pack](https://opengameart.org/content/fantasy-music-and-drum-loops-pack) | — (see page) | see page | drum layers for boss waves |

## Integration notes

- Verify the license line on each OpenGameArt page before committing files
  (most above are CC0; some packs on the site are CC-BY and need attribution
  in `assets/CREDITS.md`).
- Prefer OGG (small, universally decoded); target < 1 MB per music loop so
  the single-file `dist` build stays lean. SFX should be trimmed mono OGGs.
- Wiring plan: keep the `SFX.*` call sites and `SND.music`/`SND.sfx` toggles;
  swap implementations to `Audio`/`AudioBufferSourceNode` playing decoded
  files from data URIs bundled by `tools/build_assets.py` (same pattern as
  sprites). Layered music = ambience bed always + chiptune layer during waves.
