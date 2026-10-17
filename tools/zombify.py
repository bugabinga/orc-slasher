#!/usr/bin/env python3
"""Turn every orc/goblin/ogre frame into a rotting zombie: green skin goes
corpse-grey with a sickly tint, cloth and armour fade to grimy rags, and the
darkest pixels pick up a dried-blood brown. Output keeps the source filename
in assets/zombies/, which build_assets.py lets override the original sprite.
Run after make_custom_art.py / recolor_variants.py."""
import colorsys
import glob
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "assets", "zombies")
os.makedirs(OUT, exist_ok=True)

SOURCES = [
    "assets/sprites/goblin_*", "assets/sprites/ogre_*", "assets/sprites/orc_*",
    "assets/sprites/masked_orc_*",
    "assets/custom/orc_*", "assets/custom/cave_goblin_*",
    "assets/craftpix/cp_*",
]

SKIN_HUE = 0.20  # yellow-green, like a week-old bruise


def rot(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    skin = g > r * 1.08 and g > b * 1.08 and g > 50
    if skin:
        # pale, desaturated corpse flesh; keep the light/shade ramp
        h, s, l = SKIN_HUE, s * 0.32, min(1, l * 1.08 + 0.04)
    else:
        # rags: half the colour, a touch darker
        s *= 0.5
        l *= 0.88
        if l < 0.22 and s > 0.05:  # deep shadows read as dried blood
            h, s = 0.0, min(1, s + 0.35)
    r2, g2, b2 = colorsys.hls_to_rgb(h % 1, l, s)
    return int(r2 * 255), int(g2 * 255), int(b2 * 255)


def zombify(src, dst):
    img = Image.open(src).convert("RGBA")
    px = img.load()
    cache = {}
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            key = (r, g, b)
            if key not in cache:
                cache[key] = rot(r, g, b)
            px[x, y] = (*cache[key], a)
    img.save(dst)


n = 0
for pat in SOURCES:
    for path in sorted(glob.glob(os.path.join(ROOT, pat + ".png"))):
        zombify(path, os.path.join(OUT, os.path.basename(path)))
        n += 1
print(f"zombified {n} frames -> assets/zombies/")
