#!/usr/bin/env python3
"""Slice the CraftPix 'Free Top-Down Orc Game Character Pixel Art' sheets into
per-frame sprites, downscaled 0.5x (64px -> 32px) to match the 16px-tile world.

Sheets are 64x64 frames, rows = directions: 0 down, 1 up, 2 left, 3 right.
Usage: python3 tools/extract_craftpix.py <path-to-extracted-pack>"""
import os
import sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "craftpix_orcs"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "craftpix")
os.makedirs(OUT, exist_ok=True)

DIRS = ["d", "u", "l", "r"]
# anim -> (sheet suffix, frames to keep)
ANIMS = {"idle": ("idle_full", 4), "run": ("run_full", 8), "attack": ("attack_full", 8)}
FS = 64  # source frame size

count = 0
for orc in (1, 2, 3):
    for anim, (suffix, nframes) in ANIMS.items():
        path = os.path.join(SRC, "Tiled_files", f"orc{orc}_{suffix}.png")
        sheet = Image.open(path).convert("RGBA")
        cols = sheet.width // FS
        n = min(nframes, cols)
        for row, d in enumerate(DIRS):
            for f in range(n):
                fr = sheet.crop((f * FS, row * FS, (f + 1) * FS, (row + 1) * FS))
                fr = fr.resize((FS // 2, FS // 2), Image.NEAREST)
                fr.save(os.path.join(OUT, f"cp_orc{orc}_{anim}_{d}_f{f}.png"))
                count += 1
    # death: front row only, used for corpse FX on any facing
    sheet = Image.open(os.path.join(SRC, "Tiled_files", f"orc{orc}_death_full.png")).convert("RGBA")
    for f in range(sheet.width // FS):
        fr = sheet.crop((f * FS, 0, (f + 1) * FS, FS)).resize((FS // 2, FS // 2), Image.NEAREST)
        fr.save(os.path.join(OUT, f"cp_orc{orc}_death_f{f}.png"))
        count += 1

print(f"extracted {count} frames to {OUT}")
