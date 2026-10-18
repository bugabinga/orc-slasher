#!/usr/bin/env python3
"""Cut street furniture out of Kenney's Roguelike Modern City pack (CC0,
16x16 tiles with a 1px margin) and give it an abandoned-city grime pass:
colour drained, a little darker. Output: assets/custom/city_k_*.png

    python3 tools/extract_kenney.py <path>/roguelikeCity_magenta.png

Pack: https://opengameart.org/content/roguelike-modern-city-pack (Kenney, CC0)
"""
import colorsys
import os
import sys
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "custom")
sheet = Image.open(sys.argv[1]).convert("RGBA")

# name -> (column, row) in the 37x28 tile grid
PICKS = {
    "hydrant": (15, 14), "cone": (14, 18), "bin": (15, 13), "bin2": (17, 13), "barrelw": (16, 13),
    "tires": (14, 14), "tire": (12, 14), "rubble": (12, 13), "rubble2": (13, 13),
    "box": (13, 16), "box2": (14, 16), "boxes": (14, 17), "mailbox": (12, 15),
    "news": (28, 7), "news2": (29, 7), "utility": (25, 8), "bench": (15, 15), "barrier": (24, 7),
}


def grime(px):
    r, g, b, a = px
    if a == 0 or (r > 240 and g < 20 and b > 240):  # magenta key
        return (0, 0, 0, 0)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    r2, g2, b2 = colorsys.hls_to_rgb(h, l * 0.82, s * 0.6)
    return (int(r2 * 255), int(g2 * 255), int(b2 * 255), 255)


for name, (c, r) in PICKS.items():
    tile = sheet.crop((c * 17, r * 17, c * 17 + 16, r * 17 + 16))
    px = tile.load()
    for y in range(tile.height):
        for x in range(tile.width):
            px[x, y] = grime(px[x, y])
    bbox = tile.getbbox()  # trim to the visible pixels so feet anchoring is exact
    if bbox:
        tile = tile.crop(bbox)
    tile.save(os.path.join(OUT, f"city_k_{name}.png"))
print(f"wrote {len(PICKS)} Kenney props")
