/* ZOMBIE BLASTER — a Brotato-style roguelike with guns, in an abandoned city.
 * Sprites: 0x72 DungeonTileset II (CC0) + CraftPix + original art, all
 * zombified by tools/zombify.py (see assets/CREDITS.md).
 */
"use strict";

// ------------------------------------------------------------------ setup --
const canvas = document.getElementById("game"); // what the player sees (WebGL2, or 2D fallback)
const VW = canvas.width, VH = canvas.height;
// the game draws into two offscreen layers: the world scene (lit by the FX
// pass) and the UI on top (never lit). `ctx` points at whichever is current.
const sceneCanvas = document.createElement("canvas"), uiCanvas = document.createElement("canvas");
sceneCanvas.width = uiCanvas.width = VW; sceneCanvas.height = uiCanvas.height = VH;
let sceneCtx = sceneCanvas.getContext("2d", { alpha: false }), uiCtx = uiCanvas.getContext("2d");
let ctx = sceneCtx;

const TILE = 16;
const MAP_W = 4096, MAP_H = 4096; // virtual: any size works, cost follows the view
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
// the same lists keyed without string building: ANIM_DIR.cp_orc1.run.d
const ANIM_DIR = {};
for (const p of ["cp_orc1", "cp_orc2", "cp_orc3", "cp_frost", "cp_night", "cp_blood", "cp_savage", "cp_veteran", "cp_ghost"]) {
  ANIM_DIR[p] = { run: {}, attack: {}, death: ANIM[`${p}_death`] };
  for (const d of ["d", "u", "l", "r"]) { ANIM_DIR[p].run[d] = ANIM[`${p}_run_${d}`]; ANIM_DIR[p].attack[d] = ANIM[`${p}_attack_${d}`]; }
}

// sound settings ------------------------------------------------------------
const SND = { music: true, sfx: true, fx: true }; // fx = WebGL lighting + CRT post-processing
try { Object.assign(SND, JSON.parse(localStorage.getItem("orcslasher_sound") || "{}")); } catch (e) { /* no storage */ }
function saveSound() { try { localStorage.setItem("orcslasher_sound", JSON.stringify(SND)); } catch (e) { /* no storage */ } }

// tiny synth ---------------------------------------------------------------
let AC = null;
function audio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  startMusic();
  loadSamples();
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
// sampled sounds (CC0 packs, bundled as window.SOUNDS), decoded once the
// audio context exists; sample() returns false until then so callers can
// fall back to the synth
const SAMPLES = {};
let samplesLoading = false;
function loadSamples() {
  if (samplesLoading || !AC || !window.SOUNDS) return;
  samplesLoading = true;
  for (const [name, uri] of Object.entries(window.SOUNDS)) {
    const bin = atob(uri.slice(uri.indexOf(",") + 1)), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    AC.decodeAudioData(buf.buffer).then(b => { SAMPLES[name] = b; }, () => { /* undecodable: synth fallback */ });
  }
}
function sample(name, vol, rate = 1, pan = 0) {
  const b = SAMPLES[name];
  if (!SND.sfx || !AC || !b) return false;
  try {
    const src = AC.createBufferSource(), g = AC.createGain();
    src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
    src.connect(g);
    if (pan && AC.createStereoPanner) {
      const pn = AC.createStereoPanner();
      pn.pan.value = clamp(pan, -1, 1);
      g.connect(pn).connect(AC.destination);
    } else g.connect(AC.destination);
    src.start();
  } catch (e) { return false; }
  return true;
}
// a sound at a world position: quieter with distance, panned left/right
function sampleAt(name, x, y, vol, rate = 1) {
  if (!player) return sample(name, vol, rate);
  const d = Math.hypot(x - player.x, y - player.y);
  return sample(name, vol * clamp(1.2 - d / 320, 0, 1), rate, (x - player.x) / 260);
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
  boom: () => { if (!sample("boom", 0.6, rnd(0.85, 1.1))) { noise(0.5, 0.16, 520); beep(60, 0.35, "sawtooth", 0.12, -30); } },
  reload: () => { beep(620, 0.04, "square", 0.04); setTimeout(() => beep(880, 0.05, "square", 0.04), 110); },
  level: () => { beep(520, 0.09, "square", 0.06); setTimeout(() => beep(660, 0.09, "square", 0.06), 90); setTimeout(() => beep(880, 0.14, "square", 0.06), 180); },
  card: () => beep(440, 0.08, "triangle", 0.08, 100),
  dash: () => beep(300, 0.1, "sine", 0.05, 300),
  bossRoar: () => { if (!sample("zboss", 0.7, rnd(0.7, 0.85))) beep(55, 0.6, "sawtooth", 0.12, -20); },
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
  // undo the CRT curvature so taps land where the button is drawn
  const [u, v] = fxWarp((t.clientX - r.left - offX) / scale / VW, 1 - (t.clientY - r.top - offY) / scale / VH);
  return { x: u * VW, y: (1 - v) * VH };
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
  if (e.pointerType === "mouse") { // mouse: hold to aim and fire where you point
    mouse.down = true; mouse.seen = true; mouse.x = p.x; mouse.y = p.y;
    return;
  }
  touchState.active = true; touchState.id = e.pointerId;
  touchState.ox = p.x; touchState.oy = p.y; touchState.dx = 0; touchState.dy = 0;
});
canvas.addEventListener("pointermove", e => {
  if (e.pointerType === "mouse") { const m = canvasPos(e); mouse.x = m.x; mouse.y = m.y; mouse.seen = true; }
  if (!touchState.active || e.pointerId !== touchState.id) return;
  const p = canvasPos(e);
  touchState.dx = p.x - touchState.ox; touchState.dy = p.y - touchState.oy;
});
window.addEventListener("pointerup", e => {
  if (e.pointerType === "mouse") mouse.down = false;
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

// mirrored and tinted copies are made once and cached, so drawing never needs
// save/restore, transforms or ctx.filter (all slow per sprite)
const flipCache = new Map(), tintCache = new Map();
const TINTS = { hit: "rgba(255,255,255,0.78)", rage: "rgba(255,60,40,0.38)", char: "rgba(22,12,10,0.88)", dead: "rgba(70,10,14,0.55)", ghost: "rgba(120,230,255,0.75)" };
function spriteCanvas(im) {
  const c = document.createElement("canvas");
  c.width = im.width; c.height = im.height;
  return c;
}
function flipped(name) {
  let c = flipCache.get(name);
  if (!c) {
    const im = IMG[name];
    c = spriteCanvas(im);
    const g = c.getContext("2d");
    g.translate(im.width, 0); g.scale(-1, 1); g.drawImage(im, 0, 0);
    flipCache.set(name, c);
  }
  return c;
}
function tinted(name, flip, tint) {
  const key = flip ? name + "|f|" + tint : name + "|" + tint;
  let c = tintCache.get(key);
  if (!c) {
    const im = IMG[name];
    c = spriteCanvas(im);
    const g = c.getContext("2d");
    g.drawImage(flip ? flipped(name) : im, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = TINTS[tint]; g.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c);
  }
  return c;
}
// feet-anchored; alpha multiplies whatever globalAlpha the caller set
function drawSprite(name, x, y, flip = false, scale = 1, alpha = 1, tint = null) {
  const im = IMG[name];
  if (!im || !im.complete || !im.naturalWidth) return;
  const src = tint ? tinted(name, flip, tint) : flip ? flipped(name) : im;
  const w = Math.round(im.width * scale), h = Math.round(im.height * scale);
  const a0 = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = a0 * alpha;
  ctx.drawImage(src, Math.round(x - w / 2), Math.round(y) - h, w, h);
  if (alpha !== 1) ctx.globalAlpha = a0;
}

// soft radial blobs (lights, glows, flashes) rendered once, scaled on draw
function blobSprite(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return c;
}
const LIGHT_BLOB = blobSprite([[0, "rgba(0,0,0,1)"], [0.5, "rgba(0,0,0,0.55)"], [1, "rgba(0,0,0,0)"]]);
const FIRE_GLOW = blobSprite([[0, "rgba(252,150,50,0.30)"], [1, "rgba(252,150,50,0)"]]);
const FLASH_BLOB = blobSprite([[0, "rgba(255,240,190,0.9)"], [0.5, "rgba(250,140,40,0.6)"], [1, "rgba(250,140,40,0)"]]);
const blob = (im, x, y, r, a) => {
  ctx.globalAlpha = a;
  ctx.drawImage(im, Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
  ctx.globalAlpha = 1;
};

function animFrame(list, t, fps = 8) {
  return list[Math.floor(t * fps) % list.length];
}

// ------------------------------------------------------------------- map ---
// A virtual abandoned city of any size: nothing is stored for the whole map.
// Roads are two sorted lists of positions; the city is cut into "cells"
// (one block plus the road west and north of it), and each cell is generated
// on demand from the run seed and cached. The floor is painted lazily in
// 256px chunks, the flow field covers only a window around the player, and
// the minimap is a local radar. Memory and per-frame cost follow the view,
// not MAP_W/MAP_H.
const T_BLD = 0, T_ROAD = 1, T_WALK = 2, T_LOT = 3, T_GRASS = 4, T_PLAZA = 5, T_RUBBLE = 6;
const EDGE = 2;           // the outermost tiles are a ring of buildings
const CHUNK = 16;         // floor chunk side, in tiles
const CELL_CAP = 900, CHUNK_CAP = 60;
const EMPTY = [];
const EDGE_BLD = { wall: "concrete", roof: 0, doors: new Set() };
let SEED = 1, roadX = [], roadY = [], startPos = null, kingPos = null, kingCell = null;
const cellCache = new Map(), chunkCache = new Map();
let mapStamp = 0; // bumped every frame; caches evict the least recently used

// deterministic randomness: same seed + same coordinates = same city
function hash3(a, b, c) {
  let h = (SEED ^ Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// index of the cell column/row holding tile t = how many roads start at or before it
function upperBound(arr, t) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; }
  return lo;
}
const colOf = tx => upperBound(roadX, tx), rowOf = ty => upperBound(roadY, ty);
const inVRoad = tx => { const c = colOf(tx); return c > 0 && tx < roadX[c - 1] + 4; };
const inHRoad = ty => { const r = rowOf(ty); return r > 0 && ty < roadY[r - 1] + 4; };
const walkCol = tx => { const c = colOf(tx); return (c > 0 && tx === roadX[c - 1] + 4) || (c < roadX.length && tx === roadX[c] - 1); };
const walkRow = ty => { const r = rowOf(ty); return (r > 0 && ty === roadY[r - 1] + 4) || (r < roadY.length && ty === roadY[r] - 1); };

function buildMap() {
  SEED = (Math.random() * 4294967296) >>> 0;
  cellCache.clear(); chunkCache.clear(); chunkDecals.clear();
  WORLD.props.clear(); WORLD.tiles.clear(); WORLD.cellTiles.clear();
  radarReady = false;
  const R = mulberry(hash3(1, 2, 3));
  roadX = []; roadY = [];
  for (let x = 7 + Math.floor(R() * 4); x < MAP_W - 12; x += 17 + Math.floor(R() * 7)) roadX.push(x);
  for (let y = 6 + Math.floor(R() * 3); y < MAP_H - 10; y += 13 + Math.floor(R() * 5)) roadY.push(y);
  // start on the crossroads nearest the middle; the King hangs a few blocks east
  const ci = clamp(upperBound(roadX, MAP_W / 2) - 1, 0, roadX.length - 1);
  const cj = clamp(upperBound(roadY, MAP_H / 2) - 1, 0, roadY.length - 1);
  startPos = { x: (roadX[ci] + 2) * TILE, y: (roadY[cj] + 2) * TILE };
  kingPos = null;
  for (let k = 4; !kingPos && k < 12; k++) { // first block big enough for a plaza
    kingCell = { ci: Math.min(ci + k, roadX.length), cj: Math.min(cj + 1, roadY.length) };
    cellCache.clear();
    kingPos = getCell(kingCell.ci, kingCell.cj).king;
  }
}

function getCell(ci, cj) {
  const key = ci * 65536 + cj;
  let c = cellCache.get(key);
  if (!c) {
    if (cellCache.size >= CELL_CAP) evict(cellCache, CELL_CAP / 4);
    c = genCell(ci, cj);
    cellCache.set(key, c);
  }
  c.stamp = mapStamp;
  return c;
}
function evict(cache, n) {
  const old = [...cache.entries()].sort((a, b) => a[1].stamp - b[1].stamp);
  for (let i = 0; i < n && i < old.length; i++) cache.delete(old[i][0]);
}
const cellAt = (tx, ty) => getCell(colOf(tx), rowOf(ty));
const oob = (tx, ty) => tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H;
function tileType(tx, ty) {
  if (oob(tx, ty)) return T_BLD;
  const c = cellAt(tx, ty);
  return c.T[(ty - c.y0) * c.w + tx - c.x0];
}
function buildingAt(tx, ty) {
  if (oob(tx, ty)) return EDGE_BLD;
  const c = cellAt(tx, ty), b = c.bid[(ty - c.y0) * c.w + tx - c.x0];
  return b === -2 ? EDGE_BLD : b >= 0 ? c.buildings[b] : null;
}
function walkAt(tx, ty) {
  if (oob(tx, ty)) return 0;
  const c = cellAt(tx, ty);
  return c.walk[(ty - c.y0) * c.w + tx - c.x0];
}
function rectsAt(tx, ty) {
  if (oob(tx, ty)) return EMPTY;
  const c = cellAt(tx, ty);
  return c.pg[(ty - c.y0) * c.w + tx - c.x0] || EMPTY;
}

// one block + its west and north road, fully self-contained: every prop
// rect stays inside the cell, so collision never has to look next door
function genCell(ci, cj) {
  const R = mulberry(hash3(ci, cj, 7));
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1)), rf = (a, b) => a + R() * (b - a);
  const rp = arr => arr[Math.floor(R() * arr.length)];
  const x0 = ci ? roadX[ci - 1] : 0, x1 = (ci < roadX.length ? roadX[ci] : MAP_W) - 1;
  const y0 = cj ? roadY[cj - 1] : 0, y1 = (cj < roadY.length ? roadY[cj] : MAP_H) - 1;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const T = new Uint8Array(w * h).fill(T_LOT), bid = new Int16Array(w * h).fill(-1);
  const L = (tx, ty) => (ty - y0) * w + tx - x0;
  const inCell = (tx, ty) => tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const i = L(tx, ty);
      if (tx < EDGE || ty < EDGE || tx >= MAP_W - EDGE || ty >= MAP_H - EDGE) { T[i] = T_BLD; bid[i] = -2; }
      else if ((ci && tx < x0 + 4) || (cj && ty < y0 + 4)) T[i] = T_ROAD;
      else if ((ci && tx === x0 + 4) || (ci < roadX.length && tx === x1) || (cj && ty === y0 + 4) || (cj < roadY.length && ty === y1)) T[i] = T_WALK;
    }
  }
  const block = {
    x0: ci ? x0 + 5 : EDGE, x1: ci < roadX.length ? x1 - 1 : MAP_W - EDGE - 1,
    y0: cj ? y0 + 5 : EDGE, y1: cj < roadY.length ? y1 - 1 : MAP_H - EDGE - 1,
  };
  const cell = { ci, cj, x0, y0, x1, y1, w, h, T, bid, buildings: [], props: [], lamps: [], spawns: [], manholes: [], king: null, stamp: 0 };
  const bw = block.x1 - block.x0, bh = block.y1 - block.y0;
  const isKing = kingCell && ci === kingCell.ci && cj === kingCell.cj && bw >= 2 && bh >= 2;
  let kind = "lot";
  const fill = t => { for (let ty = block.y0; ty <= block.y1; ty++) for (let tx = block.x0; tx <= block.x1; tx++) T[L(tx, ty)] = t; };
  const WALL_STYLES = ["brick", "concrete", "beige"];
  function addBuilding(bx0, bx1, by0, by1) {
    const id = cell.buildings.length, bwid = bx1 - bx0 + 1;
    const doors = new Set([bx0 + ri(1, Math.max(1, bwid - 2))]);
    if (bwid >= 7 && R() < 0.5) doors.add(bx0 + ri(1, bwid - 2));
    cell.buildings.push({ wall: rp(WALL_STYLES), roof: ri(0, 2), doors });
    for (let ty = by0; ty <= by1; ty++) for (let tx = bx0; tx <= bx1; tx++) { T[L(tx, ty)] = T_BLD; bid[L(tx, ty)] = id; }
    for (const d of doors) if (by1 + 1 <= y1 && T[L(d, by1 + 1)] !== T_BLD) cell.spawns.push({ x: d * TILE + 8, y: (by1 + 1) * TILE + 8 });
  }
  function buildingRow(by0, by1) {
    let x = block.x0;
    while (x <= block.x1) {
      let bwid = ri(4, 8);
      if (block.x1 - (x + bwid - 1) < 4) bwid = block.x1 - x + 1; // swallow a sliver too thin to build on
      const yb = by1 - (R() < 0.25 ? 1 : 0); // some stand back from the street
      if (yb - by0 >= 2) addBuilding(x, x + bwid - 1, by0, yb);
      x += bwid;
      if (x <= block.x1 - 4 && R() < 0.3) x++; // alley
    }
  }
  if (bw >= 2 && bh >= 2) {
    const r = R();
    if (isKing) { fill(T_PLAZA); kind = "plaza"; }
    else if (r < 0.68 && bw >= 3 && bh >= 3) {
      kind = "bld";
      if (bh >= 10 && R() < 0.55) { // two rows facing a back alley
        const mid = Math.floor((block.y0 + block.y1) / 2);
        buildingRow(block.y0, mid - 1); buildingRow(mid + 1, block.y1);
      } else buildingRow(block.y0, block.y1);
    } else if (r < 0.84) { fill(T_GRASS); kind = "park"; }
  }

  // ---- props (feet + footprint relative to the feet; footprints stay in the cell)
  const walkable = (tx, ty) => inCell(tx, ty) && T[L(tx, ty)] !== T_BLD;
  const free = (x, y, rw, rh, pad = 3) => {
    for (let ty = Math.floor((y - pad) / TILE); ty <= Math.floor((y + rh + pad) / TILE); ty++) {
      for (let tx = Math.floor((x - pad) / TILE); tx <= Math.floor((x + rw + pad) / TILE); tx++) if (!walkable(tx, ty)) return false;
    }
    return !cell.props.some(p => p.rect && x < p.rect.x + p.rect.w + pad && x + rw + pad > p.rect.x && y < p.rect.y + p.rect.h + pad && y + rh + pad > p.rect.y);
  };
  const nearStart = (x, y) => Math.hypot(x - startPos.x, y - startPos.y) < 7 * TILE;
  function addProp(img, x, y, rect, extra) {
    const rr = rect ? { x: x + rect[0], y: y + rect[1], w: rect[2], h: rect[3] } : null;
    if (rr && (!free(rr.x, rr.y, rr.w, rr.h) || (rr.w > 8 && nearStart(x, y)))) return null; // keep the start clear of wrecks
    const p = { img, x, y, rect: rr, flip: false, t: rf(0, 9), fire: false, fireY: 0, gallows: false,
      dk: "", hp: 0, maxHp: 0, state: 0, gone: false, hitT: 0, fuse: 0, geyser: 0, fireT: 0, active: false, key: 0 };
    if (extra) Object.assign(p, extra);
    cell.props.push(p);
    return p;
  }
  const fire = p => { if (p) { p.fire = true; p.fireY = p.img === "city_firebarrel" ? 12 : p.fireY; } return p; };
  const CAR_COLORS = ["red", "blue", "white", "green", "rust", "rust", "burnt"];
  const car = (x, y, vertical) => {
    const col = rp(CAR_COLORS);
    const p = vertical
      ? addProp(`city_car_v_${col}`, x, y, [-8, -28, 16, 26], { fireY: 18 })
      : addProp(`city_car_h_${col}`, x, y, [-15, -14, 30, 12], { flip: R() < 0.5, fireY: 12 });
    if (p && col === "burnt" && R() < 0.6) fire(p);
  };
  const barrel = (x, y) => {
    const p = addProp(R() < 0.5 ? "city_firebarrel" : rp(["city_barrel", "city_barrel_blue"]), x, y, [-5, -6, 10, 6]);
    if (p && p.img === "city_firebarrel") fire(p);
  };
  const lamp = (tx, ty, flip) => {
    if (!walkable(tx, ty)) return;
    const x = tx * TILE + 8, y = ty * TILE + 14;
    const p = addProp("city_lamp", x, y, [-2, -3, 4, 3], { flip });
    if (!p) return;
    if (R() < 0.25) p.img = "city_lamp_broken";
    else cell.lamps.push({ x: x + (flip ? -7 : 7), y: y - 10, flicker: R() < 0.15, t: rf(0, 9), prop: p });
  };
  const roadTop = cj ? y0 + 6 : EDGE, roadLeft = ci ? x0 + 6 : EDGE; // segments clear of the crossing
  if (ci) { // west road (vertical)
    for (let ty = roadTop + 1; ty < y1 - 1; ty += ri(5, 11)) car((x0 + (R() < 0.5 ? 1 : 3)) * TILE, ty * TILE + rf(0, 8), true);
    if (R() < 0.3) { const ty = ri(roadTop, y1 - 2); addProp("city_barricade", (x0 + (R() < 0.5 ? 1 : 3)) * TILE, ty * TILE, [-15, -8, 30, 7]); }
    for (let ty = roadTop + 1; ty < y1 - 1; ty += 6) lamp(x0 + 4, ty, true);
    for (let ty = roadTop; ty < y1 - 2; ty += ri(8, 12)) {
      const tx = x0 + ri(0, 2);
      cell.manholes.push({ x: tx * TILE + 4, y: ty * TILE + 6 });
      cell.spawns.push({ x: tx * TILE + 10, y: ty * TILE + 12 });
    }
  }
  if (cj) { // north road (horizontal)
    for (let tx = roadLeft + 1; tx < x1 - 1; tx += ri(5, 11)) car(tx * TILE + rf(0, 8), (y0 + (R() < 0.5 ? 2 : 4)) * TILE - 2, false);
    if (R() < 0.3) { const tx = ri(roadLeft + 1, x1 - 2); addProp("city_barricade", tx * TILE, (y0 + 2) * TILE + (R() < 0.5 ? 0 : 16), [-15, -8, 30, 7]); }
    for (let tx = roadLeft; tx < x1 - 1; tx += 7) lamp(tx, y0 + 4, R() < 0.5);
    for (let tx = roadLeft; tx < x1 - 2; tx += ri(9, 14)) {
      const ty = y0 + ri(0, 2);
      cell.manholes.push({ x: tx * TILE + 4, y: ty * TILE + 6 });
      cell.spawns.push({ x: tx * TILE + 10, y: ty * TILE + 12 });
    }
  }
  // lamps on the far sidewalks (they line the next roads east and south)
  if (ci < roadX.length) for (let ty = roadTop + 3; ty < y1 - 1; ty += 6) lamp(x1, ty, false);
  if (cj < roadY.length) for (let tx = roadLeft + 3; tx < x1 - 1; tx += 7) lamp(tx, y1, R() < 0.5);

  const area = (bw + 1) * (bh + 1);
  const spot = () => ({ x: rf(block.x0 * TILE + 10, (block.x1 + 1) * TILE - 10), y: rf(block.y0 * TILE + 16, (block.y1 + 1) * TILE - 4) });
  if (kind === "park") {
    for (let i = 0; i < area / 12; i++) { const s = spot(); addProp("city_tree", s.x, s.y, [-2, -3, 4, 3]); }
  } else if (kind === "lot") {
    for (let i = 0; i < area / 22; i++) { const s = spot(); car(s.x, s.y, R() < 0.5); }
    for (let i = 0; i < area / 30; i++) { const s = spot(); barrel(s.x, s.y); }
    for (let i = 0; i < area / 40; i++) { const s = spot(); addProp("city_dumpster", s.x, s.y, [-13, -10, 26, 9]); }
  } else if (kind === "plaza") {
    const k = { x: ((block.x0 + block.x1 + 1) / 2) * TILE, y: ((block.y0 + block.y1 + 1) / 2) * TILE + 8 };
    cell.king = k;
    addProp(null, k.x, k.y, [-15, -3, 4, 4], { gallows: true });
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fire(addProp("city_firebarrel", k.x + dx * 40, k.y + dy * 26, [-5, -6, 10, 6]));
    for (let i = 0; i < area / 16; i++) { const s = spot(); if (dist(s, k) > 50) addProp("city_tree", s.x, s.y, [-2, -3, 4, 3]); }
  }
  // street furniture on the sidewalks, junk on roads and lots (Kenney, grimed)
  const SIDEWALK = ["hydrant", "hydrant", "mailbox", "news", "news2", "bin", "bin2", "bench", "utility"];
  const JUNK = ["cone", "cone", "tire", "tires", "box", "box2", "boxes", "rubble", "rubble2", "barrier", "barrelw"];
  for (let i = 0; i < w * h / 40; i++) {
    const tx = ri(x0, x1), ty = ri(y0, y1), t = T[L(tx, ty)];
    const x = tx * TILE + ri(4, 12), y = ty * TILE + ri(10, 15);
    if (t === T_WALK) {
      const k = rp(SIDEWALK);
      addProp("city_k_" + k, x, y, k === "bench" ? [-7, -4, 14, 4] : [-4, -4, 8, 4], { flip: R() < 0.5 });
    } else if (t === T_ROAD ? R() < 0.45 : t === T_LOT) {
      addProp("city_k_" + rp(JUNK), x, y, [-4, -4, 8, 4], { flip: R() < 0.5 });
    }
  }
  // alleys and setbacks collect dumpsters, barrels and fire barrels
  for (let i = 0; i < w * h / 70; i++) {
    const tx = ri(x0, x1), ty = ri(y0, y1);
    const t = T[L(tx, ty)];
    if (t !== T_LOT && t !== T_WALK) continue;
    const x = tx * TILE + 8, y = ty * TILE + 12, r = R();
    if (r < 0.25) addProp("city_dumpster", x, y, [-13, -10, 26, 9]);
    else if (r < 0.7) barrel(x, y);
  }

  // hit points, and whatever this run already broke here (WORLD)
  const ck = ci * 65536 + cj;
  cell.props.forEach((p, idx) => {
    p.key = ck * 1024 + idx;
    [p.dk, p.maxHp] = propKind(p.img);
    p.hp = p.maxHp;
    if (p.rect) { p.rect.p = p; p.rect.dead = false; }
    const saved = WORLD.props.get(p.key);
    if (saved === undefined) return;
    p.state = Math.floor(saved / 1e6);
    const hp = saved % 1e6;
    p.hp = hp === 999999 ? Infinity : hp;
    if (p.state === PS_GONE) { p.gone = true; p.fire = false; if (p.rect) p.rect.dead = true; }
    else if (p.state === PS_WRECK) { p.img = p.img.replace(/_(red|blue|white|green|rust)$/, "_burnt"); p.dk = "wreck"; p.hp = Infinity; }
    else if (p.state === PS_BROKEN) { p.img = "city_lamp_broken"; p.dk = "lampdead"; }
    else if (p.state === PS_SMOKE || p.state === PS_FUSE) { p.state = PS_SMOKE; activate(p); }
  });
  for (const i of WORLD.cellTiles.get(ck) || EMPTY) { T[i] = T_RUBBLE; bid[i] = -1; }

  // per-tile solids + walkability
  cell.pg = new Array(w * h);
  cell.walk = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) cell.walk[i] = T[i] === T_BLD ? 0 : 1;
  for (const p of cell.props) {
    const r = p.rect;
    if (!r) continue;
    for (let ty = Math.floor(r.y / TILE); ty <= Math.floor((r.y + r.h) / TILE); ty++) {
      for (let tx = Math.floor(r.x / TILE); tx <= Math.floor((r.x + r.w) / TILE); tx++) {
        if (!inCell(tx, ty)) continue;
        const i = L(tx, ty);
        (cell.pg[i] || (cell.pg[i] = [])).push(r);
        const cx = tx * TILE + 8, cy = ty * TILE + 8;
        if (!r.dead && cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h) cell.walk[i] = 0;
      }
    }
  }
  return cell;
}

