/* ORC SLASHER — a Brotato-style cave roguelike.
 * Sprites: 0x72 DungeonTileset II (CC0) + original art (see assets/CREDITS.md).
 */
"use strict";

// ------------------------------------------------------------------ setup --
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const VW = canvas.width, VH = canvas.height;

const TILE = 16;
const MAP_W = 44, MAP_H = 26;
const WORLD_W = MAP_W * TILE, WORLD_H = MAP_H * TILE;
const FINAL_WAVE = 10;

// sprite images ------------------------------------------------------------
const IMG = {};
let assetsLeft = 0;
for (const [name, uri] of Object.entries(window.ASSETS)) {
  assetsLeft++;
  const im = new Image();
  im.onload = () => { assetsLeft--; };
  im.src = uri;
  IMG[name] = im;
}

const ANIM = {
  hero_idle: ["knight_m_idle_f0", "knight_m_idle_f1", "knight_m_idle_f2", "knight_m_idle_f3"],
  hero_run: ["knight_m_run_f0", "knight_m_run_f1", "knight_m_run_f2", "knight_m_run_f3"],
  barbar_idle: ["dwarf_m_idle_f0", "dwarf_m_idle_f1", "dwarf_m_idle_f2", "dwarf_m_idle_f3"],
  barbar_run: ["dwarf_m_run_f0", "dwarf_m_run_f1", "dwarf_m_run_f2", "dwarf_m_run_f3"],
  nun_idle: ["nun_idle_f0", "nun_idle_f1", "nun_idle_f2", "nun_idle_f3"],
  nun_run: ["nun_run_f0", "nun_run_f1", "nun_run_f2", "nun_run_f3"],
  quasi_idle: ["quasi_idle_f0", "quasi_idle_f1", "quasi_idle_f2", "quasi_idle_f3"],
  quasi_run: ["quasi_run_f0", "quasi_run_f1", "quasi_run_f2", "quasi_run_f3"],
  reaper_idle: ["necromancer_f0", "necromancer_f1", "necromancer_f2", "necromancer_f3"],
  reaper_run: ["necromancer_f0", "necromancer_f1", "necromancer_f2", "necromancer_f3"],
  assassin_idle: ["assassin_idle_f0", "assassin_idle_f1", "assassin_idle_f2", "assassin_idle_f3"],
  assassin_run: ["assassin_run_f0", "assassin_run_f1", "assassin_run_f2", "assassin_run_f3"],
  monk_idle: ["monk_idle_f0", "monk_idle_f1", "monk_idle_f2", "monk_idle_f3"],
  monk_run: ["monk_run_f0", "monk_run_f1", "monk_run_f2", "monk_run_f3"],
  mage_idle: ["wizzard_m_idle_f0", "wizzard_m_idle_f1", "wizzard_m_idle_f2", "wizzard_m_idle_f3"],
  mage_run: ["wizzard_m_run_f0", "wizzard_m_run_f1", "wizzard_m_run_f2", "wizzard_m_run_f3"],
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
  butcher_idle: ["orc_butcher_idle_f0", "orc_butcher_idle_f1", "orc_butcher_idle_f2", "orc_butcher_idle_f3"],
  butcher_run: ["orc_butcher_run_f0", "orc_butcher_run_f1", "orc_butcher_run_f2", "orc_butcher_run_f3"],
  shamanking_idle: ["orc_shamanking_idle_f0", "orc_shamanking_idle_f1", "orc_shamanking_idle_f2", "orc_shamanking_idle_f3"],
  shamanking_run: ["orc_shamanking_run_f0", "orc_shamanking_run_f1", "orc_shamanking_run_f2", "orc_shamanking_run_f3"],
  campfire: ["campfire_f0", "campfire_f1", "campfire_f2", "campfire_f3"],
  gem: ["xp_gem_f0", "xp_gem_f1"],
  coin: ["coin_f0", "coin_f1", "coin_f2", "coin_f3"],
  bolt: ["shaman_bolt_f0", "shaman_bolt_f1"],
  slash: ["slash_f0", "slash_f1", "slash_f2"],
};
// CraftPix 4-direction orcs + recolor variants (see assets/CREDITS.md)
for (const p of ["cp_orc1", "cp_orc2", "cp_orc3", "cp_frost", "cp_night", "cp_blood"]) {
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

// ambient cave loop: slow minor bassline + sparse arpeggio, all synthesized
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
const SFX = {
  slash: () => beep(190, 0.09, "sawtooth", 0.05, -120),
  hit: () => beep(120, 0.08, "square", 0.06, -60),
  die: () => beep(70, 0.2, "sawtooth", 0.09, -40),
  gem: () => beep(880, 0.07, "sine", 0.07, 240),
  coinS: () => beep(1180, 0.06, "sine", 0.05, 120),
  hurt: () => beep(90, 0.25, "square", 0.1, -50),
  boom: () => { beep(60, 0.35, "sawtooth", 0.14, -30); beep(240, 0.18, "square", 0.06, -180); },
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
const touchState = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, maxD: 0, t0: 0 };
let usingTouch = false, lastPointerTouch = false;
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
  lastPointerTouch = e.pointerType === "touch";
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
  touchState.maxD = 0; touchState.t0 = performance.now();
});
canvas.addEventListener("pointermove", e => {
  if (!touchState.active || e.pointerId !== touchState.id) return;
  const p = canvasPos(e);
  touchState.dx = p.x - touchState.ox; touchState.dy = p.y - touchState.oy;
  touchState.maxD = Math.max(touchState.maxD, Math.hypot(touchState.dx, touchState.dy));
});
window.addEventListener("pointerup", e => {
  if (e.pointerId !== touchState.id) return;
  touchState.active = false;
  // a quick tap (no drag) casts the mage's next ready spell on touch
  if (usingTouch && G.state === "play" && !G.paused && player &&
      WEAPONS[G.weapon].spells && touchState.maxD < 12 &&
      performance.now() - touchState.t0 < 300) {
    castNextReady();
  }
});

// ------------------------------------------------------------------- util --
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

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
let floorCanvas = null;
let solids = []; // {x,y,w,h} world-space rects

function buildMap() {
  solids = [];
  floorCanvas = document.createElement("canvas");
  floorCanvas.width = WORLD_W; floorCanvas.height = WORLD_H + 8;
  const fc = floorCanvas.getContext("2d");
  fc.imageSmoothingEnabled = false;
  const floorNames = ["floor_1", "floor_1", "floor_1", "floor_1", "floor_2", "floor_3", "floor_4", "floor_5", "floor_6", "floor_7", "floor_8"];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      fc.drawImage(IMG[pick(floorNames)], tx * TILE, ty * TILE);
    }
  }
  // walls: top row is wall face, ring of solids around arena
  for (let tx = 0; tx < MAP_W; tx++) {
    fc.drawImage(IMG.wall_top_mid, tx * TILE, -8);
    fc.drawImage(IMG.wall_mid, tx * TILE, 8);
    if (tx % 7 === 3) fc.drawImage(IMG[tx % 14 === 3 ? "wall_banner_red" : "wall_banner_green"], tx * TILE, 8);
    fc.drawImage(IMG.wall_top_mid, tx * TILE, WORLD_H - TILE);
  }
  for (let ty = 0; ty < MAP_H; ty++) {
    fc.drawImage(IMG.wall_left, 0, ty * TILE);
    fc.drawImage(IMG.wall_right, WORLD_W - TILE, ty * TILE);
  }
  solids.push({ x: 0, y: 0, w: WORLD_W, h: TILE + 8 });          // top
  solids.push({ x: 0, y: WORLD_H - TILE, w: WORLD_W, h: TILE }); // bottom
  solids.push({ x: 0, y: 0, w: TILE, h: WORLD_H });              // left
  solids.push({ x: WORLD_W - TILE, y: 0, w: TILE, h: WORLD_H }); // right
  // scattered crates + bones
  for (let i = 0; i < 10; i++) {
    const tx = irnd(3, MAP_W - 4), ty = irnd(4, MAP_H - 4);
    if (Math.abs(tx - MAP_W / 2) < 4 && Math.abs(ty - MAP_H / 2) < 4) continue;
    if (i < 6) {
      fc.drawImage(IMG.crate, tx * TILE, ty * TILE);
      solids.push({ x: tx * TILE + 1, y: ty * TILE + 2, w: 14, h: 13 });
    } else {
      fc.drawImage(IMG.skull, tx * TILE, ty * TILE);
    }
  }
}

