/* ZOMBIE BLASTER — a Brotato-style roguelike with guns, in an abandoned city.
 * Sprites: 0x72 DungeonTileset II (CC0) + CraftPix + original art, all
 * zombified by tools/zombify.py (see assets/CREDITS.md).
 */
"use strict";

// ------------------------------------------------------------------ setup --
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const VW = canvas.width, VH = canvas.height;

const TILE = 16;
const MAP_W = 120, MAP_H = 80;
const WORLD_W = MAP_W * TILE, WORLD_H = MAP_H * TILE;
const FINAL_WAVE = 10;

// sprite images ------------------------------------------------------------
const IMG = {};
let assetsLeft = 0;
for (const [name, uri] of Object.entries(window.ASSETS)) {
  assetsLeft++;
  const im = new Image();
  im.onload = () => { assetsLeft--; };
  im.onerror = () => { assetsLeft--; }; // a broken sprite must not hang the loading gate
  im.src = uri;
  IMG[name] = im;
}
const imgOk = im => im && im.complete && im.naturalWidth > 0;

const ANIM = {
  orc_grunt_idle: ["orc_grunt_idle_f0", "orc_grunt_idle_f1", "orc_grunt_idle_f2", "orc_grunt_idle_f3"],
  orc_grunt_run: ["orc_grunt_run_f0", "orc_grunt_run_f1", "orc_grunt_run_f2", "orc_grunt_run_f3"],
  goblin_idle: ["goblin_idle_f0", "goblin_idle_f1", "goblin_idle_f2", "goblin_idle_f3"],
  goblin_run: ["goblin_run_f0", "goblin_run_f1", "goblin_run_f2", "goblin_run_f3"],
  orc_warrior_idle: ["orc_warrior_idle_f0", "orc_warrior_idle_f1", "orc_warrior_idle_f2", "orc_warrior_idle_f3"],
  orc_warrior_run: ["orc_warrior_run_f0", "orc_warrior_run_f1", "orc_warrior_run_f2", "orc_warrior_run_f3"],
  masked_orc_idle: ["masked_orc_idle_f0", "masked_orc_idle_f1", "masked_orc_idle_f2", "masked_orc_idle_f3"],
  masked_orc_run: ["masked_orc_run_f0", "masked_orc_run_f1", "masked_orc_run_f2", "masked_orc_run_f3"],
  orc_shaman_idle: ["orc_shaman_idle_f0", "orc_shaman_idle_f1", "orc_shaman_idle_f2", "orc_shaman_idle_f3"],
  orc_shaman_run: ["orc_shaman_run_f0", "orc_shaman_run_f1", "orc_shaman_run_f2", "orc_shaman_run_f3"],
  orc_berserker_idle: ["orc_berserker_idle_f0", "orc_berserker_idle_f1", "orc_berserker_idle_f2", "orc_berserker_idle_f3"],
  orc_berserker_run: ["orc_berserker_run_f0", "orc_berserker_run_f1", "orc_berserker_run_f2", "orc_berserker_run_f3"],
  ogre_idle: ["ogre_idle_f0", "ogre_idle_f1", "ogre_idle_f2", "ogre_idle_f3"],
  ogre_run: ["ogre_run_f0", "ogre_run_f1", "ogre_run_f2", "ogre_run_f3"],
  warchief_idle: ["orc_warchief_idle_f0", "orc_warchief_idle_f1", "orc_warchief_idle_f2", "orc_warchief_idle_f3"],
  warchief_run: ["orc_warchief_run_f0", "orc_warchief_run_f1", "orc_warchief_run_f2", "orc_warchief_run_f3"],
  cave_goblin_idle: ["cave_goblin_idle_f0", "cave_goblin_idle_f1", "cave_goblin_idle_f2", "cave_goblin_idle_f3"],
  cave_goblin_run: ["cave_goblin_run_f0", "cave_goblin_run_f1", "cave_goblin_run_f2", "cave_goblin_run_f3"],
  soulcaller_idle: ["orc_soulcaller_idle_f0", "orc_soulcaller_idle_f1", "orc_soulcaller_idle_f2", "orc_soulcaller_idle_f3"],
  soulcaller_run: ["orc_soulcaller_run_f0", "orc_soulcaller_run_f1", "orc_soulcaller_run_f2", "orc_soulcaller_run_f3"],
  orcgod_idle: ["orc_god_idle_f0", "orc_god_idle_f1", "orc_god_idle_f2", "orc_god_idle_f3"],
  orcgod_run: ["orc_god_run_f0", "orc_god_run_f1", "orc_god_run_f2", "orc_god_run_f3"],
  butcher_idle: ["orc_butcher_idle_f0", "orc_butcher_idle_f1", "orc_butcher_idle_f2", "orc_butcher_idle_f3"],
  butcher_run: ["orc_butcher_run_f0", "orc_butcher_run_f1", "orc_butcher_run_f2", "orc_butcher_run_f3"],
  shamanking_idle: ["orc_shamanking_idle_f0", "orc_shamanking_idle_f1", "orc_shamanking_idle_f2", "orc_shamanking_idle_f3"],
  shamanking_run: ["orc_shamanking_run_f0", "orc_shamanking_run_f1", "orc_shamanking_run_f2", "orc_shamanking_run_f3"],
  campfire: ["campfire_f0", "campfire_f1", "campfire_f2", "campfire_f3"],
  king: ["hanging_king_f0", "hanging_king_f1"],
  gem: ["xp_gem_f0", "xp_gem_f1"],
  coin: ["coin_f0", "coin_f1", "coin_f2", "coin_f3"],
  bolt: ["shaman_bolt_f0", "shaman_bolt_f1"],
};
// gunner heroes (tools/make_gun_art.py)
for (const h of ["marine", "slinger", "demo", "heavy", "pyro", "ghost", "medic", "commando", "armorer"]) {
  ANIM[`${h}_idle`] = [0, 1, 2, 3].map(f => `hero_${h}_idle_f${f}`);
  ANIM[`${h}_run`] = [0, 1, 2, 3].map(f => `hero_${h}_run_f${f}`);
}
// CraftPix 4-direction orcs + recolor variants, all zombified (see assets/CREDITS.md)
for (const p of ["cp_orc1", "cp_orc2", "cp_orc3", "cp_frost", "cp_night", "cp_blood", "cp_savage", "cp_veteran", "cp_ghost"]) {
  for (const d of ["d", "u", "l", "r"]) {
    ANIM[`${p}_idle_${d}`] = [0, 1, 2, 3].map(f => `${p}_idle_${d}_f${f}`);
    ANIM[`${p}_run_${d}`] = [0, 1, 2, 3, 4, 5, 6, 7].map(f => `${p}_run_${d}_f${f}`);
    ANIM[`${p}_attack_${d}`] = [0, 1, 2, 3, 4, 5, 6, 7].map(f => `${p}_attack_${d}_f${f}`);
  }
  ANIM[`${p}_death`] = [0, 1, 2, 3, 4, 5, 6, 7].map(f => `${p}_death_f${f}`);
}

// sound settings ------------------------------------------------------------
const SND = { music: true, sfx: true };
try { Object.assign(SND, JSON.parse(localStorage.getItem("orcslasher_sound") || "{}")); } catch (e) { /* no storage */ }
function saveSound() { try { localStorage.setItem("orcslasher_sound", JSON.stringify(SND)); } catch (e) { /* no storage */ } }

// tiny synth ---------------------------------------------------------------
let AC = null;
function audio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  startMusic();
  return AC;
}

// ambient night loop: slow minor bassline + sparse arpeggio, all synthesized
const MUSIC = { started: false, nextT: 0, step: 0 };
const M_BASS = [55.0, 55.0, 65.41, 65.41, 43.65, 43.65, 49.0, 49.0]; // A1 C2 F1 G1
const M_ARP = [220, 261.63, 329.63, 440, 329.63, 261.63];
function mnote(freq, t, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AC.destination);
  o.start(t); o.stop(t + dur);
}
function startMusic() {
  if (MUSIC.started || !AC) return;
  MUSIC.started = true;
  MUSIC.nextT = AC.currentTime + 0.1;
  setInterval(() => {
    while (MUSIC.nextT < AC.currentTime + 0.35) {
      const s = MUSIC.step, t = MUSIC.nextT;
      if (SND.music) {
        if (s % 4 === 0) mnote(M_BASS[(s / 4) | 0], t, 1.25, "triangle", 0.05);
        if (s % 2 === 0) mnote(M_ARP[(s / 2) % M_ARP.length] / 2, t, 0.30, "square", 0.011);
        if (s % 8 === 4) mnote(2200, t, 0.03, "square", 0.005); // soft tick
      }
      MUSIC.step = (MUSIC.step + 1) % 32;
      MUSIC.nextT += 0.33;
    }
  }, 120);
}

function beep(freq, dur, type = "square", vol = 0.08, slide = 0) {
  if (!SND.sfx) return;
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
// filtered white noise: the crack of every gunshot and explosion
let noiseBuf = null;
function noise(dur, vol, freq = 1800) {
  if (!SND.sfx) return;
  try {
    const ac = audio();
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    f.type = "lowpass"; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(); src.stop(ac.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
let lastShotSfx = 0;
function gunSfx(kind) {
  const now = performance.now();
  if (now - lastShotSfx < 45) return; // miniguns would drown everything else
  lastShotSfx = now;
  if (kind === "heavy") { noise(0.2, 0.13, 1300); beep(90, 0.12, "square", 0.05, -50); }
  else if (kind === "rocket") { noise(0.32, 0.08, 700); beep(220, 0.22, "sawtooth", 0.04, -150); }
  else if (kind === "thump") { noise(0.08, 0.08, 500); beep(160, 0.08, "square", 0.05, -90); }
  else if (kind === "flame") noise(0.1, 0.03, 900);
  else { noise(0.07, 0.07, 2600); beep(150, 0.04, "square", 0.03, -70); }
}
const SFX = {
  hit: () => beep(120, 0.08, "square", 0.06, -60),
  die: () => beep(70, 0.2, "sawtooth", 0.09, -40),
  gem: () => beep(880, 0.07, "sine", 0.07, 240),
  coinS: () => beep(1180, 0.06, "sine", 0.05, 120),
  hurt: () => beep(90, 0.25, "square", 0.1, -50),
  boom: () => { noise(0.5, 0.16, 520); beep(60, 0.35, "sawtooth", 0.12, -30); },
  reload: () => { beep(620, 0.04, "square", 0.04); setTimeout(() => beep(880, 0.05, "square", 0.04), 110); },
  level: () => { beep(520, 0.09, "square", 0.06); setTimeout(() => beep(660, 0.09, "square", 0.06), 90); setTimeout(() => beep(880, 0.14, "square", 0.06), 180); },
  card: () => beep(440, 0.08, "triangle", 0.08, 100),
  dash: () => beep(300, 0.1, "sine", 0.05, 300),
  bossRoar: () => beep(55, 0.6, "sawtooth", 0.12, -20),
  waveClear: () => { beep(392, 0.12, "triangle", 0.08); setTimeout(() => beep(523, 0.12, "triangle", 0.08), 120); setTimeout(() => beep(784, 0.2, "triangle", 0.08), 240); },
};

// input --------------------------------------------------------------------
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (passModal.open) {
    // the hidden input owns typing; here we only rescue focus and handle exits
    if (e.code === "Escape") closePassModal();
    else if (e.code === "Enter") submitPassword();
    else if (document.activeElement !== devInput) devInput.focus();
    return;
  }
  if (G.state !== "play") devFeedKey(e.key);
  handleKey(e.code);
});
window.addEventListener("keyup", e => { keys[e.code] = false; });

// virtual joystick + dash button for touch
const touchState = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
let usingTouch = false;
const DASH_BTN = { x: VW - 30, y: VH - 30, r: 18 };
function canvasPos(t) {
  const r = canvas.getBoundingClientRect();
  // object-fit: contain math
  const scale = Math.min(r.width / VW, r.height / VH);
  const offX = (r.width - VW * scale) / 2, offY = (r.height - VH * scale) / 2;
  return { x: (t.clientX - r.left - offX) / scale, y: (t.clientY - r.top - offY) / scale };
}
canvas.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch") usingTouch = true;
  const p = canvasPos(e);
  if (passModal.open || (["title", "cls", "select"].includes(G.state) && keyBtnRect &&
      p.x >= keyBtnRect.x - 3 && p.x <= keyBtnRect.x + keyBtnRect.w + 3 &&
      p.y >= keyBtnRect.y - 3 && p.y <= keyBtnRect.y + keyBtnRect.h + 3)) {
    e.preventDefault(); // keep focus on the hidden password input
    handleClick(p.x, p.y);
    return;
  }
  if (G.state === "play" && !G.paused && usingTouch &&
      Math.hypot(p.x - DASH_BTN.x, p.y - DASH_BTN.y) < DASH_BTN.r + 6) {
    // dash toward joystick direction, or facing if standing still
    let dx = player.facing, dy = 0;
    if (touchState.active) {
      const d = Math.hypot(touchState.dx, touchState.dy);
      if (d > 8) { dx = touchState.dx / d; dy = touchState.dy / d; }
    }
    tryDash(dx, dy);
    return;
  }
  if (handleClick(p.x, p.y)) return;
  touchState.active = true; touchState.id = e.pointerId;
  touchState.ox = p.x; touchState.oy = p.y; touchState.dx = 0; touchState.dy = 0;
});
canvas.addEventListener("pointermove", e => {
  if (!touchState.active || e.pointerId !== touchState.id) return;
  const p = canvasPos(e);
  touchState.dx = p.x - touchState.ox; touchState.dy = p.y - touchState.oy;
});
window.addEventListener("pointerup", e => {
  if (e.pointerId !== touchState.id) return;
  touchState.active = false;
});

// ------------------------------------------------------------------- util --
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// every HP / damage number the player sees is shown x3.3 (10 dmg reads as 33)
const NUM_MULT = 3.3;
const big = v => Math.round(v * NUM_MULT);
const bigf = v => Math.round(v * NUM_MULT * 10) / 10;

function drawSprite(name, x, y, flip = false, scale = 1, alpha = 1) {
  const im = IMG[name];
  if (!im || !im.complete) return;
  const w = im.width * scale, h = im.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, Math.round(-w / 2), Math.round(-h), w, h); // feet anchor
  ctx.restore();
}
function animFrame(list, t, fps = 8) {
  return list[Math.floor(t * fps) % list.length];
}

// ------------------------------------------------------------------- map ---
// an abandoned city: a grid of 4-lane roads with sidewalks; the blocks
// between them hold buildings (solid), dead parks and rubble lots, and
// wrecks litter the streets. Solids live in a tile grid (buildings) plus
// per-tile lists of prop rects (cars, barrels, trees…)
const T_BLD = 0, T_ROAD = 1, T_WALK = 2, T_LOT = 3, T_GRASS = 4, T_PLAZA = 5;
let floorCanvas = null, miniCanvas = null;
let solidGrid = null, propGrid = null, walkGrid = null;
let props = [];       // y-sorted, drawn live: { img, x, y (feet), flip, rect, fire, fireY }
let lamps = [], spawnSpots = [], kingPos = null, startPos = null;

const tileAt = (x, y) => clamp(Math.floor(y / TILE), 0, MAP_H - 1) * MAP_W + clamp(Math.floor(x / TILE), 0, MAP_W - 1);