const scratchCells = [];
// every cell overlapping a world-space rectangle
function cellsIn(x0, y0, x1, y1, out = []) {
  out.length = 0;
  const c0 = colOf(Math.max(0, Math.floor(x0 / TILE))), c1 = colOf(Math.min(MAP_W - 1, Math.floor(x1 / TILE)));
  const r0 = rowOf(Math.max(0, Math.floor(y0 / TILE))), r1 = rowOf(Math.min(MAP_H - 1, Math.floor(y1 / TILE)));
  for (let ci = c0; ci <= c1; ci++) for (let cj = r0; cj <= r1; cj++) out.push(getCell(ci, cj));
  return out;
}

// ---- floor: painted per chunk on first sight, evicted when long unseen
function getChunk(kx, ky) {
  const key = kx * 65536 + ky;
  let ch = chunkCache.get(key);
  if (!ch) {
    if (chunkCache.size >= CHUNK_CAP) evict(chunkCache, CHUNK_CAP / 4);
    ch = { canvas: paintChunk(kx, ky), stamp: 0 };
    chunkCache.set(key, ch);
  }
  ch.stamp = mapStamp;
  return ch.canvas;
}

const WIN_TILES = ["win0", "win0", "win0", "win0", "win2", "win2", "win3", "win3", "win1"];
function paintChunk(kx, ky) {
  const S = CHUNK * TILE, cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const fc = cv.getContext("2d");
  fc.imageSmoothingEnabled = false;
  const tx0 = kx * CHUNK, ty0 = ky * CHUNK;
  const put = (name, x, y, fb) => {
    const im = IMG[name];
    if (imgOk(im)) fc.drawImage(im, x, y);
    else if (fb) { fc.fillStyle = fb; fc.fillRect(x, y, TILE, TILE); } // survives a stale-cache sprite mismatch
  };
  for (let ly = 0; ly < CHUNK; ly++) {
    for (let lx = 0; lx < CHUNK; lx++) {
      const tx = tx0 + lx, ty = ty0 + ly, x = lx * TILE, y = ly * TILE;
      if (oob(tx, ty)) { fc.fillStyle = "#0b0910"; fc.fillRect(x, y, TILE, TILE); continue; }
      const t = tileType(tx, ty), h = hash3(tx, ty, 11);
      if (t === T_ROAD) {
        const vr = inVRoad(tx), hr = inHRoad(ty);
        if (vr && !hr && walkRow(ty)) put("city_cross_v", x, y, "#38383e");
        else if (hr && !vr && walkCol(tx)) put("city_cross_h", x, y, "#38383e");
        else {
          put(`city_road_${h % 13 === 0 ? 3 : h % 3}`, x, y, "#38383e");
          fc.fillStyle = "rgba(196,160,60,0.75)"; // dashed centre lines
          if (vr && !hr && !walkRow(ty) && tx === roadX[colOf(tx) - 1] + 2) fc.fillRect(x, y + 3, 2, 9);
          if (hr && !vr && !walkCol(tx) && ty === roadY[rowOf(ty) - 1] + 2) fc.fillRect(x + 3, y, 9, 2);
          if (h % 19 === 0) put("city_crack", x, y);
        }
      } else if (t === T_WALK) put(`city_walk_${h % 5 === 0 ? 1 : 0}`, x, y, "#76726e");
      else if (t === T_LOT) put(`city_lot_${h % 3}`, x, y, "#52483c");
      else if (t === T_GRASS) put(`city_grass_${h % 2}`, x, y, "#464c2e");
      else if (t === T_PLAZA) put(`city_plaza_${(tx + ty) % 2}`, x, y, "#706054");
      else if (t === T_RUBBLE) put(`city_rubble_${h % 3}`, x, y, "#4a4440");
      else {
        const b = buildingAt(tx, ty);
        const below1 = tileType(tx, ty + 1) !== T_BLD;
        const below2 = !below1 && tileType(tx, ty + 2) !== T_BLD;
        if (below1) put(b.doors.has(tx) ? `city_wall_${b.wall}_door${h % 3 === 0 ? 1 : 0}` : `city_wall_${b.wall}_${WIN_TILES[h % WIN_TILES.length]}`, x, y, "#5a4c48");
        else if (below2) put(`city_wall_${b.wall}_${WIN_TILES[(h >> 3) % WIN_TILES.length]}`, x, y, "#5a4c48");
        else {
          put(`city_roof_${b.roof}`, x, y, "#403e44");
          // parapet: dark edge where the roof meets another building or the sky
          fc.fillStyle = "#1a161e";
          if (buildingAt(tx, ty - 1) !== b) fc.fillRect(x, y, TILE, 2);
          if (buildingAt(tx - 1, ty) !== b) fc.fillRect(x, y, 1, TILE);
          if (buildingAt(tx + 1, ty) !== b) fc.fillRect(x + TILE - 1, y, 1, TILE);
          if (h % 17 === 0 && b !== EDGE_BLD) put(h % 2 ? "city_ac" : "city_vent", x + 2, y + 3);
        }
        continue;
      }
      if (t === T_WALK) { // curbs
        fc.fillStyle = "rgba(30,28,34,0.8)";
        if (tileType(tx + 1, ty) === T_ROAD) fc.fillRect(x + 15, y, 1, TILE);
        if (tileType(tx - 1, ty) === T_ROAD) fc.fillRect(x, y, 1, TILE);
        if (tileType(tx, ty + 1) === T_ROAD) fc.fillRect(x, y + 15, TILE, 1);
        if (tileType(tx, ty - 1) === T_ROAD) fc.fillRect(x, y, TILE, 1);
      }
      if (tileType(tx, ty - 1) === T_BLD) { fc.fillStyle = "rgba(0,0,0,0.35)"; fc.fillRect(x, y, TILE, 3); } // facade shadow
      if (walkAt(tx, ty)) { // decals
        const r = (h >>> 8) % 1000;
        if (r < 15) put("city_blood", x, y);
        else if (r < 20) put(r < 18 ? "skull" : "bone_pile", x + 2, y + 6);
        else if (r < 35 && t !== T_ROAD) put("city_trash", x, y + 5);
      }
    }
  }
  // manholes and the King's blood can straddle a chunk edge: draw from every nearby cell
  for (const c of cellsIn(tx0 * TILE - TILE, ty0 * TILE - TILE, (tx0 + CHUNK + 1) * TILE, (ty0 + CHUNK + 1) * TILE)) {
    for (const m of c.manholes) put("city_manhole", m.x - tx0 * TILE, m.y - ty0 * TILE);
    if (c.king) {
      fc.fillStyle = "rgba(110,20,26,0.75)";
      fc.beginPath(); fc.ellipse(c.king.x - tx0 * TILE, c.king.y - ty0 * TILE + 3, 9, 3, 0, 0, Math.PI * 2); fc.fill();
    }
  }
  // the blood, scorch and bodies this chunk has seen
  const dec = chunkDecals.get(kx * 65536 + ky);
  if (dec) for (const rec of dec.list) paintDecal(fc, rec, tx0 * TILE, ty0 * TILE);
  return cv;
}

function drawFloor(cx, cy) {
  const S = CHUNK * TILE;
  for (let ky = Math.floor(cy / S); ky <= Math.floor((cy + VH) / S); ky++) {
    for (let kx = Math.floor(cx / S); kx <= Math.floor((cx + VW) / S); kx++) {
      if (kx < 0 || ky < 0 || kx * CHUNK >= MAP_W || ky * CHUNK >= MAP_H) continue;
      ctx.drawImage(getChunk(kx, ky), kx * S, ky * S);
    }
  }
}

// push a circle out of one rect (result in PO_X/PO_Y, no allocation); a
// center buried inside exits by the nearest side
let PO_X = 0, PO_Y = 0;
function pushOut(x, y, r, sx, sy, sw, sh) {
  PO_X = x; PO_Y = y;
  const cx = clamp(x, sx, sx + sw), cy = clamp(y, sy, sy + sh);
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return;
  if (d2 === 0) {
    const l = x - sx, rr = sx + sw - x, t = y - sy, b = sy + sh - y, m = Math.min(l, rr, t, b);
    if (m === l) PO_X = sx - r; else if (m === rr) PO_X = sx + sw + r; else if (m === t) PO_Y = sy - r; else PO_Y = sy + sh + r;
    return;
  }
  const d = Math.sqrt(d2);
  PO_X = cx + (dx / d) * r; PO_Y = cy + (dy / d) * r;
}

const COLL = { x: 0, y: 0 }; // reused result: read it before the next call
function collideSolids(x, y, r) {
  for (let ty = Math.floor((y - r) / TILE); ty <= Math.floor((y + r) / TILE); ty++) {
    for (let tx = Math.floor((x - r) / TILE); tx <= Math.floor((x + r) / TILE); tx++) {
      if (tileType(tx, ty) === T_BLD) { pushOut(x, y, r, tx * TILE, ty * TILE, TILE, TILE); x = PO_X; y = PO_Y; }
      const rs = rectsAt(tx, ty);
      for (let i = 0; i < rs.length; i++) {
        const s = rs[i];
        if (s.dead) continue;
        pushOut(x, y, r, s.x, s.y, s.w, s.h); x = PO_X; y = PO_Y;
      }
    }
  }
  COLL.x = x; COLL.y = y;
  return COLL;
}

const inRock = (x, y) => solidAt(x, y) !== 0;

// flow field: BFS tile distances from the player inside a window around
// them, refreshed a few times a second; zombies walk downhill on it, so they
// round corners and buildings. Outside the window they walk straight.
const FLOW_N = 80;
const flowDist = new Int32Array(FLOW_N * FLOW_N), flowQ = new Int32Array(FLOW_N * FLOW_N), flowWalk = new Uint8Array(FLOW_N * FLOW_N);
let flowT = 0, flowX0 = 0, flowY0 = 0;
function updateFlow() {
  const N = FLOW_N;
  const ptx = Math.floor(player.x / TILE), pty = Math.floor(player.y / TILE);
  flowX0 = ptx - N / 2; flowY0 = pty - N / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) flowWalk[y * N + x] = walkAt(flowX0 + x, flowY0 + y);
  flowDist.fill(-1);
  const s = (pty - flowY0) * N + (ptx - flowX0);
  let head = 0, tail = 0;
  flowDist[s] = 0; flowQ[tail++] = s;
  while (head < tail) {
    const i = flowQ[head++], x = i % N, d = flowDist[i] + 1;
    if (x > 0 && flowWalk[i - 1] && flowDist[i - 1] < 0) { flowDist[i - 1] = d; flowQ[tail++] = i - 1; }
    if (x < N - 1 && flowWalk[i + 1] && flowDist[i + 1] < 0) { flowDist[i + 1] = d; flowQ[tail++] = i + 1; }
    if (i >= N && flowWalk[i - N] && flowDist[i - N] < 0) { flowDist[i - N] = d; flowQ[tail++] = i - N; }
    if (i + N < N * N && flowWalk[i + N] && flowDist[i + N] < 0) { flowDist[i + N] = d; flowQ[tail++] = i + N; }
  }
}
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function flowDir(e) {
  const N = FLOW_N;
  const x = Math.floor(e.x / TILE) - flowX0, y = Math.floor(e.y / TILE) - flowY0;
  if (x < 0 || y < 0 || x >= N || y >= N) return null;
  const i = y * N + x, d0 = flowDist[i];
  if (d0 === 0 || d0 === 1) return null; // close enough to charge straight in
  let bestJ = -1, bd = d0 < 0 ? 1e9 : d0;
  for (const [dx, dy] of DIRS8) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
    const j = ny * N + nx;
    if (flowDist[j] < 0 || flowDist[j] >= bd) continue;
    if (dx && dy && (!flowWalk[i + dx] || !flowWalk[i + dy * N])) continue; // no corner cutting
    bd = flowDist[j]; bestJ = j;
  }
  if (bestJ < 0) return null;
  return { x: (flowX0 + bestJ % N) * TILE + 8 - e.x, y: (flowY0 + Math.floor(bestJ / N)) * TILE + 8 - e.y };
}

// ------------------------------------------------------------------ state --
const G = {
  state: "title", // title | play | campfire | gameover | victory
  t: 0, wave: 0, kills: 0, coins: 0, groanT: 0,
  score: 0, scoreShown: 0, combo: 0, comboT: 0, mult: 1, bestCombo: 0,
  trauma: 0, hitStop: 0, slowMo: 0, wasted: 0, kickX: 0, kickY: 0, camX: 0, camY: 0,
  pager: { cur: "", t: 0 },
  endless: false,
  cls: "marine", weapon: "rifle",
  cam: { x: 0, y: 0 },
};

let player, spawnQueue, spawnTimer; // everything else that moves lives in the ECS
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
    vx: 0, vy: 0, hpLag: stats.maxHp, dashBuf: 0, ghostT: 0,
    runList: ANIM[CLASSES[G.cls].anim + "_run"], idleList: ANIM[CLASSES[G.cls].anim + "_idle"],
  };
  player.ammo = clipSize();
  flowT = 0;
  fxState.rain = Math.random() < 0.65 ? 1 : 0; // most nights it rains
  fxState.nextBolt = rnd(12, 30); shocks.length = 0;
  eReset(); banners.length = 0; activeProps.length = 0;
  spawnQueue = []; spawnTimer = 0;
  G.wave = 0; G.kills = 0; G.coins = 0; G.t = 0; G.endless = false; G.bankedRun = false; G.paused = false;
  G.sayQ = []; G.kingSeen = false; G.saidLowHp = false;
  G.score = G.scoreShown = 0; G.combo = 0; G.comboT = 0; G.mult = 1; G.bestCombo = 0;
  G.trauma = 0; G.hitStop = 0; G.slowMo = 0; G.wasted = 0; G.kickX = G.kickY = 0;
  G.camX = player.x - VW / 2; G.camY = player.y - VH / 2;
  G.pager.cur = ""; G.pager.t = 0;
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
  if (bossWave) banner(BOSS_NAMES[bossFor(w)], "IS COMING FOR YOU", "#ff4d4d", 2.6, true);
  else banner("WAVE " + w, w === 1 ? "FIND THE KING" : "SURVIVE", "#ffd166", 2.2, true);
  if (bossWave) { SFX.bossRoar(); say(bossLine(bossFor(w)), 1.4); }
  if (w >= 10 && !UN.ghost) {
    UN.ghost = true; saveUnlocks();
    banner("GHOST UNLOCKED", "a new hero joins the fight", "#b48cff", 3);
    SFX.level();
  }
}