function collideSolids(x, y, r) {
  for (const s of solids) {
    const cx = clamp(x, s.x, s.x + s.w), cy = clamp(y, s.y, s.y + s.h);
    const dx = x - cx, dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      const d = Math.sqrt(d2) || 0.01;
      x = cx + (dx / d) * r; y = cy + (dy / d) * r;
    }
  }
  return { x, y };
}

// ------------------------------------------------------------------ state --
const G = {
  state: "title", // title | play | campfire | gameover | victory
  t: 0, wave: 0, kills: 0, coins: 0, shake: 0, hitPause: 0,
  endless: false,
  cls: "knight", weapon: "sword",
  cam: { x: 0, y: 0 },
};

let player, enemies, gems, coins, flasks, bolts, arrows, stars, molotovs, firePatches, fireballs, beams, fx, texts, spawnQueue, spawnTimer;
let campfire = null; // campfire scene state

const WEAPONS = {
  sword: { name: "Knight Sword", desc: "steady swings, wide arc", sprite: "weapon_regular_sword", dmg: 11, atkSpd: 1.1, range: 38, arc: 1.15 },
  knives: { name: "Twin Knives", desc: "fast stabs, short reach, +move", sprite: "weapon_knife", dmg: 6, atkSpd: 2.3, range: 28, arc: 1.35 },
  bow: { name: "Longbow", desc: "10 arrows, then 3s reload", sprite: "weapon_bow", dmg: 8, atkSpd: 2.0, range: 155, arc: 0, ranged: true, clip: 10, reload: 3 },
  whip: { name: "Whip", desc: "long lash, narrow snap", sprite: "weapon_whip", dmg: 7, atkSpd: 1.6, range: 62, arc: 0.55 },
  axe: { name: "War Axe", desc: "heavy chop, wide arc", sprite: "weapon_waraxe", dmg: 14, atkSpd: 0.9, range: 35, arc: 1.5 },
  spear: { name: "Spear", desc: "long thrust, pierces a line", sprite: "weapon_spear", dmg: 10, atkSpd: 1.25, range: 58, arc: 0.45 },
  scythe: { name: "Scythe", desc: "slow, huge reaping circle", sprite: "weapon_scythe", dmg: 16, atkSpd: 0.8, range: 46, arc: 2.4, unlock: "scythe" },
  molotov: { name: "Molotov", desc: "lobbed firebomb, burns the ground", sprite: "weapon_molotov", dmg: 14, atkSpd: 0.7, range: 135, arc: 0, thrown: true },
  shiv: { name: "Small Knife", desc: "quick close shanks", sprite: "weapon_knife", dmg: 5, atkSpd: 2.6, range: 25, arc: 1.2 },
  katana: { name: "Katana", desc: "swift precise cuts", sprite: "weapon_katana", dmg: 12, atkSpd: 1.4, range: 42, arc: 0.9 },
  shuriken: { name: "Shuriken", desc: "rapid throwing stars", sprite: "weapon_shuriken", dmg: 5, atkSpd: 2.8, range: 125, arc: 0, star: true },
  spells: { name: "Arcane Arts", desc: "fireball · shockwave · firebeam", sprite: "weapon_red_magic_staff", dmg: 10, atkSpd: 1, range: 165, arc: 0, spells: true },
};

const SPELLS = {
  fire: { name: "Fireball", cd: 6 },
  shock: { name: "Shockwave", cd: 8 },
  beam: { name: "Firebeam", cd: 12 },
};

// classes -------------------------------------------------------------------
const CLASSES = {
  knight: { name: "Knight", anim: "hero", desc: "balanced, dependable", weapons: ["sword", "spear", "bow"], mods: s => s },
  barbar: { name: "Barbarian", anim: "barbar", desc: "+25% dmg, +10% speed, takes +15% dmg", unlock: "barbar",
    weapons: ["knives", "spear", "axe"],
    mods: s => { s.dmg *= 1.25; s.moveSpd *= 1.10; s.armor = 1 - (1 - s.armor) * 1.15; s.maxHp = 70; } },
  nun: { name: "Nun", anim: "nun", desc: "+1.2 HP/s, +20% XP, -15% dmg", unlock: "nun",
    weapons: ["whip", "bow"],
    mods: s => { s.regen += 1.2; s.xpGain *= 1.20; s.dmg *= 0.85; s.maxHp = 55; } },
  quasi: { name: "Quasimodo", anim: "quasi", desc: "hunched & hardy: 75 HP, a bit slow", weapons: ["molotov", "shiv"],
    mods: s => { s.maxHp = 75; s.moveSpd *= 0.95; } },
  assassin: { name: "Assassin", anim: "assassin", desc: "+15% crit, +10% speed, 50 HP", unlock: "assassin", price: 400,
    weapons: ["katana", "shuriken"],
    mods: s => { s.crit += 0.15; s.moveSpd *= 1.10; s.maxHp = 50; } },
  reaper: { name: "Reaper", anim: "reaper", desc: "+10% dmg, 2% lifesteal, frail", unlock: "reaper", price: 600,
    weapons: ["scythe", "knives"],
    mods: s => { s.dmg *= 1.10; s.lifesteal += 0.02; s.maxHp = 45; s.moveSpd *= 1.05; } },
  mage: { name: "Mage", anim: "mage", desc: "3 spells: click casts, auto-aim", unlock: "mage", price: 1000,
    weapons: ["spells"],
    mods: s => { s.maxHp = 50; } },
  monk: { name: "Monk", anim: "monk", desc: "dev tester — masters every weapon", devOnly: true,
    weapons: Object.keys(WEAPONS),
    mods: s => { s.maxHp = 65; } },
};
CLASSES.barbar.price = 300;
CLASSES.nun.price = 300;

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
const UN = { barbar: false, nun: false, reaper: false, scythe: false, assassin: false, mage: false };
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
    moveSpd: weaponId === "knives" ? 93 : 85,
    range: w.range, arc: w.arc,
    crit: 0.05, regen: 0, magnet: 28, xpGain: 1,
    armor: 0, lifesteal: 0,
    knock: 1, giant: 0, goldDig: 0, wind: 0, luck: 0,
  };
}

function newRun(weaponId) {
  buildMap();
  G.weapon = weaponId;
  const stats = baseStats(weaponId);
  CLASSES[G.cls].mods(stats);
  player = {
    x: WORLD_W / 2, y: WORLD_H / 2, r: 6, hp: stats.maxHp, level: 1, xp: 0,
    stats, banked: 0,
    facing: 1, moving: false, animT: 0,
    atkCd: 0, atkAng: 0, hurtCd: 0, dashCd: 0, dashT: 0, dashX: 0, dashY: 0,
    flash: 0, ammo: WEAPONS[weaponId].clip || 0, reloadT: 0,
  };
  enemies = []; gems = []; coins = []; flasks = []; bolts = []; arrows = []; stars = []; molotovs = []; firePatches = []; fireballs = []; beams = []; fx = []; texts = [];
  player.spellCd = { fire: 0, shock: 0, beam: 0 };
  spawnQueue = []; spawnTimer = 0;
  G.wave = 0; G.kills = 0; G.coins = 0; G.t = 0; G.endless = false; G.bankedRun = false; G.paused = false;
  startWave(1);
  G.state = "play";
}

