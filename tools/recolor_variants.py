#!/usr/bin/env python3
"""Generate extra orc variants by hue-shifting the green skin of the CraftPix
orcs: frost orc (blue, from orc1), night stalker (purple, from orc3), blood
general (red, from orc2). Run after extract_craftpix.py."""
import colorsys
import glob
import os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "craftpix")

# (source prefix, new prefix, target hue 0..1, lightness mult, sat mult, also_armor)
VARIANTS = [
    ("cp_orc1", "cp_frost", 0.55, 1.05, 0.9, False),
    ("cp_orc3", "cp_night", 0.78, 0.95, 0.9, False),
    ("cp_orc2", "cp_blood", 0.99, 1.0, 1.0, True),
    ("cp_orc1", "cp_savage", 0.13, 0.95, 1.1, False),   # olive-brown savage
    ("cp_orc3", "cp_veteran", 0.58, 0.9, 0.35, False),  # grizzled steel-grey
    ("cp_orc1", "cp_ghost", 0.45, 1.35, 0.75, False),   # pale spectral green
]


def shift(src, dst, hue, lmul, smul, also_armor):
    img = Image.open(src).convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            skin = g > r * 1.1 and g > b * 1.1 and g > 60
            armor = also_armor and b > r * 1.1 and b > 60  # teal/blue plate
            if a and (skin or armor):
                h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
                r2, g2, b2 = colorsys.hls_to_rgb(hue, min(1, l * lmul), min(1, s * smul))
                px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    img.save(dst)


n = 0
for src_pre, dst_pre, hue, lmul, smul, also_armor in VARIANTS:
    for path in glob.glob(os.path.join(DIR, f"{src_pre}_*.png")):
        base = os.path.basename(path).replace(src_pre, dst_pre, 1)
        shift(path, os.path.join(DIR, base), hue, lmul, smul, also_armor)
        n += 1
print(f"generated {n} variant frames")