function spawnPointFor() {
  // the dead pour out of manholes and doorways just beyond the edge of sight
  const spots = [];
  for (const c of cellsIn(player.x - 380, player.y - 380, player.x + 380, player.y + 380, scratchCells)) for (const sp of c.spawns) spots.push(sp);
  const near = spots.filter(s => { const d = dist(s, player); return d > 170 && d < 380; });
  const pool = near.length ? near : spots.filter(s => dist(s, player) > 120);
  if (pool.length) {
    const s = pick(pool);
    return { x: s.x + rnd(-4, 4), y: s.y + rnd(-3, 3) };
  }
  for (let i = 0; i < 60; i++) { // fallback: any open tile at a fair distance
    const a = rnd(0, Math.PI * 2), r = rnd(200, 340);
    const x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r;
    if (walkAt(Math.floor(x / TILE), Math.floor(y / TILE))) return { x, y };
  }
  return { x: player.x + 200, y: player.y };
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

// -------------------------------------------------------------------- ECS --
// Every dynamic game object is an entity: an id from a free list plus a
// bitmask of components. Numeric, high-volume data (particles, bullets,
// pickups) lives in typed arrays indexed by id; zombies and texts use one
// pooled object per id slot (stable shape, reused). Each component keeps a
// sparse set, so systems walk dense id lists. Kills are deferred to eFlush()
// at the end of the frame and ids are recycled: nothing is allocated in the
// loop once the pools are warm. docs/PERFORMANCE.md §3.
const E_MAX = 12288;
const M_DEAD = 1 << 30;
const C_PART = 0, C_BULLET = 1, C_PICKUP = 2, C_ZOMBIE = 3, C_BOLT = 4, C_GRENADE = 5, C_FIRE = 6, C_RING = 7, C_TEXT = 8;
class SparseSet {
  constructor() { this.dense = new Int32Array(E_MAX); this.at = new Int32Array(E_MAX).fill(-1); this.n = 0; }
  add(e) { this.at[e] = this.n; this.dense[this.n++] = e; }
  remove(e) {
    const i = this.at[e];
    if (i < 0) return;
    const last = this.dense[--this.n];
    this.dense[i] = last; this.at[last] = i; this.at[e] = -1;
  }
  clear() { for (let i = 0; i < this.n; i++) this.at[this.dense[i]] = -1; this.n = 0; }
}
const SETS = [];
for (let i = 0; i <= C_TEXT; i++) SETS.push(new SparseSet());
const PARTS = SETS[C_PART], BULLETS = SETS[C_BULLET], PICKUPS = SETS[C_PICKUP], ZOMBIES = SETS[C_ZOMBIE];
const BOLTS = SETS[C_BOLT], GRENADES = SETS[C_GRENADE], FIRES = SETS[C_FIRE], RINGS = SETS[C_RING], TEXTS = SETS[C_TEXT];
const eMask = new Uint32Array(E_MAX), eFree = new Int32Array(E_MAX), eDeadQ = new Int32Array(E_MAX);
let eFreeTop = 0, eDeadN = 0;
function eReset() {
  for (const s of SETS) s.clear();
  eMask.fill(0); eDeadN = 0; eFreeTop = 0;
  for (let i = E_MAX - 1; i >= 0; i--) eFree[eFreeTop++] = i;
}
// -1 when the pool is exhausted: callers simply skip the effect
function eCreate(comp) {
  if (eFreeTop === 0) return -1;
  const e = eFree[--eFreeTop];
  eMask[e] = 1 << comp; SETS[comp].add(e);
  return e;
}
function eKill(e) {
  if (eMask[e] & M_DEAD) return;
  eMask[e] |= M_DEAD; eDeadQ[eDeadN++] = e;
}
const eAlive = e => eMask[e] !== 0 && !(eMask[e] & M_DEAD);
function eFlush() {
  for (let i = 0; i < eDeadN; i++) {
    const e = eDeadQ[i], m = eMask[e];
    for (let c = 0; c < SETS.length; c++) if (m & (1 << c)) SETS[c].remove(e);
    eMask[e] = 0; REF[e] = null; eFree[eFreeTop++] = e;
  }
  eDeadN = 0;
}
// component data, indexed by entity id
const PX = new Float32Array(E_MAX), PY = new Float32Array(E_MAX), PZ = new Float32Array(E_MAX);
const VX = new Float32Array(E_MAX), VY = new Float32Array(E_MAX), VZ = new Float32Array(E_MAX);
const LIFE = new Float32Array(E_MAX), MAXL = new Float32Array(E_MAX), ROT = new Float32Array(E_MAX), VROT = new Float32Array(E_MAX);
const SIZE = new Float32Array(E_MAX), OX = new Float32Array(E_MAX), OY = new Float32Array(E_MAX), VAL = new Float32Array(E_MAX);
const KIND = new Uint8Array(E_MAX), COL = new Uint8Array(E_MAX), FLAG = new Uint8Array(E_MAX);
const AUX = new Float32Array(E_MAX * 4); // per-kind extras (grenade start/target, ...)
const REF = new Array(E_MAX).fill(null); // sprite name or frame list for sprite particles
const ZO = new Array(E_MAX).fill(null);  // pooled zombie objects
const TXO = new Array(E_MAX).fill(null); // pooled text objects
const HITS = new Array(E_MAX).fill(null); // pooled per-bullet "already hit" lists
eReset();

// particle kinds
const P_BLOOD = 0, P_SPARK = 1, P_SHELL = 2, P_SMOKE = 3, P_DRIP = 4, P_MUZZLE = 5, P_FLASH = 6, P_RING = 7, P_SPAWN = 8,
  P_GIB = 9, P_DEBRIS = 10, P_WATER = 11, P_FIRE = 12, P_EMBER = 13, P_CORPSE = 14, P_BODY = 15, P_DUST = 16, P_AFTER = 17, P_MIST = 18;
const PAL = ["#7a141a", "#a8201e", "#56090f", "#fce032", "#fca032", "#e6be50", "#968c96", "#c8282d", "#ffd166", "#ffffff",
  "#8fc8ff", "#d8f0ff", "#ff8a2a", "#ffe08a", "#d8441c", "#6a6470", "#b46e3c", "#4a8a3a"];
const PC_BLOOD = 0, PC_BLOOD2 = 1, PC_BLOOD3 = 2, PC_SPARK = 3, PC_SPARK2 = 4, PC_SHELL = 5, PC_SMOKE = 6, PC_DRIP = 7,
  PC_GOLD = 8, PC_WHITE = 9, PC_WATER = 10, PC_WATER2 = 11, PC_FIRE = 12, PC_FIRE2 = 13, PC_FIRE3 = 14, PC_DUST = 15, PC_WOOD = 16, PC_ACID = 17;
const F_GROUND = 1, F_BOUNCED = 2, F_DECAL = 4, F_SPRITE = 8;

// spawn a particle; z/vz give it an arc above the ground (gravity pulls vz)
function part(kind, x, y, vx, vy, life, col = 0, z = 0, vz = 0, size = 1) {
  const e = eCreate(C_PART);
  if (e < 0) return -1;
  PX[e] = x; PY[e] = y; VX[e] = vx; VY[e] = vy; PZ[e] = z; VZ[e] = vz;
  LIFE[e] = life; MAXL[e] = life; KIND[e] = kind; COL[e] = col; SIZE[e] = size; FLAG[e] = 0;
  ROT[e] = 0; VROT[e] = 0;
  return e;
}
function spritePart(kind, name, x, y, vx, vy, z, vz, life, spin) {
  const e = part(kind, x, y, vx, vy, life, 0, z, vz, 1);
  if (e < 0) return -1;
  REF[e] = name; FLAG[e] = F_SPRITE; ROT[e] = rnd(0, 6.28); VROT[e] = spin;
  return e;
}

// ---------------------------------------------------------------- decals --
// Blood, scorch, rubble stains and dead bodies are painted straight into the
// cached floor chunks, and remembered per chunk (ring buffer) so a chunk
// that gets evicted and repainted keeps its history.
const DECAL_CAP = 220;
const chunkDecals = new Map(); // chunk key -> { list: [], i: 0 }
function decalRecord(key, rec) {
  let d = chunkDecals.get(key);
  if (!d) { d = { list: [], i: 0 }; chunkDecals.set(key, d); }
  if (d.list.length < DECAL_CAP) d.list.push(rec);
  else { d.list[d.i] = rec; d.i = (d.i + 1) % DECAL_CAP; }
}
function paintDecal(g, rec, ox, oy) {
  const [type, a, x, y, rot, alpha, w, h] = rec;
  g.globalAlpha = alpha;
  if (type === 0) { // sprite (name), rotated around its centre
    const im = a.getContext ? a : IMG[a];
    if (!im || !im.width) { g.globalAlpha = 1; return; }
    if (rot) {
      g.save(); g.translate(Math.round(x - ox), Math.round(y - oy)); g.rotate(rot);
      g.drawImage(im, -Math.round(im.width / 2), -Math.round(im.height / 2)); g.restore();
    } else g.drawImage(im, Math.round(x - ox - im.width / 2), Math.round(y - oy - im.height / 2));
  } else { g.fillStyle = a; g.fillRect(Math.round(x - ox), Math.round(y - oy), w, h); }
  g.globalAlpha = 1;
}
// name: sprite name or a canvas; w/h: bounding size used to find chunks
function decalAt(type, a, x, y, rot, alpha, w, h) {
  const S = CHUNK * TILE, rec = [type, a, x, y, rot, alpha, w, h];
  const hw = type === 0 ? Math.max(w, h) / 2 + 1 : 0;
  const x0 = type === 0 ? x - hw : x, y0 = type === 0 ? y - hw : y;
  const x1 = type === 0 ? x + hw : x + w, y1 = type === 0 ? y + hw : y + h;
  for (let ky = Math.floor(y0 / S); ky <= Math.floor(y1 / S); ky++) {
    for (let kx = Math.floor(x0 / S); kx <= Math.floor(x1 / S); kx++) {
      const key = kx * 65536 + ky;
      decalRecord(key, rec);
      const ch = chunkCache.get(key);
      if (ch) paintDecal(ch.canvas.getContext("2d"), rec, kx * S, ky * S);
    }
  }
}
const decal = (name, x, y, rot = 0, alpha = 1) => {
  const im = typeof name === "string" ? IMG[name] : name;
  if (!im || !im.width) return;
  decalAt(0, name, x, y, rot, alpha, im.width, im.height);
};
const decalPx = (col, x, y, w = 1, h = 1, alpha = 1) => decalAt(1, col, x, y, 0, alpha, w, h);
const SPLATS = ["splat_0", "splat_1", "splat_2", "splat_3", "splat_4", "splat_5"];
const GIBS = ["gib_0", "gib_1", "gib_2", "gib_3", "gib_4", "gib_5", "gib_6", "gib_7", "gib_8"];

// ------------------------------------------------------------ spatial hash --
// zombies only, rebuilt each frame through typed-array linked lists
const HASH_SIZE = 4096, HCELL = 32;
const hashHead = new Int32Array(HASH_SIZE).fill(-1), hashNext = new Int32Array(E_MAX);
let queryId = 0;
const hkey = (cx, cy) => (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & (HASH_SIZE - 1);
function buildHash() {
  hashHead.fill(-1);
  for (let i = 0; i < ZOMBIES.n; i++) {
    const e = ZOMBIES.dense[i], z = ZO[e], k = hkey(Math.floor(z.x / HCELL), Math.floor(z.y / HCELL));
    hashNext[e] = hashHead[k]; hashHead[k] = e;
  }
}
// live zombies whose cell overlaps the box, each once (out is reused by the caller)
function queryEnemies(x0, y0, x1, y1, out) {
  out.length = 0;
  const q = ++queryId;
  const cx1 = Math.floor(x1 / HCELL), cy1 = Math.floor(y1 / HCELL);
  for (let cy = Math.floor(y0 / HCELL); cy <= cy1; cy++) {
    for (let cx = Math.floor(x0 / HCELL); cx <= cx1; cx++) {
      for (let e = hashHead[hkey(cx, cy)]; e !== -1; e = hashNext[e]) {
        const z = ZO[e];
        if (z && z.e === e && z.qs !== q && !z.dead) { z.qs = q; out.push(z); }
      }
    }
  }
  return out;
}
const qShots = [], qBlast = [], qNear = [];
const zombieCount = () => ZOMBIES.n;
function clearZombies() { for (let i = 0; i < ZOMBIES.n; i++) eKill(ZOMBIES.dense[i]); eFlush(); }

// -------------------------------------------------------------- zombies ----
function newZombieObject() {
  return {
    e: -1, type: "", x: 0, y: 0, kx: 0, ky: 0, r: 4, anim: "", dirAnim: "", dir: "d", scale: 1,
    runList: null, dirSet: null, dead: false, qs: 0, atkTouch: 0,
    hp: 1, maxHp: 1, spd: 1, dmg: 1, xp: 1, score: 1,
    ranged: false, rage: false, big: false, boss: false, bossBar: false, charge: false, king: false, souls: false, ghost: false, god: false,
    slamCd: 5, atkCd: 0, animT: 0, facing: 1, hitFlash: 0, warmup: 0.8,
    summonCd: 6, strafe: 0, chargeCd: 4, chargeT: 0, avoidT: 0, avoidDir: 1,
    burn: 0, hitAng: 0, lastHow: 0, env: false,
  };
}
function spawnEnemy(type, at) {
  const t = E_TYPES[type];
  const p = at && !inRock(at.x, at.y) ? at : spawnPointFor(); // summons must not land inside a building
  const e = eCreate(C_ZOMBIE);
  if (e < 0) return null;
  const z = ZO[e] || (ZO[e] = newZombieObject());
  const mult = 1 + 0.20 * (G.wave - 1);
  z.e = e; z.type = type; z.x = p.x; z.y = p.y; z.kx = 0; z.ky = 0; z.r = t.r;
  z.anim = t.anim || ""; z.dirAnim = t.dirAnim || ""; z.dir = "d"; z.scale = t.scale;
  z.runList = t.anim ? (ANIM[t.anim + "_run"] || ANIM[t.anim + "_idle"]) : null;
  z.dirSet = t.dirAnim ? ANIM_DIR[t.dirAnim] : null;
  z.dead = false; z.qs = 0; z.atkTouch = 0;
  z.hp = z.maxHp = t.hp * mult;
  z.spd = t.spd * (1 + 0.02 * (G.wave - 1)) * rnd(0.9, 1.1);
  z.dmg = t.dmg * (1 + 0.06 * (G.wave - 1));
  z.xp = t.xp; z.score = t.score;
  z.ranged = !!t.ranged; z.rage = !!t.rage; z.big = !!t.big; z.boss = !!t.boss; z.bossBar = !!t.bossBar;
  z.charge = !!t.charge; z.king = !!t.king; z.souls = !!t.souls; z.ghost = !!t.ghost; z.god = !!t.god;
  z.slamCd = 5; z.atkCd = rnd(0, 1); z.animT = rnd(0, 9); z.facing = 1; z.hitFlash = 0; z.warmup = 0.8;
  z.summonCd = 6; z.strafe = rnd(0, Math.PI * 2); z.chargeCd = 4; z.chargeT = 0; z.avoidT = 0; z.avoidDir = 1;
  z.burn = 0; z.hitAng = 0; z.lastHow = 0; z.env = false;
  part(P_SPAWN, p.x, p.y, 0, 0, 0.8);
  return z;
}

// ------------------------------------------------------------- score/combo --
// kills inside a 3s window build a combo; every 6 kills raise the score
// multiplier (max x10). One hit taken and the combo is gone: easy to play,
// hard to keep.
const FRENZY = [[10, "KILL FRENZY!"], [25, "CARNAGE!"], [50, "MASSACRE!"], [100, "ZOMBIE APOCALYPSE!"], [200, "GOD OF GUNS"]];
function addKillScore(z, how) {
  G.combo++; G.comboT = 3;
  if (G.combo > G.bestCombo) G.bestCombo = G.combo;
  const m = Math.min(10, 1 + Math.floor(G.combo / 6));
  if (m > G.mult) { G.mult = m; banner(`x${m} MULTIPLIER`, "", "#ffd166", 1.2, true); SFX.level(); }
  let pts = z.score * 10 * G.mult;
  if (z.env) { pts *= 2; popText(z.x, z.y - 22, "CARNAGE x2", "#ff8a2a", true); }
  else if (how === HOW_GIB) pts = Math.round(pts * 1.5);
  G.score += pts;
  for (const [n, s] of FRENZY) if (G.combo === n) { banner(s, `${n} KILL COMBO`, "#ff4d4d", 1.8, true); G.trauma = Math.min(1, G.trauma + 0.3); }
}
function breakCombo() {
  if (G.combo >= 6) popText(player.x, player.y - 34, "COMBO LOST", "#8fa0b8", false);
  G.combo = 0; G.mult = 1; G.comboT = 0;
}

// ----------------------------------------------------------------- texts ---
// floating damage numbers and pops, in world space, drawn on the UI layer
function popText(x, y, s, col, big = false, life = 0.8) {
  const e = eCreate(C_TEXT);
  if (e < 0) return;
  const t = TXO[e] || (TXO[e] = { s: "", col: "", big: false, vy: 0 });
  t.s = s; t.col = col; t.big = big; t.vy = big ? -10 : -26;
  PX[e] = x; PY[e] = y; LIFE[e] = life; MAXL[e] = life;
}
// big centre-screen messages (GTA style): wave starts, frenzies, WASTED
const banners = [];
function banner(s, sub, col, dur = 2, punch = false) {
  // one headline at a time: older ones fade out fast instead of stacking
  for (const b of banners) b.t = Math.max(b.t, b.dur * 0.8);
  if (banners.length > 3) banners.shift();
  banners.push({ s, sub, col, t: 0, dur, punch });
}

// --------------------------------------------------------------- combat ---
function nearestEnemy(from, maxD = 1e9) {
  let best = null, bd = maxD;
  for (let i = 0; i < ZOMBIES.n; i++) {
    const z = ZO[ZOMBIES.dense[i]];
    if (z.warmup > 0 || z.dead) continue;
    const d = dist(from, z);
    if (d < bd) { bd = d; best = z; }
  }
  return best;
}

const HOW_SHOT = 0, HOW_GIB = 1, HOW_FIRE = 2, HOW_FLUNG = 3;
// knock: impulse in px/s along ang; how: what a killing blow does to the body
function damageEnemy(z, dmg, crit, ang = 0, knock = 0, how = HOW_SHOT) {
  if (z.dead) return;
  if (z.big && player.stats.giant) dmg *= 1 + player.stats.giant;
  z.hp -= dmg;
  z.hitFlash = 0.08;
  z.hitAng = ang; z.lastHow = how;
  if (knock && !z.bossBar) { z.kx += Math.cos(ang) * knock; z.ky += Math.sin(ang) * knock; }
  popText(z.x + rnd(-4, 4), z.y - 14 * z.scale, String(big(dmg)), crit ? "#ffd166" : "#ffffff", crit, 0.6);
  // a spray of blood along the shot
  for (let i = 0; i < (crit ? 5 : 2); i++) {
    const a = ang + rnd(-0.5, 0.5), sp = rnd(40, 110);
    part(P_BLOOD, z.x, z.y - 6, Math.cos(a) * sp, Math.sin(a) * sp, 1.2, PC_BLOOD + irnd(0, 2), 6, rnd(10, 50));
  }
  if (player.stats.lifesteal > 0) player.hp = Math.min(player.stats.maxHp, player.hp + dmg * player.stats.lifesteal);
  if (z.hp <= 0) {
    const overkill = -z.hp / z.maxHp;
    killEnemy(z, how === HOW_SHOT && (overkill > 0.6 || (crit && overkill > 0.3)) ? HOW_GIB : how);
  } else SFX.hit();
}

// how a zombie dies is the show: splatter, gibs, a flung body, or a torch
function killEnemy(z, how) {
  if (z.dead) return;
  z.dead = true;
  eKill(z.e);
  G.kills++;
  if (Math.random() < 0.4) sampleAt("zdie_" + irnd(0, 3), z.x, z.y, 0.35, rnd(0.85, 1.2));
  else SFX.die();
  const big2 = z.big ? 2 : 1;
  const frame = z.dirSet ? z.dirSet.run.d[0] : z.runList[0];
  if (z.big || z.boss) how = HOW_GIB;
  // blood: always a lot
  for (let i = 0; i < 14 * big2; i++) {
    const a = z.hitAng + rnd(-1.1, 1.1), sp = rnd(30, 150) * big2;
    part(P_BLOOD, z.x + rnd(-3, 3), z.y - 6, Math.cos(a) * sp, Math.sin(a) * sp, 1.5, PC_BLOOD + irnd(0, 2), rnd(4, 12), rnd(20, 90));
  }
  decal(pick(SPLATS), z.x + rnd(-4, 4), z.y + rnd(-2, 3), rnd(0, 6.28), 0.9);
  if (how === HOW_GIB) {
    for (let i = 0; i < 10 * big2; i++) {
      const a = z.hitAng + rnd(-1.6, 1.6), sp = rnd(40, 170) * (z.big ? 1.3 : 1);
      spritePart(P_GIB, pick(GIBS), z.x, z.y - 4, Math.cos(a) * sp, Math.sin(a) * sp, rnd(4, 14), rnd(60, 160), rnd(5, 9), rnd(-14, 14));
    }
    for (let i = 0; i < 8 * big2; i++) part(P_MIST, z.x + rnd(-6, 6), z.y - rnd(4, 14), rnd(-20, 20), rnd(-25, 5), rnd(0.4, 0.8), PC_BLOOD2, 0, 0, rnd(2, 4));
    for (let i = 0; i < 2 * big2; i++) decal(pick(SPLATS), z.x + rnd(-14, 14) * big2, z.y + rnd(-8, 8) * big2, rnd(0, 6.28), 0.85);
    decal("streak_" + irnd(0, 2), z.x + Math.cos(z.hitAng) * 14, z.y + Math.sin(z.hitAng) * 8, z.hitAng, 0.8);
    G.trauma = Math.min(1, G.trauma + (z.big ? 0.35 : 0.12));
    G.hitStop = Math.max(G.hitStop, z.boss ? 0.25 : z.big ? 0.06 : 0.025);
    sampleAt("boom", z.x, z.y, 0.12, rnd(1.8, 2.2)); // wet pop
  } else if (how === HOW_FIRE) { // a charred husk and a last gasp of flame
    decal(tinted(frame, false, "char"), z.x, z.y - 4, rnd(-0.4, 0.4), 0.9);
    for (let i = 0; i < 10; i++) part(P_FIRE, z.x + rnd(-4, 4), z.y - rnd(2, 12), rnd(-12, 12), rnd(-40, -15), rnd(0.3, 0.7), PC_FIRE, 0, 0, rnd(2, 4));
  } else { // the body is flung along the shot and lands in a smear
    const sp = how === HOW_FLUNG ? rnd(160, 240) : rnd(50, 90);
    const e = spritePart(P_BODY, frame, z.x, z.y, Math.cos(z.hitAng) * sp + z.kx * 0.3, Math.sin(z.hitAng) * sp + z.ky * 0.3, 4,
      how === HOW_FLUNG ? rnd(90, 150) : rnd(30, 60), 3, how === HOW_FLUNG ? rnd(-12, 12) : rnd(-4, 4));
    if (e >= 0) SIZE[e] = z.scale;
    if (Math.random() < 0.5) spritePart(P_GIB, pick(GIBS), z.x, z.y - 4, rnd(-60, 60), rnd(-60, 60), 6, rnd(60, 120), 6, rnd(-10, 10));
  }
  addKillScore(z, how);
  // loot
  const gemCount = z.big ? 5 : 1;
  for (let i = 0; i < gemCount; i++) pickup(PK_GEM, z.x + rnd(-8, 8), z.y + rnd(-6, 6), z.xp / gemCount);
  const coinCount = z.ghost ? 0 : (z.big ? 3 : (Math.random() < 0.3 * (1 + player.stats.goldDig) ? 1 : 0));
  for (let i = 0; i < coinCount; i++) pickup(PK_COIN, z.x + rnd(-6, 6), z.y + rnd(-4, 4), 1);
  if (Math.random() < (z.big ? 0.8 : 0.04)) pickup(PK_FLASK, z.x, z.y, 0);
  if (z.big && Math.random() < 0.001) { // 0.1% relic drop from bosses
    const locked = ["demo", "heavy"].filter(c => !UN[c]);
    if (locked.length) {
      const c = pick(locked);
      UN[c] = true; saveUnlocks();
      banner("RELIC FOUND", `${CLASSES[c].name.toUpperCase()} UNLOCKED`, "#b48cff", 3);
      SFX.level();
    }
  }
  if (z.boss) {
    G.trauma = 1; G.slowMo = 1.2;
    explode(z.x, z.y - 8, 60, 0, false, EX_FX);
    if (!G.endless) { G.state = "victory"; SFX.waveClear(); }
  }
}

// ---------------------------------------------------------------- pickups --
const PK_GEM = 0, PK_COIN = 1, PK_FLASK = 2;
function pickup(kind, x, y, v) {
  const e = eCreate(C_PICKUP);
  if (e < 0) return;
  KIND[e] = kind; PX[e] = x; PY[e] = y; VAL[e] = v; LIFE[e] = rnd(0, 9);
  VX[e] = rnd(-30, 30); VY[e] = rnd(-60, -20);
}

// ------------------------------------------------------------------- guns --
const clipSize = () => Math.max(1, Math.round(WEAPONS[G.weapon].clip * player.stats.clipMul));
const handPos = () => ({ x: player.x + player.facing * 2, y: player.y - 8 });
const aiming = () => G.t - player.lastShot < 0.8;
// mouse aim: hold the button to shoot where you point (barrels! cars!)
const mouse = { x: 0, y: 0, down: false, seen: false };

function fireGun() {
  const st = player.stats, w = WEAPONS[G.weapon];
  let tx, ty;
  if (mouse.down) {
    tx = mouse.x + G.cam.x; ty = mouse.y + G.cam.y + 4;
    const near = nearestEnemy({ x: tx, y: ty }, 18); // gentle snap onto a zombie under the cursor
    if (near) { tx = near.x; ty = near.y; }
  } else {
    const target = nearestEnemy(player, st.range);
    if (!target) return;
    tx = target.x; ty = target.y;
  }
  player.atkCd = 1 / st.atkSpd;
  const hand = handPos();
  const ang = Math.atan2(ty - 4 - hand.y, tx - hand.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  player.atkAng = ang;
  player.lastShot = G.t;
  player.recoil = w.kick || 1.5;
  player.akimboSide = -player.akimboSide;
  G.kickX -= Math.cos(ang) * (w.kick || 1) * 0.6; G.kickY -= Math.sin(ang) * (w.kick || 1) * 0.6;
  // muzzle sits a gun-length out from the (re-faced) hand
  const h2 = handPos(), len = IMG[w.sprite].width - 3;
  const mzx = h2.x + Math.cos(ang) * len, mzy = h2.y + Math.sin(ang) * len + (w.akimbo ? player.akimboSide : 0);
  if (w.kind === "grenade") {
    const d = Math.min(Math.hypot(tx - player.x, ty - player.y), st.range);
    const e = eCreate(C_GRENADE);
    if (e >= 0) {
      const gx = player.x + Math.cos(ang) * d, gy = player.y + Math.sin(ang) * d;
      AUX[e * 4] = mzx; AUX[e * 4 + 1] = mzy; AUX[e * 4 + 2] = gx; AUX[e * 4 + 3] = gy;
      PX[e] = mzx; PY[e] = mzy; LIFE[e] = 0; MAXL[e] = clamp(d / 170, 0.35, 0.9); ROT[e] = 0;
      VAL[e] = w.blast * st.blast; FLAG[e] = (w.fire ? 1 : 0) | (Math.random() < st.crit ? 2 : 0);
    }
  } else {
    for (let i = 0; i < (w.pellets || 1); i++) {
      const e = eCreate(C_BULLET);
      if (e < 0) break;
      const a = ang + rnd(-w.spread, w.spread);
      const spd = w.speed * (w.kind === "flame" ? rnd(0.75, 1.1) : 1);
      const life = st.range / w.speed * (w.kind === "flame" ? 1.6 : 1.15);
      // OX/OY: last hit-test point; starts at the hand so point-blank zombies get hit
      PX[e] = mzx; PY[e] = mzy; OX[e] = h2.x; OY[e] = h2.y; VX[e] = Math.cos(a) * spd; VY[e] = Math.sin(a) * spd; ROT[e] = a;
      LIFE[e] = life; MAXL[e] = life; KIND[e] = w.kind === "flame" ? 2 : w.kind === "rocket" ? 1 : 0;
      FLAG[e] = Math.random() < st.crit ? 1 : 0; VAL[e] = w.pierce || 0; SIZE[e] = (w.blast || 0) * st.blast;
      const hits = HITS[e] || (HITS[e] = []);
      hits.length = 0;
    }
  }
  if (w.kind !== "flame") {
    const m = part(P_MUZZLE, mzx, mzy, 0, 0, 0.06);
    if (m >= 0) ROT[m] = ang;
    if (w.kind === "bullet") part(P_SHELL, h2.x, h2.y, -player.facing * rnd(20, 50), rnd(-12, 12), 2.5, PC_SHELL, 4, rnd(40, 70));
  }
  gunSfx(w.snd);
  player.ammo--;
  if (player.ammo <= 0) {
    player.reloadT = w.reload * st.reloadMul;
    popText(player.x, player.y - 28, "RELOAD", "#ffd166");
    sample("clip", 0.5);
  }
}

// blasts: who made it decides who gets hurt. The player's own rockets spare
// the player; exploding cars and barrels do not.
const EX_PLAYER = 0, EX_ENV = 1, EX_FX = 2;
function explode(x, y, r, dmg, crit, src = EX_PLAYER) {
  SFX.boom();
  G.trauma = Math.min(1, G.trauma + r / 70);
  if (r > 36) G.hitStop = Math.max(G.hitStop, 0.05);
  if (dmg > 0) {
    const hits = queryEnemies(x - r - 16, y - r - 16, x + r + 16, y + r + 16, qBlast);
    for (let i = 0; i < hits.length; i++) {
      const z = hits[i];
      if (z.warmup > 0 || z.dead) continue;
      const d = Math.hypot(z.x - x, z.y - y);
      if (d >= r + z.r) continue;
      const fall = 1 - 0.5 * clamp(d / r, 0, 1);
      if (src === EX_ENV) z.env = true;
      damageEnemy(z, dmg * fall * (crit ? 2 : 1) * rnd(0.9, 1.1), crit, Math.atan2(z.y - y, z.x - x), 260 * fall * player.stats.knock, d < r * 0.55 ? HOW_GIB : HOW_FLUNG);
    }
    if (src === EX_ENV && dist(player, { x, y }) < r + player.r) hurtPlayer(dmg * 0.35);
    blastWorld(x, y, r, dmg, src);
  }
  // the show: fireball, smoke, sparks, debris, scorch, shockwave, light
  part(P_RING, x, y, 0, 0, 0.32, 0, 0, 0, r);
  part(P_FLASH, x, y, 0, 0, 0.22, 0, 0, 0, r);
  for (let i = 0; i < 16 + r / 3; i++) {
    const a = rnd(0, 6.28), sp = rnd(10, r * 2.2);
    part(P_FIRE, x + rnd(-4, 4), y + rnd(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp * 0.7 - 20, rnd(0.25, 0.6), PC_FIRE, 0, 0, rnd(3, 6));
  }
  for (let i = 0; i < 8 + r / 6; i++) part(P_SMOKE, x + rnd(-r / 3, r / 3), y + rnd(-r / 4, r / 4), rnd(-15, 15), rnd(-30, -8), rnd(0.8, 1.6), PC_SMOKE, 0, 0, rnd(3, 6));
  for (let i = 0; i < 18; i++) {
    const a = rnd(0, 6.28), sp = rnd(60, 220);
    part(P_SPARK, x, y - 2, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.2, 0.6), PC_SPARK, 4, rnd(30, 120));
  }
  for (let i = 0; i < 4; i++) part(P_EMBER, x + rnd(-8, 8), y, rnd(-30, 30), rnd(-50, -20), rnd(1, 2), PC_FIRE2, 0, 0, 1);
  if (dmg > 0) decal("scorch_" + irnd(0, 1), x, y, 0, 0.75);
  fxShock(x, y, 2 + r / 12);
  fxState.chroma = Math.min(1, fxState.chroma + 0.45);
}

// distance from point p to segment a->b: fast bullets travel 10-30px per
// frame, so hits are tested along the whole step, not just its end
function segDist(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}

// ----------------------------------------------------------- systems -------
function sysBullets(dt) {
  const st = player.stats;
  for (let i = BULLETS.n - 1; i >= 0; i--) {
    const e = BULLETS.dense[i];
    if (!eAlive(e)) continue;
    const ox = OX[e], oy = OY[e], kind = KIND[e];
    PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; LIFE[e] -= dt;
    OX[e] = PX[e]; OY[e] = PY[e];
    if (kind === 2) { VX[e] *= 1 - 2.4 * dt; VY[e] *= 1 - 2.4 * dt; }
    if (kind === 1 && Math.random() < dt * 40) part(P_SMOKE, PX[e], PY[e], rnd(-5, 5), rnd(-8, 0), 0.5, PC_SMOKE, 0, 0, 2);
    let dead = LIFE[e] <= 0;
    // the world: buildings stop rounds, props soak them up (and break)
    if (!dead) {
      const hit = solidAt(PX[e], PY[e] + 8);
      if (hit === 1) dead = kind !== 2 || Math.random() < 0.3;
      else if (hit) {
        damageProp(hit.p, st.dmg * (kind === 2 ? 0.4 : 1) * (FLAG[e] ? 2 : 1), ROT[e]);
        if (kind !== 2) dead = true;
        if (kind === 0) for (let k = 0; k < 3; k++) part(P_SPARK, PX[e], PY[e], rnd(-60, 60), rnd(-60, 60), 0.2, PC_SPARK, 2, rnd(10, 40));
      }
    }
    if (!dead) {
      const near = queryEnemies(Math.min(ox, PX[e]) - 18, Math.min(oy, PY[e]) - 18, Math.max(ox, PX[e]) + 18, Math.max(oy, PY[e]) + 18, qShots);
      const hits = HITS[e];
      for (let k = 0; k < near.length && !dead; k++) {
        const z = near[k];
        if (z.warmup > 0 || z.dead || hits.includes(z)) continue;
        if (segDist(ox, oy, PX[e], PY[e], z.x, z.y - 4) >= z.r + (kind === 2 ? 6 : 3)) continue;
        if (kind === 1) { dead = true; break; }
        if (kind === 2) z.burn = Math.max(z.burn, 1.2);
        damageEnemy(z, st.dmg * (FLAG[e] ? 2 : 1) * rnd(0.9, 1.1), FLAG[e] === 1, ROT[e], (kind === 2 ? 15 : 90) * st.knock, kind === 2 ? HOW_FIRE : HOW_SHOT);
        hits.push(z);
        if (VAL[e]-- <= 0) dead = true;
      }
    }
    if (dead) {
      if (kind === 1) explode(PX[e], PY[e], SIZE[e], st.dmg, FLAG[e] === 1);
      eKill(e);
    }
  }
  for (let i = GRENADES.n - 1; i >= 0; i--) {
    const e = GRENADES.dense[i];
    if (!eAlive(e)) continue;
    LIFE[e] += dt; ROT[e] += dt * 9;
    const p = LIFE[e] / MAXL[e], k = e * 4;
    if (p >= 1) {
      explode(AUX[k + 2], AUX[k + 3], VAL[e], st.dmg, (FLAG[e] & 2) !== 0);
      if (FLAG[e] & 1) spawnFire(AUX[k + 2], AUX[k + 3], 2.4);
      eKill(e);
      continue;
    }
    PX[e] = AUX[k] + (AUX[k + 2] - AUX[k]) * p;
    PY[e] = AUX[k + 1] + (AUX[k + 3] - AUX[k + 1]) * p - Math.sin(Math.PI * p) * 26;
  }
}

function spawnFire(x, y, life) {
  const e = eCreate(C_FIRE);
  if (e < 0) return;
  PX[e] = x; PY[e] = y; LIFE[e] = life; MAXL[e] = life; VAL[e] = 0; ROT[e] = Math.random() * 9;
}
function sysFire(dt) {
  const st = player.stats;
  for (let i = FIRES.n - 1; i >= 0; i--) {
    const e = FIRES.dense[i];
    LIFE[e] -= dt; VAL[e] -= dt;
    if (LIFE[e] <= 0) { decal("scorch_" + irnd(0, 1), PX[e], PY[e], 0, 0.5); eKill(e); continue; }
    if (Math.random() < dt * 12) part(P_FIRE, PX[e] + rnd(-14, 14), PY[e] + rnd(-8, 8), rnd(-6, 6), rnd(-35, -15), rnd(0.3, 0.6), PC_FIRE, 0, 0, rnd(2, 4));
    if (VAL[e] <= 0) {
      VAL[e] = 0.45;
      const near = queryEnemies(PX[e] - 40, PY[e] - 40, PX[e] + 40, PY[e] + 40, qBlast);
      for (let k = 0; k < near.length; k++) {
        const z = near[k];
        if (z.warmup > 0 || z.dead) continue;
        if (Math.hypot(z.x - PX[e], z.y - PY[e]) < 24 + z.r) { z.burn = 1.5; damageEnemy(z, st.dmg * 0.3 * rnd(0.85, 1.15), false, 0, 0, HOW_FIRE); }
      }
    }
  }
}

function sysZombies(dt) {
  for (let i = 0; i < ZOMBIES.n; i++) {
    const z = ZO[ZOMBIES.dense[i]];
    if (z.dead) continue;
    z.animT += dt;
    z.hitFlash = Math.max(0, z.hitFlash - dt);
    if (z.warmup > 0) { z.warmup -= dt; continue; }
    if (dist(z, player) > 720) { // left far behind in a huge city: climb out of a nearer manhole
      const sp0 = spawnPointFor();
      z.x = sp0.x; z.y = sp0.y; z.kx = z.ky = 0;
      z.warmup = 0.8; z.avoidT = 0;
      part(P_SPAWN, z.x, z.y, 0, 0, 0.8);
      continue;
    }
    if (z.burn > 0) { // on fire: keeps burning, panics a little
      z.burn -= dt;
      if (Math.random() < dt * 20) part(P_FIRE, z.x + rnd(-3, 3), z.y - rnd(4, 14), rnd(-8, 8), rnd(-40, -20), rnd(0.2, 0.4), PC_FIRE, 0, 0, rnd(2, 3));
      if (Math.random() < dt * 3) damageEnemy(z, player.stats.dmg * 0.25, false, z.hitAng, 0, HOW_FIRE);
      if (z.dead) continue;
    }
    const dToP = dist(z, player);
    let sp = z.spd;
    if (z.rage && z.hp < z.maxHp * 0.5) sp *= 1.7;
    if (z.burn > 0) sp *= 1.25;
    if (z.charge) { // butcher: telegraphed bull-rush
      z.chargeCd -= dt;
      if (z.chargeCd <= 0 && dToP > 40) {
        z.chargeCd = 5; z.chargeT = 1.0;
        popText(z.x, z.y - 42, "!", "#ff6b6b", true);
        SFX.bossRoar();
      }
      if (z.chargeT > 0) { z.chargeT -= dt; sp *= 3.1; }
    }
    let tx = player.x - z.x, ty = player.y - z.y;
    if (z.ranged) {
      // spitters hover at range and lob acid
      z.strafe += dt * 0.7;
      const want = 110;
      if (dToP < want - 15) { tx = -tx; ty = -ty; }
      else if (dToP < want + 25) { tx = Math.cos(z.strafe) * 40; ty = Math.sin(z.strafe) * 40; }
      z.atkCd -= dt;
      if (z.atkCd <= 0 && dToP < (z.king ? 230 : 190)) {
        z.atkCd = z.king ? 3.6 : rnd(2.2, 3.2);
        const a = Math.atan2(player.y - z.y, player.x - z.x);
        const n = z.king ? 5 : 1; // the bile king spits a fan
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * 0.26, e = eCreate(C_BOLT);
          if (e < 0) break;
          PX[e] = z.x; PY[e] = z.y - 8; VX[e] = Math.cos(a + off) * 95; VY[e] = Math.sin(a + off) * 95; LIFE[e] = 0; VAL[e] = z.dmg;
        }
        sampleAt("spit", z.x, z.y, 0.4, rnd(0.9, 1.15));
      }
    }
    if (z.boss) {
      z.summonCd -= dt;
      if (z.summonCd <= 0) {
        z.summonCd = 7;
        popText(z.x, z.y - 40, "BRAAAINS!", "#ff6b6b", true, 1.2);
        SFX.bossRoar();
        for (let k = 0; k < 3; k++) spawnEnemy("crawler", { x: z.x + rnd(-34, 34), y: z.y + rnd(-26, 26) });
      }
    }
    if (z.god) { // morgrax: ground slams + ferals, enrages when wounded
      const enragedGod = z.hp < z.maxHp * 0.4;
      if (enragedGod) sp *= 1.6;
      z.slamCd -= dt;
      if (z.slamCd <= 0 && dToP < 200) {
        z.slamCd = enragedGod ? 3.2 : 5;
        popText(z.x, z.y - 52, "!", "#ff6b6b", true, 0.7);
        G.trauma = Math.min(1, G.trauma + 0.5);
        SFX.boom();
        const e = eCreate(C_RING);
        if (e >= 0) { PX[e] = z.x; PY[e] = z.y; SIZE[e] = 12; VAL[e] = z.dmg * 0.9; }
        fxShock(z.x, z.y, 5);
        blastWorld(z.x, z.y, 40, 30, EX_ENV);
      }
      z.summonCd -= dt;
      if (z.summonCd <= 0) {
        z.summonCd = 8;
        popText(z.x, z.y - 40, "ROT WITH ME!", "#ffb347", true, 1.2);
        for (let k = 0; k < 2; k++) spawnEnemy("feral", { x: z.x + rnd(-36, 36), y: z.y + rnd(-28, 28) });
      }
    }
    if (z.souls) { // the necromancer raises wraiths around himself
      z.summonCd -= dt;
      if (z.summonCd <= 0) {
        z.summonCd = 6;
        popText(z.x, z.y - 40, "RISE, MY FALLEN!", "#78ffdc", true, 1.4);
        beep(180, 0.5, "sine", 0.09, 240);
        for (let k = 0; k < 4; k++) spawnEnemy("wraith", { x: z.x + rnd(-38, 38), y: z.y + rnd(-30, 30) });
      }
    }
    if (!(z.ranged && dToP < 140)) { // walk the flow field around buildings and wrecks
      const f = flowDir(z);
      if (f) { tx = f.x; ty = f.y; }
    }
    const tl = Math.hypot(tx, ty) || 1;
    let dirX = tx / tl, dirY = ty / tl;
    if (z.avoidT > 0) { // steering around an obstacle: blend toward the tangent
      z.avoidT -= dt;
      const ax = -dirY * z.avoidDir + dirX * 0.4, ay = dirX * z.avoidDir + dirY * 0.4;
      const al = Math.hypot(ax, ay) || 1;
      dirX = ax / al; dirY = ay / al;
    }
    const preX = z.x, preY = z.y;
    // knockback is a velocity that bleeds off, so hits shove instead of teleporting
    const kd = Math.exp(-dt * 9);
    z.x += (dirX * sp + z.kx) * dt; z.y += (dirY * sp + z.ky) * dt;
    z.kx *= kd; z.ky *= kd;
    z.facing = player.x >= z.x ? 1 : -1;
    if (z.dirAnim) z.dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? "r" : "l") : (ty > 0 ? "d" : "u");
    const ec = collideSolids(z.x, z.y, z.r);
    z.x = ec.x; z.y = ec.y;
    // barely moved while trying to -> pick a side and slide around the obstacle
    if (sp > 0 && Math.hypot(z.x - preX, z.y - preY) < sp * dt * 0.35 && z.avoidT <= 0 && Math.abs(z.kx) + Math.abs(z.ky) < 20) {
      z.avoidT = rnd(0.45, 0.9);
      z.avoidDir = Math.random() < 0.5 ? 1 : -1;
    }
    // contact damage
    z.atkTouch = Math.max(0, z.atkTouch - dt);
    if (!z.ranged && dToP < z.r + player.r + 3 && z.atkTouch === 0) {
      z.atkTouch = 0.7;
      hurtPlayer(z.dmg);
    }
  }
  // push overlapping zombies apart (pairs found through the hash)
  buildHash();
  for (let i = 0; i < ZOMBIES.n; i++) {
    const ea = ZOMBIES.dense[i], a = ZO[ea];
    if (a.dead) continue;
    const near = queryEnemies(a.x - 24, a.y - 24, a.x + 24, a.y + 24, qNear);
    for (let k = 0; k < near.length; k++) {
      const b = near[k];
      if (b.e <= ea) continue; // each pair once
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy), min = a.r + b.r;
      if (d > 0 && d < min) {
        const push = (min - d) / 2 / d;
        a.x -= dx * push; a.y -= dy * push;
        b.x += dx * push; b.y += dy * push;
      }
    }
  }
}