function buildMap() {
  props = []; lamps = []; spawnSpots = [];
  const N = MAP_W * MAP_H;
  const T = new Uint8Array(N).fill(T_LOT);
  const bid = new Int16Array(N).fill(-1); // building id per tile; -2 = city edge
  const at = (tx, ty) => ty * MAP_W + tx;
  const EDGE = 2;

  // road grid
  const vx = [], hy = [];
  for (let x = irnd(7, 10); x < MAP_W - 12; x += irnd(17, 23)) vx.push(x);
  for (let y = irnd(6, 8); y < MAP_H - 10; y += irnd(13, 17)) hy.push(y);
  const inV = tx => vx.some(x => tx >= x && tx <= x + 3);
  const inH = ty => hy.some(y => ty >= y && ty <= y + 3);
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const i = at(tx, ty);
      if (tx < EDGE || ty < EDGE || tx >= MAP_W - EDGE || ty >= MAP_H - EDGE) { T[i] = T_BLD; bid[i] = -2; }
      else if (inV(tx) || inH(ty)) T[i] = T_ROAD;
      else if (vx.some(x => tx === x - 1 || tx === x + 4) || hy.some(y => ty === y - 1 || ty === y + 4)) T[i] = T_WALK;
    }
  }
  // the player starts on the crossroads nearest the middle
  let best = 1e9;
  for (const x of vx) for (const y of hy) {
    const d = Math.hypot(x + 2 - MAP_W / 2, y + 2 - MAP_H / 2);
    if (d < best) { best = d; startPos = { x: (x + 2) * TILE, y: (y + 2) * TILE }; }
  }
  const nearStart = (x, y, r) => Math.hypot(x - startPos.x, y - startPos.y) < r;

  // blocks: the rectangles between the sidewalks
  const cols = [], rows = [];
  for (let i = 0; i <= vx.length; i++) cols.push([i ? vx[i - 1] + 5 : EDGE, i < vx.length ? vx[i] - 2 : MAP_W - EDGE - 1]);
  for (let i = 0; i <= hy.length; i++) rows.push([i ? hy[i - 1] + 5 : EDGE, i < hy.length ? hy[i] - 2 : MAP_H - EDGE - 1]);
  const blocks = [];
  for (const [x0, x1] of cols) for (const [y0, y1] of rows) if (x1 - x0 >= 2 && y1 - y0 >= 2) blocks.push({ x0, x1, y0, y1 });
  // the King hangs in a plaza on the east side
  let kingBlock = null; best = 1e9;
  for (const b of blocks) {
    const d = Math.hypot((b.x0 + b.x1) / 2 - MAP_W * 0.82, (b.y0 + b.y1) / 2 - MAP_H / 2);
    if (d < best && b.x1 - b.x0 >= 5 && b.y1 - b.y0 >= 5) { best = d; kingBlock = b; }
  }

  const buildings = [];
  const WALL_STYLES = ["brick", "concrete", "beige"];
  function addBuilding(x0, x1, y0, y1) {
    const id = buildings.length;
    const w = x1 - x0 + 1, doors = new Set([x0 + irnd(1, Math.max(1, w - 2))]);
    if (w >= 7 && Math.random() < 0.5) doors.add(x0 + irnd(1, w - 2));
    buildings.push({ x0, x1, y0, y1, wall: pick(WALL_STYLES), roof: irnd(0, 2), doors });
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { T[at(tx, ty)] = T_BLD; bid[at(tx, ty)] = id; }
  }
  function buildingRow(b, y0, y1) {
    let x = b.x0;
    while (x <= b.x1) {
      let w = irnd(4, 8);
      if (b.x1 - (x + w - 1) < 4) w = b.x1 - x + 1; // swallow a sliver too thin to build on
      const yb = y1 - (Math.random() < 0.25 ? 1 : 0); // some stand back from the street
      if (yb - y0 >= 2) addBuilding(x, x + w - 1, y0, yb);
      x += w;
      if (x <= b.x1 - 4 && Math.random() < 0.3) x++; // alley
    }
  }
  const fillType = (b, t) => { for (let ty = b.y0; ty <= b.y1; ty++) for (let tx = b.x0; tx <= b.x1; tx++) T[at(tx, ty)] = t; };
  const kinds = [];
  for (const b of blocks) {
    if (b === kingBlock) { fillType(b, T_PLAZA); kinds.push("plaza"); continue; }
    const r = Math.random();
    if (r < 0.68 && b.x1 - b.x0 >= 3 && b.y1 - b.y0 >= 3) {
      if (b.y1 - b.y0 >= 10 && Math.random() < 0.55) { // two rows facing a back alley
        const mid = Math.floor((b.y0 + b.y1) / 2);
        buildingRow(b, b.y0, mid - 1);
        buildingRow(b, mid + 1, b.y1);
      } else buildingRow(b, b.y0, b.y1);
      kinds.push("bld");
    } else if (r < 0.84) { fillType(b, T_GRASS); kinds.push("park"); }
    else kinds.push("lot");
  }
  solidGrid = new Uint8Array(N);
  for (let i = 0; i < N; i++) solidGrid[i] = T[i] === T_BLD ? 1 : 0;
  const walkable = (tx, ty) => tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H && T[at(tx, ty)] !== T_BLD;

  // ---- props (solid ones also go into propGrid)
  const free = (x, y, w, h, pad = 3) => {
    for (let ty = Math.floor((y - pad) / TILE); ty <= Math.floor((y + h + pad) / TILE); ty++) {
      for (let tx = Math.floor((x - pad) / TILE); tx <= Math.floor((x + w + pad) / TILE); tx++) if (!walkable(tx, ty)) return false;
    }
    return !props.some(p => p.rect && x < p.rect.x + p.rect.w + pad && x + w + pad > p.rect.x && y < p.rect.y + p.rect.h + pad && y + h + pad > p.rect.y);
  };
  // rect: footprint relative to the feet point
  function addProp(img, x, y, rect, extra = {}) {
    const r = rect ? { x: x + rect[0], y: y + rect[1], w: rect[2], h: rect[3] } : null;
    if (r && (!free(r.x, r.y, r.w, r.h) || (r.w > 8 && nearStart(x, y, 7 * TILE)))) return null; // keep the start clear of wrecks
    const p = { img, x, y, rect: r, flip: false, t: rnd(0, 9), ...extra };
    props.push(p);
    return p;
  }
  const CAR_COLORS = ["red", "blue", "white", "green", "rust", "rust", "burnt"];
  const car = (x, y, vertical) => {
    const col = pick(CAR_COLORS);
    const p = vertical
      ? addProp(`city_car_v_${col}`, x, y, [-8, -28, 16, 26])
      : addProp(`city_car_h_${col}`, x, y, [-15, -14, 30, 12], { flip: Math.random() < 0.5 });
    if (p && col === "burnt" && Math.random() < 0.6) { p.fire = true; p.fireY = vertical ? 18 : 12; }
  };
  // wrecks on the roads
  for (const x of vx) {
    for (let ty = EDGE; ty < MAP_H - EDGE; ty += irnd(5, 11)) {
      if (inH(ty) || inH(ty - 2)) continue;
      car((x + (Math.random() < 0.5 ? 1 : 3)) * TILE, ty * TILE + rnd(0, 8), true);
    }
  }
  for (const y of hy) {
    for (let tx = EDGE; tx < MAP_W - EDGE; tx += irnd(5, 11)) {
      if (inV(tx) || inV(tx + 1)) continue;
      car(tx * TILE + rnd(0, 8), (y + (Math.random() < 0.5 ? 2 : 4)) * TILE - 2, false);
    }
  }
  // roadblocks: a jersey barrier half across some street segments
  for (let i = 0; i < Math.round(vx.length * hy.length * 0.6); i++) {
    if (Math.random() < 0.5) {
      const x = pick(vx), ty = irnd(EDGE + 2, MAP_H - EDGE - 3);
      if (!inH(ty)) addProp("city_barricade", (x + (Math.random() < 0.5 ? 1 : 3)) * TILE, ty * TILE, [-15, -8, 30, 7]);
    } else {
      const y = pick(hy), tx = irnd(EDGE + 2, MAP_W - EDGE - 3);
      if (!inV(tx)) addProp("city_barricade", tx * TILE, (y + 2) * TILE + (Math.random() < 0.5 ? 0 : 16), [-15, -8, 30, 7]);
    }
  }
  // streetlights along every sidewalk, a quarter of them dead
  const lamp = (tx, ty, flip) => {
    if (!walkable(tx, ty)) return;
    const x = tx * TILE + 8, y = ty * TILE + 14;
    const p = addProp("city_lamp", x, y, [-2, -3, 4, 3], { flip });
    if (!p) return;
    const broken = Math.random() < 0.25;
    if (broken) p.img = "city_lamp_broken";
    else lamps.push({ x: x + (flip ? -7 : 7), y: y - 10, flicker: Math.random() < 0.15, t: rnd(0, 9) });
  };
  for (const x of vx) for (let ty = EDGE + 2; ty < MAP_H - EDGE - 1; ty += 6) {
    if (inH(ty) || inH(ty + 1) || inH(ty - 1)) continue;
    lamp(x - 1, ty, false); lamp(x + 4, ty + 3, true);
  }
  for (const y of hy) for (let tx = EDGE + 3; tx < MAP_W - EDGE - 1; tx += 7) {
    if (inV(tx) || inV(tx + 1) || inV(tx - 1)) continue;
    lamp(tx, y - 1, Math.random() < 0.5); lamp(tx + 3, y + 4, Math.random() < 0.5);
  }
  // block fillings
  const spotIn = b => ({ x: rnd(b.x0 * TILE + 10, (b.x1 + 1) * TILE - 10), y: rnd(b.y0 * TILE + 16, (b.y1 + 1) * TILE - 4) });
  blocks.forEach((b, k) => {
    const area = (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1);
    if (kinds[k] === "park") {
      for (let i = 0; i < area / 12; i++) { const s = spotIn(b); addProp("city_tree", s.x, s.y, [-2, -3, 4, 3]); }
    } else if (kinds[k] === "lot") {
      for (let i = 0; i < area / 22; i++) { const s = spotIn(b); car(s.x, s.y, Math.random() < 0.5); }
      for (let i = 0; i < area / 30; i++) {
        const s = spotIn(b);
        const p = addProp(Math.random() < 0.5 ? "city_firebarrel" : pick(["city_barrel", "city_barrel_blue"]), s.x, s.y, [-5, -6, 10, 6]);
        if (p && p.img === "city_firebarrel") { p.fire = true; p.fireY = 12; }
      }
      for (let i = 0; i < area / 40; i++) { const s = spotIn(b); addProp("city_dumpster", s.x, s.y, [-13, -10, 26, 9]); }
    } else if (kinds[k] === "plaza") {
      kingPos = { x: ((b.x0 + b.x1 + 1) / 2) * TILE, y: ((b.y0 + b.y1 + 1) / 2) * TILE + 8 };
      addProp(null, kingPos.x, kingPos.y, [-15, -3, 4, 4], { gallows: true });
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const p = addProp("city_firebarrel", kingPos.x + dx * 40, kingPos.y + dy * 26, [-5, -6, 10, 6]);
        if (p) { p.fire = true; p.fireY = 12; }
      }
      for (let i = 0; i < area / 16; i++) { const s = spotIn(b); if (dist(s, kingPos) > 50) addProp("city_tree", s.x, s.y, [-2, -3, 4, 3]); }
    }
  });
  // alleys and lots between buildings get dumpsters, bags and barrels
  for (let i = 0; i < N / 70; i++) {
    const tx = irnd(EDGE, MAP_W - EDGE - 1), ty = irnd(EDGE, MAP_H - EDGE - 1);
    if (T[at(tx, ty)] !== T_LOT && T[at(tx, ty)] !== T_WALK) continue;
    const x = tx * TILE + 8, y = ty * TILE + 12, r = Math.random();
    if (r < 0.25) addProp("city_dumpster", x, y, [-13, -10, 26, 9]);
    else if (r < 0.55) addProp(pick(["city_barrel", "city_barrel_blue"]), x, y, [-5, -6, 10, 6]);
    else if (r < 0.7) { const p = addProp("city_firebarrel", x, y, [-5, -6, 10, 6]); if (p) { p.fire = true; p.fireY = 12; } }
  }

  propGrid = Array.from({ length: N }, () => []);
  walkGrid = new Uint8Array(N);
  for (let i = 0; i < N; i++) walkGrid[i] = solidGrid[i] ? 0 : 1;
  for (const p of props) {
    const r = p.rect;
    if (!r) continue;
    for (let ty = Math.floor(r.y / TILE); ty <= Math.floor((r.y + r.h) / TILE); ty++) {
      for (let tx = Math.floor(r.x / TILE); tx <= Math.floor((r.x + r.w) / TILE); tx++) {
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
        propGrid[at(tx, ty)].push(r);
        const cx = tx * TILE + 8, cy = ty * TILE + 8;
        if (cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h) walkGrid[at(tx, ty)] = 0;
      }
    }
  }

  // ---- paint the floor canvas
  floorCanvas = document.createElement("canvas");
  floorCanvas.width = WORLD_W; floorCanvas.height = WORLD_H + 8;
  const fc = floorCanvas.getContext("2d");
  fc.imageSmoothingEnabled = false;
  const put = (name, x, y, fb) => {
    const im = IMG[name];
    if (imgOk(im)) fc.drawImage(im, x, y);
    else if (fb) { fc.fillStyle = fb; fc.fillRect(x, y, TILE, TILE); } // survives a stale-cache sprite mismatch
  };
  const hash = (tx, ty) => ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  const WIN = ["win0", "win0", "win0", "win0", "win2", "win2", "win3", "win3", "win1"];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const i = at(tx, ty), h = hash(tx, ty), x = tx * TILE, y = ty * TILE, t = T[i];
      if (t === T_ROAD) put(`city_road_${h % 13 === 0 ? 3 : h % 3}`, x, y, "#38383e");
      else if (t === T_WALK) put(`city_walk_${h % 5 === 0 ? 1 : 0}`, x, y, "#76726e");
      else if (t === T_LOT) put(`city_lot_${h % 3}`, x, y, "#52483c");
      else if (t === T_GRASS) put(`city_grass_${h % 2}`, x, y, "#464c2e");
      else if (t === T_PLAZA) put(`city_plaza_${(tx + ty) % 2}`, x, y, "#706054");
      else {
        const b = buildings[bid[i]] || { wall: "concrete", roof: 0, doors: new Set() };
        const below1 = ty + 1 < MAP_H && T[i + MAP_W] !== T_BLD;
        const below2 = ty + 2 < MAP_H && T[i + 2 * MAP_W] !== T_BLD && T[i + MAP_W] === T_BLD;
        if (below1) put(b.doors.has(tx) ? `city_wall_${b.wall}_door${h % 3 === 0 ? 1 : 0}` : `city_wall_${b.wall}_${WIN[h % WIN.length]}`, x, y, "#5a4c48");
        else if (below2) put(`city_wall_${b.wall}_${WIN[(h >> 3) % WIN.length]}`, x, y, "#5a4c48");
        else {
          put(`city_roof_${b.roof}`, x, y, "#403e44");
          // parapet: dark edge where the roof meets another building or the sky
          fc.fillStyle = "#1a161e";
          if (ty === 0 || bid[i - MAP_W] !== bid[i]) fc.fillRect(x, y, TILE, 2);
          if (tx === 0 || bid[i - 1] !== bid[i]) fc.fillRect(x, y, 1, TILE);
          if (tx === MAP_W - 1 || bid[i + 1] !== bid[i]) fc.fillRect(x + TILE - 1, y, 1, TILE);
          if (h % 17 === 0 && bid[i] >= 0) put(h % 2 ? "city_ac" : "city_vent", x + 2, y + 3);
        }
        if (below1 && b.doors.has(tx) && bid[i] >= 0) spawnSpots.push({ x: x + 8, y: y + TILE + 8 });
      }
    }
  }
  // curbs, facade shadows, lane markings, crosswalks
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const i = at(tx, ty), x = tx * TILE, y = ty * TILE;
      if (T[i] === T_WALK) {
        fc.fillStyle = "rgba(30,28,34,0.8)";
        if (tx + 1 < MAP_W && T[i + 1] === T_ROAD) fc.fillRect(x + 15, y, 1, TILE);
        if (tx > 0 && T[i - 1] === T_ROAD) fc.fillRect(x, y, 1, TILE);
        if (ty + 1 < MAP_H && T[i + MAP_W] === T_ROAD) fc.fillRect(x, y + 15, TILE, 1);
        if (ty > 0 && T[i - MAP_W] === T_ROAD) fc.fillRect(x, y, TILE, 1);
      }
      if (T[i] !== T_BLD && ty > 0 && T[i - MAP_W] === T_BLD) {
        fc.fillStyle = "rgba(0,0,0,0.35)"; fc.fillRect(x, y, TILE, 3);
      }
    }
  }
  fc.fillStyle = "rgba(196,160,60,0.75)";
  for (const x of vx) for (let ty = EDGE; ty < MAP_H - EDGE; ty++) {
    if (!inH(ty) && !hy.some(y => ty === y - 1 || ty === y + 4)) fc.fillRect((x + 2) * TILE - 1, ty * TILE + 3, 2, 9);
  }
  for (const y of hy) for (let tx = EDGE; tx < MAP_W - EDGE; tx++) {
    if (!inV(tx) && !vx.some(x => tx === x - 1 || tx === x + 4)) fc.fillRect(tx * TILE + 3, (y + 2) * TILE - 1, 9, 2);
  }
  for (const x of vx) for (const y of hy) {
    for (let k = 0; k < 4; k++) {
      for (const ty of [y - 1, y + 4]) if (T[at(x + k, ty)] === T_ROAD) put("city_cross_v", (x + k) * TILE, ty * TILE);
      for (const tx of [x - 1, x + 4]) if (T[at(tx, y + k)] === T_ROAD) put("city_cross_h", tx * TILE, (y + k) * TILE);
    }
  }
  // decals: cracks, blood, bones; sewer manholes the dead climb out of
  for (let ty = EDGE; ty < MAP_H - EDGE; ty++) {
    for (let tx = EDGE; tx < MAP_W - EDGE; tx++) {
      const i = at(tx, ty), x = tx * TILE, y = ty * TILE;
      if (T[i] === T_BLD || !walkGrid[i]) continue;
      const r = Math.random();
      if (T[i] === T_ROAD && r < 0.05) put("city_crack", x, y);
      else if (r < 0.065) put("city_blood", x, y);
      else if (r < 0.07) put(Math.random() < 0.5 ? "skull" : "bone_pile", x + 2, y + 6);
      else if (r < 0.085 && T[i] !== T_ROAD) put("city_trash", x, y + 5);
    }
  }
  for (const x of vx) for (let ty = EDGE + 3; ty < MAP_H - EDGE - 3; ty += irnd(8, 12)) {
    const tx = x + irnd(0, 2);
    if (inH(ty) || !walkGrid[at(tx, ty)]) continue;
    put("city_manhole", tx * TILE + 4, ty * TILE + 6);
    spawnSpots.push({ x: tx * TILE + 10, y: ty * TILE + 12 });
  }
  for (const y of hy) for (let tx = EDGE + 3; tx < MAP_W - EDGE - 3; tx += irnd(9, 14)) {
    const ty = y + irnd(0, 2);
    if (inV(tx) || !walkGrid[at(tx, ty)]) continue;
    put("city_manhole", tx * TILE + 4, ty * TILE + 6);
    spawnSpots.push({ x: tx * TILE + 10, y: ty * TILE + 12 });
  }
  if (kingPos) { // dried blood under the gallows
    fc.fillStyle = "rgba(110,20,26,0.75)";
    fc.beginPath(); fc.ellipse(kingPos.x, kingPos.y + 3, 9, 3, 0, 0, Math.PI * 2); fc.fill();
  }

  // minimap: one pixel per tile
  miniCanvas = document.createElement("canvas");
  miniCanvas.width = MAP_W; miniCanvas.height = MAP_H;
  const mc = miniCanvas.getContext("2d");
  const MCOL = ["#1c1820", "#55555e", "#7a7672", "#4e4438", "#46502e", "#7a6250"];
  for (let i = 0; i < N; i++) { mc.fillStyle = MCOL[T[i]]; mc.fillRect(i % MAP_W, Math.floor(i / MAP_W), 1, 1); }
}

// push a circle out of one rect; a center buried inside exits by the nearest side
function pushOut(x, y, r, s) {
  const cx = clamp(x, s.x, s.x + s.w), cy = clamp(y, s.y, s.y + s.h);
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [x, y];
  if (d2 === 0) {
    const l = x - s.x, rr = s.x + s.w - x, t = y - s.y, b = s.y + s.h - y, m = Math.min(l, rr, t, b);
    if (m === l) return [s.x - r, y];
    if (m === rr) return [s.x + s.w + r, y];
    if (m === t) return [x, s.y - r];
    return [x, s.y + s.h + r];
  }
  const d = Math.sqrt(d2);
  return [cx + (dx / d) * r, cy + (dy / d) * r];
}

function collideSolids(x, y, r) {
  for (let ty = Math.floor((y - r) / TILE); ty <= Math.floor((y + r) / TILE); ty++) {
    for (let tx = Math.floor((x - r) / TILE); tx <= Math.floor((x + r) / TILE); tx++) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      const i = ty * MAP_W + tx;
      if (solidGrid[i]) [x, y] = pushOut(x, y, r, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
      for (const s of propGrid[i]) [x, y] = pushOut(x, y, r, s);
    }
  }
  return { x, y };
}

const inRock = (x, y) => {
  const i = tileAt(x, y);
  return !!solidGrid[i] || propGrid[i].some(s => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h);
};

// flow field: BFS tile distances from the player, refreshed a few times a
// second; zombies walk downhill on it, so they round corners and buildings
let flowDist = null, flowQ = null, flowT = 0;
function updateFlow() {
  const N = MAP_W * MAP_H;
  if (!flowDist || flowDist.length !== N) { flowDist = new Int16Array(N); flowQ = new Int32Array(N); }
  flowDist.fill(-1);
  const s = tileAt(player.x, player.y);
  let head = 0, tail = 0;
  flowDist[s] = 0; flowQ[tail++] = s;
  while (head < tail) {
    const i = flowQ[head++], x = i % MAP_W, d = flowDist[i] + 1;
    if (x > 0 && walkGrid[i - 1] && flowDist[i - 1] < 0) { flowDist[i - 1] = d; flowQ[tail++] = i - 1; }
    if (x < MAP_W - 1 && walkGrid[i + 1] && flowDist[i + 1] < 0) { flowDist[i + 1] = d; flowQ[tail++] = i + 1; }
    if (i >= MAP_W && walkGrid[i - MAP_W] && flowDist[i - MAP_W] < 0) { flowDist[i - MAP_W] = d; flowQ[tail++] = i - MAP_W; }
    if (i + MAP_W < N && walkGrid[i + MAP_W] && flowDist[i + MAP_W] < 0) { flowDist[i + MAP_W] = d; flowQ[tail++] = i + MAP_W; }
  }
}
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function flowDir(e) {
  const i = tileAt(e.x, e.y), d0 = flowDist[i];
  if (d0 === 0 || d0 === 1) return null; // close enough to charge straight in
  const x = i % MAP_W, y = Math.floor(i / MAP_W);
  let bestJ = -1, bd = d0 < 0 ? 1e9 : d0;
  for (const [dx, dy] of DIRS8) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
    const j = ny * MAP_W + nx;
    if (flowDist[j] < 0 || flowDist[j] >= bd) continue;
    if (dx && dy && (!walkGrid[i + dx] || !walkGrid[i + dy * MAP_W])) continue; // no corner cutting
    bd = flowDist[j]; bestJ = j;
  }
  if (bestJ < 0) return null;
  return { x: (bestJ % MAP_W) * TILE + 8 - e.x, y: Math.floor(bestJ / MAP_W) * TILE + 8 - e.y };
}

// ------------------------------------------------------------------ state --
const G = {
  state: "title", // title | play | campfire | gameover | victory
  t: 0, wave: 0, kills: 0, coins: 0, shake: 0, hitPause: 0,
  endless: false,
  cls: "marine", weapon: "rifle",
  cam: { x: 0, y: 0 },
};

