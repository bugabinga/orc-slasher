#!/usr/bin/env python3
"""Generate the abandoned-city tiles and props: asphalt, crosswalks,
sidewalks, lots, building roofs and facades, wrecked cars, streetlights,
barrels, dumpsters, barricades, manholes and decals. Output: assets/custom/
city_*.png. Everything is drawn procedurally with a fixed seed, so reruns
give identical files.

All art here is original (CC0, do whatever you want with it)."""
import os
import random
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "custom")
os.makedirs(OUT, exist_ok=True)
R = random.Random(1337)
K = (20, 16, 24, 255)


def new(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def save(img, name):
    img.save(os.path.join(OUT, f"city_{name}.png"))


def jit(c, n):
    return tuple(max(0, min(255, v + R.randint(-n, n))) for v in c[:3]) + (255,)


def rect(img, x0, y0, x1, y1, col):  # inclusive
    px = img.load()
    for y in range(max(0, y0), min(img.height, y1 + 1)):
        for x in range(max(0, x0), min(img.width, x1 + 1)):
            px[x, y] = col if len(col) == 4 else col + (255,)


def texture(base, n, specks=(), w=16, h=16):
    img = new(w, h)
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = jit(base, n)
    for col, count in specks:
        for _ in range(count):
            px[R.randrange(w), R.randrange(h)] = col + (255,)
    return img


def crack(img, col, length=10):
    px = img.load()
    x, y = R.randrange(3, 13), R.randrange(3, 13)
    for _ in range(length):
        px[x % 16, y % 16] = col + (255,)
        x += R.choice((-1, 0, 1)); y += R.choice((0, 1, 1))


# ---------------------------------------------------------------- ground ----
ASPHALT = (56, 56, 62)
for i in range(4):
    t = texture(ASPHALT, 5, [((44, 44, 50), 10), ((72, 72, 78), 6)])
    if i == 3:
        crack(t, (30, 30, 36), 14)
    save(t, f"road_{i}")
for d in ("h", "v"):  # worn zebra crossing; stripes run along the road ("v" = on a N-S road)
    t = texture(ASPHALT, 5)
    px = t.load()
    for x in range(16):
        for y in range(16):
            if (y if d == "h" else x) % 6 < 3 and R.random() > 0.18:
                px[x, y] = jit((176, 176, 170), 8)
    save(t, f"cross_{d}")

CONCRETE = (118, 114, 110)
for i in range(2):
    t = texture(CONCRETE, 4, [((100, 96, 92), 8)])
    rect(t, 0, 7 + i, 15, 7 + i, (96, 92, 88))
    rect(t, 7, 0, 7, 15, (96, 92, 88))
    if i == 1:
        crack(t, (84, 80, 76), 8)
    save(t, f"walk_{i}")
for i in range(3):
    save(texture((82, 72, 60), 7, [((60, 52, 44), 12), ((112, 100, 86), 6), ((130, 126, 120), 3)]), f"lot_{i}")
for i in range(2):
    t = texture((70, 76, 46), 7, [((96, 92, 52), 14), ((58, 52, 40), 8)])
    save(t, f"grass_{i}")
for i in range(2):
    t = new(16, 16)
    for by in range(0, 16, 4):
        off = 4 if (by // 4 + i) % 2 else 0
        for bx in range(-off, 16, 8):
            rect(t, bx, by, bx + 6, by + 2, jit((116, 96, 82), 10))
            rect(t, bx + 7, by, bx + 7, by + 3, (78, 64, 56))
        rect(t, 0, by + 3, 15, by + 3, (78, 64, 56))
    save(t, f"plaza_{i}")

# ------------------------------------------------------------- buildings ----
# the first roof set is still drawn (and dropped) so the shared random stream,
# and with it every sprite below, stays exactly as it was
for c in [(64, 62, 68), (78, 60, 52), (58, 66, 76)]:
    texture(c, 4, [(tuple(v - 14 for v in c), 14), (tuple(v + 14 for v in c), 6)])
_main_rng, R = R, random.Random(4242)
# roofs read as roofs from above: brighter than asphalt, each its own material
t = texture((128, 122, 110), 10, [((96, 90, 82), 30), ((158, 152, 140), 20)])  # tar and gravel
save(t, "roof_0")
t = texture((142, 84, 62), 6, [((112, 70, 52), 10)])  # ribbed metal
for x in range(0, 16, 4):
    rect(t, x, 0, x, 15, (108, 62, 46)); rect(t, x + 1, 0, x + 1, 15, (170, 106, 80))
save(t, "roof_1")
t = texture((96, 118, 116), 5, [((120, 140, 136), 8)])  # membrane panels
rect(t, 0, 0, 15, 0, (70, 88, 86)); rect(t, 0, 8, 15, 8, (70, 88, 86)); rect(t, 0, 0, 0, 15, (70, 88, 86))
save(t, "roof_2")
t = texture((152, 138, 126), 6, [((128, 116, 106), 14), ((112, 100, 92), 6)])  # big poured slabs, stained
rect(t, 0, 0, 15, 0, (110, 98, 90)); rect(t, 0, 0, 0, 15, (110, 98, 90))
rect(t, 9, 5, 12, 7, (126, 114, 104)); rect(t, 4, 10, 6, 12, (130, 118, 108))
crack(t, (110, 98, 90), 6)
save(t, "roof_3")
t = new(10, 8)  # skylight
rect(t, 0, 0, 9, 7, K); rect(t, 1, 1, 8, 6, (70, 110, 140)); rect(t, 2, 2, 3, 3, (170, 210, 230)); rect(t, 4, 1, 4, 6, (40, 60, 80))
save(t, "skylight")
R = _main_rng

WALLS = {"brick": (124, 60, 48), "concrete": (116, 116, 122), "beige": (150, 132, 104)}
for name, c in WALLS.items():
    def wall():
        t = texture(c, 4)
        if name == "brick":
            for y in range(0, 16, 3):
                rect(t, 0, y, 15, y, tuple(v - 26 for v in c))
                for x in range((y // 3 % 2) * 4, 16, 8):
                    rect(t, x, y, x, y + 2, tuple(v - 26 for v in c))
        else:
            rect(t, 0, 15, 15, 15, tuple(v - 22 for v in c))
        return t
    save(wall(), f"wall_{name}")
    for v in range(4):  # window: dark, lit, smashed, boarded
        t = wall()
        rect(t, 3, 3, 12, 12, (30, 28, 34))
        rect(t, 4, 4, 11, 11, [(36, 44, 58), (150, 130, 70), (14, 12, 18), (36, 44, 58)][v])
        if v == 0:
            rect(t, 5, 5, 6, 6, (70, 84, 104))
        if v == 1:
            rect(t, 4, 9, 11, 11, (110, 90, 50))
        if v == 2:
            px = t.load()
            for (x, y) in [(4, 4), (5, 4), (4, 5), (11, 4), (10, 4), (11, 11), (4, 11), (5, 11), (10, 11), (11, 10)]:
                px[x, y] = (80, 96, 112, 255)
        if v == 3:
            for y in (5, 8, 10):
                rect(t, 3, y, 12, y + 1, (122, 92, 58))
                rect(t, 3, y + 1, 12, y + 1, (92, 66, 40))
        rect(t, 3, 12, 12, 12, tuple(min(255, x + 30) for x in c))  # sill
        save(t, f"wall_{name}_win{v}")
    for v in range(2):  # door: shut, broken open
        t = wall()
        rect(t, 4, 2, 11, 15, (30, 26, 30))
        if v == 0:
            rect(t, 5, 3, 10, 15, (88, 58, 40))
            rect(t, 9, 9, 9, 9, (200, 170, 90))
        else:
            rect(t, 5, 3, 10, 15, (6, 4, 8))
            rect(t, 9, 4, 11, 15, (88, 58, 40))
        save(t, f"wall_{name}_door{v}")

# rooftop clutter
t = new(12, 10)
rect(t, 0, 2, 11, 9, K); rect(t, 1, 3, 10, 8, (150, 150, 156)); rect(t, 1, 3, 10, 4, (176, 176, 182))
for x in (3, 5, 7, 9):
    rect(t, x, 5, x, 8, (96, 96, 104))
save(t, "ac")
t = new(8, 8)
rect(t, 1, 1, 6, 7, K); rect(t, 2, 2, 5, 6, (100, 100, 108)); rect(t, 2, 2, 5, 3, (130, 130, 138))
save(t, "vent")

# ---------------------------------------------------------------- cars ------
CARS = {"red": (150, 44, 40), "blue": (48, 74, 130), "white": (196, 196, 190), "green": (62, 96, 64),
        "rust": (126, 82, 50), "burnt": (46, 40, 40)}


def car_h(c):
    t = new(32, 20)
    burnt = c == CARS["burnt"]
    dark = tuple(max(0, v - 40) for v in c)
    rect(t, 1, 4, 30, 16, K)
    rect(t, 2, 5, 29, 15, c)
    rect(t, 2, 12, 29, 15, dark)
    rect(t, 9, 2, 22, 11, K)
    rect(t, 10, 3, 21, 10, tuple(min(255, v + 18) for v in c))
    glass = (20, 18, 22) if burnt else (64, 92, 120)
    rect(t, 10, 7, 14, 10, glass); rect(t, 17, 7, 21, 10, glass)
    for wx in (5, 23):
        rect(t, wx, 15, wx + 4, 18, K); rect(t, wx + 1, 15, wx + 3, 17, (40, 38, 42))
    if not burnt:
        rect(t, 29, 7, 29, 8, (230, 220, 160)); rect(t, 2, 7, 2, 8, (170, 30, 30))
    else:
        px = t.load()
        for _ in range(40):
            x, y = R.randrange(2, 30), R.randrange(4, 16)
            if px[x, y][3]:
                px[x, y] = R.choice([(96, 56, 36, 255), (30, 26, 28, 255), (70, 64, 62, 255)])
    return t


def car_v(c):
    t = new(18, 30)
    burnt = c == CARS["burnt"]
    dark = tuple(max(0, v - 40) for v in c)
    rect(t, 1, 1, 16, 28, K)
    rect(t, 2, 2, 15, 27, c)
    rect(t, 2, 24, 15, 27, dark)
    glass = (20, 18, 22) if burnt else (64, 92, 120)
    rect(t, 4, 8, 13, 11, glass)   # windscreen
    rect(t, 4, 20, 13, 22, glass)  # rear window
    rect(t, 4, 12, 13, 19, tuple(min(255, v + 18) for v in c))  # roof
    for wy in (4, 20):
        rect(t, 0, wy, 1, wy + 4, K); rect(t, 16, wy, 17, wy + 4, K)
    if not burnt:
        rect(t, 3, 27, 5, 27, (170, 30, 30)); rect(t, 12, 27, 14, 27, (170, 30, 30))
    else:
        px = t.load()
        for _ in range(40):
            x, y = R.randrange(2, 16), R.randrange(2, 28)
            if px[x, y][3]:
                px[x, y] = R.choice([(96, 56, 36, 255), (30, 26, 28, 255), (70, 64, 62, 255)])
    return t


for name, c in CARS.items():
    save(car_h(c), f"car_h_{name}")
    save(car_v(c), f"car_v_{name}")

# ---------------------------------------------------------------- props -----
t = new(12, 40)  # streetlight: pole, arm to the right, lamp head
rect(t, 2, 6, 4, 39, K); rect(t, 3, 6, 3, 38, (90, 92, 100))
rect(t, 1, 37, 5, 39, K); rect(t, 2, 37, 4, 38, (70, 72, 80))
rect(t, 2, 4, 10, 6, K); rect(t, 3, 5, 9, 5, (90, 92, 100))
rect(t, 7, 6, 11, 8, K); rect(t, 8, 7, 10, 7, (250, 230, 160))
save(t, "lamp")
t = t.copy(); rect(t, 8, 7, 10, 7, (60, 60, 66))
save(t, "lamp_broken")

for name, c in {"barrel": (140, 54, 40), "barrel_blue": (50, 80, 130)}.items():
    t = new(10, 13)
    rect(t, 0, 1, 9, 12, K); rect(t, 1, 2, 8, 11, c); rect(t, 1, 2, 8, 3, tuple(v + 30 for v in c))
    rect(t, 1, 6, 8, 6, tuple(v - 30 for v in c)); rect(t, 1, 9, 8, 9, tuple(v - 30 for v in c))
    rect(t, 3, 4, 3, 10, tuple(v + 20 for v in c))
    save(t, name)
t = new(10, 13)  # fire barrel: rusty drum with a glowing mouth (flames drawn live)
rect(t, 0, 1, 9, 12, K); rect(t, 1, 2, 8, 11, (96, 60, 40)); rect(t, 1, 2, 8, 3, (250, 150, 50))
rect(t, 2, 2, 7, 2, (255, 220, 120)); rect(t, 1, 7, 8, 7, (70, 44, 30))
save(t, "firebarrel")

t = new(26, 18)
rect(t, 0, 3, 25, 17, K); rect(t, 1, 4, 24, 16, (52, 92, 62)); rect(t, 1, 4, 24, 7, (70, 116, 80))
rect(t, 0, 0, 25, 3, K); rect(t, 1, 1, 24, 2, (40, 72, 48))
for x in (4, 12, 20):
    rect(t, x, 9, x + 2, 14, (40, 72, 48))
save(t, "dumpster")

t = new(16, 10)
for (x, y, r) in [(4, 5, 4), (11, 5, 4), (8, 3, 3)]:
    for yy in range(-r, r + 1):
        for xx in range(-r, r + 1):
            if xx * xx + yy * yy <= r * r and 0 <= x + xx < 16 and 0 <= y + yy < 10:
                t.load()[x + xx, y + yy] = (34, 34, 40, 255) if xx * xx + yy * yy > (r - 1) ** 2 else (52, 52, 60, 255)
save(t, "trash")

t = new(32, 14)  # concrete jersey barrier with faded hazard paint
rect(t, 2, 0, 29, 13, K); rect(t, 0, 6, 31, 13, K)
rect(t, 3, 1, 28, 12, (150, 148, 142)); rect(t, 1, 7, 30, 12, (132, 130, 124))
for x in range(4, 28, 8):
    rect(t, x, 2, x + 3, 5, (176, 60, 44))
save(t, "barricade")

t = new(16, 9)  # open manhole: dark sewer mouth, lid shoved aside
for y in range(9):
    for x in range(16):
        dx, dy = (x - 6) / 6, (y - 4) / 3.6
        d = dx * dx + dy * dy
        if d <= 1:
            t.load()[x, y] = (6, 4, 10, 255) if d < 0.62 else (60, 58, 62, 255)
rect(t, 11, 5, 15, 8, K); rect(t, 12, 6, 14, 7, (84, 82, 88))
save(t, "manhole")

t = new(16, 16)
for _ in range(3):
    crack(t, (34, 34, 40), 12)
save(t, "crack")
t = new(16, 16)
px = t.load()
for _ in range(26):
    x, y = int(R.gauss(8, 2.6)), int(R.gauss(8, 2.0))
    if 0 <= x < 16 and 0 <= y < 16:
        px[x, y] = R.choice([(96, 20, 22, 255), (70, 14, 18, 255), (120, 30, 28, 255)])
save(t, "blood")

t = new(18, 28)  # dead tree
rect(t, 7, 12, 10, 27, K); rect(t, 8, 12, 9, 26, (74, 56, 42))
for (x0, y0, dx, n) in [(8, 12, -1, 7), (9, 10, 1, 7), (8, 6, -1, 5), (9, 4, 1, 6)]:
    x, y = x0, y0
    for _ in range(n):
        rect(t, x, y, x, y, (74, 56, 42)); x += dx; y -= R.choice((0, 1))
rect(t, 6, 26, 11, 27, K)
save(t, "tree")

print("wrote city art")
