# 🧟 ZOMBIE BLASTER

One soldier. A dead city. Endless waves of the dead.

A Brotato-style 2D pixel roguelike: your hero shoots on their own — you
dodge, dash, hoover up XP gems, and shape your build with upgrade cards at
the campfire between waves. Survive to wave 10 and put down **Patient Zero**.

## ▶ Play

**Play it now: https://bugabinga.github.io/orc-slasher/**

Or open **`dist/orc-slasher.html`** in any browser — one file, works
offline, on desktop and phone.

## How to play

- **Move:** WASD / arrow keys, or drag anywhere on a touchscreen
- **Shoot:** automatic — your hero aims at the nearest zombie, empties the
  clip, reloads (the yellow pips / bar top-left show your ammo)
- **Dash:** Space / Shift (touch: the round button, bottom-right) — a burst
  of speed with invincibility frames, 2s cooldown
- **Menus:** click things, or press the number keys
- **Pause:** P / Esc, or the ⏸ button top-right in combat
- **Fullscreen:** the ⛶ button in the menu corner (or press F)

Every HP and damage number is big: 10 damage reads as **33**, 60 HP reads
as **198**.

## Heroes

| Hero | Style | Guns | How to get |
|---|---|---|---|
| 🪖 Marine | balanced, by the book | Assault Rifle, Pistol, Shotgun | always yours |
| 🤠 Gunslinger | +10% crit, +8% speed, frail | Twin Revolvers, Shotgun | always yours |
| 🧨 Demolitionist | +30% blast radius | Rocket Launcher, Grenade Launcher | buy 300g · or 0.1% boss relic |
| 💪 Heavy | tons of HP, armored, slow | Minigun, Shotgun | buy 300g · or 0.1% boss relic |
| 🔥 Pyro | +20% damage | Flamethrower, Firebomb Launcher | buy 400g |
| ⛑ Medic | regenerates, lifesteal, hits softer | Uzi, Pistol | buy 500g |
| 🎯 Ghost | +15% crit, +20% range, very frail | Sniper Rifle, Uzi | buy 600g · or reach wave 10 |
| ❓ ??? | …one hero no menu will show you. The deep knows. | ??? | secret |

No swords anywhere — every weapon is a gun. Bullets pierce, rockets and
grenades explode, the flamethrower burns through whole crowds.

**Gold is forever:** every cleared wave pays a 25-gold bounty, and whatever
gold you're holding when a run ends is banked. Spend the bank on the hero
select screen to unlock new classes.

## The city

A new abandoned city is generated every run: a grid of four-lane streets
littered with burnt-out wrecks and roadblocks, sidewalks under flickering
streetlights (a quarter of them dead), brick and concrete blocks, dead parks
and rubble lots. The dead climb out of **manholes** and burst through
**doorways** just beyond your sight. Somewhere in the east plaza hangs the
King — the radar (bottom-left) shows him as a gold dot, or a gold arrow
on its rim pointing the way. The city is enormous (4096×4096 tiles, about
65 000 px each way) yet it's built on the fly around you, so it starts
instantly and runs as smoothly as a small map.

Over a dozen kinds of zombie hunt you, from crawler swarms to frozen
corpses, stalkers, acid spitters and armored gorehulks. **Every 5th wave a
boss arrives:** the charging **Butcher**, **Patient Zero**, the wraith-raising
**Necromancer**, **Morgrax the Rot God**, the bile-spraying **Bile King** —
then the cycle repeats, meaner each time.

Between waves you rest at a campfire: pick one upgrade card per level you
gained. Cards come in **common, rare, epic and legendary** rarities (Lucky
Charm cards tilt the odds) — Extended Mags, Fast Hands, Laser Sight, Bigger
Boom, up to legendary Depleted Uranium and Bullet Hell. Spend run gold at
the fire — reroll the offer, buy a heal, buy an extra card — and leave when
you're ready.

On the weapon screen, banked gold buys **permanent gun upgrades**
(+8% damage each, price climbing every level, max 5).

Kill Patient Zero and endless mode opens. How deep can you go?

## Look & feel

With **FX** on (top-right of the menu), the city is lit for real: sodium
streetlights, burning wrecks and barrels, muzzle flashes and explosions
cast coloured light, your flashlight follows your aim, fog drifts through
the streets, and most nights it rains, with the odd lightning strike.
Over it all sits a retro CRT: soft curvature, scanlines, bloom, a little
chromatic aberration, and shockwaves when rockets land. It needs WebGL2
on a real GPU; otherwise the game quietly uses its plain 2D look.

## Settings

Top-right of the menu: toggle FX, mute the music ♪ and sound effects 🔊 separately.
Your choices are remembered. Press **C** on the title for the credits.

## Credits

Built on the shoulders of generous pixel artists — see the in-game credits
(press **C**) or [`assets/CREDITS.md`](assets/CREDITS.md). Sprites by
[0x72](https://0x72.itch.io/dungeontileset-ii) (CC0) and
[CraftPix](https://craftpix.net/freebies/free-top-down-orc-game-character-pixel-art/),
zombified, plus original heroes and guns made for this game (CC0). All
sound is synthesized live. Code: MIT.