function sysEnemyShots(dt) {
  for (let i = BOLTS.n - 1; i >= 0; i--) {
    const e = BOLTS.dense[i];
    PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; LIFE[e] += dt;
    if (LIFE[e] > 2.4 || solidAt(PX[e], PY[e] + 8) === 1) { eKill(e); continue; }
    if (Math.hypot(PX[e] - player.x, PY[e] - player.y) < player.r + 4) {
      hurtPlayer(VAL[e]);
      for (let k = 0; k < 6; k++) part(P_BLOOD, PX[e], PY[e], rnd(-50, 50), rnd(-50, 50), 0.6, PC_ACID, 4, rnd(10, 40));
      eKill(e);
    }
  }
  for (let i = RINGS.n - 1; i >= 0; i--) {
    const e = RINGS.dense[i];
    SIZE[e] += 85 * dt;
    if (SIZE[e] >= 100) { eKill(e); continue; }
    if (Math.abs(Math.hypot(player.x - PX[e], player.y - PY[e]) - SIZE[e]) < 9) hurtPlayer(VAL[e]);
  }
}

// particles: plain ballistics; things with height (z) arc, bounce once and
// settle; gibs, bodies and debris end up painted into the floor
function sysParticles(dt) {
  for (let i = PARTS.n - 1; i >= 0; i--) {
    const e = PARTS.dense[i];
    const k = KIND[e];
    LIFE[e] -= dt;
    if (k === P_SMOKE || k === P_MIST || k === P_DUST) { PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; VX[e] *= 0.97; VY[e] *= 0.97; SIZE[e] += dt * 4; }
    else if (k === P_FIRE || k === P_EMBER) { PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; VX[e] *= 0.92; VY[e] = VY[e] * 0.95 - 10 * dt; }
    else if (k === P_WATER) { PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; VZ[e] -= 300 * dt; PZ[e] += VZ[e] * dt; if (PZ[e] < 0) { if (Math.random() < 0.2) decalPx(PAL[PC_WATER], PX[e], PY[e], 1, 1, 0.25); eKill(e); continue; } }
    else if (k === P_DRIP) PY[e] += 55 * dt;
    else if (k === P_AFTER || k === P_MUZZLE || k === P_FLASH || k === P_RING || k === P_SPAWN || k === P_CORPSE) { /* static */ }
    else if (!(FLAG[e] & F_GROUND)) { // ballistic with height
      PX[e] += VX[e] * dt; PY[e] += VY[e] * dt;
      VZ[e] -= 380 * dt; PZ[e] += VZ[e] * dt; ROT[e] += VROT[e] * dt;
      if (PZ[e] <= 0) {
        PZ[e] = 0;
        if (k === P_BLOOD) { // a drop hits the street
          if (COL[e] === PC_ACID) decalPx(PAL[PC_ACID], PX[e], PY[e], 1, 1, 0.6);
          else decalPx(PAL[COL[e]], PX[e], PY[e], Math.random() < 0.3 ? 2 : 1, 1, 0.85);
          eKill(e); continue;
        }
        if (k === P_SPARK) { eKill(e); continue; }
        if (!(FLAG[e] & F_BOUNCED) && Math.abs(VZ[e]) > 40) { // one bounce
          FLAG[e] |= F_BOUNCED; VZ[e] = -VZ[e] * 0.35; VX[e] *= 0.5; VY[e] *= 0.5; VROT[e] *= 0.4;
          if (k === P_GIB || k === P_BODY) decalPx(PAL[PC_BLOOD3], PX[e] - 1, PY[e], 3, 2, 0.8);
        } else { // settled
          FLAG[e] |= F_GROUND; VX[e] = VY[e] = 0;
          if (k === P_BODY) { // the body hits hard: a smear along its path
            decal(pick(SPLATS), PX[e], PY[e] + 2, rnd(0, 6.28), 0.85);
            decal(tinted(REF[e], VROT[e] < 0, "dead"), PX[e], PY[e] - 4, ROT[e] * 0.3, 0.95);
            eKill(e); continue;
          }
          LIFE[e] = Math.min(LIFE[e], rnd(2.5, 6));
        }
      }
      // keep debris out of walls
      if (solidAt(PX[e], PY[e]) === 1) { VX[e] = -VX[e] * 0.3; VY[e] = -VY[e] * 0.3; PX[e] += VX[e] * dt * 2; PY[e] += VY[e] * dt * 2; }
    }
    if (LIFE[e] <= 0) {
      if ((k === P_GIB || k === P_DEBRIS || k === P_SHELL) && (FLAG[e] & F_GROUND)) { // rest forever in the floor
        if (k === P_SHELL) decalPx(PAL[PC_SHELL], PX[e], PY[e], 1, 1, 0.7);
        else decal(REF[e], PX[e], PY[e], ROT[e], 0.9);
      }
      eKill(e);
    }
  }
}

function sysPickups(dt) {
  const st = player.stats;
  for (let i = PICKUPS.n - 1; i >= 0; i--) {
    const e = PICKUPS.dense[i];
    LIFE[e] += dt;
    PX[e] += VX[e] * dt; PY[e] += VY[e] * dt; VX[e] *= 0.9; VY[e] *= 0.9;
    const d = Math.hypot(PX[e] - player.x, PY[e] - player.y);
    const kind = KIND[e];
    if (kind !== PK_FLASK && d < st.magnet) {
      const a = Math.atan2(player.y - PY[e], player.x - PX[e]), sp = kind === PK_GEM ? 180 * (1.2 - d / st.magnet) : 150;
      PX[e] += Math.cos(a) * sp * dt; PY[e] += Math.sin(a) * sp * dt;
    }
    if (d >= (kind === PK_FLASK ? 10 : 8)) continue;
    eKill(e);
    if (kind === PK_GEM) {
      SFX.gem();
      player.xp += VAL[e] * st.xpGain;
      while (player.xp >= xpNeeded(player.level)) {
        player.xp -= xpNeeded(player.level);
        player.level++; player.banked++;
        banner("LEVEL UP", `LV ${player.level}`, "#7bd88f", 1.2);
        SFX.level();
      }
    } else if (kind === PK_COIN) { G.coins++; G.score += 25 * G.mult; SFX.coinS(); }
    else {
      player.hp = Math.min(st.maxHp, player.hp + st.maxHp * 0.3);
      popText(player.x, player.y - 26, "+" + big(st.maxHp * 0.3), "#7bd88f", true);
      if (!sample("heal", 0.45)) SFX.gem();
    }
  }
}

function sysTexts(dt) {
  for (let i = TEXTS.n - 1; i >= 0; i--) {
    const e = TEXTS.dense[i], t = TXO[e];
    LIFE[e] -= dt;
    PY[e] += t.vy * dt; t.vy *= 0.92;
    if (LIFE[e] <= 0) eKill(e);
  }
  for (let i = banners.length - 1; i >= 0; i--) { banners[i].t += dt; if (banners[i].t >= banners[i].dur) banners.splice(i, 1); }
  // the pager: one message at a time, typed out
  const pg = G.pager;
  if (pg.cur) { pg.t += dt; if (pg.t > pg.cur.length * 0.035 + 3) pg.cur = ""; }
  while (!pg.cur && G.sayQ.length && G.t >= G.sayQ[0].at) { pg.cur = G.sayQ.shift().s; pg.t = 0; beep(1400, 0.05, "square", 0.03); setTimeout(() => beep(1800, 0.05, "square", 0.03), 90); }
}

// ------------------------------------------------------------ player ------
// smooth movement: velocity eases toward the stick, the dash is an impulse
// with invulnerability and afterimages; the camera leads where you aim
function updatePlayer(dt) {
  const st = player.stats;
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (touchState.active) {
    const d = Math.hypot(touchState.dx, touchState.dy);
    if (d > 6) { const m = Math.min(1, d / 18); mx = touchState.dx / d * m; my = touchState.dy / d * m; }
  }
  const ml = Math.hypot(mx, my);
  player.moving = ml > 0.1;
  if (ml > 1) { mx /= ml; my /= ml; }
  if (mx !== 0 && !aiming()) player.facing = Math.sign(mx); // while shooting, backpedal facing the target
  player.dashCd = Math.max(0, player.dashCd - dt);
  if ((keys.Space || keys.ShiftLeft || player.dashBuf > 0) && ml > 0.1) tryDash(mx / Math.max(ml, 0.01), my / Math.max(ml, 0.01));
  player.dashBuf = Math.max(0, player.dashBuf - dt);
  if (player.dashT > 0) {
    player.dashT -= dt;
    player.vx = player.dashX * st.moveSpd * 3.4; player.vy = player.dashY * st.moveSpd * 3.4;
    if ((player.ghostT -= dt) <= 0) { // afterimages
      player.ghostT = 0.025;
      const e = part(P_AFTER, player.x, player.y + 5, 0, 0, 0.22);
      if (e >= 0) { REF[e] = animFrame(player.moving ? player.runList : player.idleList, player.animT); FLAG[e] = player.facing < 0 ? 1 : 0; }
    }
  } else {
    const k = 1 - Math.exp(-dt * (ml > 0.1 ? 16 : 11));
    player.vx += (mx * st.moveSpd - player.vx) * k; player.vy += (my * st.moveSpd - player.vy) * k;
  }
  player.x += player.vx * dt; player.y += player.vy * dt;
  const pc = collideSolids(player.x, player.y, player.r + 2);
  player.x = pc.x; player.y = pc.y;
  player.animT += dt * (0.5 + 0.5 * Math.min(1, Math.hypot(player.vx, player.vy) / st.moveSpd));
  player.hurtCd = Math.max(0, player.hurtCd - dt);
  player.hp = Math.min(st.maxHp, player.hp + st.regen * dt);
  player.hpLag += (player.hp - player.hpLag) * (1 - Math.exp(-dt * (player.hp > player.hpLag ? 10 : 2.5)));

  // shooting
  player.atkCd -= dt;
  player.recoil = Math.max(0, player.recoil - dt * 30);
  if (player.reloadT > 0) {
    player.reloadT -= dt;
    if (player.reloadT <= 0) { player.ammo = clipSize(); SFX.reload(); }
  } else if (player.atkCd <= 0) fireGun();
}

function tryDash(dx, dy) {
  if (player.dashCd > 0) { player.dashBuf = 0.12; return; } // buffered: fires as soon as it's ready
  player.dashCd = 1.6; player.dashT = 0.16; player.dashX = dx; player.dashY = dy; player.dashBuf = 0; player.ghostT = 0;
  // a dash that slips past a zombie at point blank is a "close call": combo time back
  const near = nearestEnemy(player, 22);
  if (near && G.combo > 0) { G.comboT = 3; popText(player.x, player.y - 30, "CLOSE CALL", "#78ffdc"); }
  SFX.dash();
}

function hurtPlayer(dmg) {
  if (player.hurtCd > 0 || player.dashT > 0 || G.state !== "play") return;
  const taken = dmg * (1 - player.stats.armor);
  player.hp -= taken;
  breakCombo();
  if (!G.saidLowHp && player.hp > 0 && player.hp < player.stats.maxHp * 0.25) {
    G.saidLowHp = true;
    say("Not yet… I must survive… for the King!", 0.3);
  }
  player.hurtCd = 0.5;
  player.flash = 0.15;
  fxState.hurt = 1;
  G.trauma = Math.min(1, G.trauma + 0.35);
  SFX.hurt();
  popText(player.x, player.y - 26, "-" + big(taken), "#ff4d4d", true);
  for (let i = 0; i < 6; i++) part(P_BLOOD, player.x, player.y - 8, rnd(-70, 70), rnd(-70, 30), 1, PC_BLOOD, 6, rnd(20, 60));
  if (player.hp <= 0) { // WASTED: slow motion, then the end screen
    player.hp = 0;
    G.wasted = 2.2;
    banner("WASTED", "", "#e4485a", 2.4, true);
    bankCoins();
    if (G.score > (META.best || 0)) { META.best = G.score; saveMeta(); }
    SFX.bossRoar();
  }
}

// ------------------------------------------------------------------ update --
function updatePlay(rawDt) {
  // time: hit-stop freezes a beat on big hits, slow-mo for drama
  if (G.hitStop > 0) { G.hitStop -= rawDt; rawDt *= 0.08; }
  if (G.slowMo > 0) { G.slowMo -= rawDt; rawDt *= 0.35; }
  if (G.wasted > 0) {
    G.wasted -= rawDt; rawDt *= 0.3;
    if (G.wasted <= 0) { G.state = "gameover"; return; }
  }
  const dt = rawDt;
  G.t += dt;
  G.trauma = Math.max(0, G.trauma - dt * 1.4);
  const kd = Math.exp(-dt * 14);
  G.kickX *= kd; G.kickY *= kd;
  if (G.comboT > 0 && (G.comboT -= dt) <= 0) breakCombo();

  if (G.wasted <= 0) updatePlayer(dt);
  buildHash(); // bullets and blasts query this frame's zombies
  sysBullets(dt);
  sysFire(dt);
  sysEnemyShots(dt);

  // pathing + spawning
  flowT -= dt;
  if (flowT <= 0) { flowT = 0.25; updateFlow(); }
  spawnTimer += dt;
  while (spawnQueue.length && spawnQueue[0].at <= spawnTimer) spawnEnemy(spawnQueue.shift().type);

  sysZombies(dt);
  updateActiveProps(dt);
  sysParticles(dt);
  sysPickups(dt);

  // the horde groans: a random nearby zombie, more often in a crowd
  if ((G.groanT -= dt) <= 0 && ZOMBIES.n) {
    const z = ZO[ZOMBIES.dense[irnd(0, ZOMBIES.n - 1)]];
    if (!z.dead && z.warmup <= 0 && dist(z, player) < 320) sampleAt("groan_" + irnd(0, 9), z.x, z.y, z.big ? 0.5 : 0.32, z.big ? rnd(0.6, 0.75) : rnd(0.85, 1.15));
    G.groanT = rnd(0.7, 2.4) / (1 + Math.min(ZOMBIES.n, 60) / 30);
  }

  // the king bleeds
  if (kingPos) {
    if (Math.random() < dt * 0.9) part(P_DRIP, kingPos.x + rnd(-3, 3), kingPos.y - rnd(4, 14), 0, 0, 0.5, PC_DRIP);
    if (!G.kingSeen && dist(player, kingPos) < 70) {
      G.kingSeen = true;
      beep(110, 0.5, "sine", 0.06, -40);
      banner("THE KING", "they got to him", "#b48cff", 2.6);
      say("No… my King… they got to him.");
      say("…then this city becomes their grave.", 3.4);
    }
  }
  sysTexts(dt);
  eFlush();

  // wave end
  if (G.wasted <= 0 && !spawnQueue.length && ZOMBIES.n === 0 && G.state === "play") {
    if (G.wave === 20 && !UN.commando) { // beating the Rot God frees his prisoner
      UN.commando = true; saveUnlocks();
      banner("A CAGE BREAKS", "SECRET HERO: THE COMMANDO", "#ffd166", 3.5);
      SFX.level();
      say("A survivor… and armed to the teeth!", 1.5);
    }
    if (G.wave === FINAL_WAVE && !G.endless) G.state = "victory"; // safety net: victory comes from the boss kill
    else enterCampfire();
  }
}

// ------------------------------------------------------------------ render --
// camera: eases toward the player plus a lead in the aim/move direction;
// shake comes from trauma (squared, so small hits stay calm), and each shot
// kicks the view back a little
function camera() {
  const dt = 1 / 60;
  const lead = aiming() ? 26 : 12;
  const ax = aiming() ? Math.cos(player.atkAng) : (player.moving ? player.vx / player.stats.moveSpd : 0);
  const ay = aiming() ? Math.sin(player.atkAng) : (player.moving ? player.vy / player.stats.moveSpd : 0);
  const tx = player.x + ax * lead - VW / 2, ty = player.y + ay * lead * 0.7 - VH / 2;
  const k = 1 - Math.exp(-dt * 7);
  G.camX += (tx - G.camX) * k; G.camY += (ty - G.camY) * k;
  if (Math.abs(G.camX - tx) > 300 || Math.abs(G.camY - ty) > 300) { G.camX = tx; G.camY = ty; } // teleports/new runs
  const s = G.trauma * G.trauma * 9, t = G.t * 40;
  let cx = clamp(G.camX, 0, WORLD_W - VW) + Math.sin(t * 1.3) * s + G.kickX;
  let cy = clamp(G.camY, 0, WORLD_H - VH) + Math.cos(t * 1.7) * s + G.kickY;
  G.cam.x = cx; G.cam.y = cy;
  return { cx, cy };
}

