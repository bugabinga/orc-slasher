#!/usr/bin/env python3
"""Encode the CC0 sound packs into small mono MP3s in assets/sounds/
(bundled into src/assets.js by build_assets.py). Needs ffmpeg.

    python3 tools/build_sounds.py <zombies-pack-dir> <residue-sfx-dir>

Sources (both CC0, see assets/CREDITS.md):
  zombies.zip     https://opengameart.org/content/zombies-sound-pack (artisticdude)
  residue-sfx.zip https://opengameart.org/content/residue-sfx (planetkillergames)
"""
import os
import subprocess
import sys

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")
os.makedirs(OUT, exist_ok=True)
zdir, rdir = sys.argv[1], sys.argv[2]

# output name -> source file
SOUNDS = {f"groan_{i}": os.path.join(zdir, f"zombie-{n}.wav") for i, n in enumerate([1, 2, 4, 8, 9, 12, 15, 19, 20, 23])}
SOUNDS.update({f"zdie_{i}": os.path.join(zdir, f"zombie-{n}.wav") for i, n in enumerate([3, 5, 11, 13])})
SOUNDS.update({
    "zboss": os.path.join(zdir, "zombie-17.wav"),
    "boom": os.path.join(rdir, "boom.ogg"),
    "clip": os.path.join(rdir, "emptyclip.ogg"),
    "spit": os.path.join(rdir, "spit.ogg"),
    "heal": os.path.join(rdir, "healthpack.ogg"),
})

# trim leading/trailing silence, mono, 22.05 kHz, ~40 kbps: tiny inside a data URI
TRIM = "silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse"
total = 0
for name, src in SOUNDS.items():
    dst = os.path.join(OUT, name + ".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", TRIM, "-ac", "1", "-ar", "22050",
                    "-codec:a", "libmp3lame", "-b:a", "40k", dst], check=True)
    total += os.path.getsize(dst)
print(f"wrote {len(SOUNDS)} sounds, {total // 1024} KB")