let player, enemies, gems, coins, flasks, bolts, bullets, grenades, firePatches, bossRings, fx, texts, spawnQueue, spawnTimer;
let campfire = null; // campfire scene state

// every weapon is a gun: it fires `pellets` projectiles per shot from a clip,
// then reloads. kind: bullet | rocket (explodes on hit) | grenade (lobbed,
// explodes where it lands) | flame (short-lived, slows, pierces)
const WEAPONS = {
  pistol: { name: "Pistol", desc: "reliable sidearm, pierces 1", sprite: "gun_pistol", dmg: 10, atkSpd: 2.6, range: 150, clip: 12, reload: 1.2, speed: 340, spread: 0.04, pierce: 1, kind: "bullet", snd: "light" },
  revolver: { name: "Twin Revolvers", desc: "akimbo six-shooters, pierce 1", sprite: "gun_revolver", dmg: 8, atkSpd: 3.6, range: 145, clip: 12, reload: 1.6, speed: 360, spread: 0.06, pierce: 1, kind: "bullet", akimbo: true, snd: "light" },
  uzi: { name: "Uzi", desc: "spray and pray, pierces 1", sprite: "gun_uzi", dmg: 3.6, atkSpd: 9, range: 120, clip: 32, reload: 1.6, speed: 330, spread: 0.16, pierce: 1, kind: "bullet", snd: "light" },
  shotgun: { name: "Shotgun", desc: "7 pellets, brutal up close", sprite: "gun_shotgun", dmg: 4.5, pellets: 7, atkSpd: 1.1, range: 95, clip: 6, reload: 2.0, speed: 320, spread: 0.3, pierce: 1, kind: "bullet", snd: "heavy", kick: 4 },
  rifle: { name: "Assault Rifle", desc: "fast, accurate, pierces 2", sprite: "gun_rifle", dmg: 5.5, atkSpd: 5, range: 165, clip: 30, reload: 1.8, speed: 380, spread: 0.06, pierce: 2, kind: "bullet", snd: "light" },
  sniper: { name: "Sniper Rifle", desc: "slow, huge damage, pierces 4", sprite: "gun_sniper", dmg: 22, atkSpd: 0.8, range: 240, clip: 5, reload: 2.2, speed: 620, spread: 0, pierce: 4, kind: "bullet", snd: "heavy", kick: 4 },
  minigun: { name: "Minigun", desc: "pierces 1, slows you down", sprite: "gun_minigun", dmg: 3, atkSpd: 14, range: 140, clip: 120, reload: 3.4, speed: 360, spread: 0.2, pierce: 1, kind: "bullet", move: 0.85, snd: "light" },
  rocket: { name: "Rocket Launcher", desc: "rockets explode on impact", sprite: "gun_rocket", dmg: 16, atkSpd: 0.8, range: 175, clip: 3, reload: 2.6, speed: 210, spread: 0.02, kind: "rocket", blast: 34, snd: "rocket", kick: 5 },
  grenade: { name: "Grenade Launcher", desc: "lobbed explosive shells", sprite: "gun_grenade", dmg: 11, atkSpd: 1.2, range: 150, clip: 6, reload: 2.2, kind: "grenade", blast: 30, snd: "thump", kick: 3 },
  incendiary: { name: "Firebomb Launcher", desc: "shells set the ground ablaze", sprite: "gun_grenade", dmg: 8, atkSpd: 1.0, range: 140, clip: 4, reload: 2.4, kind: "grenade", blast: 26, fire: true, snd: "thump", kick: 3 },
  flamer: { name: "Flamethrower", desc: "short cone, burns crowds", sprite: "gun_flamer", dmg: 1.1, atkSpd: 16, range: 70, clip: 100, reload: 2.6, speed: 150, spread: 0.22, pierce: 99, kind: "flame", snd: "flame" },
  m60: { name: "M60", desc: "belt-fed, rounds pierce 2", sprite: "gun_m60", dmg: 3.6, atkSpd: 7, range: 170, clip: 80, reload: 3.2, speed: 400, spread: 0.1, pierce: 2, kind: "bullet", snd: "light" },
  golden: { name: "Golden Deagle", desc: "hand cannon, pierces 6", sprite: "gun_golden", dmg: 24, atkSpd: 1.5, range: 200, clip: 7, reload: 1.4, speed: 700, spread: 0, pierce: 6, kind: "bullet", snd: "heavy", kick: 4 },
};

// classes -------------------------------------------------------------------
const CLASSES = {
  marine: { name: "Marine", anim: "marine", desc: "balanced, by the book", weapons: ["rifle", "pistol", "shotgun"], mods: s => s },
  slinger: { name: "Gunslinger", anim: "slinger", desc: `+10% crit, +8% speed, ${big(50)} HP`,
    weapons: ["revolver", "shotgun"],
    mods: s => { s.crit += 0.10; s.moveSpd *= 1.08; s.maxHp = 50; } },
  demo: { name: "Demolitionist", anim: "demo", desc: `+30% blast radius, ${big(65)} HP`, unlock: "demo", price: 300,
    weapons: ["rocket", "grenade"],
    mods: s => { s.blast *= 1.30; s.maxHp = 65; } },
  heavy: { name: "Heavy", anim: "heavy", desc: `${big(85)} HP, -10% dmg taken, slow`, unlock: "heavy", price: 300,
    weapons: ["minigun", "shotgun"],
    mods: s => { s.maxHp = 85; s.armor = 1 - (1 - s.armor) * 0.90; s.moveSpd *= 0.90; } },
  pyro: { name: "Pyro", anim: "pyro", desc: `+20% dmg, burns everything, ${big(55)} HP`, unlock: "pyro", price: 400,
    weapons: ["flamer", "incendiary"],
    mods: s => { s.dmg *= 1.20; s.maxHp = 55; } },
  medic: { name: "Medic", anim: "medic", desc: `+${bigf(1.2)} HP/s, 3% lifesteal, -15% dmg`, unlock: "medic", price: 500,
    weapons: ["uzi", "pistol"],
    mods: s => { s.regen += 1.2; s.lifesteal += 0.03; s.dmg *= 0.85; s.maxHp = 55; } },
  ghost: { name: "Ghost", anim: "ghost", desc: `+15% crit, +20% range, ${big(45)} HP`, unlock: "ghost", price: 600,
    weapons: ["sniper", "uzi"],
    mods: s => { s.crit += 0.15; s.range *= 1.20; s.maxHp = 45; } },
  commando: { name: "Commando", anim: "commando", desc: "one-man army: +15% speed, belt-fed M60", unlock: "commando", secret: true,
    weapons: ["m60", "golden"],
    mods: s => { s.moveSpd *= 1.15; s.maxHp = 60; } },
  armorer: { name: "Armorer", anim: "armorer", desc: "dev tester — carries every gun", devOnly: true,
    weapons: Object.keys(WEAPONS),
    mods: s => { s.maxHp = 65; } },
};

// persistent gold bank — coins left at the end of a run are deposited here
// and spent on unlocking classes
const META = { gold: 0, wpn: {} };
try { Object.assign(META, JSON.parse(localStorage.getItem("orcslasher_meta") || "{}")); } catch (e) { /* no storage */ }
META.wpn = META.wpn || {};

// permanent weapon upgrades bought on the weapon-select screen
const WPN_MAX_LV = 5;
const wpnLevel = id => META.wpn[id] || 0;
const wpnUpCost = id => 40 + wpnLevel(id) * 60; // 40, 100, 160, 220, 280
function saveMeta() { try { localStorage.setItem("orcslasher_meta", JSON.stringify(META)); } catch (e) { /* no storage */ } }
function bankCoins() {
  if (G.bankedRun || !G.coins) return;
  META.gold += Math.round(G.coins);
  G.bankedRun = true;
  saveMeta();
}

// unlocks persist across runs (best-effort; storage may be unavailable)
const UN = { demo: false, heavy: false, pyro: false, medic: false, ghost: false, commando: false };

// secret classes never show in the menu until earned; devOnly need dev mode
function visibleClasses() {
  return Object.keys(CLASSES).filter(id => {
    const c = CLASSES[id];
    if (c.devOnly && !DEV.on) return false;
    if (c.secret && !isUnlocked(c.unlock)) return false;
    return true;
  });
}
try { Object.assign(UN, JSON.parse(localStorage.getItem("orcslasher_unlocks") || "{}")); } catch (e) { /* no storage */ }
function saveUnlocks() { try { localStorage.setItem("orcslasher_unlocks", JSON.stringify(UN)); } catch (e) { /* no storage */ } }
function isUnlocked(key) { return DEV.on || !key || UN[key]; }

// developer mode — toggled by typing a secret passphrase on any menu screen.
// Only the hash of the phrase is stored here, so the phrase can't be read
// from the source. While active, every class and weapon is available.
const DEV = { on: false, buf: "", HASH: 707363094, LEN: 11 };
try { DEV.on = localStorage.getItem("orcslasher_dev") === "1"; } catch (e) { /* no storage */ }
function djb2(s) { let h = 5381; for (const c of s) { h = (((h << 5) + h) ^ c.charCodeAt(0)) >>> 0; } return h; }
// password prompt opened by the key button in the menu corner.
// A hidden real <input> backs it so mobile devices get their native
// on-screen keyboard; the canvas renders the masked value.
const passModal = { open: false, input: "", errT: 0 };
let keyBtnRect = null;
let passRects = { box: null, ok: null, cancel: null };

const devInput = document.createElement("input");
devInput.type = "password";
devInput.autocomplete = "off";
devInput.autocapitalize = "none";
devInput.spellcheck = false;
devInput.style.cssText = "position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;border:0;padding:0;background:none;";
document.body.appendChild(devInput);
devInput.addEventListener("input", () => { passModal.input = devInput.value; });
devInput.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); submitPassword(); }
  else if (e.key === "Escape") closePassModal();
  e.stopPropagation(); // keep gameplay key handling out of the field
});

function openPassModal() {
  passModal.open = true; passModal.input = ""; passModal.errT = 0;
  devInput.value = "";
  devInput.focus(); // synchronously, inside the tap gesture, so mobile keyboards open
}
function closePassModal() {
  passModal.open = false; passModal.input = "";
  devInput.value = "";
  devInput.blur();
}
function submitPassword() {
  if (passModal.input.length === DEV.LEN && djb2(passModal.input.toLowerCase()) === DEV.HASH) {
    closePassModal();
    DEV.on = true;
    try { localStorage.setItem("orcslasher_dev", "1"); } catch (e) { /* no storage */ }
    SFX.level();
  } else {
    passModal.input = ""; devInput.value = "";
    passModal.errT = 1.2;
    SFX.hurt();
  }
}

function devFeedKey(k) {
  if (!k || k.length !== 1) return;
  DEV.buf = (DEV.buf + k.toLowerCase()).slice(-24);
  if (DEV.buf.length >= DEV.LEN && djb2(DEV.buf.slice(-DEV.LEN)) === DEV.HASH) {
    DEV.buf = "";
    DEV.on = !DEV.on;
    try { localStorage.setItem("orcslasher_dev", DEV.on ? "1" : "0"); } catch (e) { /* no storage */ }
    SFX.level();
  }
}

function baseStats(weaponId) {
  const w = WEAPONS[weaponId];
  return {
    maxHp: 60, dmg: w.dmg * (1 + 0.08 * wpnLevel(weaponId)), atkSpd: w.atkSpd,
    moveSpd: 85 * (w.move || 1),
    range: w.range,
    crit: 0.05, regen: 0, magnet: 28, xpGain: 1,
    armor: 0, lifesteal: 0,
    knock: 1, giant: 0, goldDig: 0, wind: 0, luck: 0,
    clipMul: 1, reloadMul: 1, blast: 1,
  };
}

function newRun(weaponId) {
  buildMap();
  G.weapon = weaponId;
  const stats = baseStats(weaponId);
  CLASSES[G.cls].mods(stats);
  player = {
    x: startPos.x, y: startPos.y, r: 6, hp: stats.maxHp, level: 1, xp: 0,
    stats, banked: 0,
    facing: 1, moving: false, animT: 0,
    atkCd: 0, atkAng: 0, hurtCd: 0, dashCd: 0, dashT: 0, dashX: 0, dashY: 0,
    flash: 0, ammo: 0, reloadT: 0, recoil: 0, lastShot: -9, akimboSide: 1,
  };
  player.ammo = clipSize();
  flowT = 0;
  enemies = []; gems = []; coins = []; flasks = []; bolts = []; bullets = []; grenades = []; firePatches = []; bossRings = []; fx = []; texts = [];
  spawnQueue = []; spawnTimer = 0;
  G.wave = 0; G.kills = 0; G.coins = 0; G.t = 0; G.endless = false; G.bankedRun = false; G.paused = false;
  G.sayQ = []; G.kingSeen = false; G.saidLowHp = false;
  say("The dead dragged the King into this city…", 1.2);
  say("I will find him. Locked and loaded.", 4.2);
  startWave(1);
  G.state = "play";
}

function xpNeeded(level) { return 4 + level * 4; }

// story: the hero speaks — lines queue up and follow the player
function say(s, delay = 0) {
  G.sayQ.push({ s, at: G.t + delay });
  G.sayQ.sort((a, b) => a.at - b.at);
}

function bossLine(type) {
  if (type === "butcher") {
    return G.kingSeen ? "The Butcher rots for what they did!" : "That thing is huge… hold on, for the King!";
  }
  if (type === "patient_zero") {
    return G.kingSeen ? "Patient Zero! You turned my King!" : "Patient Zero… where the plague began.";
  }
  if (type === "necromancer") {
    return "He raises the dead… stay strong, for the King!";
  }
  if (type === "rot_god") {
    return "Their god crawls out… but my King watches over me!";
  }
  return "A king of bile… mine was worth ten of you.";
}

// ------------------------------------------------------------------ waves --
const E_TYPES = {
  crawler: { anim: "goblin", hp: 9, spd: 55, dmg: 5, xp: 1, r: 4, scale: 1, score: 1 },
  walker: { anim: "orc_grunt", hp: 22, spd: 34, dmg: 9, xp: 2, r: 5, scale: 1, score: 2 },
  sprinter: { dirAnim: "cp_orc3", hp: 15, spd: 62, dmg: 8, xp: 3, r: 5, scale: 1, score: 3 },
  brute: { dirAnim: "cp_orc2", hp: 70, spd: 28, dmg: 14, xp: 6, r: 6, scale: 1, score: 6 },
  frozen: { dirAnim: "cp_frost", hp: 45, spd: 24, dmg: 12, xp: 4, r: 5, scale: 1, score: 4 },
  stalker: { dirAnim: "cp_night", hp: 16, spd: 74, dmg: 9, xp: 4, r: 5, scale: 1, score: 4 },
  gorehulk: { dirAnim: "cp_blood", hp: 120, spd: 32, dmg: 17, xp: 8, r: 6, scale: 1, score: 8 },
  masked: { anim: "masked_orc", hp: 16, spd: 58, dmg: 7, xp: 2, r: 5, scale: 1, score: 2 },
  spitter: { anim: "orc_shaman", hp: 14, spd: 30, dmg: 7, xp: 3, r: 5, scale: 1, ranged: true, score: 3 },
  rager: { anim: "orc_berserker", hp: 30, spd: 40, dmg: 11, xp: 4, r: 5, scale: 1, rage: true, score: 4 },
  runt: { anim: "cave_goblin", hp: 6, spd: 68, dmg: 4, xp: 1, r: 4, scale: 1, score: 1 },
  feral: { dirAnim: "cp_savage", hp: 18, spd: 46, dmg: 8, xp: 2, r: 5, scale: 1, score: 2 },
  dead_soldier: { dirAnim: "cp_veteran", hp: 48, spd: 30, dmg: 12, xp: 5, r: 6, scale: 1, score: 5 },
  wraith: { dirAnim: "cp_ghost", hp: 10, spd: 72, dmg: 6, xp: 1, r: 4, scale: 1, ghost: true, score: 2 },
  tank: { anim: "ogre", hp: 150, spd: 22, dmg: 18, xp: 12, r: 10, scale: 1, big: true, score: 10 },
  patient_zero: { anim: "warchief", hp: 750, spd: 30, dmg: 22, xp: 40, r: 9, scale: 2, boss: true, bossBar: true, big: true, score: 50 },
  butcher: { anim: "butcher", hp: 300, spd: 32, dmg: 20, xp: 20, r: 10, scale: 2, big: true, bossBar: true, charge: true, score: 30 },
  bile_king: { anim: "shamanking", hp: 340, spd: 26, dmg: 10, xp: 25, r: 8, scale: 2, big: true, bossBar: true, ranged: true, king: true, score: 40 },
  necromancer: { anim: "soulcaller", hp: 380, spd: 24, dmg: 14, xp: 30, r: 8, scale: 2, big: true, bossBar: true, souls: true, score: 45 },
  rot_god: { anim: "orcgod", hp: 900, spd: 20, dmg: 26, xp: 80, r: 12, scale: 2.2, big: true, bossBar: true, god: true, score: 100 },
};

const BOSS_CYCLE = ["butcher", "patient_zero", "necromancer", "rot_god", "bile_king"];
const BOSS_NAMES = { butcher: "THE BUTCHER", patient_zero: "PATIENT ZERO", necromancer: "THE NECROMANCER", rot_god: "MORGRAX, THE ROT GOD", bile_king: "THE BILE KING" };
const bossFor = w => BOSS_CYCLE[(Math.floor(w / 5) - 1 + BOSS_CYCLE.length) % BOSS_CYCLE.length];

function waveComposition(w) {
  const list = [];
  const add = (type, n) => { for (let i = 0; i < n; i++) list.push(type); };
  add("crawler", clamp(8 + w * 2, 0, 26));
  add("runt", 3 + w);
  if (w >= 1) add("walker", 2 + Math.floor(w * 1.6));
  if (w >= 2) add("feral", w);
  if (w >= 3) add("sprinter", w);
  if (w >= 3) add("masked", w - 1);
  if (w >= 6) add("dead_soldier", Math.floor(w / 3));
  if (w >= 4) add("spitter", Math.floor(w / 2) + 1);
  if (w >= 5) add("rager", w - 3);
  if (w >= 5) add("frozen", Math.floor(w / 2) - 1);
  if (w >= 6) add("brute", Math.floor(w / 3));
  if (w >= 7) add("stalker", w - 5);
  if (w >= 8) add("tank", Math.floor(w / 8));
  if (w >= 9) add("gorehulk", Math.floor(w / 4));
  if (w % 5 === 0) add(bossFor(w), 1); // a boss every 5th wave
  if (w > FINAL_WAVE) { add("rager", w - 8); add("stalker", w - 8); }
  return list;
}

function startWave(w) {
  G.wave = w;
  const comp = waveComposition(w);
  // bosses/bigs first, rest shuffled, all spread over a fixed wave window
  comp.sort((a, b) => (E_TYPES[b].bossBar ? 1 : 0) - (E_TYPES[a].bossBar ? 1 : 0) || Math.random() - 0.5);
  const waveDur = clamp(6 + w * 1.2, 8, 20);
  spawnQueue = comp.map((type, i) => ({ type, at: 1 + (i / comp.length) * waveDur + rnd(0, 0.3) }));
  spawnTimer = 0;
  const bossWave = w % 5 === 0;
  texts.push({ x: player.x, y: player.y - 40, s: bossWave ? `${BOSS_NAMES[bossFor(w)]} COMES` : "WAVE " + w, life: 2.2, col: bossWave ? "#ff6b6b" : "#ffd166", big: true });
  if (bossWave) { SFX.bossRoar(); say(bossLine(bossFor(w)), 1.4); }
  if (w >= 10 && !UN.ghost) {
    UN.ghost = true; saveUnlocks();
    texts.push({ x: player.x, y: player.y - 56, s: "GHOST UNLOCKED!", life: 3, col: "#b48cff", big: true });
    SFX.level();
  }
}