const drawPool = [], drawList = [];
const byY = (a, b) => a.y - b.y;
function pushDraw(y, kind, ref) {
  let d = drawPool[drawList.length];
  if (!d) { d = { y: 0, kind: 0, ref: null }; drawPool.push(d); }
  d.y = y; d.kind = kind; d.ref = ref;
  drawList.push(d);
}

function drawSpritePart(e, alpha) {
  const im = typeof REF[e] === "string" ? IMG[REF[e]] : REF[e];
  if (!im || !im.width) return;
  const s = SIZE[e] || 1;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(Math.round(PX[e]), Math.round(PY[e] - PZ[e]));
  if (ROT[e]) ctx.rotate(ROT[e]);
  ctx.drawImage(im, -Math.round(im.width * s / 2), -Math.round(im.height * s / 2), Math.round(im.width * s), Math.round(im.height * s));
  ctx.restore();
  ctx.globalAlpha = 1;
}

function renderWorld() {
  const { cx, cy } = camera();
  ctx.save();
  ctx.translate(-Math.round(cx), -Math.round(cy));
  drawFloor(cx, cy);
  const vx0 = cx - 40, vx1 = cx + VW + 40, vy0 = cy - 20, vy1 = cy + VH + 60;

  // burning ground
  for (let i = 0; i < FIRES.n; i++) {
    const e = FIRES.dense[i], a = clamp(LIFE[e] / MAXL[e], 0, 1);
    blob(FIRE_GLOW, PX[e], PY[e], 30, a);
  }
  // ground layer: spawn warnings, corpses, settled gibs/debris/shells
  for (let i = 0; i < PARTS.n; i++) {
    const e = PARTS.dense[i], k = KIND[e];
    if (PX[e] < vx0 || PX[e] > vx1 || PY[e] < vy0 || PY[e] > vy1) continue;
    if (k === P_SPAWN) {
      const a = LIFE[e] / MAXL[e];
      ctx.globalAlpha = 0.7 * a; ctx.strokeStyle = "#ff503c";
      ctx.beginPath(); ctx.arc(PX[e], PY[e], 6 + (1 - a) * 6, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if ((FLAG[e] & F_GROUND) && (FLAG[e] & F_SPRITE)) drawSpritePart(e, Math.min(1, LIFE[e]));
    else if ((FLAG[e] & F_GROUND) && k === P_SHELL) { ctx.fillStyle = PAL[PC_SHELL]; ctx.fillRect(Math.round(PX[e]), Math.round(PY[e]), 1, 1); }
  }
  // pickups
  for (let i = 0; i < PICKUPS.n; i++) {
    const e = PICKUPS.dense[i], k = KIND[e];
    if (k === PK_GEM) drawSprite(animFrame(ANIM.gem, LIFE[e], 4), PX[e], PY[e] + 3);
    else if (k === PK_COIN) drawSprite(animFrame(ANIM.coin, LIFE[e], 8), PX[e], PY[e] + 4);
    else drawSprite("flask_big_red", PX[e], PY[e] + 6 - Math.abs(Math.sin(LIFE[e] * 4)) * 2);
  }

  // entities, y-sorted (pooled records, no per-frame closures)
  drawList.length = 0;
  for (const c of cellsIn(vx0, cy - 8, vx1, cy + VH + 50, scratchCells)) {
    for (const p of c.props) {
      if (p.gone || p.x < vx0 || p.x > vx1 || p.y < cy - 8 || p.y > cy + VH + 50) continue;
      pushDraw(p.y, 0, p);
    }
  }
  for (let i = 0; i < ZOMBIES.n; i++) {
    const z = ZO[ZOMBIES.dense[i]];
    if (z.x > cx - 60 && z.x < cx + VW + 60 && z.y > cy - 20 && z.y < cy + VH + 80) pushDraw(z.y, 1, z);
  }
  for (let i = 0; i < PARTS.n; i++) { // afterimages sort with the player
    const e = PARTS.dense[i];
    if (KIND[e] === P_AFTER) pushDraw(PY[e] - 5, 3, e);
  }
  if (G.wasted <= 0 || Math.floor(G.t * 10) % 2) pushDraw(player.y, 2, player);
  drawList.sort(byY);
  for (const d of drawList) {
    if (d.kind === 0) drawProp(d.ref);
    else if (d.kind === 1) drawEnemy(d.ref);
    else if (d.kind === 2) drawPlayer();
    else drawSprite(REF[d.ref], PX[d.ref], PY[d.ref], FLAG[d.ref] === 1, PLAYER_SCALE, 0.45 * LIFE[d.ref] / MAXL[d.ref], "ghost");
  }

  // air layer: projectiles, gore in flight, smoke, fire
  for (let i = 0; i < GRENADES.n; i++) {
    const e = GRENADES.dense[i], im = IMG.proj_grenade;
    ctx.save(); ctx.translate(Math.round(PX[e]), Math.round(PY[e])); ctx.rotate(ROT[e]);
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  for (let i = 0; i < BULLETS.n; i++) {
    const e = BULLETS.dense[i], k = KIND[e];
    if (k === 2) {
      const age = 1 - LIFE[e] / MAXL[e], r = 2 + age * 7;
      ctx.fillStyle = age < 0.3 ? "#fff0aa" : age < 0.65 ? "#fa8c28" : "#a0321e";
      ctx.globalAlpha = age < 0.3 ? 0.9 : age < 0.65 ? 0.85 - age * 0.4 : 0.6 * (1 - age);
      ctx.fillRect(Math.round(PX[e] - r / 2), Math.round(PY[e] - r / 2), Math.round(r), Math.round(r));
      ctx.globalAlpha = 1;
    } else if (k === 1) {
      ctx.save(); ctx.translate(Math.round(PX[e]), Math.round(PY[e])); ctx.rotate(ROT[e]);
      ctx.fillStyle = Math.random() < 0.5 ? "#ffd166" : "#ff8a3d";
      ctx.fillRect(-7, -1, 3, 2); // exhaust
      const im = IMG.proj_rocket;
      ctx.drawImage(im, -im.width / 2, -im.height / 2);
      ctx.restore();
    } else {
      const tl = VAL[e] > 2 ? 0.035 : 0.018; // snipers leave a longer tracer
      ctx.strokeStyle = FLAG[e] ? "#fff7d6" : "#ffd166"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PX[e] - VX[e] * tl, PY[e] - VY[e] * tl); ctx.lineTo(PX[e], PY[e]); ctx.stroke();
    }
  }
  for (let i = 0; i < BOLTS.n; i++) { const e = BOLTS.dense[i]; drawSprite(animFrame(ANIM.bolt, LIFE[e], 8), PX[e], PY[e] + 3); }
  for (let i = 0; i < RINGS.n; i++) {
    const e = RINGS.dense[i], fade = 1 - SIZE[e] / 100;
    ctx.save();
    ctx.translate(PX[e], PY[e]); ctx.scale(1, 0.7);
    ctx.globalAlpha = 0.3 + 0.6 * fade; ctx.strokeStyle = "#ff6e32"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, SIZE[e], 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.5 + 0.5 * fade; ctx.strokeStyle = "#ffdc78"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(1, SIZE[e] - 3), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < PARTS.n; i++) {
    const e = PARTS.dense[i], k = KIND[e];
    if (FLAG[e] & F_GROUND || k === P_SPAWN || k === P_AFTER) continue;
    const x = PX[e], y = PY[e] - PZ[e];
    if (x < vx0 || x > vx1 || y < vy0 - 40 || y > vy1) continue;
    const a = LIFE[e] / MAXL[e];
    if (FLAG[e] & F_SPRITE) {
      // a shadow under anything in flight sells the height
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(Math.round(PX[e] - 2), Math.round(PY[e]), 4, 1);
      drawSpritePart(e, 1);
    } else if (k === P_SMOKE || k === P_MIST || k === P_DUST) {
      ctx.globalAlpha = (k === P_MIST ? 0.55 : 0.4) * a; ctx.fillStyle = PAL[COL[e]];
      const r = SIZE[e];
      ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.round(r), Math.round(r));
    } else if (k === P_FIRE) {
      ctx.globalAlpha = Math.min(1, a * 1.4);
      ctx.fillStyle = a > 0.66 ? "#ffe08a" : a > 0.33 ? "#ff8a2a" : "#b8361a";
      const r = SIZE[e] * (0.5 + a * 0.6);
      ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.round(r), Math.round(r));
    } else if (k === P_FLASH) {
      blob(FLASH_BLOB, x, y, SIZE[e] * 1.3, a);
    } else if (k === P_RING) {
      const pr = (1 - a) * SIZE[e] * 1.2;
      ctx.globalAlpha = a; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, pr - 5), 0, Math.PI * 2); ctx.stroke();
    } else if (k === P_MUZZLE) {
      ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ROT[e]);
      ctx.fillStyle = "#fff3c4"; ctx.fillRect(0, -1, 6, 3);
      ctx.fillStyle = "#ffb347"; ctx.fillRect(5, -2, 3, 1); ctx.fillRect(5, 2, 3, 1); ctx.fillRect(6, 0, 3, 1);
      ctx.restore();
    } else {
      ctx.globalAlpha = k === P_BLOOD || k === P_SHELL || k === P_WATER ? 1 : a;
      ctx.fillStyle = PAL[COL[e]];
      const s = k === P_BLOOD && SIZE[e] > 1 ? 2 : k === P_WATER ? 1 : k === P_SHELL ? 1 : 2;
      ctx.fillRect(Math.round(x), Math.round(y), s, k === P_WATER ? 2 : s);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  collectLights(cx, cy);
  if (!fxLit()) renderDarkness(cx, cy);
}

function drawProp(p) {
  if (p.gallows) { // the hanged King: a post, a crossbeam, a rope
    ctx.fillStyle = "#141018"; ctx.fillRect(p.x - 15, p.y - 38, 4, 41); ctx.fillRect(p.x - 15, p.y - 38, 18, 3);
    ctx.fillStyle = "#5a4232"; ctx.fillRect(p.x - 14, p.y - 37, 2, 39); ctx.fillRect(p.x - 14, p.y - 37, 16, 1);
    drawSprite(animFrame(ANIM.king, G.t, 1.4), p.x, p.y);
    return;
  }
  const shake = p.hitT > 0 ? Math.round(Math.sin(G.t * 90) * 1.5) : 0; // hits make props judder
  drawSprite(p.img, p.x + shake, p.y, p.flip, 1, 1, p.hitT > 0.05 ? "hit" : null);
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
  const list = player.moving ? player.runList : player.idleList;
  let tint = null;
  if (player.flash > 0) { player.flash -= 1 / 60; tint = "hit"; }
  // a soft shadow grounds him
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(Math.round(player.x - 5), Math.round(player.y + 4), 10, 2);
  drawSprite(animFrame(list, player.animT), player.x, player.y + 5, player.facing < 0, PLAYER_SCALE, player.hurtCd > 0.3 ? 0.6 : 1, tint);
  // held gun(s): pointed at the target while shooting, lowered otherwise
  const w = WEAPONS[G.weapon], im = IMG[w.sprite];
  const ang = aiming() ? player.atkAng : (player.facing > 0 ? 0.35 : Math.PI - 0.35);
  const h = handPos();
  const backKick = w.akimbo && player.akimboSide < 0; // akimbo: the guns take turns
  if (w.akimbo) drawGun(im, h.x - player.facing * 4, h.y + 1, ang, backKick ? player.recoil : 0);
  drawGun(im, h.x, h.y, ang, backKick ? 0 : player.recoil);
  if (player.reloadT > 0) { // reload ring over his head
    const p = 1 - player.reloadT / (w.reload * player.stats.reloadMul);
    ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y - 30, 5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
  }
}

function drawGun(im, x, y, ang, kick) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(ang);
  if (Math.cos(ang) < 0) ctx.scale(1, -1); // keep it upright when aiming left
  ctx.drawImage(im, -2 - Math.round(kick), -im.height + 3); // grip at (2, h-3)
  ctx.restore();
}

function drawEnemy(z) {
  if (z.warmup > 0 || z.dead) {
    if (z.warmup > 0) { // crawling out: rises from the ground
      const p = 1 - z.warmup / 0.8, list = z.dirSet ? z.dirSet.run.d : z.runList, im = IMG[list[0]];
      if (!im || !im.width) return;
      const h = Math.round(im.height * z.scale * p);
      if (h > 0) ctx.drawImage(im, 0, 0, im.width, Math.round(im.height * p), Math.round(z.x - im.width * z.scale / 2), Math.round(z.y + 4 - h), Math.round(im.width * z.scale), h);
    }
    return;
  }
  let list, flip = false;
  if (z.dirSet) list = (z.atkTouch > 0.35 ? z.dirSet.attack : z.dirSet.run)[z.dir];
  else { list = z.runList; flip = z.facing < 0; }
  const enraged = z.rage && z.hp < z.maxHp * 0.5;
  const tint = z.hitFlash > 0 ? "hit" : z.burn > 0 ? "rage" : enraged ? "rage" : null;
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(Math.round(z.x - z.r), Math.round(z.y + 3), z.r * 2, 2);
  drawSprite(animFrame(list, z.animT, enraged ? 14 : 10), z.x, z.y + (z.dirAnim ? 6 : 4), flip, z.scale,
    z.ghost ? 0.62 + Math.sin(z.animT * 6) * 0.1 : 1, tint);
  if (z.hp < z.maxHp) {
    const w = z.big ? 26 : 12, h = 2;
    const top = z.y + 4 - (IMG[list[0]].height * z.scale) * (z.dirAnim ? 0.75 : 1) - 4;
    ctx.fillStyle = "#1a1420"; ctx.fillRect(Math.round(z.x - w / 2), Math.round(top), w, h);
    ctx.fillStyle = z.bossBar ? "#ff4d4d" : "#7bd88f";
    ctx.fillRect(Math.round(z.x - w / 2), Math.round(top), Math.round(w * z.hp / z.maxHp), h);
  }
}

// true when the WebGL pass lights the scene (set up in the FX section)
let fxLit = () => false;

// every light this frame, in world space: position, radius, intensity and
// colour. The 2D darkness pass punches holes with them; the WebGL pass
// (FX on) uses them as coloured lights. Preallocated: no per-frame garbage.
const MAX_LIGHTS = 48;
const LIGHTS = new Float32Array(MAX_LIGHTS * 7);
let lightCount = 0, lightCam = { x: 0, y: 0 };
function addLight(x, y, r, a, cr, cg, cb) {
  if (lightCount >= MAX_LIGHTS) return;
  const cx = lightCam.x, cy = lightCam.y;
  if (x < cx - r || x > cx + VW + r || y < cy - r || y > cy + VH + r) return;
  const k = lightCount++ * 7;
  LIGHTS[k] = x; LIGHTS[k + 1] = y; LIGHTS[k + 2] = r; LIGHTS[k + 3] = a;
  LIGHTS[k + 4] = cr; LIGHTS[k + 5] = cg; LIGHTS[k + 6] = cb;
}
// most important first: once the budget is spent, small lights are dropped
function collectLights(cx, cy) {
  lightCount = 0; lightCam.x = cx; lightCam.y = cy;
  const gl = fxLit();
  addLight(player.x, player.y, gl ? 90 : 135, gl ? 0.75 : 0.95, 0.75, 0.82, 1.0);
  for (let i = 0; i < PARTS.n; i++) {
    const e = PARTS.dense[i], k = KIND[e];
    if (k === P_FLASH) addLight(PX[e], PY[e], SIZE[e] * 2.4, 1.6 * LIFE[e] / MAXL[e], 1.0, 0.62, 0.28);
    else if (k === P_MUZZLE) addLight(PX[e], PY[e], 40, 0.9, 1.0, 0.86, 0.55);
  }
  for (let i = 0; i < FIRES.n; i++) { const e = FIRES.dense[i]; addLight(PX[e], PY[e], 55, 0.85 * clamp(LIFE[e] / MAXL[e] + 0.3, 0, 1), 1.0, 0.5, 0.18); }
  for (let i = 0; i < RINGS.n; i++) { const e = RINGS.dense[i]; addLight(PX[e], PY[e], SIZE[e] + 14, 0.5, 1.0, 0.45, 0.2); }
  if (kingPos) addLight(kingPos.x, kingPos.y - 12, 44, 0.6, 0.7, 0.45, 1.0);
  for (const c of cellsIn(cx - 70, cy - 70, cx + VW + 70, cy + VH + 70, scratchCells)) {
    for (const p of c.props) if (p.fire && !p.gone) addLight(p.x, p.y - p.fireY, p.dk === "car" || p.dk === "wreck" ? 70 : 50 + Math.sin(G.t * 9 + p.t) * 5, 0.95, 1.0, 0.52, 0.2);
    for (const l of c.lamps) {
      if (l.prop.dk !== "lamp" || l.prop.gone) continue; // shot out
      if (l.flicker && Math.sin(G.t * 23 + l.t) + Math.sin(G.t * 7.3 + l.t * 2) > 1.1) continue; // dying bulb
      addLight(l.x, l.y, gl ? 78 : 64, 0.8, 1.0, 0.74, 0.42);
    }
  }
  for (let i = 0; i < BOLTS.n; i++) { const e = BOLTS.dense[i]; addLight(PX[e], PY[e], 24, 0.8, 0.45, 1.0, 0.3); }
  for (let i = 0; i < BULLETS.n; i++) {
    const e = BULLETS.dense[i], k = KIND[e];
    if (k === 2) addLight(PX[e], PY[e], 22, 0.55, 1.0, 0.5, 0.15);
    else if (k === 1) addLight(PX[e], PY[e], 30, 0.8, 1.0, 0.6, 0.3);
    else addLight(PX[e], PY[e], 10, 0.6, 1.0, 0.85, 0.5);
  }
  for (let i = 0; i < GRENADES.n; i++) { const e = GRENADES.dense[i]; addLight(PX[e], PY[e], 14, 0.5, 1.0, 0.7, 0.4); }
  for (let i = 0; i < ZOMBIES.n && lightCount < MAX_LIGHTS - 4; i++) { // burning zombies are torches
    const z = ZO[ZOMBIES.dense[i]];
    if (z.burn > 0) addLight(z.x, z.y - 6, 30, 0.7, 1.0, 0.5, 0.15);
  }
  if (!gl) { // without coloured lighting, zombies and gems need a glow to be seen
    let n = 0;
    for (let i = 0; i < ZOMBIES.n && n++ < 50; i++) { const z = ZO[ZOMBIES.dense[i]]; addLight(z.x, z.y, z.big ? 40 : 24, 0.45, 1, 1, 1); }
  }
  for (let i = 0; i < PICKUPS.n; i++) { const e = PICKUPS.dense[i]; if (KIND[e] === PK_GEM) addLight(PX[e], PY[e], 10, 0.5, 0.4, 1.0, 0.5); }
}

let darkCanvas = null, darkCtx = null;
function renderDarkness(cx, cy) {
  if (!darkCanvas) { darkCanvas = document.createElement("canvas"); darkCanvas.width = VW; darkCanvas.height = VH; darkCtx = darkCanvas.getContext("2d"); }
  const dc = darkCtx;
  dc.globalCompositeOperation = "source-over";
  dc.globalAlpha = 1;
  dc.clearRect(0, 0, VW, VH);
  dc.fillStyle = "rgba(6,4,18,0.55)"; // a dead city has no power: night is dark
  dc.fillRect(0, 0, VW, VH);
  dc.globalCompositeOperation = "destination-out";
  for (let i = 0; i < lightCount; i++) {
    const k = i * 7, r = LIGHTS[k + 2];
    dc.globalAlpha = Math.min(1, LIGHTS[k + 3]);
    dc.drawImage(LIGHT_BLOB, Math.round(LIGHTS[k] - cx - r), Math.round(LIGHTS[k + 1] - cy - r), Math.round(r * 2), Math.round(r * 2));
  }
  dc.globalAlpha = 1;
  ctx.drawImage(darkCanvas, 0, 0);
}

// ------------------------------------------------------------ destruction --
// The city breaks. Every prop has hit points and a kind that decides how it
// dies (cars smoke, burn and blow up; barrels explode; lamps shatter;
// hydrants geyser; the rest splinters). Building tiles crumble into
// walkable rubble under explosions. Everything broken is remembered in
// WORLD for the rest of the run, so cells regenerated from the seed come
// back broken, and floor chunks are repainted around changes.
const WORLD = { props: new Map(), tiles: new Map(), cellTiles: new Map() };
const activeProps = []; // props with running timers: smoke, fuses, fires, geysers
const TILE_HP = 55;
const PS_OK = 0, PS_SMOKE = 1, PS_FUSE = 2, PS_WRECK = 3, PS_GONE = 4, PS_BROKEN = 5;

function propKind(img) {
  if (!img) return ["gallows", Infinity];
  if (img.startsWith("city_car_")) return img.endsWith("burnt") ? ["wreck", Infinity] : ["car", 70];
  if (img === "city_barrel") return ["barrel", 14];
  if (img === "city_barrel_blue") return ["can", 12];
  if (img === "city_firebarrel") return ["firebarrel", 12];
  if (img === "city_lamp") return ["lamp", 14];
  if (img === "city_lamp_broken") return ["lampdead", 18];
  if (img === "city_tree") return ["tree", 20];
  if (img === "city_dumpster") return ["dumpster", 80];
  if (img === "city_barricade") return ["barricade", 50];
  if (img === "city_k_hydrant") return ["hydrant", 10];
  return ["small", 8];
}
function debrisOf(p) {
  if (p.dk === "tree" || /box|bench|barrelw/.test(p.img)) return "wood";
  if (p.dk === "barricade" || /rubble/.test(p.img)) return "concrete";
  if (p.dk === "lamp") return "glass";
  return "metal";
}
function burst(mat, x, y, n, power, ang = 0, spread = 3.2) {
  for (let i = 0; i < n; i++) {
    const a = ang + rnd(-spread, spread) / 2, sp = rnd(30, power);
    spritePart(P_DEBRIS, `deb_${mat}_${irnd(0, 1)}`, x + rnd(-4, 4), y + rnd(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp, rnd(4, 16), rnd(50, 140), rnd(3, 7), rnd(-12, 12));
  }
}
function dust(x, y, n, size = 5) {
  for (let i = 0; i < n; i++) part(P_DUST, x + rnd(-10, 10), y + rnd(-8, 4), rnd(-25, 25), rnd(-20, 4), rnd(0.8, 1.8), PC_DUST, 0, 0, rnd(3, size));
}

function saveProp(p) { WORLD.props.set(p.key, p.state * 1e6 + Math.max(0, Math.min(999999, Math.round(p.hp === Infinity ? 999999 : p.hp)))); }
function activate(p) { if (!p.active) { p.active = true; activeProps.push(p); } }
// re-derive walkability for the tiles under a prop that just disappeared
function refreshWalk(p) {
  const r = p.rect;
  for (let ty = Math.floor(r.y / TILE); ty <= Math.floor((r.y + r.h) / TILE); ty++) {
    for (let tx = Math.floor(r.x / TILE); tx <= Math.floor((r.x + r.w) / TILE); tx++) {
      if (oob(tx, ty)) continue;
      const c = cellAt(tx, ty), i = (ty - c.y0) * c.w + tx - c.x0;
      if (c.T[i] === T_BLD) continue;
      const cx = tx * TILE + 8, cy = ty * TILE + 8;
      let covered = false;
      for (const s of c.pg[i] || EMPTY) if (!s.dead && cx > s.x && cx < s.x + s.w && cy > s.y && cy < s.y + s.h) covered = true;
      c.walk[i] = covered ? 0 : 1;
    }
  }
}

function damageProp(p, dmg, ang = 0, blast = false) {
  if (!p || p.gone || p.hp === Infinity || dmg <= 0) return;
  p.hp -= dmg; p.hitT = 0.12;
  activate(p);
  const dk = p.dk;
  if (dk === "car") {
    if (p.state === PS_OK && p.hp < p.maxHp * 0.6) p.state = PS_SMOKE;
    if (p.state <= PS_SMOKE && p.hp < p.maxHp * 0.25) { // it's going to blow: fire and a fuse
      p.state = PS_FUSE; p.fire = true; p.fuse = blast ? rnd(0.35, 0.9) : 2.2;
      popText(p.x, p.y - 30, "!", "#ff4d4d", true, 0.8);
    } else if (p.state === PS_FUSE && blast) p.fuse = Math.min(p.fuse, rnd(0.2, 0.6)); // chain reactions run fast
    for (let i = 0; i < 2; i++) part(P_SPARK, p.x + rnd(-8, 8), p.y - 8, rnd(-60, 60), rnd(-60, 20), 0.25, PC_SPARK, 6, rnd(20, 60));
  } else if (dk === "barrel" || dk === "firebarrel") {
    if (p.hp <= 0 && p.state !== PS_FUSE) { p.state = PS_FUSE; p.fuse = blast ? rnd(0.1, 0.3) : 0.12; }
  } else if (dk === "lamp") {
    if (p.hp <= 0) { // shot out: glass rains, the light dies, the post stays
      p.state = PS_BROKEN; p.dk = "lampdead"; p.img = "city_lamp_broken"; p.hp = p.maxHp = 18;
      burst("glass", p.x + (p.flip ? -7 : 7), p.y - 32, 6, 60);
      for (let i = 0; i < 10; i++) part(P_SPARK, p.x + (p.flip ? -7 : 7), p.y - 32, rnd(-40, 40), rnd(-20, 40), rnd(0.3, 0.7), PC_SPARK, 30, rnd(-10, 30));
      beep(2400, 0.08, "square", 0.04, -1800);
    }
  } else if (p.hp <= 0) destroyProp(p, ang);
  saveProp(p);
}

function destroyProp(p, ang = 0) {
  if (p.gone) return;
  p.gone = true; p.state = PS_GONE; p.fire = false;
  if (p.rect) { p.rect.dead = true; refreshWalk(p); }
  const mat = debrisOf(p);
  burst(mat, p.x, p.y - 6, p.dk === "dumpster" || p.dk === "barricade" ? 12 : 6, 120, ang + Math.PI, 4);
  dust(p.x, p.y, p.dk === "small" ? 2 : 5);
  if (p.dk === "hydrant") { p.geyser = 7; activate(p); sampleAt("spit", p.x, p.y, 0.4, 0.5); }
  else if (p.dk === "tree") decal("deb_wood_0", p.x, p.y - 2, 0, 1);
  if (p.dk === "dumpster") decal("city_trash", p.x, p.y - 4, 0, 1);
  saveProp(p);
}

// an exploding prop; src EX_ENV, so it hurts the player too
function blowProp(p) {
  if (p.dk === "car") {
    explode(p.x, p.y - 8, 58, 48, false, EX_ENV);
    burst("metal", p.x, p.y - 8, 10, 200);
    p.img = p.img.replace(/_(red|blue|white|green|rust)$/, "_burnt");
    p.dk = "wreck"; p.state = PS_WRECK; p.hp = Infinity; p.fire = true; p.fireT = rnd(6, 10);
    decal("scorch_" + irnd(0, 1), p.x, p.y - 4, 0, 0.8);
    saveProp(p);
  } else {
    const fireB = p.dk === "firebarrel";
    explode(p.x, p.y - 6, fireB ? 32 : 44, fireB ? 24 : 36, false, EX_ENV);
    if (fireB) spawnFire(p.x, p.y, 4);
    destroyProp(p);
  }
}

function updateActiveProps(dt) {
  for (let i = activeProps.length - 1; i >= 0; i--) {
    const p = activeProps[i];
    p.hitT = Math.max(0, p.hitT - dt);
    let busy = p.hitT > 0;
    if (p.state === PS_SMOKE && !p.gone) {
      busy = true;
      if (Math.random() < dt * 8) part(P_SMOKE, p.x + rnd(-6, 6), p.y - 12, rnd(-5, 5), rnd(-25, -10), rnd(0.8, 1.4), PC_SMOKE, 0, 0, rnd(3, 5));
    }
    if (p.state === PS_FUSE && !p.gone) {
      busy = true;
      p.fuse -= dt;
      if (Math.random() < dt * 14) part(P_FIRE, p.x + rnd(-6, 6), p.y - 10, rnd(-8, 8), rnd(-40, -20), rnd(0.3, 0.6), PC_FIRE, 0, 0, rnd(2, 4));
      if (p.fuse <= 0) blowProp(p);
    }
    if (p.fireT > 0) { // a wreck burns out
      busy = true;
      p.fireT -= dt;
      if (Math.random() < dt * 6) part(P_SMOKE, p.x + rnd(-6, 6), p.y - 14, rnd(-5, 5), rnd(-25, -10), rnd(1, 1.8), PC_SMOKE, 0, 0, rnd(4, 6));
      if (p.fireT <= 0) p.fire = false;
    }
    if (p.geyser > 0) { // a busted hydrant
      busy = true;
      p.geyser -= dt;
      for (let k = 0; k < 3; k++) part(P_WATER, p.x + rnd(-2, 2), p.y - 4, rnd(-25, 25), rnd(-25, 25), 2, Math.random() < 0.5 ? PC_WATER : PC_WATER2, 4, rnd(140, 210));
    }
    if (!busy) { p.active = false; activeProps.splice(i, 1); }
  }
}

// a blast reaches out into the world: props in range take damage (cars
// ignite fast, so they chain), building tiles crack and crumble
function blastWorld(x, y, r, dmg, src) {
  const reach = r + 12;
  for (const c of cellsIn(x - reach, y - reach, x + reach, y + reach, scratchCells2)) {
    for (const p of c.props) {
      if (p.gone || p.hp === Infinity) continue;
      const d = Math.hypot(p.x - x, p.y - 6 - y);
      if (d < reach) damageProp(p, dmg * 1.5 * (1 - d / reach) + 4, Math.atan2(p.y - y, p.x - x), true);
    }
  }
  blastBuildings(x, y, r * 0.9, dmg);
}
const scratchCells2 = [];

function blastBuildings(x, y, r, dmg) {
  const tx0 = Math.floor((x - r) / TILE), tx1 = Math.floor((x + r) / TILE);
  const ty0 = Math.floor((y - r) / TILE), ty1 = Math.floor((y + r) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (oob(tx, ty) || tileType(tx, ty) !== T_BLD) continue;
      const b = buildingAt(tx, ty);
      if (!b || b === EDGE_BLD) continue; // the city's outer ring holds
      const d = Math.hypot(tx * TILE + 8 - x, ty * TILE + 8 - y);
      if (d >= r) continue;
      const key = ty * MAP_W + tx;
      const was = WORLD.tiles.has(key) ? WORLD.tiles.get(key) : TILE_HP;
      const hp = was - dmg * 1.4 * (1 - d / r);
      if (hp <= 0) destroyTile(tx, ty, b);
      else {
        WORLD.tiles.set(key, hp);
        if (was === TILE_HP || Math.random() < 0.4) decal("crack_" + irnd(0, 1), tx * TILE + 8, ty * TILE + 8, 0, 0.9);
        burst(b.wall === "brick" ? "brick" : b.wall === "beige" ? "beige" : "concrete", tx * TILE + 8, ty * TILE + 14, 2, 80);
      }
    }
  }
}

