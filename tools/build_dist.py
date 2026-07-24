#!/usr/bin/env python3
"""Inline assets.js + game.js into index.html -> dist/orc-slasher.html
(single self-contained playable file)."""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)

html = open(os.path.join(ROOT, "index.html")).read()
assets = open(os.path.join(ROOT, "src", "assets.js")).read()
game = open(os.path.join(ROOT, "src", "game.js")).read()

html = html.replace('<script src="src/assets.js"></script>', "<script>\n" + assets + "\n</script>")
html = html.replace('<script src="src/game.js"></script>', "<script>\n" + game + "\n</script>")
assert "src/" not in re.sub(r"<script>.*</script>", "", html, flags=re.S)

out = os.path.join(ROOT, "dist", "orc-slasher.html")
open(out, "w").write(html)
print(f"wrote {out} ({os.path.getsize(out)//1024} KB)")