function spawnPointFor() {
  // the dead pour out of manholes and doorways just beyond the edge of sight
  const near = spawnSpots.filter(s => { const d = dist(s, player); return d > 170 && d < 380; });
  const pool = near.length ? near : spawnSpots.filter(s => dist(s, player) > 120);
  if (pool.length) {
    const s = pick(pool);
    return { x: s.x + rnd(-4, 4), y: s.y + rnd(-3, 3) };
  }
  for (let i = 0; i < 60; i++) { // fallback: any open tile at a fair distance
    const a = rnd(0, Math.PI * 2), r = rnd(200, 340);
    const x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r;
    if (x > 0 && y > 0 && x < WORLD_W && y < WORLD_H && walkGrid[tileAt(x, y)]) return { x, y };
  }
  return { x: player.x + 200, y: player.y };
}

function spawnEnemy(type, at) {
  const t = E_TYPES[type];
  const p = at && !inRock(at.x, at.y) ? at : spawnPointFor(); // summons must not land inside a building
  const mult = 1 + 0.20 * (G.wave - 1);
  enemies.push({
    type, ...p, r: t.r, anim: t.anim, dirAnim: t.dirAnim, dir: "d", scale: t.scale,
    hp: t.hp * mult, maxHp: t.hp * mult,
    spd: t.spd * (1 + 0.02 * (G.wave - 1)) * rnd(0.9, 1.1),
    dmg: t.dmg * (1 + 0.06 * (G.wave - 1)),
    xp: t.xp, ranged: !!t.ranged, rage: !!t.rage, big: !!t.big, boss: !!t.boss,
    bossBar: !!t.bossBar, charge: !!t.charge, king: !!t.king, souls: !!t.souls, ghost: !!t.ghost, god: !!t.god,
    slamCd: 5,
    score: t.score,
    atkCd: rnd(0, 1), animT: rnd(0, 9), facing: 1, hitFlash: 0, warmup: 0.8,
    summonCd: 6, strafe: rnd(0, Math.PI * 2), chargeCd: 4, chargeT: 0,
    avoidT: 0, avoidDir: 1,
  });
  fx.push({ kind: "spawn", x: p.x, y: p.y, life: 0.8, max: 0.8 });
}

// ------------------------------------------------------------------ cards --
const RARITY = {
  common: { name: "COMMON", col: "#cfc6de", w: 60 },
  rare: { name: "RARE", col: "#5ab0ff", w: 27 },
  epic: { name: "EPIC", col: "#b48cff", w: 10 },
  legendary: { name: "LEGENDARY", col: "#ffd166", w: 3 },
};

// `need`: only offered when the current gun has that property
const CARD_POOL = [
  // common
  { id: "dmg", r: "common", name: "Hollow Points", desc: "+10% damage", icon: "gun_pistol", max: 7, apply: s => s.dmg *= 1.10 },
  { id: "mov", r: "common", name: "Running Shoes", desc: "+6% move speed", icon: "flask_big_green", max: 5, apply: s => s.moveSpd *= 1.06 },
  { id: "hp", r: "common", name: "Adrenaline", desc: `+12% max HP, heal ${big(10)}`, icon: "flask_big_red", max: 7, apply: s => { s.maxHp = Math.round(s.maxHp * 1.12); player.hp = Math.min(s.maxHp, player.hp + 10); } },
  { id: "stone", r: "common", name: "Kevlar Plates", desc: `+${big(16)} max HP`, icon: "wall_mid", max: 5, apply: s => s.maxHp += 16 },
  { id: "knock", r: "common", name: "Stopping Power", desc: "+35% knockback", icon: "gun_shotgun", max: 4, apply: s => s.knock *= 1.35 },
  { id: "mag", r: "common", name: "Scavenger", desc: "+30% pickup range", icon: "coin_f0", max: 4, apply: s => s.magnet *= 1.30 },
  // rare
  { id: "spd", r: "rare", name: "Trigger Finger", desc: "+8% fire rate", icon: "gun_uzi", max: 7, apply: s => s.atkSpd *= 1.08 },
  { id: "reg", r: "rare", name: "Field Bandage", desc: `+${bigf(0.5)} HP/s regen`, icon: "campfire_f0", max: 5, apply: s => s.regen += 0.5 },
  { id: "cry", r: "rare", name: "Battle Cry", desc: "+6% damage, +4% fire rate", icon: "gun_rifle", max: 5, apply: s => { s.dmg *= 1.06; s.atkSpd *= 1.04; } },
  { id: "xp", r: "rare", name: "Trophy Hunter", desc: "+15% XP gained", icon: "xp_gem_f0", max: 4, apply: s => s.xpGain *= 1.15 },
  { id: "rng", r: "rare", name: "Long Barrel", desc: "+10% range", icon: "gun_sniper", max: 3, apply: s => s.range *= 1.10 },
  { id: "gold", r: "rare", name: "Gold Digger", desc: "+35% coin drops", icon: "coin_f2", max: 3, apply: s => s.goldDig += 0.35 },
  { id: "clip", r: "rare", name: "Extended Mags", desc: "+25% magazine size", icon: "gun_m60", max: 4, apply: s => s.clipMul *= 1.25 },
  { id: "rel", r: "rare", name: "Fast Hands", desc: "-15% reload time", icon: "gun_revolver", max: 4, apply: s => s.reloadMul *= 0.85 },
  // epic
  { id: "crit", r: "epic", name: "Laser Sight", desc: "+6% crit chance (2x)", icon: "gun_pistol", max: 5, apply: s => s.crit += 0.06 },
  { id: "arm", r: "epic", name: "Riot Armor", desc: "-8% damage taken", icon: "crate", max: 5, apply: s => s.armor = 1 - (1 - s.armor) * 0.92 },
  { id: "vamp", r: "epic", name: "Blood Pact", desc: "2% lifesteal", icon: "skull", max: 4, apply: s => s.lifesteal += 0.02 },
  { id: "giant", r: "epic", name: "Big Game Hunter", desc: "+20% damage vs big zombies", icon: "gun_rocket", max: 3, apply: s => s.giant += 0.20 },
  { id: "wind", r: "epic", name: "Second Wind", desc: "+15% campfire healing", icon: "campfire_f2", max: 3, apply: s => s.wind += 0.15 },
  { id: "luck", r: "epic", name: "Lucky Charm", desc: "rarer cards appear more often", icon: "flask_big_yellow", max: 3, apply: s => s.luck += 0.5 },
  { id: "boom", r: "epic", name: "Bigger Boom", desc: "+20% blast radius", icon: "proj_grenade", max: 3, need: "blast", apply: s => s.blast *= 1.20 },
  // legendary
  { id: "ldmg", r: "legendary", name: "Depleted Uranium", desc: "+25% damage", icon: "gun_golden", max: 3, apply: s => s.dmg *= 1.25 },
  { id: "lspd", r: "legendary", name: "Bullet Hell", desc: "+20% fire rate", icon: "gun_minigun", max: 3, apply: s => s.atkSpd *= 1.20 },
  { id: "lvamp", r: "legendary", name: "Vampire Lord", desc: "+5% lifesteal", icon: "skull", max: 2, apply: s => s.lifesteal += 0.05 },
  { id: "lcrit", r: "legendary", name: "Deathmark", desc: "+15% crit chance", icon: "gun_sniper", max: 2, apply: s => s.crit += 0.15 },
];
let cardCounts = {};

function rollRarity(luck) {
  // luck (from Lucky Charm) shifts weight away from common toward the top
  const w = {
    common: RARITY.common.w / (1 + luck),
    rare: RARITY.rare.w * (1 + luck * 0.4),
    epic: RARITY.epic.w * (1 + luck * 0.8),
    legendary: RARITY.legendary.w * (1 + luck * 1.5),
  };
  let roll = Math.random() * (w.common + w.rare + w.epic + w.legendary);
  for (const r of ["common", "rare", "epic", "legendary"]) {
    if ((roll -= w[r]) <= 0) return r;
  }
  return "common";
}

const cardOk = c => (cardCounts[c.id] || 0) < c.max && (!c.need || WEAPONS[G.weapon][c.need]);
const cardsAvailable = () => CARD_POOL.some(cardOk);

function drawThreeCards() {
  const avail = CARD_POOL.filter(cardOk);
  const opts = [];
  const order = ["common", "rare", "epic", "legendary"];
  for (let slot = 0; slot < 3 && avail.length; slot++) {
    let r = rollRarity(player ? player.stats.luck : 0);
    let pool = [];
    // fall back down the rarity ladder if that tier is exhausted
    for (let ri = order.indexOf(r); ri >= 0 && !pool.length; ri--) {
      pool = avail.filter(c => c.r === order[ri] && !opts.includes(c));
    }
    if (!pool.length) pool = avail.filter(c => !opts.includes(c));
    if (!pool.length) break;
    opts.push(pick(pool));
  }
  return opts;
}

function enterCampfire() {
  G.state = "campfire";
  G.coins += 25; // wave bounty
  player.hp = Math.min(player.stats.maxHp, player.hp + Math.round((player.stats.maxHp - player.hp) * (0.4 + player.stats.wind)));
  campfire = {
    t: 0,
    // at least one card by the fire — unless every card is already maxed
    picksLeft: cardsAvailable() ? Math.max(1, player.banked) : 0,
    cards: drawThreeCards(),
    chosen: -1,
    rerollCost: 3, pickCost: 10,
    toast: null,
  };
  player.banked = 0;
  SFX.waveClear();
}

function toast(s) { if (campfire) campfire.toast = { s, t: 1.6 }; }

function pickCard(i) {
  if (!campfire || campfire.picksLeft <= 0 || i >= campfire.cards.length) return;
  const c = campfire.cards[i];
  cardCounts[c.id] = (cardCounts[c.id] || 0) + 1;
  c.apply(player.stats);
  player.hp = Math.min(player.hp, player.stats.maxHp);
  SFX.card();
  campfire.picksLeft--;
  if (campfire.picksLeft > 0) {
    campfire.cards = drawThreeCards();
    if (!campfire.cards.length) campfire.picksLeft = 0; // pool exhausted mid-rest
  }
}

function leaveCampfire() {
  campfire = null;
  startWave(G.wave + 1);
  G.state = "play";
}

// campfire shop -------------------------------------------------------------
const HEAL_COST = 5;
function shopReroll() {
  if (!campfire || campfire.picksLeft <= 0) return toast("no picks left to reroll");
  if (G.coins < campfire.rerollCost) return toast("not enough gold");
  G.coins -= campfire.rerollCost;
  campfire.rerollCost += 2;
  campfire.cards = drawThreeCards();
  SFX.card();
}
function shopHeal() {
  if (G.coins < HEAL_COST) return toast("not enough gold");
  if (player.hp >= player.stats.maxHp - 0.5) return toast("already at full health");
  G.coins -= HEAL_COST;
  player.hp = Math.min(player.stats.maxHp, player.hp + player.stats.maxHp * 0.5);
  toast("+" + big(player.stats.maxHp * 0.5) + " HP");
  SFX.gem();
}
function shopExtraPick() {
  if (!campfire) return;
  if (!cardsAvailable()) return toast("every card is already maxed out");
  if (G.coins < campfire.pickCost) return toast("not enough gold");
  G.coins -= campfire.pickCost;
  campfire.pickCost += 5;
  campfire.picksLeft++;
  if (campfire.picksLeft === 1) campfire.cards = drawThreeCards();
  SFX.level();
}

// ------------------------------------------------------------------ combat --
function nearestEnemy(from, maxD = 1e9) {
  let best = null, bd = maxD;
  for (const e of enemies) {
    if (e.warmup > 0) continue;
    const d = dist(from, e);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function damageEnemy(e, dmg, crit) {
  if (e.big && player.stats.giant) dmg *= 1 + player.stats.giant;
  e.hp -= dmg;
  e.hitFlash = 0.1;
  texts.push({ x: e.x + rnd(-4, 4), y: e.y - 14 * e.scale, s: String(big(dmg)), life: 0.6, col: crit ? "#ffd166" : "#fff" });
  if (player.stats.lifesteal > 0) {
    player.hp = Math.min(player.stats.maxHp, player.hp + dmg * player.stats.lifesteal);
  }
  if (e.hp <= 0) killEnemy(e);
  else SFX.hit();
}

function killEnemy(e) {
  enemies.splice(enemies.indexOf(e), 1);
  G.kills++;
  SFX.die();
  if (e.dirAnim) fx.push({ kind: "corpse", anim: e.dirAnim + "_death", x: e.x, y: e.y, life: 0.7, max: 0.7 });
  for (let i = 0; i < (e.big ? 14 : 6); i++) {
    fx.push({ kind: "blood", x: e.x, y: e.y - 6, vx: rnd(-60, 60), vy: rnd(-90, 10), life: rnd(0.3, 0.7), max: 0.7 });
  }
  const gemCount = e.big ? 5 : 1;
  for (let i = 0; i < gemCount; i++) {
    gems.push({ x: e.x + rnd(-8, 8), y: e.y + rnd(-6, 6), v: e.xp / gemCount, t: rnd(0, 9), vx: rnd(-30, 30), vy: rnd(-60, -20) });
  }
  const coinCount = e.ghost ? 0 : (e.big ? 3 : (Math.random() < 0.3 * (1 + player.stats.goldDig) ? 1 : 0));
  for (let i = 0; i < coinCount; i++) coins.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-4, 4), t: rnd(0, 9), vx: rnd(-25, 25), vy: rnd(-50, -20) });
  if (Math.random() < (e.big ? 0.8 : 0.04)) flasks.push({ x: e.x, y: e.y, t: 0 });
  if (e.big && Math.random() < 0.001) { // 0.1% relic drop from bosses
    const locked = ["demo", "heavy"].filter(c => !UN[c]);
    if (locked.length) {
      const c = pick(locked);
      UN[c] = true; saveUnlocks();
      texts.push({ x: e.x, y: e.y - 40, s: `RELIC! ${CLASSES[c].name.toUpperCase()} UNLOCKED!`, life: 4, col: "#b48cff", big: true });
      SFX.level();
    }
  }
  if (e.boss) {
    G.shake = 12;
    if (!G.endless) { G.state = "victory"; SFX.waveClear(); }
  }
}

const clipSize = () => Math.max(1, Math.round(WEAPONS[G.weapon].clip * player.stats.clipMul));
const handPos = () => ({ x: player.x + player.facing * 2, y: player.y - 8 });
const aiming = () => G.t - player.lastShot < 0.8;