function destroyTile(tx, ty, b) {
  const c = cellAt(tx, ty), i = (ty - c.y0) * c.w + tx - c.x0;
  c.T[i] = T_RUBBLE; c.bid[i] = -1; c.walk[i] = 1;
  for (const s of c.pg[i] || EMPTY) if (!s.dead) c.walk[i] = 0;
  const key = ty * MAP_W + tx;
  WORLD.tiles.set(key, -1);
  const ck = c.ci * 65536 + c.cj;
  let lst = WORLD.cellTiles.get(ck);
  if (!lst) { lst = []; WORLD.cellTiles.set(ck, lst); }
  lst.push(i);
  const mat = b.wall === "brick" ? "brick" : b.wall === "beige" ? "beige" : "concrete";
  burst(mat, tx * TILE + 8, ty * TILE + 8, 9, 160);
  burst("glass", tx * TILE + 8, ty * TILE + 8, 3, 120);
  dust(tx * TILE + 8, ty * TILE + 12, 6, 7);
  // repaint the chunks that can see this tile (facades above and below change)
  const S = CHUNK;
  for (let yy = ty - 2; yy <= ty + 1; yy++) for (let xx = tx - 1; xx <= tx + 1; xx++) chunkCache.delete(Math.floor(xx / S) * 65536 + Math.floor(yy / S));
}

// what is at a world point: 0 nothing, 1 a building, or the live prop rect
function solidAt(x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tileType(tx, ty) === T_BLD) return 1;
  for (const s of rectsAt(tx, ty)) if (!s.dead && x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return s;
  return 0;
}

// ---------------------------------------------------------------- UI ------
// ------------------------------------------------------------------ font ---
// Chunky pixel type: one 5x8 glyph atlas (tools/make_gore_art.py) turned
// into styled atlases on demand — optional bold, black outline, a two-tone
// fill — and cached per colour. ftext() is a drop-in for ctx.fillText: it
// reads ctx.font (size, bold, italic), ctx.fillStyle and ctx.textAlign.
const FONT_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~★♥·";
const FONT_IDX = new Map();
for (let i = 0; i < FONT_CHARS.length; i++) FONT_IDX.set(FONT_CHARS[i], i);
const FONT_SUB = { "“": '"', "”": '"', "‘": "'", "’": "'", "…": "...", "—": "-", "–": "-", "×": "x", "→": ">", "»": ">", "✓": "+", "⏸": "|" };
let glyphMask = null;
const fontAtlases = new Map(), colorProbe = document.createElement("canvas").getContext("2d");
function loadGlyphs() {
  const im = IMG.font_atlas;
  if (!imgOk(im)) return false;
  const c = document.createElement("canvas");
  c.width = im.width; c.height = im.height;
  const g = c.getContext("2d");
  g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, im.width, im.height).data;
  glyphMask = new Uint8Array(FONT_CHARS.length * 40);
  for (let i = 0; i < FONT_CHARS.length; i++) {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) glyphMask[i * 40 + y * 5 + x] = d[(y * im.width + i * 6 + x) * 4 + 3] > 128 ? 1 : 0;
  }
  return true;
}
function rgbOf(col) {
  colorProbe.fillStyle = "#fff"; colorProbe.fillStyle = col;
  const s = colorProbe.fillStyle;
  if (s[0] === "#") return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const m = s.match(/[\d.]+/g);
  return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
}
// glyph cell: (bold ? 6 : 5) + 2 wide, 10 high (1px outline all round)
let fontNoOutline = false; // logo fills are tinted afterwards: no outline wanted
function fontAtlas(col, bold) {
  const outline = !fontNoOutline;
  const key = col + (bold ? "|b" : "|n") + (outline ? "" : "|f");
  let a = fontAtlases.get(key);
  if (a) return a;
  if (!glyphMask && !loadGlyphs()) return null;
  const gw = bold ? 6 : 5, cw = gw + 2, ch = 10, n = FONT_CHARS.length;
  const c = document.createElement("canvas");
  c.width = cw * n; c.height = ch;
  const g = c.getContext("2d"), img = g.createImageData(c.width, ch), d = img.data;
  const [r, gg, b] = rgbOf(col);
  const fill = new Uint8Array(cw * ch);
  for (let i = 0; i < n; i++) {
    fill.fill(0);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) {
      if (!glyphMask[i * 40 + y * 5 + x]) continue;
      fill[(y + 1) * cw + x + 1] = 1;
      if (bold) fill[(y + 1) * cw + x + 2] = 1;
    }
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const o = (y * c.width + i * cw + x) * 4;
      if (fill[y * cw + x]) { // two-tone: the lower half a shade darker
        const k = y >= 5 ? 0.78 : 1;
        d[o] = r * k; d[o + 1] = gg * k; d[o + 2] = b * k; d[o + 3] = 255;
      } else {
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < cw && yy < ch && fill[yy * cw + xx]) { edge = true; break; }
        }
        if (edge && outline) { d[o] = 18; d[o + 1] = 12; d[o + 2] = 20; d[o + 3] = 255; }
      }
    }
  }
  g.putImageData(img, 0, 0);
  a = { canvas: c, cw, adv: gw + 1 };
  fontAtlases.set(key, a);
  return a;
}
let fontKey = "", fontSize = 8, fontBold = false, fontItalic = false;
function parseFont() {
  if (ctx.font === fontKey) return;
  fontKey = ctx.font;
  const m = /(\d+)px/.exec(fontKey);
  fontSize = m ? +m[1] : 8;
  fontBold = /bold/.test(fontKey) || fontSize >= 9;
  fontItalic = /italic/.test(fontKey);
}
const fontScale = () => fontSize >= 13 ? Math.max(2, Math.floor(fontSize / 7)) : 1;
function fchars(str) {
  let out = "";
  for (const ch of String(str)) out += FONT_IDX.has(ch) ? ch : (FONT_SUB[ch] || "?");
  return out;
}
function fmeasure(str) {
  parseFont();
  return fchars(str).length * (fontBold ? 7 : 6) * fontScale();
}
// draws like ftext(str, x, baselineY)
function ftext(str, x, y) {
  parseFont();
  const s = fchars(str), sc = fontScale();
  const col = typeof ctx.fillStyle === "string" ? ctx.fillStyle : "#ffffff";
  const a = fontAtlas(col, fontBold);
  if (!a) return;
  const w = s.length * a.adv * sc;
  let x0 = ctx.textAlign === "center" ? x - w / 2 : ctx.textAlign === "right" ? x - w : x;
  x0 = Math.round(x0); const top = Math.round(y - 8 * sc);
  if (fontItalic) { ctx.save(); ctx.transform(1, 0, -0.2, 1, (y) * 0.2, 0); }
  for (let i = 0; i < s.length; i++) {
    const gi = FONT_IDX.get(s[i]);
    if (gi === 0) continue;
    ctx.drawImage(a.canvas, gi * a.cw, 0, a.cw, 10, x0 + i * a.adv * sc - sc, top, a.cw * sc, 10 * sc);
  }
  if (fontItalic) ctx.restore();
}
// convenience: draw with an explicit style, restoring nothing (callers set ctx state freely)
function ftx(str, x, y, size, col, align = "left", italic = false) {
  ctx.font = `${italic ? "italic " : ""}bold ${size}px monospace`;
  ctx.fillStyle = col; ctx.textAlign = align;
  ftext(str, x, y);
}

// ------------------------------------------------------------------- HUD ---
function bar(x, y, w, h, frac, fg, bg = "#241c2e") {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h);
  ctx.strokeStyle = "#0b0910"; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function panel(x, y, w, h, edge = "#3a3346") {
  ctx.fillStyle = "rgba(10,8,16,0.72)"; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x + 1, y + 1, w - 2, 1);
}

function renderHUD() {
  const st = player.stats, t = G.t, w = WEAPONS[G.weapon];
  // --- top-left: the gun, its ammo, health
  panel(4, 4, 112, 44);
  const icon = IMG[w.sprite];
  if (icon && icon.complete) {
    const s = Math.min(1.6, 26 / icon.width, 14 / icon.height);
    const kick = player.recoil * 0.6;
    ctx.drawImage(icon, Math.round(9 - kick), Math.round(12 - icon.height * s / 2 + 3), Math.round(icon.width * s), Math.round(icon.height * s));
  }
  const clip = clipSize(), low = player.ammo <= Math.max(1, clip * 0.2);
  if (player.reloadT > 0) {
    const p = 1 - player.reloadT / (w.reload * st.reloadMul);
    ftx("RELOAD", 40, 18, 9, Math.floor(t * 8) % 2 ? "#ffd166" : "#ff8a2a");
    bar(40, 20, 70, 3, p, "#ffd166");
  } else {
    ftx(String(player.ammo), 40, 23, 14, low && Math.floor(t * 6) % 2 ? "#ff4d4d" : "#ffffff");
    ftx("/" + clip, 42 + fmeasure(String(player.ammo)), 23, 8, "#8f84a8");
  }
  // health: segmented bar with a white "lag" that drains after a hit
  const hx = 8, hy = 30, hw = 104, hh = 7;
  ctx.fillStyle = "#1a1220"; ctx.fillRect(hx, hy, hw, hh);
  ctx.fillStyle = "#f4f0f8"; ctx.fillRect(hx, hy, Math.round(hw * clamp(player.hpLag / st.maxHp, 0, 1)), hh);
  const hpF = clamp(player.hp / st.maxHp, 0, 1);
  ctx.fillStyle = hpF < 0.3 && Math.floor(t * 5) % 2 ? "#ff2a3a" : "#d8283a"; ctx.fillRect(hx, hy, Math.round(hw * hpF), hh);
  ctx.fillStyle = "#ff6a78"; ctx.fillRect(hx, hy, Math.round(hw * hpF), 2);
  ctx.fillStyle = "rgba(10,8,16,0.6)";
  for (let i = 1; i < 10; i++) ctx.fillRect(hx + Math.round(hw * i / 10), hy, 1, hh);
  ctx.strokeStyle = "#0b0910"; ctx.strokeRect(hx - 0.5, hy - 0.5, hw + 1, hh + 1);
  ftx("♥", hx + 1, hy + 7, 8, "#ffffff");
  ftx(String(Math.ceil(player.hp * NUM_MULT)), hx + hw - 2, hy + 7, 8, "#ffffff", "right");
  // xp + dash
  bar(hx, 40, 68, 3, player.xp / xpNeeded(player.level), "#7bd88f", "#16201a");
  ftx("LV" + player.level, hx + 72, 44, 8, "#7bd88f");
  const dashP = 1 - player.dashCd / 1.6;
  ctx.fillStyle = dashP >= 1 ? "#78ffdc" : "#2a4a48"; ctx.fillRect(hx + 96, 40, Math.round(8 * clamp(dashP, 0, 1)), 3);

  // --- top-right: the money counter, multiplier, threat stars
  G.scoreShown += (G.score - G.scoreShown) * 0.2;
  if (Math.abs(G.score - G.scoreShown) < 1) G.scoreShown = G.score;
  const money = "$" + String(Math.round(G.scoreShown)).padStart(8, "0");
  ftx(money, VW - 6, 20, 14, "#8cf25a", "right");
  if (G.mult > 1 || G.combo > 0) {
    const pop = G.comboT > 2.85 ? 21 : 14; // the number punches when it grows
    ftx("x" + G.mult, VW - 6, 40, pop, G.mult >= 5 ? "#ff4d4d" : "#ffb347", "right");
    ctx.fillStyle = "#3a2c18"; ctx.fillRect(VW - 66, 43, 60, 2);
    ctx.fillStyle = "#ffb347"; ctx.fillRect(VW - 66, 43, Math.round(60 * G.comboT / 3), 2);
    ftx(G.combo + " KILLS", VW - 10 - (String(G.mult).length + 1) * 7 * (pop >= 21 ? 3 : 2), 39, 8, "#cfc6de", "right");
  }
  const stars = Math.min(6, 1 + Math.floor(G.wave / 3)), boss = G.wave % 5 === 0;
  for (let i = 0; i < 6; i++) {
    const on = i < stars;
    const col = !on ? "#2a2434" : boss ? (Math.floor(t * 6 + i) % 2 ? "#ff3a3a" : "#3a7aff") : "#ffd166";
    ftx("★", VW - 8 - (6 - i) * 9, 56, 8, col);
  }
  // pause button
  pauseBtnRect = { x: VW - 24, y: 60, w: 18, h: 16 };
  panel(pauseBtnRect.x, pauseBtnRect.y, pauseBtnRect.w, pauseBtnRect.h);
  ctx.fillStyle = "#cfc6de";
  ctx.fillRect(pauseBtnRect.x + 5, pauseBtnRect.y + 4, 3, 8);
  ctx.fillRect(pauseBtnRect.x + 10, pauseBtnRect.y + 4, 3, 8);

  // --- top-centre: wave + what's left
  ftx("WAVE " + G.wave, VW / 2, 13, 9, boss ? "#ff6b6b" : "#ffd166", "center");
  ftx(`${ZOMBIES.n + spawnQueue.length} LEFT`, VW / 2, 22, 8, "#8f84a8", "center");

  // crosshair: hollow while auto-aiming, filled red while you hold fire
  if (mouse.seen && !usingTouch) {
    const mx = Math.round(mouse.x), my = Math.round(mouse.y), c = mouse.down ? "#ff3a3a" : "#e8dfc8", g = mouse.down ? 2 : 3;
    ctx.fillStyle = "#140f18";
    ctx.fillRect(mx - 6, my - 1, 4, 3); ctx.fillRect(mx + 3, my - 1, 4, 3); ctx.fillRect(mx - 1, my - 6, 3, 4); ctx.fillRect(mx - 1, my + 3, 3, 4);
    ctx.fillStyle = c;
    ctx.fillRect(mx - 5 - g + 3, my, 3, 1); ctx.fillRect(mx + g + 1, my, 3, 1); ctx.fillRect(mx, my - 5 - g + 3, 1, 3); ctx.fillRect(mx, my + g + 1, 1, 3);
    if (mouse.down) ctx.fillRect(mx, my, 1, 1);
  }
  renderPager();
  renderKingArrow();
  renderBanners();
  renderMinimap();

  // armorer weapon inventory (dev mode only)
  if (DEV.on && G.cls === "armorer") renderInventoryBar();
  else invRects = [];

  // touch dash button
  if (usingTouch) {
    const ready = player.dashCd <= 0;
    ctx.beginPath(); ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = ready ? "rgba(120,255,220,0.25)" : "rgba(120,110,140,0.18)";
    ctx.fill();
    if (!ready) { // cooldown wedge
      ctx.beginPath();
      ctx.moveTo(DASH_BTN.x, DASH_BTN.y);
      ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, -Math.PI / 2, -Math.PI / 2 + (1 - player.dashCd / 1.6) * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(120,255,220,0.2)"; ctx.fill();
    }
    ctx.strokeStyle = ready ? "#78ffdc" : "#6f6485"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(DASH_BTN.x, DASH_BTN.y, DASH_BTN.r, 0, Math.PI * 2); ctx.stroke();
    ftx("»", DASH_BTN.x, DASH_BTN.y + 4, 9, ready ? "#ffffff" : "#8f84a8", "center");
  }
}

// GTA-style pager: a green LCD that types the hero's thoughts
function renderPager() {
  const pg = G.pager;
  if (!pg.cur) return;
  const slide = Math.min(1, pg.t * 6), out = Math.max(0, pg.t - (pg.cur.length * 0.035 + 2.6)) * 4;
  // below the HUD panels; fades instead of sliding so it never crosses them
  const y = 52;
  ctx.globalAlpha = slide * (1 - Math.min(1, out));
  if (ctx.globalAlpha <= 0) { ctx.globalAlpha = 1; return; }
  const w = Math.min(300, Math.max(140, fchars(pg.cur).length * 6 + 26)), x = Math.round(VW / 2 - w / 2);
  ctx.fillStyle = "#1c1a22"; ctx.fillRect(x - 3, y - 3, w + 6, 22);
  ctx.fillStyle = "#3a3846"; ctx.fillRect(x - 3, y - 3, w + 6, 1);
  ctx.fillStyle = "#9bb06a"; ctx.fillRect(x, y, w, 16);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (let i = 0; i < 16; i += 2) ctx.fillRect(x, y + i, w, 1); // LCD rows
  const shown = pg.cur.slice(0, Math.floor(pg.t / 0.035));
  ctx.font = "8px monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#26301a";
  ftextFlat(shown + (Math.floor(pg.t * 3) % 2 ? "_" : ""), x + 5, y + 12);
  ctx.globalAlpha = 1;
}
// LCD text: no outline, so it reads like the pager screen
function ftextFlat(str, x, y) {
  const s = fchars(str);
  if (!glyphMask && !loadGlyphs()) return;
  ctx.fillStyle = "#26301a";
  for (let i = 0; i < s.length; i++) {
    const gi = FONT_IDX.get(s[i]);
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 5; xx++) if (glyphMask[gi * 40 + yy * 5 + xx]) ctx.fillRect(x + i * 6 + xx, y - 8 + yy, 1, 1);
  }
}