function xpNeeded(level) { return 4 + level * 4; }

// ------------------------------------------------------------------ waves --
const E_TYPES = {
  goblin: { anim: "goblin", hp: 9, spd: 55, dmg: 5, xp: 1, r: 4, scale: 1, score: 1 },
  orc_warrior: { anim: "orc_grunt", hp: 22, spd: 34, dmg: 9, xp: 2, r: 5, scale: 1, score: 2 },
  orc_blade: { dirAnim: "cp_orc3", hp: 15, spd: 62, dmg: 8, xp: 3, r: 5, scale: 1, score: 3 },
  orc_general: { dirAnim: "cp_orc2", hp: 70, spd: 28, dmg: 14, xp: 6, r: 6, scale: 1, score: 6 },
  frost_orc: { dirAnim: "cp_frost", hp: 45, spd: 24, dmg: 12, xp: 4, r: 5, scale: 1, score: 4 },
  night_orc: { dirAnim: "cp_night", hp: 16, spd: 74, dmg: 9, xp: 4, r: 5, scale: 1, score: 4 },
  blood_general: { dirAnim: "cp_blood", hp: 120, spd: 32, dmg: 17, xp: 8, r: 6, scale: 1, score: 8 },
  masked_orc: { anim: "masked_orc", hp: 16, spd: 58, dmg: 7, xp: 2, r: 5, scale: 1, score: 2 },
  orc_shaman: { anim: "orc_shaman", hp: 14, spd: 30, dmg: 7, xp: 3, r: 5, scale: 1, ranged: true, score: 3 },
  orc_berserker: { anim: "orc_berserker", hp: 30, spd: 40, dmg: 11, xp: 4, r: 5, scale: 1, rage: true, score: 4 },
  ogre: { anim: "ogre", hp: 150, spd: 22, dmg: 18, xp: 12, r: 10, scale: 1, big: true, score: 10 },
  warchief: { anim: "warchief", hp: 750, spd: 30, dmg: 22, xp: 40, r: 9, scale: 2, boss: true, bossBar: true, big: true, score: 50 },
  orc_butcher: { anim: "butcher", hp: 300, spd: 32, dmg: 20, xp: 20, r: 10, scale: 2, big: true, bossBar: true, charge: true, score: 30 },
  orc_shamanking: { anim: "shamanking", hp: 340, spd: 26, dmg: 10, xp: 25, r: 8, scale: 2, big: true, bossBar: true, ranged: true, king: true, score: 40 },
};

const BOSS_CYCLE = ["orc_butcher", "warchief", "orc_shamanking"];
const BOSS_NAMES = { orc_butcher: "THE BUTCHER", warchief: "THE WARCHIEF", orc_shamanking: "THE SHAMAN KING" };
const bossFor = w => BOSS_CYCLE[(Math.floor(w / 5) - 1 + BOSS_CYCLE.length) % BOSS_CYCLE.length];

function waveComposition(w) {
  const list = [];
  const add = (type, n) => { for (let i = 0; i < n; i++) list.push(type); };
  add("goblin", clamp(8 + w * 2, 0, 26));
  if (w >= 1) add("orc_warrior", 2 + Math.floor(w * 1.6));
  if (w >= 3) add("orc_blade", w);
  if (w >= 3) add("masked_orc", w - 1);
  if (w >= 4) add("orc_shaman", Math.floor(w / 2) + 1);
  if (w >= 5) add("orc_berserker", w - 3);
  if (w >= 5) add("frost_orc", Math.floor(w / 2) - 1);
  if (w >= 6) add("orc_general", Math.floor(w / 3));
  if (w >= 7) add("night_orc", w - 5);
  if (w >= 8) add("ogre", Math.floor(w / 8));
  if (w >= 9) add("blood_general", Math.floor(w / 4));
  if (w % 5 === 0) add(bossFor(w), 1); // a boss every 5th wave
  if (w > FINAL_WAVE) { add("orc_berserker", w - 8); add("night_orc", w - 8); }
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
  if (bossWave) SFX.bossRoar();
  if (w >= 10 && (!UN.scythe || !UN.reaper)) {
    UN.scythe = true; UN.reaper = true; saveUnlocks();
    texts.push({ x: player.x, y: player.y - 56, s: "SCYTHE & REAPER UNLOCKED!", life: 3, col: "#b48cff", big: true });
    SFX.level();
  }
}

function spawnPointFor() {
  // random point near an edge, away from the player
  for (let i = 0; i < 24; i++) {
    const side = irnd(0, 3);
    let x, y;
    if (side === 0) { x = rnd(TILE * 2, WORLD_W - TILE * 2); y = rnd(TILE * 2.5, TILE * 4); }
    else if (side === 1) { x = rnd(TILE * 2, WORLD_W - TILE * 2); y = rnd(WORLD_H - TILE * 4, WORLD_H - TILE * 2); }
    else if (side === 2) { x = rnd(TILE * 2, TILE * 4); y = rnd(TILE * 3, WORLD_H - TILE * 2); }
    else { x = rnd(WORLD_W - TILE * 4, WORLD_W - TILE * 2); y = rnd(TILE * 3, WORLD_H - TILE * 2); }
    if (dist({ x, y }, player) > 90) return { x, y };
  }
  return { x: TILE * 3, y: TILE * 3 };
}