function fireGun() {
  const st = player.stats, w = WEAPONS[G.weapon];
  const target = nearestEnemy(player, st.range);
  if (!target) return;
  player.atkCd = 1 / st.atkSpd;
  const hand = handPos();
  const ang = Math.atan2(target.y - 4 - hand.y, target.x - hand.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  player.atkAng = ang;
  player.lastShot = G.t;
  player.recoil = w.kick || 1.5;
  player.akimboSide = -player.akimboSide;
  // muzzle sits a gun-length out from the (re-faced) hand
  const h2 = handPos(), len = IMG[w.sprite].width - 3;
  const mz = { x: h2.x + Math.cos(ang) * len, y: h2.y + Math.sin(ang) * len + (w.akimbo ? player.akimboSide : 0) };
  if (w.kind === "grenade") {
    const d = Math.min(dist(player, target), st.range);
    grenades.push({ sx: mz.x, sy: mz.y, tx: target.x, ty: target.y, x: mz.x, y: mz.y, t: 0, dur: clamp(d / 170, 0.35, 0.9), spin: 0,
      blast: w.blast * st.blast, fire: !!w.fire, crit: Math.random() < st.crit });
  } else {
    for (let i = 0; i < (w.pellets || 1); i++) {
      const a = ang + rnd(-w.spread, w.spread);
      const spd = w.speed * (w.kind === "flame" ? rnd(0.75, 1.1) : 1);
      const life = st.range / w.speed * (w.kind === "flame" ? 1.6 : 1.15);
      // px/py: last hit-test point; starts at the hand so point-blank zombies get hit
      bullets.push({ x: mz.x, y: mz.y, px: h2.x, py: h2.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, ang: a, life, max: life,
        kind: w.kind, crit: Math.random() < st.crit, pierce: w.pierce || 0, hit: [], blast: (w.blast || 0) * st.blast });
    }
  }
  if (w.kind !== "flame") {
    fx.push({ kind: "muzzle", x: mz.x, y: mz.y, ang, life: 0.06, max: 0.06 });
    if (w.kind === "bullet") fx.push({ kind: "shell", x: h2.x, y: h2.y - 2, vx: -player.facing * rnd(20, 50), vy: rnd(-70, -40), life: 0.45, max: 0.45 });
  }
  gunSfx(w.snd);
  player.ammo--;
  if (player.ammo <= 0) {
    player.reloadT = w.reload * st.reloadMul;
    texts.push({ x: player.x, y: player.y - 28, s: "reloading…", life: 1, col: "#ffd166" });
  }
}

// rockets and grenade shells: area damage + knockback away from the blast
function explode(x, y, r, dmg, crit) {
  const st = player.stats;
  SFX.boom();
  G.shake = Math.max(G.shake, 5);
  for (const e of [...enemies]) {
    if (e.warmup > 0) continue;
    if (Math.hypot(e.x - x, e.y - y) < r + e.r) {
      damageEnemy(e, dmg * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
      if (enemies.includes(e) && !e.bossBar) {
        const a = Math.atan2(e.y - y, e.x - x);
        e.x += Math.cos(a) * 8 * st.knock; e.y += Math.sin(a) * 8 * st.knock;
      }
    }
  }
  fx.push({ kind: "ring", x, y, life: 0.3, max: 0.3, r });
  fx.push({ kind: "flash", x, y, life: 0.18, max: 0.18, r });
  for (let i = 0; i < 14; i++) {
    fx.push({ kind: "spark", x, y: y - 2, vx: rnd(-80, 80), vy: rnd(-100, -10), life: rnd(0.25, 0.6), max: 0.6 });
  }
}

// distance from point p to segment a->b: fast bullets travel 10-30px per
// frame, so hits are tested along the whole step, not just its end
function segDist(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}

function updateShots(dt) {
  const st = player.stats;
  for (const b of [...bullets]) {
    const ox = b.px, oy = b.py;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    b.px = b.x; b.py = b.y;
    if (b.kind === "flame") { b.vx *= 1 - 2.4 * dt; b.vy *= 1 - 2.4 * dt; }
    if (b.kind === "rocket" && Math.random() < dt * 40) fx.push({ kind: "smoke", x: b.x, y: b.y, life: 0.4, max: 0.4 });
    let dead = b.life <= 0 || inRock(b.x, b.y + 8);
    for (const e of [...enemies]) {
      if (dead) break;
      if (e.warmup > 0 || b.hit.includes(e)) continue;
      if (segDist(ox, oy, b.x, b.y, e.x, e.y - 4) >= e.r + (b.kind === "flame" ? 6 : 3)) continue;
      if (b.kind === "rocket") { dead = true; break; }
      damageEnemy(e, st.dmg * (b.crit ? 2 : 1) * rnd(0.9, 1.1), b.crit);
      if (enemies.includes(e) && !e.bossBar) {
        const kb = (b.kind === "flame" ? 0.4 : 2.5) * st.knock;
        e.x += Math.cos(b.ang) * kb; e.y += Math.sin(b.ang) * kb;
      }
      b.hit.push(e);
      if (b.pierce-- <= 0) dead = true;
    }
    if (dead) {
      bullets.splice(bullets.indexOf(b), 1);
      if (b.kind === "rocket") explode(b.x, b.y, b.blast, st.dmg, b.crit);
    }
  }
  for (const g of [...grenades]) {
    g.t += dt; g.spin += dt * 9;
    const p = g.t / g.dur;
    if (p >= 1) {
      grenades.splice(grenades.indexOf(g), 1);
      explode(g.tx, g.ty, g.blast, st.dmg, g.crit);
      if (g.fire) firePatches.push({ x: g.tx, y: g.ty, life: 2.4, max: 2.4, tick: 0, seed: Math.random() * 9 });
      continue;
    }
    g.x = g.sx + (g.tx - g.sx) * p;
    g.y = g.sy + (g.ty - g.sy) * p - Math.sin(Math.PI * p) * 26;
  }
}

// ------------------------------------------------------------------ update --
function updatePlay(dt) {
  G.t += dt;
  const st = player.stats;

  // -- input / movement
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (touchState.active) {
    const d = Math.hypot(touchState.dx, touchState.dy);
    if (d > 8) { mx = touchState.dx / d; my = touchState.dy / d; }
  }
  const ml = Math.hypot(mx, my);
  player.moving = ml > 0;
  if (ml > 0) {
    mx /= ml; my /= ml;
    if (mx !== 0 && !aiming()) player.facing = Math.sign(mx); // while shooting, backpedal facing the target
  }

  player.dashCd = Math.max(0, player.dashCd - dt);
  if ((keys.Space || keys.ShiftLeft) && ml > 0) tryDash(mx, my);
  let speed = st.moveSpd;
  if (player.dashT > 0) { player.dashT -= dt; speed = st.moveSpd * 3.2; mx = player.dashX; my = player.dashY; }

  player.x += mx * speed * dt; player.y += my * speed * dt;
  const pc = collideSolids(player.x, player.y, player.r + 2);
  player.x = pc.x; player.y = pc.y;
  player.animT += dt;
  player.hurtCd = Math.max(0, player.hurtCd - dt);
  player.hp = Math.min(st.maxHp, player.hp + st.regen * dt);

  // -- shooting
  player.atkCd -= dt;
  player.recoil = Math.max(0, player.recoil - dt * 30);
  if (player.reloadT > 0) {
    player.reloadT -= dt;
    if (player.reloadT <= 0) { player.ammo = clipSize(); SFX.reload(); }
  } else if (player.atkCd <= 0) {
    fireGun();
  }
  updateShots(dt);

  // -- burning ground
  for (const f of [...firePatches]) {
    f.life -= dt; f.tick -= dt;
    if (f.life <= 0) { firePatches.splice(firePatches.indexOf(f), 1); continue; }
    if (f.tick <= 0) {
      f.tick = 0.45;
      for (const e of [...enemies]) {
        if (e.warmup > 0) continue;
        if (Math.hypot(e.x - f.x, e.y - f.y) < 24 + e.r) damageEnemy(e, st.dmg * 0.3 * rnd(0.85, 1.15), false);
      }
    }
  }

  // -- pathing + spawning
  flowT -= dt;
  if (flowT <= 0) { flowT = 0.25; updateFlow(); }
  spawnTimer += dt;
  while (spawnQueue.length && spawnQueue[0].at <= spawnTimer) {
    spawnEnemy(spawnQueue.shift().type);
  }

  // -- enemies
  for (const e of [...enemies]) {
    e.animT += dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.warmup > 0) { e.warmup -= dt; continue; }
    const dToP = dist(e, player);
    let sp = e.spd;
    if (e.rage && e.hp < e.maxHp * 0.5) sp *= 1.7;
    if (e.charge) { // butcher: telegraphed bull-rush
      e.chargeCd -= dt;
      if (e.chargeCd <= 0 && dToP > 40) {
        e.chargeCd = 5; e.chargeT = 1.0;
        texts.push({ x: e.x, y: e.y - 42, s: "!", life: 0.8, col: "#ff6b6b", big: true });
        SFX.bossRoar();
      }
      if (e.chargeT > 0) { e.chargeT -= dt; sp *= 3.1; }
    }
    let tx = player.x - e.x, ty = player.y - e.y;
    if (e.ranged) {
      // spitters hover at range and lob acid
      e.strafe += dt * 0.7;
      const want = 110;
      if (dToP < want - 15) { tx = -tx; ty = -ty; }
      else if (dToP < want + 25) { tx = Math.cos(e.strafe) * 40; ty = Math.sin(e.strafe) * 40; }
      e.atkCd -= dt;
      if (e.atkCd <= 0 && dToP < (e.king ? 230 : 190)) {
        e.atkCd = e.king ? 3.6 : rnd(2.2, 3.2);
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        const n = e.king ? 5 : 1; // the bile king spits a fan
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.26;
          bolts.push({ x: e.x, y: e.y - 8, vx: Math.cos(a + off) * 95, vy: Math.sin(a + off) * 95, t: 0, dmg: e.dmg });
        }
      }
    }
    if (e.boss) {
      e.summonCd -= dt;
      if (e.summonCd <= 0) {
        e.summonCd = 7;
        texts.push({ x: e.x, y: e.y - 40, s: "BRAAAINS!", life: 1.2, col: "#ff6b6b", big: true });
        SFX.bossRoar();
        for (let i = 0; i < 3; i++) spawnEnemy("crawler", { x: e.x + rnd(-34, 34), y: e.y + rnd(-26, 26) });
      }
    }
    if (e.god) { // morgrax: ground slams + ferals, enrages when wounded
      const enragedGod = e.hp < e.maxHp * 0.4;
      if (enragedGod) sp *= 1.6;
      e.slamCd -= dt;
      if (e.slamCd <= 0 && dToP < 200) {
        e.slamCd = enragedGod ? 3.2 : 5;
        texts.push({ x: e.x, y: e.y - 52, s: "!", life: 0.7, col: "#ff6b6b", big: true });
        G.shake = Math.max(G.shake, 9);
        SFX.boom();
        bossRings.push({ x: e.x, y: e.y, r: 12, maxR: 100, dmg: e.dmg * 0.9 });
      }
      e.summonCd -= dt;
      if (e.summonCd <= 0) {
        e.summonCd = 8;
        texts.push({ x: e.x, y: e.y - 40, s: "ROT WITH ME!", life: 1.2, col: "#ffb347", big: true });
        for (let i = 0; i < 2; i++) spawnEnemy("feral", { x: e.x + rnd(-36, 36), y: e.y + rnd(-28, 28) });
      }
    }
    if (e.souls) { // the necromancer raises wraiths around himself
      e.summonCd -= dt;
      if (e.summonCd <= 0) {
        e.summonCd = 6;
        texts.push({ x: e.x, y: e.y - 40, s: "RISE, MY FALLEN!", life: 1.4, col: "#78ffdc", big: true });
        beep(180, 0.5, "sine", 0.09, 240);
        for (let i = 0; i < 4; i++) spawnEnemy("wraith", { x: e.x + rnd(-38, 38), y: e.y + rnd(-30, 30) });
      }
    }
    if (!(e.ranged && dToP < 140)) { // walk the flow field around buildings and wrecks
      const f = flowDir(e);
      if (f) { tx = f.x; ty = f.y; }
    }
    const tl = Math.hypot(tx, ty) || 1;
    let dirX = tx / tl, dirY = ty / tl;
    if (e.avoidT > 0) { // steering around a rock: blend toward the tangent
      e.avoidT -= dt;
      let ax = -dirY * e.avoidDir + dirX * 0.4, ay = dirX * e.avoidDir + dirY * 0.4;
      const al = Math.hypot(ax, ay) || 1;
      dirX = ax / al; dirY = ay / al;
    }
    const preX = e.x, preY = e.y;
    e.x += dirX * sp * dt; e.y += dirY * sp * dt;
    e.facing = player.x >= e.x ? 1 : -1;
    if (e.dirAnim) e.dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? "r" : "l") : (ty > 0 ? "d" : "u");
    const ec = collideSolids(e.x, e.y, e.r);
    e.x = ec.x; e.y = ec.y;
    // barely moved while trying to -> pick a side and slide around the obstacle
    if (sp > 0 && Math.hypot(e.x - preX, e.y - preY) < sp * dt * 0.35 && e.avoidT <= 0) {
      e.avoidT = rnd(0.45, 0.9);
      e.avoidDir = Math.random() < 0.5 ? 1 : -1;
    }
    // contact damage
    e.atkTouch = Math.max(0, (e.atkTouch || 0) - dt);
    if (!e.ranged && dToP < e.r + player.r + 3 && e.atkTouch === 0) {
      e.atkTouch = 0.7;
      hurtPlayer(e.dmg);
    }
  }
  // cheap separation
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i], b = enemies[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy), min = a.r + b.r;
      if (d > 0 && d < min) {
        const push = (min - d) / 2 / d;
        a.x -= dx * push; a.y -= dy * push;
        b.x += dx * push; b.y += dy * push;
      }
    }
  }

  // -- enemy projectiles
  for (const b of [...bolts]) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
    if (b.t > 2.4) { bolts.splice(bolts.indexOf(b), 1); continue; }
    if (dist(b, player) < player.r + 4) {
      bolts.splice(bolts.indexOf(b), 1);
      hurtPlayer(b.dmg);
    }
  }
  for (const ring of [...bossRings]) {
    ring.r += 85 * dt;
    if (ring.r >= ring.maxR) { bossRings.splice(bossRings.indexOf(ring), 1); continue; }
    if (Math.abs(dist(ring, player) - ring.r) < 9) hurtPlayer(ring.dmg);
  }

  // -- pickups
  for (const g of [...gems]) {
    g.t += dt;
    g.x += (g.vx || 0) * dt; g.y += (g.vy || 0) * dt;
    g.vx = (g.vx || 0) * 0.9; g.vy = (g.vy || 0) * 0.9;
    const d = dist(g, player);
    if (d < st.magnet) { const a = Math.atan2(player.y - g.y, player.x - g.x); const sp = 180 * (1.2 - d / st.magnet); g.x += Math.cos(a) * sp * dt; g.y += Math.sin(a) * sp * dt; }
    if (d < 8) {
      gems.splice(gems.indexOf(g), 1);
      SFX.gem();
      player.xp += g.v * st.xpGain;
      while (player.xp >= xpNeeded(player.level)) {
        player.xp -= xpNeeded(player.level);
        player.level++; player.banked++;
        texts.push({ x: player.x, y: player.y - 30, s: "LEVEL UP!", life: 1.4, col: "#7bd88f", big: true });
        SFX.level();
      }
    }
  }
  for (const c of [...coins]) {
    c.t += dt;
    c.x += (c.vx || 0) * dt; c.y += (c.vy || 0) * dt;
    c.vx = (c.vx || 0) * 0.9; c.vy = (c.vy || 0) * 0.9;
    const d = dist(c, player);
    if (d < st.magnet) { const a = Math.atan2(player.y - c.y, player.x - c.x); c.x += Math.cos(a) * 150 * dt; c.y += Math.sin(a) * 150 * dt; }
    if (d < 8) { coins.splice(coins.indexOf(c), 1); G.coins++; SFX.coinS(); }
  }
  for (const f of [...flasks]) {
    f.t += dt;
    if (dist(f, player) < 10) {
      flasks.splice(flasks.indexOf(f), 1);
      player.hp = Math.min(st.maxHp, player.hp + st.maxHp * 0.3);
      texts.push({ x: player.x, y: player.y - 26, s: "+" + big(st.maxHp * 0.3), life: 1, col: "#ff6b6b" });
      SFX.gem();
    }
  }

  // -- the king bleeds
  if (kingPos) {
    if (Math.random() < dt * 0.9) {
      fx.push({ kind: "drip", x: kingPos.x + rnd(-3, 3), y: kingPos.y - rnd(4, 14), life: 0.5, max: 0.5 });
    }
    if (!G.kingSeen && dist(player, kingPos) < 70) {
      G.kingSeen = true;
      beep(110, 0.5, "sine", 0.06, -40);
      say("No… my King… they got to him.");
      say("…then this city becomes their grave.", 3.4);
    }
  }

  // hero speech queue — only one line on screen at a time
  while (G.sayQ.length && G.t >= G.sayQ[0].at) {
    for (let i = texts.length - 1; i >= 0; i--) if (texts[i].speech) texts.splice(i, 1);
    texts.push({ x: player.x, y: player.y - 30, s: G.sayQ.shift().s, life: 3, col: "#a8d4ff", speech: true });
  }

  // -- fx / texts
  for (const p of [...fx]) {
    p.life -= dt;
    if (p.kind === "blood" || p.kind === "spark" || p.kind === "shell") { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
    if (p.kind === "smoke") p.y -= 12 * dt;
    if (p.kind === "drip") p.y += 55 * dt;
    if (p.life <= 0) fx.splice(fx.indexOf(p), 1);
  }
  for (const t of [...texts]) {
    t.life -= dt;
    if (t.speech) { t.x = player.x; t.y = player.y - 30; } // speech follows the hero
    else t.y -= 14 * dt;
    if (t.life <= 0) texts.splice(texts.indexOf(t), 1);
  }

  G.shake = Math.max(0, G.shake - dt * 30);

  // -- wave end
  if (!spawnQueue.length && enemies.length === 0) {
    if (G.wave === 20 && !UN.commando) { // beating the Rot God frees his prisoner
      UN.commando = true; saveUnlocks();
      texts.push({ x: player.x, y: player.y - 52, s: "A CAGE BREAKS IN THE DEEP…", life: 3.5, col: "#b48cff", big: true });
      texts.push({ x: player.x, y: player.y - 40, s: "SECRET HERO UNLOCKED: THE COMMANDO", life: 3.5, col: "#ffd166", big: true });
      SFX.level();
      say("A survivor… and armed to the teeth!", 1.5);
    }
    if (G.wave === FINAL_WAVE && !G.endless) {
      // victory is triggered on boss kill; safety net:
      G.state = "victory";
    } else {
      enterCampfire();
    }
  }
}

function tryDash(dx, dy) {
  if (player.dashCd > 0) return;
  player.dashCd = 2; player.dashT = 0.16; player.dashX = dx; player.dashY = dy;
  SFX.dash();
}

function hurtPlayer(dmg) {
  if (player.hurtCd > 0 || player.dashT > 0) return;
  const taken = dmg * (1 - player.stats.armor);
  player.hp -= taken;
  if (!G.saidLowHp && player.hp > 0 && player.hp < player.stats.maxHp * 0.25) {
    G.saidLowHp = true;
    say("Not yet… I must survive… for the King!", 0.3);
  }
  player.hurtCd = 0.5;
  player.flash = 0.15;
  G.shake = 6;
  SFX.hurt();
  texts.push({ x: player.x, y: player.y - 26, s: "-" + big(taken), life: 0.8, col: "#ff6b6b" });
  if (player.hp <= 0) {
    G.state = "gameover";
    bankCoins();
    SFX.bossRoar();
  }
}

// ------------------------------------------------------------------ render --
function camera() {
  let cx = clamp(player.x - VW / 2, 0, WORLD_W - VW);
  let cy = clamp(player.y - VH / 2, 0, WORLD_H - VH);
  if (G.shake > 0) { cx += rnd(-G.shake, G.shake) * 0.5; cy += rnd(-G.shake, G.shake) * 0.5; }
  G.cam.x = cx; G.cam.y = cy;
  return { cx, cy };
}