// a big yellow arrow orbiting the hero, pointing at the King (GTA 2 style)
function renderKingArrow() {
  if (!kingPos || G.kingSeen) return;
  const sx = player.x - G.cam.x, sy = player.y - G.cam.y - 12;
  const kx = kingPos.x - G.cam.x, ky = kingPos.y - G.cam.y;
  if (kx > 20 && kx < VW - 20 && ky > 20 && ky < VH - 20) return;
  const a = Math.atan2(ky - sy, kx - sx), r = 30 + Math.sin(G.t * 5) * 2;
  const x = sx + Math.cos(a) * r, y = sy + Math.sin(a) * r;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
  ctx.fillStyle = "#140f18";
  ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// centre messages punch in big and settle: integer pixel scales only
function renderBanners() {
  for (const b of banners) {
    const p = b.t / b.dur;
    const sc = b.t < 0.06 ? 6 : b.t < 0.12 ? 5 : 4;
    const alpha = p > 0.8 ? (1 - p) / 0.2 : 1;
    ctx.globalAlpha = alpha;
    const size = b.punch ? sc * 7 : 14;
    const y = 104 + (b.punch ? Math.sin(Math.min(1, b.t * 8) * Math.PI) * -4 : 0);
    ftx(b.s, VW / 2, y, size, b.col, "center", true);
    if (b.sub) ftx(b.sub, VW / 2, y + 14, 9, "#e8dfc8", "center");
    ctx.globalAlpha = 1;
  }
}

// world-space floating texts on the UI layer
function renderWorldTexts() {
  const ox = Math.round(G.cam.x), oy = Math.round(G.cam.y);
  for (let i = 0; i < TEXTS.n; i++) {
    const e = TEXTS.dense[i], t = TXO[e];
    const age = MAXL[e] - LIFE[e];
    const size = t.big ? (age < 0.07 ? 21 : 14) : (age < 0.05 ? 14 : 8);
    ctx.globalAlpha = Math.min(1, LIFE[e] * 4);
    ftx(t.s, Math.round(PX[e]) - ox, Math.round(PY[e]) - oy, size, t.col, "center");
  }
  ctx.globalAlpha = 1;
}

let pauseBtnRect = null, fsPauseRect = null, invRects = [];

// radar, bottom-left: the streets around you (white), the horde (red);
// the King is a gold dot, or a gold arrow on the rim when out of range
// round GTA-style radar: tiles are sampled into a padded canvas a few times a
// second and scrolled by the sub-sample offset every frame, then masked to a disc
const RADAR_R = 34, RADAR_D = RADAR_R * 2, RADAR_TPP = 2, RADAR_PAD = 10; // tiles per radar pixel
const RADAR_S = RADAR_D + RADAR_PAD * 2;
// by tile type: buildings, road, sidewalk, lot, grass, plaza, rubble, off-map
const RADAR_COL = ["#2b2f3c", "#858ea0", "#3f4452", "#353946", "#2c4a35", "#8a7444", "#4d4038", "#08090d"];
// two sample canvases: the front one is drawn while the back one refills a
// slice of rows per frame, so a resample never costs a whole frame
let radarCanvas = null, radarBack = null, radarDisc = null, radarBezel = null;
let radarT = 0, radarOX = 0, radarOY = 0, radarHead = 0;
let radarJob = -1, radarJX = 0, radarJY = 0, radarReady = false;
const RADAR_ROWS = 22; // rows resampled per frame
function pixelDisc(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let y = -r; y < r; y++) {
    const w = Math.round(Math.sqrt(r * r - (y + 0.5) * (y + 0.5)));
    c.fillRect(cx - w, cy + y, w * 2, 1);
  }
}
function initRadar() {
  radarCanvas = document.createElement("canvas"); radarCanvas.width = radarCanvas.height = RADAR_S;
  radarBack = document.createElement("canvas"); radarBack.width = radarBack.height = RADAR_S;
  radarDisc = new Path2D();
  for (let y = -RADAR_R; y < RADAR_R; y++) {
    const w = Math.round(Math.sqrt(RADAR_R * RADAR_R - (y + 0.5) * (y + 0.5)));
    radarDisc.rect(RADAR_R - w, RADAR_R + y, w * 2, 1);
  }
  const B = RADAR_D + 8, bz = document.createElement("canvas"); bz.width = bz.height = B;
  const c = bz.getContext("2d"), m = B / 2;
  pixelDisc(c, m, m, RADAR_R + 4, "#07060b");
  pixelDisc(c, m, m, RADAR_R + 3, "#4a4458");
  c.globalCompositeOperation = "source-atop"; // light from the top-left, shade bottom-right
  c.fillStyle = "#8a82a0"; c.fillRect(0, 0, m - 6, m - 6);
  c.fillStyle = "#26222f"; c.fillRect(m + 6, m + 6, m, m);
  c.globalCompositeOperation = "source-over";
  pixelDisc(c, m, m, RADAR_R + 1, "#07060b");
  c.globalCompositeOperation = "destination-out";
  pixelDisc(c, m, m, RADAR_R, "#000");
  radarBezel = bz;
}
function resampleRows(c, ox, oy, y0, y1) {
  // fillRect runs, not putImageData: re-uploading pixel data stalls some GPUs
  for (let y = y0; y < y1; y++) {
    let runX = 0, runC = -1;
    for (let x = 0; x <= RADAR_S; x++) {
      const tx = ox + x * RADAR_TPP, ty = oy + y * RADAR_TPP;
      const k = x === RADAR_S ? -2 : oob(tx, ty) ? 7 : tileType(tx, ty);
      if (k === runC) continue;
      if (runC !== -1) { c.fillStyle = RADAR_COL[runC]; c.fillRect(runX, y, x - runX, 1); }
      runX = x; runC = k;
    }
  }
}
function stepRadar(ptx, pty, dx, dy) {
  if (radarJob < 0) {
    if ((radarT -= 1 / 60) > 0 && Math.abs(dx) < RADAR_PAD - 4 && Math.abs(dy) < RADAR_PAD - 4) return;
    radarT = 0.5; // also picks up fresh rubble
    radarJob = 0;
    radarJX = Math.floor(ptx) - (RADAR_R + RADAR_PAD) * RADAR_TPP;
    radarJY = Math.floor(pty) - (RADAR_R + RADAR_PAD) * RADAR_TPP;
  }
  const y1 = Math.min(RADAR_S, radarJob + RADAR_ROWS);
  resampleRows(radarBack.getContext("2d"), radarJX, radarJY, radarJob, y1);
  radarJob = y1;
  if (radarJob >= RADAR_S) {
    const t = radarCanvas; radarCanvas = radarBack; radarBack = t;
    radarOX = radarJX; radarOY = radarJY; radarJob = -1;
  }
}
function renderMinimap() {
  if (!radarCanvas) initRadar();
  const ptx = player.x / TILE, pty = player.y / TILE;
  // radar pixels between the sample origin and where the view wants to be
  if (!radarReady) { // new map: fill synchronously once
    radarReady = true;
    radarJob = -1; radarT = 0; stepRadar(ptx, pty, 0, 0);
    while (radarJob >= 0) stepRadar(ptx, pty, 0, 0);
  }
  // radar pixels between the sample origin and where the view wants to be
  const dx = (ptx - RADAR_R * RADAR_TPP - radarOX) / RADAR_TPP - RADAR_PAD;
  const dy = (pty - RADAR_R * RADAR_TPP - radarOY) / RADAR_TPP - RADAR_PAD;
  stepRadar(ptx, pty, dx, dy);

  const x0 = 10, y0 = VH - RADAR_D - 10, cx = x0 + RADAR_R, cy = y0 + RADAR_R;
  ctx.save();
  ctx.translate(x0, y0); ctx.clip(radarDisc);
  ctx.globalAlpha = 0.92;
  ctx.drawImage(radarCanvas, -RADAR_PAD - Math.round(dx), -RADAR_PAD - Math.round(dy));
  ctx.globalAlpha = 1;
  // sweep: a soft wedge trailing the beam
  const sa = G.t * 1.6;
  ctx.fillStyle = "rgba(160,255,200,0.07)";
  ctx.beginPath(); ctx.moveTo(RADAR_R, RADAR_R); ctx.arc(RADAR_R, RADAR_R, RADAR_R * 1.5, sa - 0.7, sa); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(160,255,200,0.08)";
  ctx.beginPath(); ctx.moveTo(RADAR_R, RADAR_R); ctx.arc(RADAR_R, RADAR_R, RADAR_R * 1.5, sa - 0.25, sa); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.drawImage(radarBezel, x0 - 4, y0 - 4);

  const inR = RADAR_R - 2, k = 1 / TILE / RADAR_TPP;
  for (let i = 0; i < ZOMBIES.n && i < 150; i++) {
    const z = ZO[ZOMBIES.dense[i]];
    if (z.warmup > 0) continue;
    const px = (z.x - player.x) * k, py = (z.y - player.y) * k;
    if (px * px + py * py > inR * inR) continue;
    if (z.bossBar) {
      const pulse = Math.floor(G.t * 4) % 2;
      ctx.fillStyle = "#07060b"; ctx.fillRect(Math.round(cx + px) - 2, Math.round(cy + py) - 2, 5, 5);
      ctx.fillStyle = pulse ? "#ff4d4d" : "#ff9a9a"; ctx.fillRect(Math.round(cx + px) - 1, Math.round(cy + py) - 1, 3, 3);
    } else {
      ctx.fillStyle = "#ff3846"; ctx.fillRect(Math.round(cx + px), Math.round(cy + py), 1, 1);
    }
  }
  if (kingPos) {
    const px = (kingPos.x - player.x) * k, py = (kingPos.y - player.y) * k, d = Math.hypot(px, py);
    const on = Math.floor(G.t * 2.5) % 2;
    if (d <= inR - 2) {
      ctx.fillStyle = "#07060b"; ctx.fillRect(Math.round(cx + px) - 3, Math.round(cy + py) - 3, 7, 7);
      ctx.fillStyle = on ? "#ffd166" : "#fff2c0"; ctx.fillRect(Math.round(cx + px) - 2, Math.round(cy + py) - 2, 5, 5);
    } else { // gold blip pinned to the rim, nudging outward
      const a = Math.atan2(py, px), r = RADAR_R + 1 + on;
      const bx = Math.round(cx + Math.cos(a) * r), by = Math.round(cy + Math.sin(a) * r);
      ctx.fillStyle = "#07060b"; ctx.fillRect(bx - 3, by - 3, 7, 7);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(bx - 2, by - 2, 5, 5);
      ctx.fillStyle = "#07060b"; ctx.fillRect(bx, by - 1, 1, 3); ctx.fillRect(bx - 1, by, 3, 1);
    }
  }
  // N marker on the bezel
  ctx.fillStyle = "#07060b"; ctx.fillRect(cx - 4, y0 - 6, 9, 10);
  ftx("N", cx + 1, y0 + 3, 8, "#e8dfc8", "center");
  // the hero: a white arrow toward where they move / shoot
  const want = aiming() ? player.atkAng : player.moving ? Math.atan2(player.vy, player.vx) : radarHead;
  radarHead += Math.atan2(Math.sin(want - radarHead), Math.cos(want - radarHead)) * 0.25;
  ctx.save(); ctx.translate(cx + 0.5, cy + 0.5); ctx.rotate(radarHead);
  ctx.fillStyle = "#07060b";
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -3); ctx.lineTo(-1, 0); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
  ctx.restore();
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
  ftext(`ARMORY — ${WEAPONS[G.weapon].name} · tap a slot or Q/E to cycle`, VW / 2, y - 4);
}
function renderPauseOverlay(t) {
  ctx.fillStyle = "rgba(7,5,16,0.7)"; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = "center";
  ctx.font = "bold 20px monospace"; ctx.fillStyle = "#ffd166";
  ftext("PAUSED", VW / 2, 110);
  ctx.font = "8px monospace"; ctx.fillStyle = "#cfc6de";
  ftext("tap / press P to resume", VW / 2, 130);
  const bw = 150, bh = 24;
  fsPauseRect = { x: VW / 2 - bw / 2, y: 150, w: bw, h: bh };
  ctx.fillStyle = "#241c2e"; ctx.fillRect(fsPauseRect.x, fsPauseRect.y, bw, bh);
  ctx.strokeStyle = "#8a6a30"; ctx.lineWidth = 1;
  ctx.strokeRect(fsPauseRect.x + 0.5, fsPauseRect.y + 0.5, bw - 1, bh - 1);
  ctx.font = "bold 8px monospace"; ctx.fillStyle = "#e8dfc8";
  ftext("FULLSCREEN  [F]", VW / 2, fsPauseRect.y + 15);
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
  ftext(`WAVE ${G.wave} CLEARED`, VW / 2, 26);
  ctx.font = "8px monospace"; ctx.fillStyle = "#cfc6de";
  ftext(campfire.picksLeft > 0 ? `pick a card (${campfire.picksLeft} left)` : "rested and ready", VW / 2, 40);

  // gold purse
  const cim0 = IMG.coin_f0;
  if (cim0 && cim0.complete) ctx.drawImage(cim0, VW - 52, 14);
  ctx.textAlign = "right"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ftext(`${G.coins}`, VW - 14, 24);

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
      ftext(rar.name, x + 6, y + 13);
      ctx.textAlign = "right"; ctx.fillStyle = "#8f84a8";
      ftext(`[${i + 1}]`, x + cw - 6, y + 13);
      const icon = IMG[c.icon];
      if (icon && icon.complete) {
        const s = Math.min(2.4, 34 / icon.height);
        ctx.drawImage(icon, Math.round(x + cw / 2 - icon.width * s / 2), Math.round(y + 26 + (38 - icon.height * s) / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      }
      ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
      ftext(c.name, x + cw / 2, y + 80);
      ctx.font = "8px monospace"; ctx.fillStyle = "#c9c0da";
      wrapText(c.desc, x + cw / 2, y + 94, cw - 12, 10);
      const cnt = cardCounts[c.id] || 0;
      if (cnt > 0) {
        ctx.font = "7px monospace"; ctx.fillStyle = "#7bd88f";
        ftext(`owned ${cnt}/${c.max}`, x + cw / 2, y + chh - 7);
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
    ftext(`NEXT WAVE  [ENTER]`, VW / 2, by + 19);
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
      const s = it.icon === "card" ? 0.28 : 1;
      ctx.drawImage(icon, x + 6, Math.round(y + bh / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
    }
    ctx.font = "8px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = afford ? "#e8dfc8" : "#57506b";
    ftext(`${it.label} [${it.key}]`, x + 24, y + 15);
    ctx.textAlign = "right";
    ctx.fillStyle = afford ? "#ffd166" : "#57506b";
    ftext(`${it.cost}g`, x + bw - 6, y + 15);
  }

  // toast
  if (campfire.toast) {
    campfire.toast.t -= dt;
    if (campfire.toast.t <= 0) campfire.toast = null;
    else {
      ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd166";
      ftext(campfire.toast.s, VW / 2, VH - 42);
    }
  }
}

function wrapText(text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (fmeasure(test) > maxW && line) {
      ftext(line, x, yy); line = w; yy += lh;
    } else line = test;
  }
  ftext(line, x, yy);
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
    if (fmeasure(t) > maxW && line) { out.push(line); line = w; }
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
      ftext(l.s, VW / 2, y);
      if (l.deco === "heart") {
        const w = fmeasure(l.s);
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
  // FX toggle (lighting + CRT)
  let rf = menuButton(VW - 140, SND.fx);
  ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
  ctx.fillStyle = SND.fx ? "#e8dfc8" : "#57506b";
  ftext("FX", rf.x + rf.w / 2, rf.y + 13);
  if (!SND.fx) slashOut(rf);
  sndBtnRects.push({ ...rf, id: "fx" });
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
  ftext("DEVELOPER ACCESS", VW / 2 + 6, py + 16);
  // masked input (tap to summon the keyboard)
  passRects.box = { x: px + 20, y: py + 28, w: pw2 - 40, h: 18 };
  ctx.fillStyle = "#241c2e"; ctx.fillRect(px + 20, py + 28, pw2 - 40, 18);
  ctx.strokeStyle = document.activeElement === devInput ? "#8a6a30" : "#57506b";
  ctx.strokeRect(px + 20.5, py + 28.5, pw2 - 41, 17);
  ctx.font = "bold 10px monospace"; ctx.fillStyle = "#e8dfc8";
  const dots = "*".repeat(passModal.input.length) + (Math.floor(performance.now() / 400) % 2 ? "_" : " ");
  ftext(dots, VW / 2, py + 41);
  if (passModal.errT > 0) {
    passModal.errT -= dt;
    ctx.font = "7px monospace"; ctx.fillStyle = "#ff6b6b";
    ftext("wrong password", VW / 2, py + 56);
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
    ftext(label, r.x + r.w / 2, r.y + 13);
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
  if (id === "ghost") return "locked · or reach wave 10";
  if (id === "demo" || id === "heavy") return "locked · or find a boss relic";
  return "locked";
}

// shared menu backdrop: dark, a warm glow, a slow diagonal hazard stripe
function menuBg(t, title) {
  ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);
  const g = ctx.createRadialGradient(VW / 2, 40, 8, VW / 2, 40, 220);
  g.addColorStop(0, "rgba(252,120,50,0.14)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let x = -VH + ((t * 12) % 24); x < VW; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, VH); ctx.lineTo(x + 10, VH); ctx.lineTo(x + 10 + VH, 0); ctx.lineTo(x + VH, 0); ctx.fill();
  }
  ctx.fillStyle = "#b81414"; ctx.fillRect(0, 42, VW, 2);
  ftx(title, 10, 34, 14, "#ffd166", "left", true);
  // the bank
  const cim = IMG.coin_f0;
  if (cim && cim.complete) ctx.drawImage(cim, 12, 50);
  ftx("$" + META.gold + " BANKED", 26, 59, 9, "#8cf25a");
}

function renderClassSelect(t) {
  menuBg(t, "CHOOSE YOUR HERO");
  clsRects = [];
  const ids = visibleClasses();
  const cols = 3, rows = Math.ceil(ids.length / cols), gap = 6;
  const cw = Math.floor((VW - 20 - (cols - 1) * gap) / cols);
  const chh = Math.min(70, Math.floor((VH - 70 - 22 - (rows - 1) * gap) / rows));
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], c = CLASSES[id];
    const unlocked = isUnlocked(c.unlock);
    const x = 10 + (i % cols) * (cw + gap), y = 68 + Math.floor(i / cols) * (chh + gap);
    clsRects.push({ x, y, w: cw, h: chh, id, unlocked });
    const hot = unlocked && Math.floor(t * 2 + i) % 7 === 0;
    panel(x, y, cw, chh, unlocked ? (hot ? "#ffd166" : "#8a6a30") : "#2a2434");
    ctx.fillStyle = unlocked ? "rgba(255,209,102,0.06)" : "rgba(0,0,0,0.3)"; ctx.fillRect(x + 1, y + 1, 40, chh - 2);
    drawSprite(animFrame(ANIM[c.anim + "_idle"], t + i * 0.4, 6), x + 21, y + chh - 8, false, 1.6, unlocked ? 1 : 0.3);
    ftx(`${i + 1}`, x + 4, y + 11, 8, "#a5834a");
    ftx(c.name.toUpperCase(), x + 46, y + 14, 9, unlocked ? "#ffffff" : "#6f6485");
    ctx.font = "8px monospace"; ctx.fillStyle = unlocked ? "#b9aed0" : "#57506b"; ctx.textAlign = "left";
    wrapText(unlocked ? c.desc : unlockHint(id, c), x + 46, y + 26, cw - 50, 9);
    if (!unlocked) {
      const afford = META.gold >= c.price;
      ftx(`BUY $${c.price}`, x + cw - 6, y + chh - 6, 9, afford ? "#8cf25a" : "#57506b", "right");
    }
  }
  if (clsToast) {
    clsToast.t -= 1 / 60;
    if (clsToast.t <= 0) clsToast = null;
    else ftx(clsToast.s, VW / 2, VH - 20, 9, "#ffd166", "center");
  }
  ftx(`PRESS 1-${ids.length} · LOCKED HEROES CAN BE BOUGHT WITH BANKED $`, VW / 2, VH - 6, 8, "#6f6485", "center");
  drawKeyButton();
}

// weapon select --------------------------------------------------------------
let selectRects = [];
function renderSelect(t) {
  menuBg(t, "GUN SHOP");
  drawSprite(animFrame(ANIM[CLASSES[G.cls].anim + "_idle"], t, 6), VW - 40, 100, false, 2);
  ftx(CLASSES[G.cls].name.toUpperCase(), VW - 40, 116, 9, "#ffffff", "center");

  selectRects = []; upRects = [];
  const ids = CLASSES[G.cls].weapons;
  const many = ids.length > 4;
  const pw = many ? 196 : 330, ph = many ? 30 : 46, gap = 6;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], w = WEAPONS[id];
    const unlocked = isUnlocked(w.unlock);
    const x = 10 + (many ? (i % 2) * (pw + 6) : 0), y = 68 + (many ? Math.floor(i / 2) : i) * (ph + gap);
    selectRects.push({ x, y, w: pw - 56, h: ph, id, unlocked });
    panel(x, y, pw, ph, unlocked ? "#8a6a30" : "#2a2434");
    const icon = IMG[w.sprite];
    if (icon && icon.complete) {
      const s = Math.min(2, (ph - 8) / icon.height, 34 / icon.width);
      ctx.globalAlpha = unlocked ? 1 : 0.35;
      ctx.drawImage(icon, Math.round(x + 22 - icon.width * s / 2), Math.round(y + ph / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      ctx.globalAlpha = 1;
    }
    const lv = wpnLevel(id);
    ftx(`${i + 1} ${w.name.toUpperCase()}${lv > 0 ? ` +${lv}` : ""}`, x + 44, y + 13, 9, unlocked ? "#ffffff" : "#57506b");
    const dmgNow = big(w.dmg * (1 + 0.08 * lv));
    if (!many) ftx(unlocked ? w.desc : "locked", x + 44, y + 25, 8, unlocked ? "#b9aed0" : "#453f58");
    ftx(`DMG ${dmgNow}${w.pellets ? "x" + w.pellets : ""}${w.blast ? " AOE" : ""} · ${w.atkSpd}/S · ${w.clip} RDS`, x + 44, y + (many ? 25 : 38), 8, unlocked ? "#ffd166" : "#453f58");
    // upgrade button (persistent, costs banked gold, price climbs per level)
    if (unlocked) {
      const ur = { x: x + pw - 52, y: y + 3, w: 48, h: ph - 6, id };
      upRects.push(ur);
      const maxed = lv >= WPN_MAX_LV, cost = wpnUpCost(id), afford = !maxed && META.gold >= cost;
      ctx.fillStyle = afford ? "#2e2438" : "#181322"; ctx.fillRect(ur.x, ur.y, ur.w, ur.h);
      ctx.strokeStyle = afford ? "#8cf25a" : "#3a3346"; ctx.strokeRect(ur.x + 0.5, ur.y + 0.5, ur.w - 1, ur.h - 1);
      if (maxed) ftx("MAX", ur.x + ur.w / 2, ur.y + ur.h / 2 + 4, 9, "#ffd166", "center");
      else {
        ftx("+8%", ur.x + ur.w / 2, ur.y + ur.h / 2 - (many ? 1 : 2), 8, afford ? "#ffffff" : "#57506b", "center");
        ftx("$" + cost, ur.x + ur.w / 2, ur.y + ur.h / 2 + (many ? 9 : 10), 8, afford ? "#8cf25a" : "#57506b", "center");
      }
    }
  }
  if (selToast) {
    selToast.t -= 1 / 60;
    if (selToast.t <= 0) selToast = null;
    else ftx(selToast.s, VW / 2, VH - 20, 9, "#ffd166", "center");
  }
  ftx(`PRESS 1-${ids.length} TO FIGHT · UPGRADES ARE FOREVER`, VW / 2, VH - 6, 8, "#6f6485", "center");
  drawKeyButton();
}

// title / end screens -------------------------------------------------------
// the logo is built once: a thick black outline, a hot gradient fill, then
// "BLASTER" on a red slab underneath, all in the pixel font
let logoCanvas = null;
function buildLogo() {
  const c = document.createElement("canvas");
  c.width = 460; c.height = 110;
  const g = c.getContext("2d"), keep = ctx;
  g.imageSmoothingEnabled = false;
  ctx = g;
  const word = (s, x, y, size, outline, fill, grad) => {
    ctx.font = `bold ${size}px monospace`; ctx.textAlign = "center";
    // outline: the word in black, stamped around in a ring
    const sc = fontScale(), o = Math.max(2, sc >> 1);
    for (let dy = -o; dy <= o; dy += o) for (let dx = -o; dx <= o; dx += o) { ctx.fillStyle = outline; ftext(s, x + dx, y + dy); }
    // fill, tinted with the gradient through a scratch layer
    const l = document.createElement("canvas");
    l.width = c.width; l.height = c.height;
    const lg = l.getContext("2d");
    lg.imageSmoothingEnabled = false;
    ctx = lg; ctx.font = `bold ${size}px monospace`; ctx.textAlign = "center"; ctx.fillStyle = fill;
    fontNoOutline = true; ftext(s, x, y); fontNoOutline = false;
    if (grad) {
      lg.globalCompositeOperation = "source-atop";
      const gr = lg.createLinearGradient(0, y - 8 * sc, 0, y);
      for (const [o2, col] of grad) gr.addColorStop(o2, col);
      lg.fillStyle = gr; lg.fillRect(0, 0, l.width, l.height);
    }
    ctx = g;
    g.drawImage(l, 0, 0);
  };
  word("ZOMBIE", 230, 62, 42, "#120a10", "#ffffff", [[0, "#fff3a0"], [0.3, "#ffc83a"], [0.6, "#ff7a1a"], [0.85, "#d8261a"], [1, "#7a0810"]]);
  g.fillStyle = "#120a10"; g.fillRect(100, 67, 260, 37);
  g.fillStyle = "#b81414"; g.fillRect(102, 69, 256, 33);
  g.fillStyle = "#e0303a"; g.fillRect(102, 69, 256, 2);
  g.fillStyle = "#7a0810"; g.fillRect(102, 99, 256, 3);
  word("BLASTER", 230, 95, 28, "#120a10", "#ffffff", null);
  ctx = keep;
  return c;
}

const titleFx = { boom: 3, parts: [], drips: [], shake: 0, flash: 0 };
let titleFloor = null;
function renderTitle(t) {
  const dt = 1 / 60, tf = titleFx;
  if (!logoCanvas) logoCanvas = buildLogo();
  const shx = (Math.random() - 0.5) * tf.shake, shy = (Math.random() - 0.5) * tf.shake;
  tf.shake = Math.max(0, tf.shake - dt * 20);
  // night sky with a blood-red horizon and a fat moon
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#05040c"); sky.addColorStop(0.55, "#1a0c1e"); sky.addColorStop(0.8, "#3a1220"); sky.addColorStop(1, "#120810");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
  blob(FLASH_BLOB, 392, 52, 46, 0.25);
  ctx.fillStyle = "#e8dcc0"; ctx.beginPath(); ctx.arc(392, 52, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#cfc0a0"; ctx.fillRect(386, 46, 4, 3); ctx.fillRect(396, 56, 3, 3);
  // searchlights sweeping the clouds
  ctx.globalCompositeOperation = "lighter";
  for (const [bx, sp, ph] of [[90, 0.5, 0], [330, 0.37, 2]]) {
    const a = -Math.PI / 2 + Math.sin(t * sp + ph) * 0.55;
    const gr = ctx.createLinearGradient(bx, VH - 70, bx + Math.cos(a) * 260, VH - 70 + Math.sin(a) * 260);
    gr.addColorStop(0, "rgba(200,220,255,0.16)"); gr.addColorStop(1, "rgba(200,220,255,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(bx, VH - 70);
    ctx.lineTo(bx + Math.cos(a - 0.09) * 260, VH - 70 + Math.sin(a - 0.09) * 260);
    ctx.lineTo(bx + Math.cos(a + 0.09) * 260, VH - 70 + Math.sin(a + 0.09) * 260);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // three skyline layers, nearer = darker and faster
  const layers = [[0.04, "#140c1a", 70, 40, 0.5], [0.1, "#0e0814", 55, 60, 0.35], [0.22, "#07050c", 35, 46, 0]];
  for (let L = 0; L < 3; L++) {
    const [spd, col, hMin, hVar, lit] = layers[L];
    const off = (t * spd * 60) % 600;
    for (let k = 0, bx = -off; bx < VW + 40; k++) {
      const w = 22 + (k * 37 + L * 11) % 34, h = hMin + (k * 53 + L * 29) % hVar, top = VH - 62 - h + L * 8;
      ctx.fillStyle = col; ctx.fillRect(Math.round(bx), top, w, h);
      if (lit) for (let wy = top + 5; wy < VH - 66; wy += 7) for (let wx = bx + 3; wx < bx + w - 3; wx += 5) {
        const on = ((Math.round(wx + off) * 7 + wy * 13 + k * 3 + L) % 29) === 0;
        if (on) { ctx.fillStyle = `rgba(255,200,110,${lit})`; ctx.fillRect(Math.round(wx), wy, 2, 3); }
      }
      if (L === 2 && k % 5 === 2) { // a burning rooftop
        for (let i = 0; i < 5; i++) {
          const fl = Math.sin(t * 12 + i * 2 + k) * 0.5 + 0.5;
          ctx.fillStyle = i % 2 ? "#ff8a2a" : "#ffd166";
          ctx.fillRect(Math.round(bx + 4 + i * 3), top - 2 - Math.round(fl * 5), 2, 2 + Math.round(fl * 5));
        }
        blob(FIRE_GLOW, bx + 12, top, 30, 0.8);
      }
      bx += w + 3;
    }
  }
  // rain
  ctx.fillStyle = "rgba(150,170,210,0.35)";
  for (let i = 0; i < 70; i++) {
    const x = (i * 71 + t * 90) % (VW + 40) - 20, y = (i * 137 + t * 330) % (VH + 20) - 10;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
  }

  // the street: curb, asphalt, the hero at a burning barrel, the horde coming
  if (!titleFloor) {
    titleFloor = document.createElement("canvas");
    titleFloor.width = VW; titleFloor.height = 40;
    const fc = titleFloor.getContext("2d");
    fc.imageSmoothingEnabled = false;
    for (let i = 0; i <= VW / TILE; i++) {
      fc.drawImage(IMG[`city_walk_${i % 5 === 0 ? 1 : 0}`], i * TILE, 8);
      fc.drawImage(IMG[`city_road_${(i * 7) % 3}`], i * TILE, 24);
    }
    fc.fillStyle = "rgba(30,28,34,0.9)"; fc.fillRect(0, 23, VW, 1);
    fc.fillStyle = "rgba(6,4,14,0.45)"; fc.fillRect(0, 0, VW, 40);
  }
  ctx.save(); ctx.translate(Math.round(shx), Math.round(shy));
  ctx.drawImage(titleFloor, 0, VH - 62);
  drawSprite("city_firebarrel", 46, VH - 40);
  drawFlames(46, VH - 52, 0);
  blob(FIRE_GLOW, 46, VH - 48, 40, 1);
  drawSprite(animFrame(ANIM.marine_idle, t, 6), 78, VH - 42, false, PLAYER_SCALE);
  const gim = IMG.gun_rifle;
  if (imgOk(gim)) ctx.drawImage(gim, 79, VH - 55);
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
  // now and then something on the street goes up
  if ((tf.boom -= dt) <= 0) {
    tf.boom = rnd(3.5, 7);
    const bx = rnd(150, VW - 40), by = VH - 40;
    tf.shake = 8; tf.flash = 1;
    for (let i = 0; i < 40; i++) {
      const a = rnd(Math.PI, Math.PI * 2), sp = rnd(30, 160);
      tf.parts.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(0.4, 1.1), k: i % 4 });
    }
    if (AC) SFX.boom();
  }
  for (let i = tf.parts.length - 1; i >= 0; i--) {
    const p = tf.parts[i];
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
    if (p.life <= 0 || p.y > VH - 30) { tf.parts.splice(i, 1); continue; }
    ctx.fillStyle = p.k === 0 ? "#ffe08a" : p.k === 1 ? "#ff8a2a" : p.k === 2 ? "#a8201e" : "#6a6470";
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
  }
  if (tf.flash > 0) { blob(FLASH_BLOB, tf.parts[0] ? tf.parts[0].x : VW / 2, VH - 44, 60, tf.flash); tf.flash = Math.max(0, tf.flash - dt * 3); }
  ctx.restore();
  const fade = ctx.createLinearGradient(VW - 90, 0, VW, 0);
  fade.addColorStop(0, "rgba(7,5,16,0)"); fade.addColorStop(1, "rgba(7,5,16,0.85)");
  ctx.fillStyle = fade; ctx.fillRect(VW - 90, VH - 90, 90, 90);

  // the logo: drops in, then breathes; a dying neon flicker now and then
  const drop = Math.min(1, t * 1.5);
  const ly = Math.round(-120 + (8 + 120) * (1 - Math.pow(1 - drop, 3)) + Math.sin(t * 2) * 1.5);
  const flicker = Math.sin(t * 13) + Math.sin(t * 31) > 1.7 ? 0.45 : 1;
  ctx.globalAlpha = 0.6; ctx.drawImage(logoCanvas, 10 + 4, ly + 5); // drop shadow, tinted dark
  ctx.globalAlpha = flicker; ctx.drawImage(logoCanvas, 10, ly);
  ctx.globalAlpha = 1;
  // blood running off the letters
  if (Math.random() < 0.08) tf.drips.push({ x: rnd(130, 350), y: ly + 64, v: 0, len: rnd(2, 5) });
  for (let i = tf.drips.length - 1; i >= 0; i--) {
    const d = tf.drips[i];
    d.v += dt * 40; d.y += d.v * dt;
    if (d.y > ly + 150) { tf.drips.splice(i, 1); continue; }
    ctx.fillStyle = "#a8141a"; ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, Math.round(d.len));
  }

  // tagline types itself out, the prompt pulses
  const tag = "THE DEAD RUN THIS CITY. TAKE IT BACK.";
  ftx(tag.slice(0, Math.max(0, Math.floor((t - 0.8) * 28))), VW / 2, 132, 9, "#e8dfc8", "center");
  const pulse = Math.floor(t * 2.5) % 2;
  ftx(pulse ? "> PRESS ENTER <" : "  PRESS ENTER  ", VW / 2, 158, 14, pulse ? "#ffd166" : "#ffffff", "center");
  if (META.best) ftx("BEST $" + String(META.best).padStart(8, "0"), VW / 2, 172, 8, "#8cf25a", "center");

  // credits link
  creditsRect = { x: 6, y: 6, w: 64, h: 16 };
  drawHeart(creditsRect.x + 4, creditsRect.y + 5, "#e4485a");
  ftx("CREDITS", creditsRect.x + 15, creditsRect.y + 12, 8, "#8f84a8");
  drawKeyButton();
}

function renderEnd(victory, t) {
  ctx.fillStyle = victory ? "rgba(8,14,10,0.78)" : "rgba(20,4,8,0.8)"; ctx.fillRect(0, 0, VW, VH);
  if (victory) {
    ftx("MISSION PASSED", VW / 2, 78, 28, "#ffd166", "center", true);
    ftx("RESPECT +", VW / 2, 98, 14, "#8cf25a", "center");
  } else {
    const wob = Math.round(Math.sin(t * 3) * 2);
    ftx("WASTED", VW / 2, 86 + wob, 42, "#e4485a", "center", true);
  }
  panel(VW / 2 - 110, 112, 220, 70);
  const rows = [
    ["SCORE", "$" + String(G.score).padStart(8, "0"), "#8cf25a"],
    ["BEST", "$" + String(Math.max(META.best || 0, G.score)).padStart(8, "0"), "#ffd166"],
    ["KILLS", String(G.kills), "#ffffff"],
    ["BEST COMBO", String(G.bestCombo), "#ffb347"],
    ["WAVE", String(G.wave), "#ffffff"],
  ];
  rows.forEach(([k, v, col], i) => {
    ftx(k, VW / 2 - 100, 126 + i * 12, 8, "#8f84a8");
    ftx(v, VW / 2 + 100, 126 + i * 12, 9, col, "right");
  });
  if (victory) {
    ctx.font = "italic 8px monospace"; ctx.fillStyle = "#a8d4ff"; ctx.textAlign = "center";
    ftext("“It is done. Rest now, my King.”", VW / 2, 198);
    ftx("[E] KEEP BLASTING (ENDLESS)   [ENTER] NEW RUN", VW / 2, 214, 8, Math.floor(t * 2) % 2 ? "#ffffff" : "#ffd166", "center");
  } else {
    ctx.font = "italic 8px monospace"; ctx.fillStyle = "#a8d4ff"; ctx.textAlign = "center";
    ftext("“Forgive me, my King…”", VW / 2, 198);
    ftx("[ENTER] TRY AGAIN", VW / 2, 214, 9, Math.floor(t * 2) % 2 ? "#ffffff" : "#ffd166", "center");
  }
}

// ------------------------------------------------------------- FX / WebGL --
// Retro-but-modern post-processing (docs/PERFORMANCE.md §6). The game draws
// into two 480x270 layers — the scene and the UI — which are uploaded once a
// frame and composited by four passes:
//   light  (480x270)  coloured lights + flashlight cone, fog, rain, lightning
//   bright (240x135)  bright-pass for bloom, then a separable blur (2 passes)
//   final  (screen)   CRT curvature, sharp pixel scaling, chromatic
//                     aberration, shockwaves, grading, scanlines, vignette,
//                     grain, hurt / low-HP pulse, UI on top
// Without WebGL2 the layers are copied onto a 2D canvas instead.
const FX_CURVE = [0.045, 0.06]; // barrel strength per axis; canvasPos() uses the same warp
const MAX_SHOCKS = 6;
const shocks = []; // { x, y, t } world space, t = age in seconds
let FXR = null;

const GLSL_HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
const VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); // one big triangle
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const FS_LIGHT = GLSL_HEAD + `
uniform sampler2D uScene;
uniform vec4 uL[${MAX_LIGHTS}];   // x, y, radius, intensity (game px, top-left origin)
uniform vec3 uC[${MAX_LIGHTS}];   // colour
uniform int uNL;
uniform vec3 uAmb;
uniform vec4 uTorch;   // hand x, y, aim angle, intensity
uniform vec2 uCam;     // camera offset: fog sticks to the world
uniform float uTime, uLit, uRain, uFlash;
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec3 base = texture(uScene, vUv).rgb;
  if (uLit < 0.5) { o = vec4(base, 1.0); return; }
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * vec2(480.0, 270.0);
  vec3 light = uAmb + vec3(0.85, 0.9, 1.0) * uFlash;
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uNL) break;
    vec4 L = uL[i];
    vec2 d = px - L.xy;
    float r2 = dot(d, d);
    if (r2 >= L.z * L.z) continue;
    float a = 1.0 - sqrt(r2) / L.z;
    light += uC[i] * (a * a * (3.0 - 2.0 * a)) * L.w * 1.3; // smoothstep falloff: wide soft pools
  }
  if (uTorch.w > 0.0) {
    vec2 d = px - uTorch.xy;
    float len = max(length(d), 0.001);
    float c = dot(d / len, vec2(cos(uTorch.z), sin(uTorch.z)));
    float cone = smoothstep(0.86, 0.96, c) * (1.0 - smoothstep(30.0, 175.0, len)) + (1.0 - smoothstep(0.0, 18.0, len)) * 0.25;
    light += vec3(0.8, 0.9, 1.0) * cone * uTorch.w;
  }
  vec3 lit = base * light;
  // drifting ground fog, brighter where it catches the light
  float f = fbm((px + uCam) * 0.011 + vec2(uTime * 0.045, uTime * 0.018));
  lit += vec3(0.30, 0.34, 0.46) * f * f * 0.3 * (0.35 + 0.65 * min(light, vec3(1.3)));
  // pixel rain: slanted 1px streaks per 3px column, lit by nearby lamps
  if (uRain > 0.0) {
    float col = floor((px.x + px.y * 0.35) / 3.0);
    float h = hash(vec2(col, 7.0));
    float seg = mod(px.y + uTime * (230.0 + h * 120.0) + h * 400.0, 70.0 + h * 90.0);
    float drop = step(seg, 3.0) * step(0.8, hash(vec2(col, 3.0)));
    lit += vec3(0.55, 0.62, 0.78) * drop * uRain * (0.1 + 0.35 * min(light.b, 1.0));
  }
  o = vec4(lit, 1.0);
}`;
const FS_BRIGHT = GLSL_HEAD + `
uniform sampler2D uSrc;
void main() {
  vec3 c = texture(uSrc, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(0.5, 0.95, l), 1.0);
}`;
const FS_BLUR = GLSL_HEAD + `
uniform sampler2D uSrc;
uniform vec2 uDir; // one texel step along the blur axis
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 0.227;
  c += (texture(uSrc, vUv + uDir * 1.38).rgb + texture(uSrc, vUv - uDir * 1.38).rgb) * 0.316;
  c += (texture(uSrc, vUv + uDir * 3.23).rgb + texture(uSrc, vUv - uDir * 3.23).rgb) * 0.070;
  o = vec4(c, 1.0);
}`;
const FS_FINAL = GLSL_HEAD + `
uniform sampler2D uLitT, uBloom, uUI;
uniform vec2 uOut;
uniform float uTime, uFx, uHurt, uLow, uChroma;
uniform vec4 uShock[${MAX_SHOCKS}]; // x, y (game px), radius, strength
uniform int uNS;
const vec2 RES = vec2(480.0, 270.0);
vec2 warp(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + c.yx * c.yx * vec2(${FX_CURVE[0]}, ${FX_CURVE[1]}) * uFx;
  return c * 0.5 + 0.5;
}
// sharp bilinear: crisp pixels at any scale, only the texel edges blend
vec2 sharp(vec2 uv) {
  vec2 t = uv * RES, s = max(uOut / RES, vec2(1.0));
  vec2 fl = floor(t), fr = fract(t) - 0.5;
  vec2 region = 0.5 - 0.5 / s;
  return (fl + (fr - clamp(fr, -region, region)) * s + 0.5) / RES;
}
void main() {
  vec2 w = warp(vUv);
  if (w.x < 0.0 || w.y < 0.0 || w.x > 1.0 || w.y > 1.0) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 gp = vec2(w.x, 1.0 - w.y) * RES;
  vec2 off = vec2(0.0);
  for (int i = 0; i < ${MAX_SHOCKS}; i++) {
    if (i >= uNS) break;
    vec4 s = uShock[i];
    vec2 d = gp - s.xy;
    float dl = max(length(d), 1.0);
    off += d / dl * (1.0 - smoothstep(0.0, 9.0, abs(dl - s.z))) * s.w;
  }
  vec2 wu = w + vec2(off.x, -off.y) / RES;
  vec2 cc = (wu - 0.5) * (0.5 + uChroma * 2.5) * uFx / RES * 2.0;
  vec3 col = vec3(texture(uLitT, sharp(wu + cc)).r, texture(uLitT, sharp(wu)).g, texture(uLitT, sharp(wu - cc)).b);
  col += texture(uBloom, wu).rgb * 0.85 * uFx;
  // grade: cold teal shadows, warm sodium highlights, a touch of contrast
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 graded = mix(col * vec3(0.9, 1.0, 1.12), col * vec3(1.12, 1.0, 0.86), smoothstep(0.15, 0.75, l));
  graded = (graded - 0.5) * 1.06 + 0.5;
  col = mix(col, graded, uFx);
  col = mix(col, vec3(l) * vec3(1.05, 0.95, 0.95), uLow * 0.65);
  vec4 ui = texture(uUI, sharp(w));
  col = mix(col, ui.rgb, ui.a);
  vec2 v = w - 0.5;
  float sk = smoothstep(1.5, 3.0, uOut.y / RES.y); // scanlines only once a game pixel is several screen pixels
  col *= 1.0 - uFx * sk * 0.16 * (0.5 - 0.5 * cos(gp.y * 6.2831853));
  col *= 1.0 - dot(v, v) * 0.85 * uFx;
  col = mix(col, vec3(0.55, 0.02, 0.03), min(0.7, uHurt * 0.5 + uLow * 0.3) * smoothstep(0.25, 0.7, length(v * vec2(1.0, 0.8))));
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5) * 0.05 * uFx;
  o = vec4(col, 1.0);
}`;