function spawnEnemy(type) {
  const t = E_TYPES[type];
  const p = spawnPointFor();
  const mult = 1 + 0.20 * (G.wave - 1);
  enemies.push({
    type, ...p, r: t.r, anim: t.anim, dirAnim: t.dirAnim, dir: "d", scale: t.scale,
    hp: t.hp * mult, maxHp: t.hp * mult,
    spd: t.spd * (1 + 0.02 * (G.wave - 1)) * rnd(0.9, 1.1),
    dmg: t.dmg * (1 + 0.06 * (G.wave - 1)),
    xp: t.xp, ranged: !!t.ranged, rage: !!t.rage, big: !!t.big, boss: !!t.boss,
    bossBar: !!t.bossBar, charge: !!t.charge, king: !!t.king,
    score: t.score,
    atkCd: rnd(0, 1), animT: rnd(0, 9), facing: 1, hitFlash: 0, warmup: 0.8,
    summonCd: 6, strafe: rnd(0, Math.PI * 2), chargeCd: 4, chargeT: 0,
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

const CARD_POOL = [
  // common
  { id: "dmg", r: "common", name: "Sharpened Edge", desc: "+10% damage", icon: "weapon_waraxe", max: 7, apply: s => s.dmg *= 1.10 },
  { id: "mov", r: "common", name: "Swift Boots", desc: "+6% move speed", icon: "flask_big_green", max: 5, apply: s => s.moveSpd *= 1.06 },
  { id: "hp", r: "common", name: "Orcish Vigor", desc: "+12% max HP, heal 10", icon: "flask_big_red", max: 7, apply: s => { s.maxHp = Math.round(s.maxHp * 1.12); player.hp = Math.min(s.maxHp, player.hp + 10); } },
  { id: "stone", r: "common", name: "Stone Skin", desc: "+16 max HP", icon: "wall_mid", max: 5, apply: s => s.maxHp += 16 },
  { id: "knock", r: "common", name: "Heavy Blows", desc: "+35% knockback", icon: "weapon_mace", max: 4, apply: s => s.knock *= 1.35 },
  { id: "mag", r: "common", name: "Greedy Hands", desc: "+30% pickup range", icon: "coin_f0", max: 4, apply: s => s.magnet *= 1.30 },
  // rare
  { id: "spd", r: "rare", name: "Battle Rage", desc: "+8% attack speed", icon: "slash_f1", max: 7, apply: s => s.atkSpd *= 1.08 },
  { id: "reg", r: "rare", name: "Campfire Warmth", desc: "+0.5 HP/s regen", icon: "campfire_f0", max: 5, apply: s => s.regen += 0.5 },
  { id: "cry", r: "rare", name: "War Cry", desc: "+6% damage, +4% attack speed", icon: "weapon_throwing_axe", max: 5, apply: s => { s.dmg *= 1.06; s.atkSpd *= 1.04; } },
  { id: "xp", r: "rare", name: "Trophy Hunter", desc: "+15% XP gained", icon: "xp_gem_f0", max: 4, apply: s => s.xpGain *= 1.15 },
  { id: "rng", r: "rare", name: "Long Arms", desc: "+10% attack range", icon: "slash_f0", max: 3, apply: s => s.range *= 1.10 },
  { id: "gold", r: "rare", name: "Gold Digger", desc: "+35% coin drops", icon: "coin_f2", max: 3, apply: s => s.goldDig += 0.35 },
  // epic
  { id: "crit", r: "epic", name: "Keen Eye", desc: "+6% crit chance (2x)", icon: "weapon_anime_sword", max: 5, apply: s => s.crit += 0.06 },
  { id: "arm", r: "epic", name: "Iron Hide", desc: "-8% damage taken", icon: "crate", max: 5, apply: s => s.armor = 1 - (1 - s.armor) * 0.92 },
  { id: "vamp", r: "epic", name: "Blood Pact", desc: "2% lifesteal", icon: "skull", max: 4, apply: s => s.lifesteal += 0.02 },
  { id: "giant", r: "epic", name: "Giant Slayer", desc: "+20% damage vs big orcs", icon: "weapon_hammer", max: 3, apply: s => s.giant += 0.20 },
  { id: "wind", r: "epic", name: "Second Wind", desc: "+15% campfire healing", icon: "campfire_f2", max: 3, apply: s => s.wind += 0.15 },
  { id: "luck", r: "epic", name: "Lucky Charm", desc: "rarer cards appear more often", icon: "flask_big_yellow", max: 3, apply: s => s.luck += 0.5 },
  // legendary
  { id: "ldmg", r: "legendary", name: "Warlord's Edge", desc: "+25% damage", icon: "weapon_golden_sword", max: 3, apply: s => s.dmg *= 1.25 },
  { id: "lspd", r: "legendary", name: "Bloodlust", desc: "+20% attack speed", icon: "weapon_saw_sword", max: 3, apply: s => s.atkSpd *= 1.20 },
  { id: "lvamp", r: "legendary", name: "Vampire Lord", desc: "+5% lifesteal", icon: "skull", max: 2, apply: s => s.lifesteal += 0.05 },
  { id: "lcrit", r: "legendary", name: "Deathmark", desc: "+15% crit chance", icon: "weapon_katana", max: 2, apply: s => s.crit += 0.15 },
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

function drawThreeCards() {
  const avail = CARD_POOL.filter(c => (cardCounts[c.id] || 0) < c.max);
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
    picksLeft: Math.max(1, player.banked), // always at least one card by the fire
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
  if (campfire.picksLeft > 0) campfire.cards = drawThreeCards();
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
  toast("+" + Math.round(player.stats.maxHp * 0.5) + " HP");
  SFX.gem();
}
function shopExtraPick() {
  if (!campfire) return;
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
  texts.push({ x: e.x + rnd(-4, 4), y: e.y - 14 * e.scale, s: String(Math.round(dmg)), life: 0.6, col: crit ? "#ffd166" : "#fff" });
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
  const coinCount = e.big ? 3 : (Math.random() < 0.3 * (1 + player.stats.goldDig) ? 1 : 0);
  for (let i = 0; i < coinCount; i++) coins.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-4, 4), t: rnd(0, 9), vx: rnd(-25, 25), vy: rnd(-50, -20) });
  if (Math.random() < (e.big ? 0.8 : 0.04)) flasks.push({ x: e.x, y: e.y, t: 0 });
  if (e.big && Math.random() < 0.001) { // 0.1% relic drop from bosses
    const locked = ["barbar", "nun"].filter(c => !UN[c]);
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

function playerMeleeAttack() {
  const st = player.stats;
  const target = nearestEnemy(player, st.range + 14);
  if (!target) return;
  player.atkCd = 1 / st.atkSpd;
  const ang = Math.atan2(target.y - player.y, target.x - player.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  player.atkAng = ang;
  if (G.weapon === "whip") {
    fx.push({ kind: "whip", ang, life: 0.18, max: 0.18 });
  } else if (G.weapon !== "spear") { // spear's thrust is the held weapon itself
    fx.push({ kind: "slash", x: player.x + Math.cos(ang) * 14, y: player.y + Math.sin(ang) * 14 - 6, ang, life: 0.18, max: 0.18, scale: G.weapon === "scythe" ? 1.7 : 1 });
  }
  SFX.slash();
  for (const e of [...enemies]) {
    if (e.warmup > 0) continue;
    const d = dist(player, e);
    if (d > st.range + e.r + 6) continue;
    const ea = Math.atan2(e.y - player.y, e.x - player.x);
    let diff = Math.abs(ea - ang);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < st.arc) {
      const crit = Math.random() < st.crit;
      damageEnemy(e, st.dmg * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
      // knockback
      e.x += Math.cos(ea) * 6 * st.knock; e.y += Math.sin(ea) * 6 * st.knock;
    }
  }
}

function playerMolotovAttack() {
  const st = player.stats;
  const target = nearestEnemy(player, st.range);
  if (!target) return;
  player.atkCd = 1 / st.atkSpd;
  const ang = Math.atan2(target.y - player.y, target.x - player.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  player.atkAng = ang;
  const d = dist(player, target);
  molotovs.push({
    sx: player.x, sy: player.y - 10, tx: target.x, ty: target.y,
    x: player.x, y: player.y - 10, t: 0, dur: clamp(d / 150, 0.45, 1.0), spin: 0,
  });
  SFX.slash();
}

function explodeMolotov(m) {
  const st = player.stats;
  SFX.boom();
  G.shake = Math.max(G.shake, 4);
  firePatches.push({ x: m.tx, y: m.ty, life: 2.4, max: 2.4, tick: 0, seed: Math.random() * 9 });
  for (const e of [...enemies]) {
    if (e.warmup > 0) continue;
    if (Math.hypot(e.x - m.tx, e.y - m.ty) < 30 + e.r) {
      const crit = Math.random() < st.crit;
      damageEnemy(e, st.dmg * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
    }
  }
  for (let i = 0; i < 12; i++) {
    fx.push({ kind: "spark", x: m.tx, y: m.ty - 2, vx: rnd(-70, 70), vy: rnd(-90, -10), life: rnd(0.25, 0.6), max: 0.6 });
  }
}

function playerStarAttack() {
  const st = player.stats;
  const target = nearestEnemy(player, st.range);
  if (!target) return;
  player.atkCd = 1 / st.atkSpd;
  const ang = Math.atan2(target.y - player.y, target.x - player.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  player.atkAng = ang;
  stars.push({ x: player.x + Math.cos(ang) * 8, y: player.y - 8 + Math.sin(ang) * 8, vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260, spin: 0, life: 0.6 });
  SFX.slash();
}

// mage spells — manual cast (click/tap or 1/2/3), auto-aimed, long cooldowns
function castSpell(id) {
  if (!player || player.spellCd[id] > 0) return false;
  const st = player.stats;
  if (id === "fire") {
    const target = nearestEnemy(player, st.range);
    if (!target) return false;
    const ang = Math.atan2(target.y - player.y, target.x - player.x);
    player.facing = Math.cos(ang) >= 0 ? 1 : -1;
    player.atkAng = ang;
    fireballs.push({ x: player.x + Math.cos(ang) * 8, y: player.y - 8 + Math.sin(ang) * 8, vx: Math.cos(ang) * 180, vy: Math.sin(ang) * 180, t: 0, life: 1.1 });
    SFX.slash();
  } else if (id === "shock") {
    if (!enemies.some(e => e.warmup <= 0 && dist(e, player) < 70)) return false;
    fx.push({ kind: "ring", x: player.x, y: player.y, life: 0.4, max: 0.4, r: 62 });
    G.shake = Math.max(G.shake, 5);
    SFX.boom();
    for (const e of [...enemies]) {
      if (e.warmup > 0) continue;
      const d = dist(e, player);
      if (d < 62 + e.r) {
        const a = Math.atan2(e.y - player.y, e.x - player.x);
        e.x += Math.cos(a) * 34 * st.knock; e.y += Math.sin(a) * 34 * st.knock;
        damageEnemy(e, st.dmg * 0.8 * rnd(0.9, 1.1), false);
      }
    }
  } else if (id === "beam") {
    const target = nearestEnemy(player, st.range + 30);
    if (!target) return false;
    const ang = Math.atan2(target.y - player.y, target.x - player.x);
    player.facing = Math.cos(ang) >= 0 ? 1 : -1;
    player.atkAng = ang;
    beams.push({ ang, t: 1.3, tick: 0, len: 150 });
    SFX.bossRoar();
  }
  player.spellCd[id] = SPELLS[id].cd;
  return true;
}

function castNextReady() {
  for (const id of ["fire", "shock", "beam"]) {
    if (player.spellCd[id] <= 0 && castSpell(id)) return true;
  }
  return false;
}

function explodeFireball(f) {
  const st = player.stats;
  SFX.boom();
  G.shake = Math.max(G.shake, 3);
  for (const e of [...enemies]) {
    if (e.warmup > 0) continue;
    if (Math.hypot(e.x - f.x, e.y - f.y) < 28 + e.r) {
      const crit = Math.random() < st.crit;
      damageEnemy(e, st.dmg * 1.1 * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
    }
  }
  for (let i = 0; i < 10; i++) {
    fx.push({ kind: "spark", x: f.x, y: f.y - 2, vx: rnd(-60, 60), vy: rnd(-80, -10), life: rnd(0.2, 0.5), max: 0.5 });
  }
}

function playerBowAttack() {
  const st = player.stats;
  const target = nearestEnemy(player, st.range);
  if (!target) return;
  player.atkCd = 1 / st.atkSpd;
  const ang = Math.atan2(target.y - player.y, target.x - player.x);
  player.facing = Math.cos(ang) >= 0 ? 1 : -1;
  arrows.push({ x: player.x + Math.cos(ang) * 8, y: player.y - 8 + Math.sin(ang) * 8, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300, ang, life: 0.8 });
  SFX.slash();
  player.ammo--;
  if (player.ammo <= 0) {
    player.reloadT = WEAPONS[G.weapon].reload;
    texts.push({ x: player.x, y: player.y - 28, s: "reloading…", life: 1, col: "#ffd166" });
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
  if (ml > 0) { mx /= ml; my /= ml; player.facing = mx !== 0 ? Math.sign(mx) : player.facing; }

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

  // -- attacks
  player.atkCd -= dt;
  if (WEAPONS[G.weapon].ranged) {
    if (player.reloadT > 0) {
      player.reloadT -= dt;
      if (player.reloadT <= 0) { player.ammo = WEAPONS[G.weapon].clip; SFX.card(); }
    } else if (player.atkCd <= 0) {
      playerBowAttack();
    }
  } else if (WEAPONS[G.weapon].thrown) {
    if (player.atkCd <= 0) playerMolotovAttack();
  } else if (WEAPONS[G.weapon].star) {
    if (player.atkCd <= 0) playerStarAttack();
  } else if (WEAPONS[G.weapon].spells) {
    for (const id of Object.keys(player.spellCd)) player.spellCd[id] = Math.max(0, player.spellCd[id] - dt);
  } else if (player.atkCd <= 0) playerMeleeAttack();

  // -- mage projectiles & beams
  for (const f of [...fireballs]) {
    f.x += f.vx * dt; f.y += f.vy * dt; f.t += dt; f.life -= dt;
    let hit = f.life <= 0;
    for (const e of enemies) {
      if (e.warmup > 0) continue;
      if (dist(f, { x: e.x, y: e.y - 4 }) < e.r + 6) { hit = true; break; }
    }
    if (hit) { fireballs.splice(fireballs.indexOf(f), 1); explodeFireball(f); }
  }
  for (const b of [...beams]) {
    b.t -= dt; b.tick -= dt;
    if (b.t <= 0) { beams.splice(beams.indexOf(b), 1); continue; }
    if (b.tick <= 0) {
      b.tick = 0.3;
      const ox = player.x, oy = player.y - 6;
      for (const e of [...enemies]) {
        if (e.warmup > 0) continue;
        const dx = e.x - ox, dy = (e.y - 6) - oy;
        const proj = dx * Math.cos(b.ang) + dy * Math.sin(b.ang);
        const perp = Math.abs(-dx * Math.sin(b.ang) + dy * Math.cos(b.ang));
        if (proj > 4 && proj < b.len && perp < 10 + e.r) {
          damageEnemy(e, player.stats.dmg * 0.45 * rnd(0.9, 1.1), false);
        }
      }
    }
  }

  // -- molotovs & burning ground
  for (const m of [...molotovs]) {
    m.t += dt; m.spin += dt * 9;
    const p = m.t / m.dur;
    if (p >= 1) { molotovs.splice(molotovs.indexOf(m), 1); explodeMolotov(m); continue; }
    m.x = m.sx + (m.tx - m.sx) * p;
    m.y = m.sy + (m.ty - m.sy) * p - Math.sin(Math.PI * p) * 26;
  }
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

  // -- spawning
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
      // shamans hover at range and lob bolts
      e.strafe += dt * 0.7;
      const want = 110;
      if (dToP < want - 15) { tx = -tx; ty = -ty; }
      else if (dToP < want + 25) { tx = Math.cos(e.strafe) * 40; ty = Math.sin(e.strafe) * 40; }
      e.atkCd -= dt;
      if (e.atkCd <= 0 && dToP < (e.king ? 230 : 190)) {
        e.atkCd = e.king ? 3.6 : rnd(2.2, 3.2);
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        const n = e.king ? 5 : 1; // shaman king fires a fan
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
        texts.push({ x: e.x, y: e.y - 40, s: "WAAAGH!", life: 1.2, col: "#ff6b6b", big: true });
        SFX.bossRoar();
        for (let i = 0; i < 3; i++) spawnEnemy("goblin");
      }
    }
    const tl = Math.hypot(tx, ty) || 1;
    e.x += (tx / tl) * sp * dt; e.y += (ty / tl) * sp * dt;
    e.facing = player.x >= e.x ? 1 : -1;
    if (e.dirAnim) e.dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? "r" : "l") : (ty > 0 ? "d" : "u");
    const ec = collideSolids(e.x, e.y, e.r);
    e.x = ec.x; e.y = ec.y;
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

  // -- projectiles
  for (const s2 of [...stars]) {
    s2.x += s2.vx * dt; s2.y += s2.vy * dt; s2.spin += dt * 22; s2.life -= dt;
    for (const e of enemies) {
      if (e.warmup > 0) continue;
      if (dist(s2, { x: e.x, y: e.y - 4 }) < e.r + 4) {
        const crit = Math.random() < st.crit;
        damageEnemy(e, st.dmg * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
        s2.life = 0;
        break;
      }
    }
    if (s2.life <= 0) stars.splice(stars.indexOf(s2), 1);
  }
  for (const a of [...arrows]) {
    a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt;
    for (const e of enemies) {
      if (e.warmup > 0) continue;
      if (dist(a, { x: e.x, y: e.y - 4 }) < e.r + 5) {
        const crit = Math.random() < st.crit;
        damageEnemy(e, st.dmg * (crit ? 2 : 1) * rnd(0.9, 1.1), crit);
        a.life = 0;
        break;
      }
    }
    if (a.life <= 0) arrows.splice(arrows.indexOf(a), 1);
  }
  for (const b of [...bolts]) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
    if (b.t > 2.4) { bolts.splice(bolts.indexOf(b), 1); continue; }
    if (dist(b, player) < player.r + 4) {
      bolts.splice(bolts.indexOf(b), 1);
      hurtPlayer(b.dmg);
    }
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
      texts.push({ x: player.x, y: player.y - 26, s: "+" + Math.round(st.maxHp * 0.3), life: 1, col: "#ff6b6b" });
      SFX.gem();
    }
  }

  // -- fx / texts
  for (const p of [...fx]) {
    p.life -= dt;
    if (p.kind === "blood" || p.kind === "spark") { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
    if (p.life <= 0) fx.splice(fx.indexOf(p), 1);
  }
  for (const t of [...texts]) {
    t.life -= dt; t.y -= 14 * dt;
    if (t.life <= 0) texts.splice(texts.indexOf(t), 1);
  }

  G.shake = Math.max(0, G.shake - dt * 30);

  // -- wave end
  if (!spawnQueue.length && enemies.length === 0) {
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
  player.hurtCd = 0.5;
  player.flash = 0.15;
  G.shake = 6;
  SFX.hurt();
  texts.push({ x: player.x, y: player.y - 26, s: "-" + Math.round(taken), life: 0.8, col: "#ff6b6b" });
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
  for (const e of enemies) drawables.push({ y: e.y, draw: () => drawEnemy(e) });
  drawables.push({ y: player.y, draw: drawPlayer });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // projectiles & fx above
  for (const m of molotovs) {
    ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y)); ctx.rotate(m.spin);
    const im = IMG.weapon_molotov;
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  for (const a of arrows) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang + Math.PI / 2);
    const im = IMG.weapon_arrow;
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  for (const s2 of stars) {
    ctx.save(); ctx.translate(Math.round(s2.x), Math.round(s2.y)); ctx.rotate(s2.spin);
    const im = IMG.weapon_shuriken;
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  for (const f of fireballs) {
    const g3 = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, 10);
    g3.addColorStop(0, "rgba(255,240,180,0.95)");
    g3.addColorStop(0.5, "rgba(240,130,40,0.7)");
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(f.x - 10, f.y - 10, 20, 20);
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 2, 4, 4);
  }
  for (const b of beams) {
    const ox = player.x, oy = player.y - 6;
    const flick = 0.7 + Math.sin(G.t * 40) * 0.3;
    const fade = clamp(b.t / 0.3, 0, 1); // fades out at the end
    ctx.save();
    ctx.translate(ox, oy); ctx.rotate(b.ang);
    ctx.lineCap = "round";
    for (const [w2, col] of [[9, `rgba(200,50,20,${0.25 * fade})`], [5, `rgba(240,130,40,${0.55 * fade * flick})`], [2, `rgba(255,240,190,${0.9 * fade})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w2;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(b.len, 0); ctx.stroke();
    }
    ctx.restore();
  }
  for (const b of bolts) drawSprite(animFrame(ANIM.bolt, b.t, 8), b.x, b.y + 3);
  for (const p of fx) {
    if (p.kind === "blood") {
      ctx.fillStyle = `rgba(110,180,60,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "ring") {
      const pr = (1 - p.life / p.max) * p.r;
      ctx.strokeStyle = `rgba(255,209,102,${p.life / p.max})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * p.life / p.max})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, pr - 5), 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === "spark") {
      ctx.fillStyle = `rgba(252,${140 + Math.round(90 * p.life / p.max)},50,${p.life / p.max})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    } else if (p.kind === "slash") {
      const f = ANIM.slash[Math.min(2, Math.floor((1 - p.life / p.max) * 3))];
      ctx.save();
      ctx.translate(p.x, p.y + 6);
      ctx.rotate(p.ang + Math.PI * 0.75);
      if (p.scale && p.scale !== 1) ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = 0.9;
      const im = IMG[f];
      ctx.drawImage(im, -im.width / 2, -im.height / 2);
      ctx.restore();
    } else if (p.kind === "whip") {
      // cracking lash: quadratic curve from hand to tip, extends then snaps back
      const prog = 1 - p.life / p.max;
      const st2 = player.stats;
      const len = st2.range * 1.05 * Math.sin(Math.PI * Math.min(1, prog * 1.15));
      const hx = player.x + Math.cos(p.ang) * 6, hy = player.y - 8 + Math.sin(p.ang) * 6;
      const tx2 = hx + Math.cos(p.ang) * len, ty2 = hy + Math.sin(p.ang) * len;
      const px2 = -Math.sin(p.ang), py2 = Math.cos(p.ang);
      const wob = Math.sin(prog * Math.PI * 3) * 9 * (1 - prog);
      ctx.save();
      ctx.lineCap = "round";
      for (const [w2, col] of [[2.5, `rgba(94,62,40,${0.8 * p.life / p.max + 0.2})`], [1, `rgba(224,190,140,${0.9})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo(hx + Math.cos(p.ang) * len * 0.5 + px2 * wob, hy + Math.sin(p.ang) * len * 0.5 + py2 * wob, tx2, ty2);
        ctx.stroke();
      }
      if (prog > 0.35 && prog < 0.75) { // crack flash at the tip
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(Math.round(tx2) - 1, Math.round(ty2) - 1, 3, 3);
      }
      ctx.restore();
    }
  }

  // damage numbers
  ctx.textAlign = "center";
  for (const t of texts) {
    ctx.font = t.big ? "bold 11px monospace" : "bold 8px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(t.s, Math.round(t.x) + 1, Math.round(t.y) + 1);
    ctx.fillStyle = t.col;
    ctx.fillText(t.s, Math.round(t.x), Math.round(t.y));
  }
  ctx.restore();

  renderDarkness(cx, cy);
}

const PLAYER_SCALE = 1.3;
function drawPlayer() {
  const st = player.stats;
  const list = ANIM[CLASSES[G.cls].anim + (player.moving ? "_run" : "_idle")];
  if (player.flash > 0) { player.flash -= 1 / 60; ctx.filter = "brightness(2.5)"; }
  if (player.hurtCd > 0.3) ctx.globalAlpha = 0.6;
  drawSprite(animFrame(list, player.animT), player.x, player.y + 5, player.facing < 0, PLAYER_SCALE);
  ctx.filter = "none"; ctx.globalAlpha = 1;
  // held weapon(s)
  const wdef = WEAPONS[G.weapon];
  const im = IMG[wdef.sprite];
  const tSince = 1 / st.atkSpd - player.atkCd;
  const attacking = player.atkCd > 0 && tSince >= 0 && tSince < 0.22;
  if (G.weapon === "spear" && attacking) {
    // thrust: the spear itself shoots out along the attack angle and returns
    const prog = Math.sin(Math.PI * tSince / 0.22);
    const d = 4 + prog * st.range * 0.6;
    ctx.save();
    ctx.translate(Math.round(player.x + Math.cos(player.atkAng) * d), Math.round(player.y - 6 + Math.sin(player.atkAng) * d));
    ctx.rotate(player.atkAng + Math.PI / 2);
    ctx.drawImage(im, -im.width / 2, -im.height + 2); // grip at origin, tip leads
    ctx.restore();
  } else if (G.weapon === "whip" && attacking) {
    // handle flicks toward the lash (the lash itself is a whip fx)
    ctx.save();
    ctx.translate(Math.round(player.x + Math.cos(player.atkAng) * 6), Math.round(player.y - 8));
    ctx.rotate(player.atkAng + Math.PI / 2 + 0.4);
    ctx.drawImage(im, -im.width / 2, -im.height + 3);
    ctx.restore();
  } else {
    const swing = (wdef.ranged || wdef.thrown || wdef.star || wdef.spells || G.weapon === "spear" || G.weapon === "whip") ? 0 : (attacking ? -1.2 : 0);
    ctx.save();
    ctx.translate(Math.round(player.x + player.facing * 8), Math.round(player.y - 8));
    ctx.rotate(player.facing * ((wdef.ranged || wdef.thrown || wdef.star || wdef.spells) ? 0.15 : 0.5 + swing));
    ctx.scale(player.facing, 1);
    ctx.drawImage(im, -2, -im.height + 4);
    ctx.restore();
    if (G.weapon === "knives") { // off-hand knife
      ctx.save();
      ctx.translate(Math.round(player.x - player.facing * 7), Math.round(player.y - 7));
      ctx.rotate(-player.facing * (0.4 + swing * 0.5));
      ctx.scale(-player.facing, 1);
      ctx.drawImage(im, -2, -im.height + 4);
      ctx.restore();
    }
  }
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
  drawSprite(animFrame(list, e.animT, enraged ? 14 : 10), e.x, e.y + (e.dirAnim ? 6 : 4), flip, e.scale);
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
  dc.fillStyle = "rgba(6,4,14,0.58)";
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
  for (const m of molotovs) punch(m.x, m.y, 18, 0.7);
  for (const f of fireballs) punch(f.x, f.y, 30, 0.8);
  for (const b of beams) {
    for (let i = 0; i < 4; i++) {
      punch(player.x + Math.cos(b.ang) * (20 + i * 38), player.y - 6 + Math.sin(b.ang) * (20 + i * 38), 26, 0.6);
    }
  }
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
  ctx.fillText(`${Math.ceil(player.hp)}/${st.maxHp}`, 12, 15);
  // xp
  bar(8, 19, 90, 5, player.xp / xpNeeded(player.level), "#7bd88f");
  ctx.fillStyle = "#cfc6de";
  ctx.fillText(`LV ${player.level}`, 102, 25);
  // wave info
  ctx.textAlign = "center"; ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd166";
  ctx.fillText(`WAVE ${G.wave}`, VW / 2, 14);
  ctx.font = "7px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText(`${enemies.length + spawnQueue.length} orcs left`, VW / 2, 23);
  // kills
  const sk = IMG.skull;
  if (sk && sk.complete) ctx.drawImage(sk, VW - 26 - String(G.kills).length * 5, 5);
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffd166"; ctx.fillText(`${G.kills}`, VW - 10, 14);
  // bow ammo
  if (WEAPONS[G.weapon].ranged) {
    if (player.reloadT > 0) {
      bar(8, 30, 60, 4, 1 - player.reloadT / WEAPONS[G.weapon].reload, "#ffd166");
    } else {
      for (let i = 0; i < WEAPONS[G.weapon].clip; i++) {
        ctx.fillStyle = i < player.ammo ? "#ffd166" : "#3a3346";
        ctx.fillRect(8 + i * 6, 30, 4, 4);
      }
    }
  }
  // pause button
  pauseBtnRect = { x: VW - 28, y: 30, w: 20, h: 18 };
  ctx.fillStyle = "rgba(36,28,46,0.75)"; ctx.fillRect(pauseBtnRect.x, pauseBtnRect.y, pauseBtnRect.w, pauseBtnRect.h);
  ctx.strokeStyle = "#57506b"; ctx.lineWidth = 1;
  ctx.strokeRect(pauseBtnRect.x + 0.5, pauseBtnRect.y + 0.5, pauseBtnRect.w - 1, pauseBtnRect.h - 1);
  ctx.fillStyle = "#cfc6de";
  ctx.fillRect(pauseBtnRect.x + 6, pauseBtnRect.y + 5, 3, 8);
  ctx.fillRect(pauseBtnRect.x + 11, pauseBtnRect.y + 5, 3, 8);

  // monk weapon inventory (dev mode only)
  if (DEV.on && G.cls === "monk") renderInventoryBar();
  else invRects = [];

  // mage spell bar
  if (WEAPONS[G.weapon].spells) renderSpellBar();
  else spellRects = [];

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

// monk-only (dev mode): switch to any weapon mid-run, stats rebuilt from
// scratch (base weapon -> class mods -> owned cards re-applied)
function monkSwitchWeapon(id) {
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
  player.atkCd = 0; player.reloadT = 0; player.ammo = WEAPONS[id].clip || 0;
  SFX.card();
}

let spellRects = [];
function renderSpellBar() {
  spellRects = [];
  const ids = Object.keys(SPELLS);
  const slot = 26, gap = 6;
  const total = ids.length * slot + (ids.length - 1) * gap;
  // sits above the monk's arsenal bar when he's testing the spells
  const x0 = VW / 2 - total / 2, y = (DEV.on && G.cls === "monk") ? VH - 62 : VH - 32;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], x = x0 + i * (slot + gap);
    spellRects.push({ x, y, w: slot, h: slot, id });
    const cd = player.spellCd[id], ready = cd <= 0;
    ctx.fillStyle = ready ? "rgba(255,209,102,0.16)" : "rgba(24,19,34,0.85)";
    ctx.fillRect(x, y, slot, slot);
    ctx.strokeStyle = ready ? "#ffd166" : "#3a3346"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, slot - 1, slot - 1);
    // icon
    const cx2 = x + slot / 2, cy2 = y + slot / 2;
    const col = ready ? "#ffb347" : "#57506b";
    if (id === "fire") {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx2, cy2 + 1, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ready ? "#fff3c4" : "#6f6485";
      ctx.beginPath(); ctx.arc(cx2 - 1, cy2, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (id === "shock") {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx2, cy2, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx2, cy2, 3.5, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = col; ctx.lineCap = "round";
      for (const [w2, len] of [[3, 8], [1.5, 10]]) {
        ctx.lineWidth = w2;
        ctx.beginPath(); ctx.moveTo(cx2 - len, cy2 + (w2 === 3 ? 0 : -4)); ctx.lineTo(cx2 + len, cy2 + (w2 === 3 ? 0 : -4)); ctx.stroke();
      }
    }
    // cooldown veil
    if (!ready) {
      const frac = cd / SPELLS[id].cd;
      ctx.fillStyle = "rgba(7,5,16,0.72)";
      ctx.fillRect(x + 1, y + 1, slot - 2, Math.round((slot - 2) * frac));
      ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#cfc6de";
      ctx.fillText(Math.ceil(cd), cx2, cy2 + 3);
    }
    ctx.font = "6px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#6f6485";
    ctx.fillText(`[${i + 1}]`, cx2, y + slot + 7);
  }
  ctx.font = "6px monospace"; ctx.fillStyle = "#8f84a8";
  ctx.fillText("click / tap to cast — aim is automatic", VW / 2, y - 4);
}

function renderInventoryBar() {
  invRects = [];
  const ids = Object.keys(WEAPONS);
  const slot = 21, gap = 1;
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
      const s = Math.min(1.1, (slot - 6) / im.height, (slot - 6) / im.width);
      ctx.drawImage(im, Math.round(x + slot / 2 - im.width * s / 2), Math.round(y + slot / 2 - im.height * s / 2), Math.round(im.width * s), Math.round(im.height * s));
    }
  }
  ctx.font = "6px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#8f84a8";
  ctx.fillText(`MONK ARSENAL — ${WEAPONS[G.weapon].name} · tap a slot or Q/E to cycle`, VW / 2, y - 4);
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

  // the knight rests by the fire while the names roll
  drawSprite(animFrame(ANIM.campfire, t, 8), VW / 2 + 16, VH - 12, false, 1.5);
  drawSprite(animFrame(ANIM.hero_idle, t, 6), VW / 2 - 18, VH - 14, false, PLAYER_SCALE);
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
  // the monk swaps weapons in-game via his inventory bar — no select screen
  if (id === "monk") newRun("sword");
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
  if (id === "reaper") return buy + " · or reach wave 10";
  if (id === "barbar" || id === "nun") return buy + " · or 0.1% boss relic";
  if (id === "mage") return buy + " — the arcane is costly";
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
  const ids = Object.keys(CLASSES).filter(id => !CLASSES[id].devOnly || DEV.on);
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
  const pw = 208, ph = 46, gapx = 16, gapy = 10;
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
      const s = Math.min(2, 36 / icon.height);
      if (!unlocked) ctx.globalAlpha = 0.35;
      ctx.drawImage(icon, Math.round(x + 20 - icon.width * s / 2), Math.round(y + ph / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      if (id === "knives") ctx.drawImage(icon, Math.round(x + 28 - icon.width * s / 2), Math.round(y + ph / 2 - icon.height * s / 2), Math.round(icon.width * s), Math.round(icon.height * s));
      ctx.globalAlpha = 1;
    }
    const lv = wpnLevel(id);
    ctx.textAlign = "left";
    ctx.font = "bold 8px monospace"; ctx.fillStyle = unlocked ? "#e8dfc8" : "#57506b";
    ctx.fillText(`[${i + 1}] ${w.name}${lv > 0 ? ` LV${lv}` : ""}`, x + 40, y + 14);
    ctx.font = "7px monospace"; ctx.fillStyle = unlocked ? "#8f84a8" : "#453f58";
    ctx.fillText(unlocked ? w.desc : "locked — reach wave 10", x + 40, y + 26);
    ctx.fillStyle = unlocked ? "#ffd166" : "#453f58";
    const dmgNow = Math.round(w.dmg * (1 + 0.08 * lv) * 10) / 10;
    ctx.fillText(w.ranged ? `dmg ${dmgNow} · ${w.atkSpd}/s · ${w.clip} arrows` : `dmg ${dmgNow} · ${w.atkSpd}/s · reach ${w.range}`, x + 40, y + 38);
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
  // cave sky: vertical gradient + faint stalactite silhouettes
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, "#070510"); sky.addColorStop(0.6, "#120c1c"); sky.addColorStop(1, "#1c1224");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);

  // warm glow from the campfire corner
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
  ctx.font = "bold 42px monospace";
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText("ORC SLASHER", 3, 4);
  const tg = ctx.createLinearGradient(0, -34, 0, 8);
  tg.addColorStop(0, "#fff3c4"); tg.addColorStop(0.45, "#ffd166"); tg.addColorStop(0.85, "#e2762e"); tg.addColorStop(1, "#a33d1e");
  ctx.fillStyle = tg; ctx.fillText("ORC SLASHER", 0, 0);
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(42,20,12,0.9)";
  ctx.strokeText("ORC SLASHER", 0, 0);
  ctx.restore();
  ctx.textAlign = "center";

  // ground strip
  if (!titleFloor) {
    titleFloor = document.createElement("canvas");
    titleFloor.width = VW; titleFloor.height = 40;
    const fc = titleFloor.getContext("2d");
    fc.imageSmoothingEnabled = false;
    const names = ["floor_1", "floor_1", "floor_2", "floor_3", "floor_7"];
    for (let i = 0; i <= VW / TILE; i++) {
      fc.drawImage(IMG[names[(i * 7) % names.length]], i * TILE, 8);
      fc.drawImage(IMG[names[(i * 3 + 1) % names.length]], i * TILE, 24);
    }
    fc.fillStyle = "rgba(6,4,14,0.45)"; fc.fillRect(0, 0, VW, 40);
  }
  ctx.drawImage(titleFloor, 0, VH - 62);

  // the knight rests at his campfire, facing the marching horde
  drawSprite(animFrame(ANIM.campfire, t, 8), 46, VH - 40, false, 1.5);
  drawSprite(animFrame(ANIM.hero_idle, t, 6), 78, VH - 42, false, PLAYER_SCALE);

  // endless orc horde marching left toward him
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
  ctx.fillText("PRESS ENTER / TAP TO SLAY", VW / 2, 138);
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
  ctx.fillText(victory ? "WARCHIEF SLAIN!" : "YOU DIED", VW / 2, 90);
  ctx.font = "9px monospace"; ctx.fillStyle = "#cfc6de";
  ctx.fillText(`wave ${G.wave} · ${G.kills} orcs slain · ${G.coins} gold · level ${player ? player.level : 1}`, VW / 2, 112);
  if (victory) {
    drawSprite(animFrame(ANIM[CLASSES[G.cls].anim + "_idle"], t, 6), VW / 2 - 12, 150);
    drawSprite(animFrame(ANIM.campfire, t, 8), VW / 2 + 12, 150);
    ctx.font = "8px monospace"; ctx.fillStyle = "#ffd166";
    ctx.fillText("the cave is quiet. the fire is warm.", VW / 2, 168);
    ctx.fillText("[E] keep slaying (endless)   [ENTER] new run", VW / 2, 196);
  } else {
    drawSprite("skull", VW / 2, 152, false, 2);
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
    const ids = Object.keys(CLASSES).filter(id => !CLASSES[id].devOnly || DEV.on);
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
    if (DEV.on && G.cls === "monk" && (code === "KeyQ" || code === "KeyE")) {
      const ids = Object.keys(WEAPONS);
      const i = ids.indexOf(G.weapon);
      monkSwitchWeapon(ids[(i + (code === "KeyE" ? 1 : ids.length - 1)) % ids.length]);
    }
    if (WEAPONS[G.weapon].spells && !G.paused) {
      const m = /^Digit([1-3])$/.exec(code);
      if (m) castSpell(Object.keys(SPELLS)[+m[1] - 1]);
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
        monkSwitchWeapon(r.id);
        return true;
      }
    }
    if (WEAPONS[G.weapon].spells && !G.paused) {
      for (const r of spellRects) {
        if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 && y <= r.y + r.h + 3) {
          castSpell(r.id);
          return true;
        }
      }
      if (!lastPointerTouch) { castNextReady(); return true; } // mouse: click anywhere casts
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
    ctx.fillText("sharpening axes…", VW / 2, VH / 2);
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

  // dev mode badge (kept clear of the monk's arsenal bar)
  if (DEV.on) {
    ctx.font = "bold 7px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = "#b48cff";
    const inPlayAsMonk = G.state === "play" && G.cls === "monk";
    ctx.fillText(inPlayAsMonk ? "DEV" : "DEV MODE — all classes & weapons (retype phrase on a menu to exit)", 6, inPlayAsMonk ? 44 : VH - 4);
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