function renderWorld() {
  const { cx, cy } = camera();
  ctx.save();
  ctx.translate(-Math.round(cx), -Math.round(cy));
  ctx.drawImage(floorCanvas, 0, 0);


  // burning ground under everything
  for (const f of firePatches) {
    const a = clamp(f.life / f.max, 0, 1);
    const g2 = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 26);
    g2.addColorStop(0, `rgba(252,150,50,${0.30 * a})`);
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(f.x - 26, f.y - 26, 52, 52);
    for (let i = 0; i < 8; i++) {
      const ang2 = f.seed + i * 0.785 + G.t * (2 + (i % 3));
      const r2 = 4 + ((i * 37) % 14);
      const fxp = f.x + Math.cos(ang2) * r2, fyp = f.y + Math.sin(ang2) * r2 * 0.6;
      const flick = Math.sin(G.t * 11 + i * 2 + f.seed) * 0.5 + 0.5;
      ctx.fillStyle = i % 3 === 0 ? `rgba(252,210,96,${0.9 * a * flick})` : `rgba(238,110,32,${0.8 * a * flick})`;
      ctx.fillRect(Math.round(fxp), Math.round(fyp - flick * 3), 2, 2 + Math.round(flick * 2));
    }
  }
  // corpses under everything
  for (const p of fx) if (p.kind === "corpse") {
    const list = ANIM[p.anim];
    const f = list[Math.min(list.length - 1, Math.floor((1 - p.life / p.max) * list.length))];
    drawSprite(f, p.x, p.y + 6, false, 1, clamp(p.life / p.max * 2, 0, 1));
  }
  // spawn warnings
  for (const p of fx) if (p.kind === "spawn") {
    const a = p.life / p.max;
    ctx.strokeStyle = `rgba(255,80,60,${0.7 * a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 + (1 - a) * 6, 0, Math.PI * 2); ctx.stroke();
  }

  // pickups under entities
  for (const g of gems) drawSprite(animFrame(ANIM.gem, g.t, 4), g.x, g.y + 3);
  for (const c of coins) drawSprite(animFrame(ANIM.coin, c.t, 8), c.x, c.y + 4);
  for (const f of flasks) drawSprite("flask_big_red", f.x, f.y + 6);

  // entities, y-sorted
  const drawables = [];
  for (const p of props) {
    if (p.x < cx - 40 || p.x > cx + VW + 40 || p.y < cy - 8 || p.y > cy + VH + 50) continue;
    drawables.push({ y: p.y, draw: () => drawProp(p) });
  }
  for (const e of enemies) drawables.push({ y: e.y, draw: () => drawEnemy(e) });
  drawables.push({ y: player.y, draw: drawPlayer });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // projectiles & fx above
  for (const p of fx) if (p.kind === "smoke") {
    ctx.fillStyle = `rgba(150,140,150,${0.35 * p.life / p.max})`;
    const r = 2 + (1 - p.life / p.max) * 3;
    ctx.fillRect(Math.round(p.x - r / 2), Math.round(p.y - r / 2), Math.round(r), Math.round(r));
  }
  for (const g of grenades) {
    ctx.save(); ctx.translate(Math.round(g.x), Math.round(g.y)); ctx.rotate(g.spin);
    const im = IMG.proj_grenade;
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  for (const b of bullets) {
    if (b.kind === "flame") {
      const age = 1 - b.life / b.max, r = 2 + age * 7;
      ctx.fillStyle = age < 0.3 ? "rgba(255,240,170,0.9)" : age < 0.65 ? `rgba(250,140,40,${0.85 - age * 0.4})` : `rgba(160,50,30,${0.6 * (1 - age)})`;
      ctx.fillRect(Math.round(b.x - r / 2), Math.round(b.y - r / 2), Math.round(r), Math.round(r));
    } else if (b.kind === "rocket") {
      ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y)); ctx.rotate(b.ang);
      ctx.fillStyle = Math.random() < 0.5 ? "#ffd166" : "#ff8a3d";
      ctx.fillRect(-7, -1, 3, 2); // exhaust
      const im = IMG.proj_rocket;
      ctx.drawImage(im, -im.width / 2, -im.height / 2);
      ctx.restore();
    } else {
      const tl = b.pierce > 2 ? 0.035 : 0.018; // snipers leave a longer tracer
      ctx.strokeStyle = b.crit ? "#fff7d6" : "#ffd166"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx * tl, b.y - b.vy * tl); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  for (const b of bolts) drawSprite(animFrame(ANIM.bolt, b.t, 8), b.x, b.y + 3);
  for (const ring of bossRings) {
    const fade = 1 - ring.r / ring.maxR;
    ctx.save();
    ctx.translate(ring.x, ring.y); ctx.scale(1, 0.7);
    ctx.strokeStyle = `rgba(255,110,50,${0.3 + 0.6 * fade})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, ring.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,220,120,${0.5 + 0.5 * fade})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(1, ring.r - 3), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  for (const p of fx) {
    if (p.kind === "blood") {
      ctx.fillStyle = `rgba(120,34,30,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "drip") {
      ctx.fillStyle = `rgba(200,40,45,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 2);
    } else if (p.kind === "ring") {
      const pr = (1 - p.life / p.max) * p.r;
      ctx.strokeStyle = `rgba(255,209,102,${p.life / p.max})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * p.life / p.max})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, pr - 5), 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === "flash") {
      const g4 = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
      g4.addColorStop(0, `rgba(255,240,190,${0.9 * p.life / p.max})`);
      g4.addColorStop(0.5, `rgba(250,140,40,${0.6 * p.life / p.max})`);
      g4.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g4;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    } else if (p.kind === "spark") {
      ctx.fillStyle = `rgba(252,${140 + Math.round(90 * p.life / p.max)},50,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "shell") {
      ctx.fillStyle = `rgba(230,190,80,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "muzzle") {
      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.ang);
      ctx.fillStyle = "#fff3c4"; ctx.fillRect(0, -1, 5, 3);
      ctx.fillStyle = "#ffb347"; ctx.fillRect(4, -2, 2, 1); ctx.fillRect(4, 2, 2, 1); ctx.fillRect(5, 0, 2, 1);
      ctx.restore();
    }
  }

  // damage numbers + hero speech
  ctx.textAlign = "center";
  for (const t of texts) {
    const s = t.speech ? `“${t.s}”` : t.s;
    ctx.font = t.big ? "bold 11px monospace" : (t.speech ? "italic bold 8px monospace" : "bold 8px monospace");
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(s, Math.round(t.x) + 1, Math.round(t.y) + 1);
    ctx.fillStyle = t.col;
    ctx.fillText(s, Math.round(t.x), Math.round(t.y));
  }
  ctx.restore();

  renderDarkness(cx, cy);
}

function drawProp(p) {
  if (p.gallows) { // the hanged King: a post, a crossbeam, a rope
    ctx.fillStyle = "#141018"; ctx.fillRect(p.x - 15, p.y - 38, 4, 41); ctx.fillRect(p.x - 15, p.y - 38, 18, 3);
    ctx.fillStyle = "#5a4232"; ctx.fillRect(p.x - 14, p.y - 37, 2, 39); ctx.fillRect(p.x - 14, p.y - 37, 16, 1);
    drawSprite(animFrame(ANIM.king, G.t, 1.4), p.x, p.y);
    return;
  }
  drawSprite(p.img, p.x, p.y, p.flip);
  if (p.fire) drawFlames(p.x, p.y - p.fireY, p.t);
}

function drawFlames(x, y, seed) {
  for (let i = 0; i < 7; i++) {
    const k = Math.sin(G.t * 13 + i * 2.3 + seed) * 0.5 + 0.5;
    const fx2 = x + ((i * 5) % 9) - 4, h = 2 + Math.round(k * (i % 3 === 1 ? 6 : 4));
    ctx.fillStyle = i % 3 === 0 ? "#ffe08a" : i % 3 === 1 ? "#ff8a2a" : "#d8441c";
    ctx.fillRect(Math.round(fx2), Math.round(y - h), 2, h);
  }
}

const PLAYER_SCALE = 1.3;
function drawPlayer() {
  const list = ANIM[CLASSES[G.cls].anim + (player.moving ? "_run" : "_idle")];
  if (player.flash > 0) { player.flash -= 1 / 60; ctx.filter = "brightness(2.5)"; }
  if (player.hurtCd > 0.3) ctx.globalAlpha = 0.6;
  drawSprite(animFrame(list, player.animT), player.x, player.y + 5, player.facing < 0, PLAYER_SCALE);
  ctx.filter = "none"; ctx.globalAlpha = 1;
  // held gun(s): pointed at the target while shooting, lowered otherwise
  const w = WEAPONS[G.weapon], im = IMG[w.sprite];
  const ang = aiming() ? player.atkAng : (player.facing > 0 ? 0.35 : Math.PI - 0.35);
  const h = handPos();
  const backKick = w.akimbo && player.akimboSide < 0; // akimbo: the guns take turns
  if (w.akimbo) drawGun(im, h.x - player.facing * 4, h.y + 1, ang, backKick ? player.recoil : 0);
  drawGun(im, h.x, h.y, ang, backKick ? 0 : player.recoil);
}

function drawGun(im, x, y, ang, kick) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(ang);
  if (Math.cos(ang) < 0) ctx.scale(1, -1); // keep it upright when aiming left
  ctx.drawImage(im, -2 - Math.round(kick), -im.height + 3); // grip at (2, h-3)
  ctx.restore();
}

function drawEnemy(e) {
  if (e.warmup > 0) return;
  let list, flip = false;
  if (e.dirAnim) {
    const mode = (e.atkTouch || 0) > 0.35 ? "attack" : "run";
    list = ANIM[`${e.dirAnim}_${mode}_${e.dir}`];
  } else {
    list = ANIM[e.anim + "_run"] || ANIM[e.anim + "_idle"];
    flip = e.facing < 0;
  }
  if (e.hitFlash > 0) ctx.filter = "brightness(2.5)";
  const enraged = e.rage && e.hp < e.maxHp * 0.5;
  if (enraged) ctx.filter = "brightness(1.4) saturate(1.6)";
  if (e.ghost) ctx.globalAlpha = 0.62 + Math.sin(e.animT * 6) * 0.1;
  drawSprite(animFrame(list, e.animT, enraged ? 14 : 10), e.x, e.y + (e.dirAnim ? 6 : 4), flip, e.scale);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  // hp bar
  if (e.hp < e.maxHp) {
    const w = e.big ? 26 : 12, h = 2;
    const top = e.y + 4 - (IMG[list[0]].height * e.scale) * (e.dirAnim ? 0.75 : 1) - 4;
    ctx.fillStyle = "#1a1420"; ctx.fillRect(Math.round(e.x - w / 2), Math.round(top), w, h);
    ctx.fillStyle = e.bossBar ? "#ff4d4d" : "#7bd88f";
    ctx.fillRect(Math.round(e.x - w / 2), Math.round(top), Math.round(w * e.hp / e.maxHp), h);
  }
}

let darkCanvas = null;
function renderDarkness(cx, cy) {
  if (!darkCanvas) { darkCanvas = document.createElement("canvas"); darkCanvas.width = VW; darkCanvas.height = VH; }
  const dc = darkCanvas.getContext("2d");
  dc.globalCompositeOperation = "source-over";
  dc.clearRect(0, 0, VW, VH);
  dc.fillStyle = "rgba(6,4,18,0.55)"; // a dead city has no power: night is dark
  dc.fillRect(0, 0, VW, VH);
  dc.globalCompositeOperation = "destination-out";
  const punch = (x, y, r, a) => {
    if (x < cx - r || x > cx + VW + r || y < cy - r || y > cy + VH + r) return;
    const g = dc.createRadialGradient(x - cx, y - cy, 0, x - cx, y - cy, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    dc.fillStyle = g;
    dc.fillRect(x - cx - r, y - cy - r, r * 2, r * 2);
  };
  punch(player.x, player.y, 135, 0.95);
  for (const b of bolts) punch(b.x, b.y, 22, 0.8);
  for (const f of firePatches) punch(f.x, f.y, 55, 0.85 * clamp(f.life / f.max + 0.3, 0, 1));
  for (const b of bullets) punch(b.x, b.y, b.kind === "flame" ? 20 : b.kind === "rocket" ? 26 : 8, 0.6);
  for (const g of grenades) punch(g.x, g.y, 12, 0.5);
  for (const p of fx) {
    if (p.kind === "muzzle") punch(p.x, p.y, 34, 0.7);
    else if (p.kind === "flash") punch(p.x, p.y, p.r * 2, 0.9 * p.life / p.max);
  }
  for (const ring of bossRings) punch(ring.x, ring.y, ring.r + 14, 0.5);
  for (const l of lamps) {
    if (l.flicker && Math.sin(G.t * 23 + l.t) + Math.sin(G.t * 7.3 + l.t * 2) > 1.1) continue; // dying bulb
    punch(l.x, l.y, 62, 0.8);
  }
  for (const p of props) if (p.fire) punch(p.x, p.y - p.fireY, 48 + Math.sin(G.t * 9 + p.t) * 4, 0.85);
  if (kingPos) punch(kingPos.x, kingPos.y - 12, 36, 0.5);
  let n = 0;
  for (const e of enemies) { if (n++ > 50) break; punch(e.x, e.y, e.big ? 40 : 24, 0.45); }
  for (const g2 of gems) punch(g2.x, g2.y, 10, 0.5);
  ctx.drawImage(darkCanvas, 0, 0);
}

// ---------------------------------------------------------------- UI ------
function bar(x, y, w, h, frac, fg, bg = "#241c2e") {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h);
  ctx.strokeStyle = "#0b0910"; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function renderHUD() {
  const st = player.stats;
  // hp
  bar(8, 8, 90, 8, player.hp / st.maxHp, "#e4485a");
  ctx.font = "bold 7px monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
  ctx.fillText(`${Math.ceil(player.hp * NUM_MULT)}/${big(st.maxHp)}`, 12, 15);
  // xp
  bar(8, 19, 90, 5, player.xp / xpNeeded(player.level), "#7bd88f");
  ctx.fillStyle = "#cfc6de";
  ctx.fillText(`LV ${player.level}`, 102, 25);
  // wave info
  ctx.textAlign = "center"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`WAVE ${G.wave}`, VW / 2, 14);
  ctx.font = "7px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText(`${enemies.length + spawnQueue.length} zombies left`, VW / 2, 23);
  // kills
  const sk = IMG.skull;
  if (sk && sk.complete) ctx.drawImage(sk, VW - 26 - String(G.kills).length * 5, 5);
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffd166"; ctx.fillText(`${G.kills}`, VW - 10, 14);
  // ammo: one pip per round for small clips, a bar + count for belts
  const clip = clipSize();
  if (player.reloadT > 0) {
    bar(8, 30, 60, 4, 1 - player.reloadT / (WEAPONS[G.weapon].reload * st.reloadMul), "#ffd166");
    ctx.font = "6px monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#ffd166";
    ctx.fillText("RELOAD", 72, 35);
  } else if (clip <= 20) {
    for (let i = 0; i < clip; i++) {
      ctx.fillStyle = i < player.ammo ? "#ffd166" : "#3a3346";
      ctx.fillRect(8 + i * 4, 30, 2, 5);
    }
  } else {
    bar(8, 30, 60, 4, player.ammo / clip, "#ffd166");
    ctx.font = "6px monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#ffd166";
    ctx.fillText(`${player.ammo}/${clip}`, 72, 35);
  }
  // pause button
  pauseBtnRect = { x: VW - 28, y: 30, w: 20, h: 18 };
  ctx.fillStyle = "rgba(36,28,46,0.75)"; ctx.fillRect(pauseBtnRect.x, pauseBtnRect.y, pauseBtnRect.w, pauseBtnRect.h);
  ctx.strokeStyle = "#57506b"; ctx.lineWidth = 1;
  ctx.strokeRect(pauseBtnRect.x + 0.5, pauseBtnRect.y + 0.5, pauseBtnRect.w - 1, pauseBtnRect.h - 1);
  ctx.fillStyle = "#cfc6de";
  ctx.fillRect(pauseBtnRect.x + 6, pauseBtnRect.y + 5, 3, 8);
  ctx.fillRect(pauseBtnRect.x + 11, pauseBtnRect.y + 5, 3, 8);

  renderMinimap();

  // armorer weapon inventory (dev mode only)
  if (DEV.on && G.cls === "armorer") renderInventoryBar();
  else invRects = [];

  // touch dash button
  if (usingTouch) {
    const ready = player.dashCd <= 0;
    ctx.beginPath(); ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = ready ? "rgba(255,209,102,0.30)" : "rgba(120,110,140,0.18)";
    ctx.fill();
    if (!ready) { // cooldown wedge
      ctx.beginPath();
      ctx.moveTo(DASH_BTN.x, DASH_BTN.y);
      ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, -Math.PI / 2, -Math.PI / 2 + (1 - player.dashCd / 2) * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,209,102,0.25)"; ctx.fill();
    }
    ctx.strokeStyle = ready ? "#ffd166" : "#6f6485"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = ready ? "#fff" : "#8f84a8";
    ctx.fillText("»", DASH_BTN.x, DASH_BTN.y + 3);
  }
}

let pauseBtnRect = null, fsPauseRect = null, invRects = [];

// city map, bottom-left: you (white), the horde (red), the King (gold)
function renderMinimap() {
  const s = 0.6, w = Math.round(MAP_W * s), h = Math.round(MAP_H * s);
  const x0 = 6, y0 = VH - h - 6;
  ctx.globalAlpha = 0.8;
  ctx.drawImage(miniCanvas, x0, y0, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#57506b"; ctx.lineWidth = 1; ctx.strokeRect(x0 - 0.5, y0 - 0.5, w + 1, h + 1);
  const dot = (x, y, col, r) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x0 + x / TILE * s - r / 2), Math.round(y0 + y / TILE * s - r / 2), r, r); };
  let n = 0;
  for (const e of enemies) { if (n++ > 150) break; if (e.warmup <= 0) dot(e.x, e.y, e.bossBar ? "#ff4d4d" : "#c0303a", e.bossBar ? 3 : 1); }
  if (kingPos && Math.floor(G.t * 2) % 2) dot(kingPos.x, kingPos.y, "#ffd166", 3);
  dot(player.x, player.y, "#ffffff", 2);
  // the viewport
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(Math.round(x0 + G.cam.x / TILE * s) + 0.5, Math.round(y0 + G.cam.y / TILE * s) + 0.5, Math.round(VW / TILE * s), Math.round(VH / TILE * s));
}

// armorer-only (dev mode): switch to any gun mid-run, stats rebuilt from
// scratch (base weapon -> class mods -> owned cards re-applied)
function armorerSwitchWeapon(id) {
  if (G.weapon === id) return;
  G.weapon = id;
  const stats = baseStats(id);
  CLASSES[G.cls].mods(stats);
  for (const c of CARD_POOL) {
    for (let i = 0; i < (cardCounts[c.id] || 0); i++) c.apply(stats);
  }
  const hpFrac = player.hp / player.stats.maxHp;
  player.stats = stats;
  player.hp = clamp(hpFrac * stats.maxHp, 1, stats.maxHp);
  player.atkCd = 0; player.reloadT = 0; player.ammo = clipSize();
  SFX.card();
}

function renderInventoryBar() {
  invRects = [];
  const ids = Object.keys(WEAPONS);
  const slot = 22, gap = 2;
  const total = ids.length * slot + (ids.length - 1) * gap;
  const x0 = VW / 2 - total / 2, y = VH - 26;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], x = x0 + i * (slot + gap);
    invRects.push({ x, y, w: slot, h: slot, id });
    const cur = id === G.weapon;
    ctx.fillStyle = cur ? "rgba(255,209,102,0.22)" : "rgba(24,19,34,0.85)";
    ctx.fillRect(x, y, slot, slot);
    ctx.strokeStyle = cur ? "#ffd166" : "#3a3346"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, slot - 1, slot - 1);
    const im = IMG[WEAPONS[id].sprite];
    if (im && im.complete) {
      const s = Math.min(1.5, (slot - 4) / im.height, (slot - 4) / im.width);
      ctx.drawImage(im, Math.round(x + slot / 2 - im.width * s / 2), Math.round(y + slot / 2 - im.height * s / 2), Math.round(im.width * s), Math.round(im.height * s));
    }
  }
  ctx.font = "6px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#8f84a8";
  ctx.fillText(`ARMORY — ${WEAPONS[G.weapon].name} · tap a slot or Q/E to cycle`, VW / 2, y - 4);
}
function renderPauseOverlay(t) {
  ctx.fillStyle = "rgba(7,5,16,0.7)"; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = "center";
  ctx.font = "bold 20px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText("PAUSED", VW / 2, 110);
  ctx.font = "8px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText("tap / press P to resume", VW / 2, 130);
  const bw = 150, bh = 24;
  fsPauseRect = { x: VW / 2 - bw / 2, y: 150, w: bw, h: bh };
  ctx.fillStyle = "#241c2e"; ctx.fillRect(fsPauseRect.x, fsPauseRect.y, bw, bh);
  ctx.strokeStyle = "#8a6a30"; ctx.lineWidth = 1;
  ctx.strokeRect(fsPauseRect.x + 0.5, fsPauseRect.y + 0.5, bw - 1, bh - 1);
  ctx.font = "bold 8px monospace"; ctx.fillStyle = "#e8dfc8";
  ctx.fillText("FULLSCREEN  [F]", VW / 2, fsPauseRect.y + 15);
}

// campfire scene -----------------------------------------------------------
let cardRects = [], shopRects = [], nextRect = null;
function renderCampfire(dt) {
  campfire.t += dt;
  // safety net: never strand the player with picks left but nothing to pick
  if (campfire.picksLeft > 0 && campfire.cards.length === 0) campfire.picksLeft = 0;
  ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);

  // fire glow
  const g = ctx.createRadialGradient(VW / 2, 84, 4, VW / 2, 84, 130);
  g.addColorStop(0, "rgba(252,150,50,0.28)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

  drawSprite(animFrame(ANIM.campfire, campfire.t, 8), VW / 2, 88, false, 2);
  drawSprite(animFrame(ANIM[CLASSES[G.cls].anim + "_idle"], campfire.t, 6), VW / 2 - 34, 86, false);
  ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`WAVE ${G.wave} CLEARED`, VW / 2, 26);
  ctx.font = "8px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText(campfire.picksLeft > 0 ? `pick a card (${campfire.picksLeft} left)` : "rested and ready", VW / 2, 40);

  // gold purse
  const cim0 = IMG.coin_f0;
  if (cim0 && cim0.complete) ctx.drawImage(cim0, VW - 52, 14);
  ctx.textAlign = "right"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`${G.coins}`, VW - 14, 24);

  // cards or the road onward
  cardRects = []; nextRect = null;
  if (campfire.picksLeft > 0) {
    const n = campfire.cards.length;
    const cw = 122, chh = 128, gap = 12;
    const total = n * cw + (n - 1) * gap;
    for (let i = 0; i < n; i++) {
      const x = VW / 2 - total / 2 + i * (cw + gap), y = 100;
      cardRects.push({ x, y, w: cw, h: chh, i });
      const c = campfire.cards[i];
      const rar = RARITY[c.r];
      const hov = campfire.chosen === i;
      ctx.save();
      if (hov) ctx.translate(0, -5);
      // dark panel, rarity-colored frame — light-on-dark for readability
      ctx.fillStyle = "#1c1626";
      ctx.fillRect(x, y, cw, chh);
      ctx.strokeStyle = rar.col; ctx.lineWidth = hov ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, chh - 1);
      ctx.fillStyle = rar.col; ctx.globalAlpha = 0.12;
      ctx.fillRect(x + 1, y + 1, cw - 2, 20);
      ctx.globalAlpha = 1;
      ctx.font = "bold 7px monospace"; ctx.textAlign = "left"; ctx.fillStyle = rar.col;
      ctx.fillText(rar.name, x + 6, y + 13);
      ctx.textAlign = "right"; ctx.fillStyle = "#8f84a8";
      ctx.fillText(`[${i + 1}]`, x + cw - 6, y + 13);
      const icon = IMG[c.icon];
      if (icon && icon.complete) {
        const s = Math.min(2.4, 34 / icon.height);
        ctx.drawImage(icon, Math.round(x + cw / 2 - icon.width * s / 2), Math.round(y + 26 + (38 - icon.height * s) / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      }
      ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
      ctx.fillText(c.name, x + cw / 2, y + 80);
      ctx.font = "8px monospace"; ctx.fillStyle = "#c9c0da";
      wrapText(c.desc, x + cw / 2, y + 94, cw - 12, 10);
      const cnt = cardCounts[c.id] || 0;
      if (cnt > 0) {
        ctx.font = "7px monospace"; ctx.fillStyle = "#7bd88f";
        ctx.fillText(`owned ${cnt}/${c.max}`, x + cw / 2, y + chh - 7);
      }
      ctx.restore();
    }
  } else {
    const bw = 150, bh = 30, bx = VW / 2 - bw / 2, by = 140;
    nextRect = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = "#241c2e"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = Math.floor(campfire.t * 2) % 2 ? "#fff" : "#ffd166";
    ctx.fillText(`NEXT WAVE  [ENTER]`, VW / 2, by + 19);
  }

  // shop row
  shopRects = [];
  const items = [
    { id: "reroll", label: "REROLL", key: "R", icon: "card", cost: campfire.rerollCost, on: campfire.picksLeft > 0 },
    { id: "heal", label: "HEAL 50%", key: "H", icon: "flask_big_red", cost: HEAL_COST, on: player.hp < player.stats.maxHp - 0.5 },
    { id: "pick", label: "+1 CARD", key: "B", icon: "xp_gem_f0", cost: campfire.pickCost, on: true },
  ];
  const bw = 128, bh = 24, gap2 = 14;
  const total2 = items.length * bw + (items.length - 1) * gap2;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const x = VW / 2 - total2 / 2 + i * (bw + gap2), y = VH - 34;
    shopRects.push({ x, y, w: bw, h: bh, id: it.id });
    const afford = G.coins >= it.cost && it.on;
    ctx.fillStyle = afford ? "#241c2e" : "#181322";
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = afford ? "#8a6a30" : "#3a3346"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
    const icon = IMG[it.icon];
    if (icon && icon.complete) {
      const s = it.icon === "card" ? 0.28 : 1.4;
      ctx.drawImage(icon, x + 6, Math.round(y + bh / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
    }
    ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = afford ? "#e8dfc8" : "#57506b";
    ctx.fillText(`${it.label} [${it.key}]`, x + 24, y + 15);
    ctx.textAlign = "right";
    ctx.fillStyle = afford ? "#ffd166" : "#57506b";
    ctx.fillText(`${it.cost}g`, x + bw - 6, y + 15);
  }

  // toast
  if (campfire.toast) {
    campfire.toast.t -= dt;
    if (campfire.toast.t <= 0) campfire.toast = null;
    else {
      ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd166";
      ctx.fillText(campfire.toast.s, VW / 2, VH - 42);
    }
  }
}

function wrapText(text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy); line = w; yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

// credits screen -------------------------------------------------------------
let creditLines = null, creditsH = 0, creditsT0 = 0, creditsRect = null;

function drawHeart(x, y, c) {
  ctx.fillStyle = c;
  const px = [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]];
  for (const [dx, dy] of px) ctx.fillRect(x + dx, y + dy, 1, 1);
}

function wrapLines(text, font, maxW) {
  ctx.font = font;
  const out = [], words = text.split(" ");
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; }
    else line = t;
  }
  if (line) out.push(line);
  return out;
}

function buildCreditLines() {
  const C = window.CREDITS;
  const L = [];
  const push = (s, font, col, gap, deco) => L.push({ s, font, col, gap, deco });
  push(C.title, "bold 15px monospace", "#ffd166", 30, "heart");
  for (const sec of C.sections) {
    push("— " + sec.heading + " —", "bold 10px monospace", "#e2762e", 20);
    for (const e of sec.entries) {
      push(e.name, "bold 12px monospace", "#fff", 12);
      for (const l of wrapLines(e.work, "8px monospace", 320)) push(l, "8px monospace", "#b9aed0", 10);
      if (e.thanks) for (const l of wrapLines("“" + e.thanks + "”", "8px monospace", 300)) push(l, "8px monospace", "#8f84a8", 10);
      const meta = [e.license, e.url].filter(Boolean).join(" · ");
      if (meta) push(meta, "7px monospace", "#7bd88f", 10);
      push("", "7px monospace", "#000", 12);
    }
    push("", "7px monospace", "#000", 8);
  }
  for (const l of wrapLines(C.outro, "bold 9px monospace", 320)) push(l, "bold 9px monospace", "#ffd166", 12);
  push("", "7px monospace", "#000", 20);
  push("press anything to return to the fire", "7px monospace", "#57506b", 10, "heart");
  creditsH = L.reduce((a, l) => a + l.gap, 0);
  return L;
}

function renderCredits(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#070510"); sky.addColorStop(1, "#1c1224");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
  const g = ctx.createRadialGradient(VW / 2, VH - 20, 6, VW / 2, VH - 20, 170);
  g.addColorStop(0, "rgba(252,150,50,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 24; i++) { // embers
    const y = VH - ((t * (8 + (i % 5) * 3) + i * 47) % (VH + 20));
    const x = ((i * 97) % VW) + Math.sin(t * 0.7 + i) * 8;
    ctx.fillStyle = `rgba(255,170,70,${clamp(y / VH, 0, 1) * 0.5})`;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  if (!creditLines) creditLines = buildCreditLines();
  const speed = 16;
  const span = creditsH + VH + 30;
  let y = VH + 16 - ((t - creditsT0) * speed) % span;
  ctx.textAlign = "center";
  for (const l of creditLines) {
    if (y > -20 && y < VH + 20 && l.s) {
      ctx.font = l.font; ctx.fillStyle = l.col;
      ctx.fillText(l.s, VW / 2, y);
      if (l.deco === "heart") {
        const w = ctx.measureText(l.s).width;
        drawHeart(VW / 2 - w / 2 - 16, y - 6, "#e4485a");
        drawHeart(VW / 2 + w / 2 + 9, y - 6, "#e4485a");
      }
    }
    y += l.gap;
  }

  // lines melt into darkness before reaching the fire
  const fade = ctx.createLinearGradient(0, VH - 96, 0, VH - 34);
  fade.addColorStop(0, "rgba(13,9,22,0)"); fade.addColorStop(1, "rgba(13,9,22,1)");
  ctx.fillStyle = fade; ctx.fillRect(0, VH - 96, VW, 96);
  const fadeTop = ctx.createLinearGradient(0, 0, 0, 26);
  fadeTop.addColorStop(0, "rgba(7,5,16,0.95)"); fadeTop.addColorStop(1, "rgba(7,5,16,0)");
  ctx.fillStyle = fadeTop; ctx.fillRect(0, 0, VW, 26);

  // the marine rests by the fire while the names roll
  drawSprite(animFrame(ANIM.campfire, t, 8), VW / 2 + 16, VH - 12, false, 1.5);
  drawSprite(animFrame(ANIM.marine_idle, t, 6), VW / 2 - 18, VH - 14, false, PLAYER_SCALE);
}

// key button + sound toggles + password modal --------------------------------
let sndBtnRects = [];
function menuButton(x, on) {
  const r = { x, y: 6, w: 22, h: 20 };
  ctx.fillStyle = on ? "rgba(36,28,46,0.9)" : "rgba(24,19,34,0.9)";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = on ? "#8a6a30" : "#57506b"; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  return r;
}
function slashOut(r) {
  ctx.strokeStyle = "#e4485a"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(r.x + 4, r.y + r.h - 4); ctx.lineTo(r.x + r.w - 4, r.y + 4); ctx.stroke();
}
function drawKeyButton() {
  sndBtnRects = [];
  // fullscreen toggle
  let r = menuButton(VW - 112, true);
  ctx.strokeStyle = "#e8dfc8"; ctx.lineWidth = 1;
  for (const [cx2, cy2, dx, dy] of [[5, 5, 1, 1], [17, 5, -1, 1], [5, 15, 1, -1], [17, 15, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(r.x + cx2 + dx * 4, r.y + cy2);
    ctx.lineTo(r.x + cx2, r.y + cy2);
    ctx.lineTo(r.x + cx2, r.y + cy2 + dy * 4);
    ctx.stroke();
  }
  sndBtnRects.push({ ...r, id: "fs" });
  // music toggle
  r = menuButton(VW - 84, SND.music);
  const mc = SND.music ? "#e8dfc8" : "#57506b";
  ctx.fillStyle = mc;
  ctx.fillRect(r.x + 5, r.y + 13, 3, 3);  // note heads
  ctx.fillRect(r.x + 12, r.y + 12, 3, 3);
  ctx.fillRect(r.x + 7, r.y + 5, 1, 9);   // stems
  ctx.fillRect(r.x + 14, r.y + 4, 1, 9);
  ctx.fillRect(r.x + 7, r.y + 4, 8, 2);   // beam
  if (!SND.music) slashOut(r);
  sndBtnRects.push({ ...r, id: "music" });
  // sfx toggle
  r = menuButton(VW - 56, SND.sfx);
  const sc = SND.sfx ? "#e8dfc8" : "#57506b";
  ctx.fillStyle = sc;
  ctx.fillRect(r.x + 4, r.y + 8, 3, 5);   // speaker body
  ctx.beginPath();                         // cone
  ctx.moveTo(r.x + 7, r.y + 8); ctx.lineTo(r.x + 11, r.y + 4);
  ctx.lineTo(r.x + 11, r.y + 17); ctx.lineTo(r.x + 7, r.y + 13);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sc; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(r.x + 12, r.y + 10.5, 4, -0.9, 0.9); ctx.stroke();
  if (!SND.sfx) slashOut(r);
  sndBtnRects.push({ ...r, id: "sfx" });
  // dev key
  keyBtnRect = { x: VW - 28, y: 6, w: 22, h: 20 };
  r = keyBtnRect;
  ctx.fillStyle = DEV.on ? "rgba(180,140,255,0.18)" : "rgba(36,28,46,0.9)";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = DEV.on ? "#b48cff" : "#57506b"; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  const im = IMG.ui_key;
  if (im && im.complete) ctx.drawImage(im, r.x + 5, r.y + 6);
}

function renderPassModal(dt) {
  ctx.fillStyle = "rgba(7,5,16,0.75)"; ctx.fillRect(0, 0, VW, VH);
  const pw2 = 220, ph2 = 104, px = VW / 2 - pw2 / 2, py = VH / 2 - ph2 / 2 - 14;
  ctx.fillStyle = "#181322"; ctx.fillRect(px, py, pw2, ph2);
  ctx.strokeStyle = "#8a6a30"; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, pw2 - 1, ph2 - 1);
  const im = IMG.ui_key;
  if (im && im.complete) ctx.drawImage(im, px + 8, py + 8);
  ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd166";
  ctx.fillText("DEVELOPER ACCESS", VW / 2 + 6, py + 16);
  // masked input (tap to summon the keyboard)
  passRects.box = { x: px + 20, y: py + 28, w: pw2 - 40, h: 18 };
  ctx.fillStyle = "#241c2e"; ctx.fillRect(px + 20, py + 28, pw2 - 40, 18);
  ctx.strokeStyle = document.activeElement === devInput ? "#8a6a30" : "#57506b";
  ctx.strokeRect(px + 20.5, py + 28.5, pw2 - 41, 17);
  ctx.font = "bold 10px monospace"; ctx.fillStyle = "#e8dfc8";
  const dots = "*".repeat(passModal.input.length) + (Math.floor(performance.now() / 400) % 2 ? "_" : " ");
  ctx.fillText(dots, VW / 2, py + 41);
  if (passModal.errT > 0) {
    passModal.errT -= dt;
    ctx.font = "7px monospace"; ctx.fillStyle = "#ff6b6b";
    ctx.fillText("wrong password", VW / 2, py + 56);
  }
  // tappable buttons
  const bw = 84, bh = 20;
  passRects.cancel = { x: px + 18, y: py + ph2 - 30, w: bw, h: bh };
  passRects.ok = { x: px + pw2 - 18 - bw, y: py + ph2 - 30, w: bw, h: bh };
  for (const [r, label, hot] of [[passRects.cancel, "CANCEL", false], [passRects.ok, "CONFIRM", true]]) {
    ctx.fillStyle = hot ? "#2e2438" : "#241c2e"; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = hot ? "#ffd166" : "#57506b"; ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.font = "bold 8px monospace"; ctx.fillStyle = hot ? "#ffd166" : "#8f84a8";
    ctx.fillText(label, r.x + r.w / 2, r.y + 13);
  }
}

// class select + class shop ---------------------------------------------------
let clsRects = [], clsToast = null;

function selectClass(id) {
  G.cls = id;
  // the armorer swaps guns in-game via the armory bar — no select screen
  if (id === "armorer") newRun("pistol");
  else G.state = "select";
}

let selToast = null, upRects = [];
function tryUpgradeWeapon(id) {
  const lv = wpnLevel(id);
  if (lv >= WPN_MAX_LV) { selToast = { s: `${WEAPONS[id].name} is already maxed`, t: 2 }; return; }
  const cost = wpnUpCost(id);
  if (META.gold < cost) {
    selToast = { s: `upgrade costs ${cost} gold — you have ${META.gold}`, t: 2.2 };
    SFX.hurt();
    return;
  }
  META.gold -= cost;
  META.wpn[id] = lv + 1;
  saveMeta();
  selToast = { s: `${WEAPONS[id].name} → LV ${lv + 1} (+8% damage)`, t: 2.2 };
  SFX.level();
}

function tryBuyClass(id) {
  const c = CLASSES[id];
  if (!c.price) return;
  if (META.gold < c.price) {
    clsToast = { s: `${c.name} costs ${c.price} gold — you have ${META.gold}`, t: 2.2 };
    SFX.hurt();
    return;
  }
  META.gold -= c.price;
  UN[c.unlock] = true;
  saveMeta(); saveUnlocks();
  clsToast = { s: `${c.name.toUpperCase()} UNLOCKED!`, t: 2.5 };
  SFX.level();
}

function unlockHint(id, c) {
  const buy = `buy ${c.price}g`;
  if (id === "ghost") return buy + " · or reach wave 10";
  if (id === "demo" || id === "heavy") return buy + " · or 0.1% boss relic";
  return buy;
}

function renderClassSelect(t) {
  ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);
  const g = ctx.createRadialGradient(VW / 2, 60, 8, VW / 2, 60, 140);
  g.addColorStop(0, "rgba(252,150,50,0.15)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = "center";
  ctx.font = "bold 14px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText("CHOOSE YOUR HERO", VW / 2, 36);

  // gold bank
  const cim = IMG.coin_f0;
  if (cim && cim.complete) ctx.drawImage(cim, 10, 8);
  ctx.textAlign = "left"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`${META.gold}`, 24, 18);
  ctx.font = "6px monospace"; ctx.fillStyle = "#6f6485";
  ctx.fillText("your gold", 10, 27);
  ctx.textAlign = "center";

  clsRects = [];
  const ids = visibleClasses();
  const gap = 3;
  const cw = Math.min(76, Math.floor((VW - 16 - (ids.length - 1) * gap) / ids.length));
  const chh = 142;
  const total = ids.length * cw + (ids.length - 1) * gap;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], c = CLASSES[id];
    const unlocked = isUnlocked(c.unlock);
    const x = VW / 2 - total / 2 + i * (cw + gap), y = 52;
    clsRects.push({ x, y, w: cw, h: chh, id, unlocked });
    ctx.drawImage(IMG.card, x, y, cw, chh);
    drawSprite(animFrame(ANIM[c.anim + "_idle"], t + i * 0.4, 6), x + cw / 2, y + 58, false, 1.3);
    ctx.font = "bold 8px monospace"; ctx.fillStyle = "#3a2c18";
    if (ctx.measureText(c.name).width > cw - 6) ctx.font = "bold 6px monospace"; // "Demolitionist" on narrow cards
    ctx.fillText(c.name, x + cw / 2, y + 78);
    ctx.font = "6px monospace"; ctx.fillStyle = "#584426";
    wrapText(c.desc, x + cw / 2, y + 90, cw - 10, 8);
    ctx.font = "bold 7px monospace"; ctx.fillStyle = "#a5834a";
    ctx.fillText(`[${i + 1}]`, x + cw / 2, y + 10);
    if (!unlocked) {
      ctx.fillStyle = "rgba(11,9,16,0.88)"; ctx.fillRect(x + 2, y + 2, cw - 4, chh - 4);
      drawSprite(animFrame(ANIM[c.anim + "_idle"], t + i * 0.4, 6), x + cw / 2, y + 58, false, 1.3, 0.25);
      ctx.font = "bold 8px monospace"; ctx.fillStyle = "#8f84a8"; ctx.textAlign = "center";
      ctx.fillText("LOCKED", x + cw / 2, y + 80);
      ctx.font = "6px monospace"; ctx.fillStyle = "#6f6485";
      wrapText(unlockHint(id, c), x + cw / 2, y + 92, cw - 8, 8);
      // buy ribbon
      const afford = META.gold >= c.price;
      ctx.fillStyle = afford ? "#2e2438" : "#181322";
      ctx.fillRect(x + 8, y + chh - 26, cw - 16, 16);
      ctx.strokeStyle = afford ? "#ffd166" : "#3a3346"; ctx.lineWidth = 1;
      ctx.strokeRect(x + 8.5, y + chh - 25.5, cw - 17, 15);
      ctx.font = "bold 7px monospace"; ctx.fillStyle = afford ? "#ffd166" : "#57506b";
      ctx.fillText(`BUY ${c.price}g`, x + cw / 2, y + chh - 15);
    }
  }
  if (clsToast) {
    clsToast.t -= 1 / 60;
    if (clsToast.t <= 0) clsToast = null;
    else {
      ctx.font = "bold 8px monospace"; ctx.fillStyle = "#ffd166";
      ctx.fillText(clsToast.s, VW / 2, VH - 26);
    }
  }
  ctx.font = "7px monospace"; ctx.fillStyle = "#6f6485";
  ctx.fillText(`click or press 1-${ids.length} · locked heroes can be bought with banked gold`, VW / 2, VH - 12);
  drawKeyButton();
}

// weapon select --------------------------------------------------------------
let selectRects = [];
function renderSelect(t) {
  ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);
  const g = ctx.createRadialGradient(VW / 2, 46, 8, VW / 2, 46, 140);
  g.addColorStop(0, "rgba(252,150,50,0.15)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = "center";
  ctx.font = "bold 14px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText("CHOOSE YOUR WEAPON", VW / 2, 30);
  drawSprite(animFrame(ANIM[CLASSES[G.cls].anim + "_idle"], t, 6), VW / 2, 66, false, PLAYER_SCALE);

  // gold bank (spent on the upgrade buttons)
  const cim = IMG.coin_f0;
  if (cim && cim.complete) ctx.drawImage(cim, 10, 8);
  ctx.textAlign = "left"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`${META.gold}`, 24, 18);
  ctx.font = "6px monospace"; ctx.fillStyle = "#6f6485";
  ctx.fillText("your gold", 10, 27);

  selectRects = []; upRects = [];
  const ids = CLASSES[G.cls].weapons;
  const pw = 212, ph = 46, gapx = 16, gapy = 10;
  const cols = ids.length > 3 ? 2 : 1;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], w = WEAPONS[id];
    const unlocked = isUnlocked(w.unlock);
    const col = i % cols, row = Math.floor(i / cols);
    const x = cols === 1 ? VW / 2 - pw / 2 : VW / 2 - pw - gapx / 2 + col * (pw + gapx);
    const y = 80 + row * (ph + gapy);
    selectRects.push({ x, y, w: pw - 48, h: ph, id, unlocked });
    ctx.fillStyle = unlocked ? "#241c2e" : "#161020";
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = unlocked ? "#8a6a30" : "#3a3346"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
    const icon = IMG[w.sprite];
    if (icon && icon.complete) {
      const s = Math.min(2, 36 / icon.height, 34 / icon.width);
      if (!unlocked) ctx.globalAlpha = 0.35;
      ctx.drawImage(icon, Math.round(x + 20 - icon.width * s / 2), Math.round(y + ph / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      if (w.akimbo) ctx.drawImage(icon, Math.round(x + 24 - icon.width * s / 2), Math.round(y + ph / 2 + 4 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      ctx.globalAlpha = 1;
    }
    const lv = wpnLevel(id);
    ctx.textAlign = "left";
    ctx.font = "bold 8px monospace"; ctx.fillStyle = unlocked ? "#e8dfc8" : "#57506b";
    ctx.fillText(`[${i + 1}] ${w.name}${lv > 0 ? ` LV${lv}` : ""}`, x + 40, y + 14);
    ctx.font = "7px monospace"; ctx.fillStyle = unlocked ? "#8f84a8" : "#453f58";
    ctx.fillText(unlocked ? w.desc : "locked", x + 40, y + 26);
    ctx.fillStyle = unlocked ? "#ffd166" : "#453f58";
    const dmgNow = big(w.dmg * (1 + 0.08 * lv));
    ctx.fillText(`dmg ${dmgNow}${w.pellets ? "×" + w.pellets : ""}${w.blast ? " AoE" : ""} · ${w.atkSpd}/s · ${w.clip} rds`, x + 40, y + 38);
    // upgrade button (persistent, costs banked gold, price climbs per level)
    if (unlocked) {
      const ur = { x: x + pw - 44, y: y + 4, w: 40, h: ph - 8, id };
      upRects.push(ur);
      const maxed = lv >= WPN_MAX_LV;
      const cost = wpnUpCost(id);
      const afford = !maxed && META.gold >= cost;
      ctx.fillStyle = afford ? "#2e2438" : "#181322";
      ctx.fillRect(ur.x, ur.y, ur.w, ur.h);
      ctx.strokeStyle = afford ? "#ffd166" : "#3a3346";
      ctx.strokeRect(ur.x + 0.5, ur.y + 0.5, ur.w - 1, ur.h - 1);
      ctx.textAlign = "center";
      ctx.font = "bold 7px monospace"; ctx.fillStyle = afford ? "#ffd166" : "#57506b";
      if (maxed) ctx.fillText("MAX", ur.x + ur.w / 2, ur.y + ur.h / 2 + 3);
      else {
        ctx.fillText("+8% dmg", ur.x + ur.w / 2, ur.y + 14);
        ctx.fillText(`${cost}g`, ur.x + ur.w / 2, ur.y + 26);
      }
      ctx.textAlign = "left";
    }
  }
  if (selToast) {
    selToast.t -= 1 / 60;
    if (selToast.t <= 0) selToast = null;
    else {
      ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd166";
      ctx.fillText(selToast.s, VW / 2, VH - 24);
    }
  }
  ctx.textAlign = "center";
  ctx.font = "7px monospace"; ctx.fillStyle = "#6f6485";
  ctx.fillText(`${CLASSES[G.cls].name}'s arsenal — press 1-${ids.length} to fight · gold buttons upgrade forever`, VW / 2, VH - 10);
  drawKeyButton();
}

// title / end screens -------------------------------------------------------
let titleFloor = null;
function renderTitle(t) {
  // night sky over a dead skyline (deterministic: no flicker between frames)
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#070510"); sky.addColorStop(0.6, "#120c1c"); sky.addColorStop(1, "#1c1224");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
  for (let bx = -6, k = 0; bx < VW; k++) {
    const w = 26 + (k * 37) % 30, h = 50 + (k * 53) % 70, top = VH - 62 - h;
    ctx.fillStyle = k % 2 ? "#0d0a14" : "#110d1a";
    ctx.fillRect(bx, top, w, h);
    for (let wy = top + 6; wy < VH - 70; wy += 9) {
      for (let wx = bx + 4; wx < bx + w - 5; wx += 7) {
        const lit = ((wx * 7 + wy * 13 + k) % 23) === 0;
        ctx.fillStyle = lit ? "rgba(230,190,90,0.55)" : "rgba(40,36,56,0.6)";
        ctx.fillRect(wx, wy, 3, 4);
      }
    }
    bx += w + 2;
  }

  // warm glow from the burning-barrel corner
  const g = ctx.createRadialGradient(64, 216, 6, 64, 216, 190);
  g.addColorStop(0, "rgba(252,150,50,0.30)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

  // drifting embers (deterministic per index — no flicker)
  for (let i = 0; i < 34; i++) {
    const spd = 9 + (i % 5) * 3;
    const y = VH - ((t * spd + i * 41) % (VH + 24));
    const x = ((i * 89) % VW) + Math.sin(t * 0.8 + i) * 9;
    const a = clamp(y / VH, 0, 1) * 0.55;
    ctx.fillStyle = i % 3 ? `rgba(255,160,64,${a})` : `rgba(255,220,120,${a})`;
    const s = i % 4 === 0 ? 2 : 1;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }

  // title: layered gold-gradient wordmark with pulse
  ctx.save();
  ctx.translate(VW / 2, 92);
  const pulse = 1 + Math.sin(t * 2) * 0.012;
  ctx.scale(pulse, pulse);
  ctx.textAlign = "center";
  ctx.font = "bold 36px monospace";
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText("ZOMBIE BLASTER", 3, 4);
  const tg = ctx.createLinearGradient(0, -34, 0, 8);
  tg.addColorStop(0, "#fff3c4"); tg.addColorStop(0.45, "#ffd166"); tg.addColorStop(0.85, "#e2762e"); tg.addColorStop(1, "#a33d1e");
  ctx.fillStyle = tg; ctx.fillText("ZOMBIE BLASTER", 0, 0);
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(42,20,12,0.9)";
  ctx.strokeText("ZOMBIE BLASTER", 0, 0);
  ctx.restore();
  ctx.textAlign = "center";

  // ground strip
  if (!titleFloor) {
    titleFloor = document.createElement("canvas");
    titleFloor.width = VW; titleFloor.height = 40;
    const fc = titleFloor.getContext("2d");
    fc.imageSmoothingEnabled = false;
    for (let i = 0; i <= VW / TILE; i++) {
      fc.drawImage(IMG[`city_walk_${i % 5 === 0 ? 1 : 0}`], i * TILE, 8);
      fc.drawImage(IMG[`city_road_${(i * 7) % 3}`], i * TILE, 24);
    }
    fc.fillStyle = "rgba(30,28,34,0.9)"; fc.fillRect(0, 23, VW, 1); // curb
    fc.fillStyle = "rgba(6,4,14,0.45)"; fc.fillRect(0, 0, VW, 40);
  }
  ctx.drawImage(titleFloor, 0, VH - 62);

  // the marine holds the line at the campfire, facing the shambling horde
  drawSprite(animFrame(ANIM.campfire, t, 8), 46, VH - 40, false, 1.5);
  drawSprite(animFrame(ANIM.marine_idle, t, 6), 78, VH - 42, false, PLAYER_SCALE);
  const gim = IMG.gun_rifle;
  if (imgOk(gim)) ctx.drawImage(gim, 79, VH - 55);

  // endless zombie horde shambling left toward him
  const MARCH = [
    ["goblin_run", true, 1], ["orc_grunt_run", true, 1], ["orc_shaman_run", true, 1],
    ["cp_orc3_run_l", false, 1], ["orc_berserker_run", true, 1], ["cp_frost_run_l", false, 1],
    ["masked_orc_run", true, 1], ["cp_orc2_run_l", false, 1], ["cp_night_run_l", false, 1],
    ["ogre_run", true, 1], ["butcher_run", true, 1.3], ["cp_blood_run_l", false, 1],
    ["shamanking_run", true, 1.3], ["warchief_run", true, 1.5],
  ];
  const span = VW - 130 + 60;
  for (let i = 0; i < MARCH.length; i++) {
    const [a, flip, sc] = MARCH[i];
    const x = 130 + ((i * 47 + 10000 - t * 26) % span);
    const bob = Math.abs(Math.sin(t * 7 + i)) * 1.5;
    drawSprite(animFrame(ANIM[a], t + i * 0.37, 9), x, VH - 42 - bob, flip, sc);
  }
  // darkness fades the far end of the horde
  const fade = ctx.createLinearGradient(VW - 90, 0, VW, 0);
  fade.addColorStop(0, "rgba(7,5,16,0)"); fade.addColorStop(1, "rgba(7,5,16,0.85)");
  ctx.fillStyle = fade; ctx.fillRect(VW - 90, VH - 90, 90, 90);

  // prompt
  ctx.font = "bold 11px monospace";
  const blink = (Math.sin(t * 4) + 1) / 2;
  ctx.fillStyle = `rgba(255,${209 + blink * 40},${102 + blink * 140},${0.6 + blink * 0.4})`;
  ctx.fillText("PRESS ENTER / TAP TO LOCK AND LOAD", VW / 2, 138);
  // credits link
  creditsRect = { x: 6, y: 6, w: 64, h: 16 };
  drawHeart(creditsRect.x + 4, creditsRect.y + 5, "#e4485a");
  ctx.font = "bold 8px monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#8f84a8";
  ctx.fillText("CREDITS", creditsRect.x + 15, creditsRect.y + 12);
  ctx.textAlign = "center";
  drawKeyButton();
}

function renderEnd(victory, t) {
  ctx.fillStyle = "rgba(11,9,16,0.85)"; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = "center";
  ctx.font = "bold 26px monospace";
  ctx.fillStyle = victory ? "#7bd88f" : "#e4485a";
  ctx.fillText(victory ? "PATIENT ZERO DOWN!" : "YOU DIED", VW / 2, 90);
  ctx.font = "9px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText(`wave ${G.wave} · ${G.kills} zombies slain · ${G.coins} gold · level ${player ? player.level : 1}`, VW / 2, 112);
  if (victory) {
    drawSprite(animFrame(ANIM[CLASSES[G.cls].anim + "_idle"], t, 6), VW / 2 - 12, 150);
    drawSprite(animFrame(ANIM.campfire, t, 8), VW / 2 + 12, 150);
    ctx.font = "italic 8px monospace"; ctx.fillStyle = "#a8d4ff";
    ctx.fillText("“It is done. Rest now, my King.”", VW / 2, 132);
    ctx.font = "8px monospace"; ctx.fillStyle = "#ffd166";
    ctx.fillText("the city is quiet. the barrels are hot.", VW / 2, 168);
    ctx.fillText("[E] keep blasting (endless)   [ENTER] new run", VW / 2, 196);
  } else {
    drawSprite("skull", VW / 2, 152, false, 2);
    ctx.font = "italic 8px monospace"; ctx.fillStyle = "#a8d4ff";
    ctx.fillText("“Forgive me, my King…”", VW / 2, 174);
    ctx.font = "8px monospace"; ctx.fillStyle = "#ffd166";
    ctx.fillText("[ENTER] try again", VW / 2, 196);
  }
}

// ------------------------------------------------------------- input glue --
function handleKey(code) {
  if (code === "KeyF" && ["title", "select"].includes(G.state)) { toggleFullscreen(); return; }
  if (G.state === "title" && code === "KeyC") { audio(); creditsT0 = performance.now() / 1000; G.state = "credits"; }
  else if (G.state === "title" && (code === "Enter" || code === "Space")) { audio(); G.state = "cls"; }
  else if (G.state === "credits") { G.state = "title"; }
  else if (G.state === "cls") {
    const ids = visibleClasses();
    if (code === "KeyF") { toggleFullscreen(); return; }
    const m = /^Digit([1-9])$/.exec(code);
    if (m) {
      const id = ids[+m[1] - 1];
      if (!id) return;
      if (isUnlocked(CLASSES[id].unlock)) selectClass(id);
      else tryBuyClass(id);
    }
  } else if (G.state === "select") {
    const ids = CLASSES[G.cls].weapons;
    const m = /^Digit([1-9])$/.exec(code);
    if (m) {
      const id = ids[+m[1] - 1];
      if (id && isUnlocked(WEAPONS[id].unlock)) newRun(id);
    }
  } else if (G.state === "campfire") {
    if (code === "Digit1") pickCard(0);
    if (code === "Digit2") pickCard(1);
    if (code === "Digit3") pickCard(2);
    if (code === "KeyR") shopReroll();
    if (code === "KeyH") shopHeal();
    if (code === "KeyB") shopExtraPick();
    if (code === "Enter" && campfire && campfire.picksLeft <= 0) leaveCampfire();
  } else if (G.state === "gameover" && code === "Enter") { cardCounts = {}; G.state = "cls"; }
  else if (G.state === "victory") {
    if (code === "KeyE") { G.endless = true; G.state = "play"; enterCampfire(); }
    if (code === "Enter") { bankCoins(); cardCounts = {}; G.state = "cls"; }
  } else if (G.state === "play") {
    if (code === "KeyP" || code === "Escape") G.paused = !G.paused;
    if (code === "KeyF" && G.paused) toggleFullscreen();
    if (DEV.on && G.cls === "armorer" && (code === "KeyQ" || code === "KeyE")) {
      const ids = Object.keys(WEAPONS);
      const i = ids.indexOf(G.weapon);
      armorerSwitchWeapon(ids[(i + (code === "KeyE" ? 1 : ids.length - 1)) % ids.length]);
    }
  }
}

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  } catch (e) { /* not supported (e.g. iPhone Safari) */ }
}

function handleClick(x, y) {
  audio();
  if (passModal.open) { // modal owns all clicks/taps
    const hit = r => r && x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 && y <= r.y + r.h + 3;
    if (hit(passRects.ok)) submitPassword();
    else if (hit(passRects.cancel)) closePassModal();
    else if (hit(passRects.box)) devInput.focus(); // re-summon the keyboard
    return true;
  }
  if (["title", "cls", "select"].includes(G.state)) {
    for (const r of sndBtnRects) {
      if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 && y <= r.y + r.h + 3) {
        if (r.id === "fs") { toggleFullscreen(); return true; }
        SND[r.id] = !SND[r.id];
        saveSound();
        SFX.card();
        return true;
      }
    }
  }
  if (["title", "cls", "select"].includes(G.state) && keyBtnRect &&
      x >= keyBtnRect.x - 3 && x <= keyBtnRect.x + keyBtnRect.w + 3 &&
      y >= keyBtnRect.y - 3 && y <= keyBtnRect.y + keyBtnRect.h + 3) {
    if (DEV.on) {
      DEV.on = false;
      try { localStorage.setItem("orcslasher_dev", "0"); } catch (e) { /* no storage */ }
      SFX.card();
    } else {
      openPassModal();
    }
    return true;
  }
  if (G.state === "title" && creditsRect &&
      x >= creditsRect.x - 3 && x <= creditsRect.x + creditsRect.w + 3 &&
      y >= creditsRect.y - 3 && y <= creditsRect.y + creditsRect.h + 3) {
    creditsT0 = performance.now() / 1000; G.state = "credits"; return true;
  }
  if (G.state === "credits") { G.state = "title"; return true; }
  if (G.state === "title") { G.state = "cls"; return true; }
  if (G.state === "cls") {
    for (const r of clsRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (r.unlocked) selectClass(r.id);
        else tryBuyClass(r.id);
        return true;
      }
    }
    return true;
  }
  if (G.state === "select") {
    for (const r of upRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { tryUpgradeWeapon(r.id); return true; }
    }
    for (const r of selectRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h && r.unlocked) { newRun(r.id); return true; }
    }
    return true;
  }
  if (G.state === "gameover") { cardCounts = {}; G.state = "cls"; return true; }
  if (G.state === "victory") { G.endless = true; G.state = "play"; enterCampfire(); return true; }
  if (G.state === "play") {
    if (pauseBtnRect && x >= pauseBtnRect.x - 3 && x <= pauseBtnRect.x + pauseBtnRect.w + 3 &&
        y >= pauseBtnRect.y - 3 && y <= pauseBtnRect.y + pauseBtnRect.h + 3) {
      G.paused = !G.paused;
      return true;
    }
    for (const r of invRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y - 2 && y <= r.y + r.h + 2) {
        armorerSwitchWeapon(r.id);
        return true;
      }
    }
    if (G.paused) {
      if (fsPauseRect && x >= fsPauseRect.x && x <= fsPauseRect.x + fsPauseRect.w &&
          y >= fsPauseRect.y && y <= fsPauseRect.y + fsPauseRect.h) toggleFullscreen();
      else G.paused = false;
      return true;
    }
    return false;
  }
  if (G.state === "campfire") {
    for (const r of shopRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (r.id === "reroll") shopReroll();
        else if (r.id === "heal") shopHeal();
        else if (r.id === "pick") shopExtraPick();
        return true;
      }
    }
    if (nextRect && x >= nextRect.x && x <= nextRect.x + nextRect.w && y >= nextRect.y && y <= nextRect.y + nextRect.h) {
      leaveCampfire(); return true;
    }
    for (const r of cardRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { pickCard(r.i); return true; }
    }
    return true;
  }
  return false;
}