// a software rasteriser (SwiftShader, llvmpipe — e.g. a blocklisted GPU)
// would run the passes on the CPU and be slower than plain 2D
function softwareGL() {
  try {
    const g = document.createElement("canvas").getContext("webgl2");
    if (!g) return true;
    const ext = g.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    const lose = g.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
  } catch (e) { return true; }
}

function initFX() {
  const useGL = /[?&]gl=force/.test(location.search) || !softwareGL();
  const gl = useGL && canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) { // plain 2D: both layers draw straight onto the visible canvas
    const c2 = canvas.getContext("2d", { alpha: false });
    if (c2) { sceneCtx = uiCtx = c2; ctx = c2; }
    return;
  }
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const program = (fs, names) => {
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (const n of names) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  };
  const tex = (w, h, filter) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const target = (w, h) => {
    const t = tex(w, h, gl.LINEAR), fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb, w, h };
  };
  try {
    const R = {
      gl,
      light: program(FS_LIGHT, ["uScene", "uL", "uC", "uNL", "uAmb", "uTorch", "uCam", "uTime", "uLit", "uRain", "uFlash"]),
      bright: program(FS_BRIGHT, ["uSrc"]),
      blur: program(FS_BLUR, ["uSrc", "uDir"]),
      final: program(FS_FINAL, ["uLitT", "uBloom", "uUI", "uOut", "uTime", "uFx", "uHurt", "uLow", "uChroma", "uShock", "uNS"]),
      scene: tex(VW, VH, gl.NEAREST), ui: tex(VW, VH, gl.LINEAR),
      lit: target(VW, VH), bloomA: target(VW / 2, VH / 2), bloomB: target(VW / 2, VH / 2),
      vao: gl.createVertexArray(),
      lightPos: new Float32Array(MAX_LIGHTS * 4), lightCol: new Float32Array(MAX_LIGHTS * 3),
      shockBuf: new Float32Array(MAX_SHOCKS * 4),
    };
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    FXR = R;
  } catch (e) {
    console.warn("FX disabled:", e.message);
  }
  resizeFX();
  window.addEventListener("resize", resizeFX);
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); FXR = null; });
  canvas.addEventListener("webglcontextrestored", () => { initFX(); });
}

// backing store follows the screen, capped by fxPerf.capMP megapixels of
// fragment work; the CSS keeps object-fit: contain, so the aspect never changes
const fxPerf = { ema: 16.7, slowT: 0, capMP: 2.4 };
function resizeFX() {
  if (!FXR) { canvas.width = VW; canvas.height = VH; return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let s = Math.min(window.innerWidth / VW, window.innerHeight / VH) * dpr;
  s = Math.max(1, Math.min(s, Math.sqrt(fxPerf.capMP * 1e6 / (VW * VH))));
  canvas.width = Math.round(VW * s); canvas.height = Math.round(VH * s);
}

// the same barrel warp as the final shader, for mapping clicks
function fxWarp(u, v) {
  if (!FXR || !SND.fx) return [u, v];
  const cx = u * 2 - 1, cy = v * 2 - 1;
  return [(cx * (1 + cy * cy * FX_CURVE[0]) + 1) / 2, (cy * (1 + cx * cx * FX_CURVE[1]) + 1) / 2];
}

const fxState = { hurt: 0, chroma: 0, flash: 0, nextBolt: 20, rain: 0 };
function fxShock(x, y, strength) {
  if (shocks.length >= MAX_SHOCKS) shocks.shift();
  shocks.push({ x, y, t: 0, s: strength });
}
// per-frame FX bookkeeping: decays, lightning, shockwave ages, and adaptive
// resolution — if frames stay slow for 2s, halve the output megapixels
function updateFX(dt) {
  if (FXR && SND.fx) {
    fxPerf.ema += (dt * 1000 - fxPerf.ema) * 0.05;
    if (fxPerf.ema > 24 && fxPerf.capMP > 0.35) {
      if ((fxPerf.slowT += dt) > 2) { fxPerf.slowT = 0; fxPerf.ema = 16.7; fxPerf.capMP /= 2; resizeFX(); }
    } else fxPerf.slowT = 0;
  }
  fxState.hurt = Math.max(0, fxState.hurt - dt * 2.2);
  fxState.chroma = Math.max(0, fxState.chroma - dt * 2.5);
  fxState.flash = Math.max(0, fxState.flash - dt * 3.2);
  let w = 0;
  for (let i = 0; i < shocks.length; i++) { const s = shocks[i]; s.t += dt; if (s.t < 0.55) shocks[w++] = s; }
  shocks.length = w;
  if (fxState.rain > 0 && G.state === "play" && (fxState.nextBolt -= dt) <= 0) { // lightning: double flash, thunder after
    fxState.nextBolt = rnd(18, 45);
    fxState.flash = 1;
    setTimeout(() => { fxState.flash = 0.7; }, 140);
    setTimeout(() => { noise(1.8, 0.14, 160); beep(45, 1.2, "sawtooth", 0.05, -10); }, rnd(400, 1400));
  }
}

function present(t, lit) {
  if (!FXR) return; // 2D path already drew onto the visible canvas
  const R = FXR, gl = R.gl, fx = SND.fx ? 1 : 0;
  // DOM uploads first: they flush the pipeline (MDN WebGL best practices)
  gl.bindTexture(gl.TEXTURE_2D, R.scene);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
  gl.bindTexture(gl.TEXTURE_2D, R.ui);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, uiCanvas);
  gl.bindVertexArray(R.vao);
  const camX = Math.round(lightCam.x), camY = Math.round(lightCam.y);
  const doLight = lit && fx;

  // 1. light
  gl.bindFramebuffer(gl.FRAMEBUFFER, R.lit.fb);
  gl.viewport(0, 0, VW, VH);
  gl.useProgram(R.light.p);
  const L = R.light.u;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, R.scene); gl.uniform1i(L.uScene, 0);
  gl.uniform1f(L.uLit, doLight ? 1 : 0);
  if (doLight) {
    for (let i = 0; i < lightCount; i++) {
      const k = i * 7;
      R.lightPos[i * 4] = LIGHTS[k] - camX; R.lightPos[i * 4 + 1] = LIGHTS[k + 1] - camY;
      R.lightPos[i * 4 + 2] = LIGHTS[k + 2]; R.lightPos[i * 4 + 3] = LIGHTS[k + 3];
      R.lightCol[i * 3] = LIGHTS[k + 4]; R.lightCol[i * 3 + 1] = LIGHTS[k + 5]; R.lightCol[i * 3 + 2] = LIGHTS[k + 6];
    }
    gl.uniform4fv(L.uL, R.lightPos); gl.uniform3fv(L.uC, R.lightCol); gl.uniform1i(L.uNL, lightCount);
    gl.uniform3f(L.uAmb, 0.2, 0.22, 0.34);
    if (player && G.state === "play") {
      const h = handPos();
      const ang = aiming() ? player.atkAng : (player.facing > 0 ? 0.25 : Math.PI - 0.25);
      gl.uniform4f(L.uTorch, h.x - camX, h.y - camY, ang, 0.85);
    } else gl.uniform4f(L.uTorch, 0, 0, 0, 0);
    gl.uniform2f(L.uCam, camX, camY);
    gl.uniform1f(L.uTime, t); gl.uniform1f(L.uRain, fxState.rain); gl.uniform1f(L.uFlash, fxState.flash);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // 2. bloom: bright-pass at half resolution, blur across then down
  if (fx) {
    gl.viewport(0, 0, VW / 2, VH / 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, R.bloomA.fb);
    gl.useProgram(R.bright.p);
    gl.bindTexture(gl.TEXTURE_2D, R.lit.t); gl.uniform1i(R.bright.u.uSrc, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(R.blur.p); gl.uniform1i(R.blur.u.uSrc, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, R.bloomB.fb);
    gl.bindTexture(gl.TEXTURE_2D, R.bloomA.t); gl.uniform2f(R.blur.u.uDir, 2 / VW, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, R.bloomA.fb);
    gl.bindTexture(gl.TEXTURE_2D, R.bloomB.t); gl.uniform2f(R.blur.u.uDir, 0, 2 / VH);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // 3. final, to the screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(R.final.p);
  const F = R.final.u;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, R.lit.t); gl.uniform1i(F.uLitT, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, R.bloomA.t); gl.uniform1i(F.uBloom, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, R.ui); gl.uniform1i(F.uUI, 2);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform2f(F.uOut, canvas.width, canvas.height);
  gl.uniform1f(F.uTime, t); gl.uniform1f(F.uFx, fx);
  const low = lit && player ? clamp(1 - player.hp / (player.stats.maxHp * 0.3), 0, 1) * (0.6 + 0.4 * Math.abs(Math.sin(t * 3.2))) : 0;
  gl.uniform1f(F.uHurt, lit ? fxState.hurt : 0); gl.uniform1f(F.uLow, low); gl.uniform1f(F.uChroma, fxState.chroma);
  let ns = 0;
  if (doLight) {
    for (const s of shocks) {
      const k = ns++ * 4, p = s.t / 0.55;
      R.shockBuf[k] = s.x - camX; R.shockBuf[k + 1] = s.y - camY;
      R.shockBuf[k + 2] = p * 120; R.shockBuf[k + 3] = s.s * (1 - p) * (1 - p);
    }
    gl.uniform4fv(F.uShock, R.shockBuf);
  }
  gl.uniform1i(F.uNS, ns);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
fxLit = () => !!FXR && SND.fx;

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
  mapStamp++;
  ctx = sceneCtx;
  sceneCtx.imageSmoothingEnabled = uiCtx.imageSmoothingEnabled = false;
  if (uiCtx !== sceneCtx) uiCtx.clearRect(0, 0, VW, VH);
  let lit = false; // the scene is the city at night (lights apply) vs a menu screen

  if (assetsLeft > 0) {
    ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#cfc6de"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ftext("loading magazines…", VW / 2, VH / 2);
    present(now / 1000, false);
    requestAnimationFrame(frame);
    return;
  }
  updateFX(dt);
  canvas.style.cursor = G.state === "play" && !G.paused && mouse.seen ? "none" : "default";

  if (G.state === "title") renderTitle(now / 1000);
  else if (G.state === "credits") renderCredits(now / 1000);
  else if (G.state === "cls") renderClassSelect(now / 1000);
  else if (G.state === "select") renderSelect(now / 1000);
  else if (G.state === "play") {
    if (!G.paused) updatePlay(dt);
    if (G.state === "play" || G.state === "gameover" || G.state === "victory") {
      renderWorld();
      lit = true; ctx = uiCtx;
      renderWorldTexts();
      renderHUD();
      if (G.state === "play" && G.paused) renderPauseOverlay(now / 1000);
      if (G.state === "gameover" || G.state === "victory") renderEnd(G.state === "victory", now / 1000);
    } else if (G.state === "campfire") renderCampfire(dt);
  }
  else if (G.state === "campfire") renderCampfire(dt);
  else if (G.state === "gameover" || G.state === "victory") { renderWorld(); lit = true; ctx = uiCtx; renderWorldTexts(); renderHUD(); renderEnd(G.state === "victory", now / 1000); }

  ctx = uiCtx;
  // password modal over the menus
  if (passModal.open) {
    if (!["title", "cls", "select"].includes(G.state)) closePassModal();
    else renderPassModal(dt);
  }

  // dev mode badge (kept clear of the armory bar)
  if (DEV.on) {
    const inPlay = G.state === "play";
    ftx("DEV", inPlay ? 6 : VW - 6, inPlay ? 58 : 34, 8, "#b48cff", inPlay ? "left" : "right");
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

  present(now / 1000, lit);
  requestAnimationFrame(frame);
}
initFX();
requestAnimationFrame(frame);