canvas.addEventListener("pointermove", e => {
  if (G.state !== "campfire" || !campfire) return;
  const p = canvasPos(e);
  campfire.chosen = -1;
  for (const r of cardRects) {
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) campfire.chosen = r.i;
  }
});

// ------------------------------------------------------------------- loop --
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ctx.imageSmoothingEnabled = false;

  if (assetsLeft > 0) {
    ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#cfc6de"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("loading magazines…", VW / 2, VH / 2);
    requestAnimationFrame(frame);
    return;
  }

  if (G.state === "title") renderTitle(now / 1000);
  else if (G.state === "credits") renderCredits(now / 1000);
  else if (G.state === "cls") renderClassSelect(now / 1000);
  else if (G.state === "select") renderSelect(now / 1000);
  else if (G.state === "play") {
    if (!G.paused) updatePlay(dt);
    if (G.state === "play" || G.state === "gameover" || G.state === "victory") {
      renderWorld();
      renderHUD();
      if (G.state === "play" && G.paused) renderPauseOverlay(now / 1000);
      if (G.state === "gameover" || G.state === "victory") renderEnd(G.state === "victory", now / 1000);
    } else if (G.state === "campfire") renderCampfire(dt);
  }
  else if (G.state === "campfire") renderCampfire(dt);
  else if (G.state === "gameover" || G.state === "victory") { renderWorld(); renderHUD(); renderEnd(G.state === "victory", now / 1000); }

  // password modal over the menus
  if (passModal.open) {
    if (!["title", "cls", "select"].includes(G.state)) closePassModal();
    else renderPassModal(dt);
  }

  // dev mode badge (kept clear of the armory bar)
  if (DEV.on) {
    ctx.font = "bold 7px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = "#b48cff";
    const inPlayAsArmorer = G.state === "play" && G.cls === "armorer";
    ctx.fillText(inPlayAsArmorer ? "DEV" : "DEV MODE — all classes & weapons (retype phrase on a menu to exit)", 6, inPlayAsArmorer ? 44 : VH - 4);
  }

  // touch joystick overlay
  if (touchState.active && G.state === "play") {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(touchState.ox, touchState.oy, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    const d = Math.hypot(touchState.dx, touchState.dy) || 1;
    const cl = Math.min(d, 18);
    ctx.beginPath(); ctx.arc(touchState.ox + touchState.dx / d * cl, touchState.oy + touchState.dy / d * cl, 6, 0, Math.PI * 2); ctx.fill();
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
