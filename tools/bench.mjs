#!/usr/bin/env node
// Frame-time benchmark for dist/orc-slasher.html in headless Chromium.
// Measures the game's own frame() inside the real requestAnimationFrame loop
// (a synchronous update/render loop never presents and gives bogus spikes).
//
//   node tools/bench.mjs [--file path.html] [--throttle 4] [--scene horde] [--fx off] [--gl force]
//
// --throttle N slows the CPU N× (CDP), roughly a mid/low-end phone at 4–6.
// --fx off measures the plain 2D path. Note: headless Chromium runs WebGL on
// SwiftShader (CPU); the game detects that and uses its 2D path, so pass
// --gl force to measure the WebGL path anyway (far slower here than on a GPU).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1];
const file = path.resolve(args.file || "dist/orc-slasher.html");
const throttle = +(args.throttle || 1);
const only = args.scene;
const fxOn = (args.fx || "on") !== "off";
const query = args.gl === "force" ? "?gl=force" : "";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(path.join(execSync("npm root -g").toString().trim(), "playwright")); }

const SCENES = {
  // title screen: skyline, marching horde, embers
  menu: { secs: 4, setup: () => {} },
  // wander the city: chunk painting, cell generation, lamps
  walk: { secs: 8, keys: ["KeyD", "KeyS"], setup: () => { G.cls = "marine"; newRun("rifle"); } },
  // 200 zombies around a minigun: collision, separation, bullets, hit numbers
  horde: { secs: 8, setup: () => {
    G.cls = "heavy"; newRun("minigun"); spawnQueue = [];
    for (let i = 0; i < 200; i++) spawnEnemy("walker");
  } },
  // rockets into a crowd: explosions, particles, lights
  boom: { secs: 8, setup: () => {
    G.cls = "demo"; newRun("rocket"); spawnQueue = [];
    for (let i = 0; i < 140; i++) spawnEnemy("walker");
  } },
};

const browser = await playwright.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const results = [];
for (const [name, sc] of Object.entries(SCENES)) {
  if (only && only !== name) continue;
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  if (throttle > 1) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  await page.goto("file://" + file + query);
  await page.waitForFunction(() => typeof assetsLeft !== "undefined" && assetsLeft === 0);
  await page.evaluate(on => { SND.fx = on; }, fxOn);
  if (name !== "menu") await page.keyboard.press("Enter");
  await page.evaluate(`(${sc.setup})()`);
  await page.evaluate(() => { if (typeof skipIntro === "function") skipIntro(); }); // measure play, not the cinematic
  await page.evaluate(() => {
    if (typeof player !== "undefined" && player) { player.stats.maxHp = 1e9; player.hp = 1e9; }
    window.__ft = [];
    const inner = frame;
    window.frame = now => {
      const t = performance.now();
      inner(now);
      window.__ft.push(performance.now() - t);
      if (typeof player !== "undefined" && player) player.hp = 1e9; // keep the scene alive
    };
  });
  await page.waitForTimeout(500); // warm-up frames are discarded below
  await page.evaluate(() => { window.__ft.length = 0; });
  const keys = sc.keys || [];
  const per = (sc.secs * 1000) / Math.max(1, keys.length);
  if (keys.length) for (const k of keys) { await page.keyboard.down(k); await page.waitForTimeout(per); await page.keyboard.up(k); }
  else await page.waitForTimeout(sc.secs * 1000);
  const ft = await page.evaluate(() => window.__ft.slice());
  const fps = ft.length / sc.secs;
  ft.sort((a, b) => a - b);
  const q = p => ft[Math.min(ft.length - 1, Math.floor(ft.length * p))];
  results.push({
    scene: name, fps: fps.toFixed(0),
    p50: q(0.5).toFixed(2), p99: q(0.99).toFixed(2), max: ft[ft.length - 1].toFixed(1),
    over16: ft.filter(t => t > 16.7).length, errors: errors.length,
  });
  for (const e of errors) console.error(`[${name}] ${e}`);
  await page.close();
}
await browser.close();
console.log(`bench ${path.basename(file)} · cpu throttle ${throttle}× · fx ${fxOn ? "on" : "off"}${query ? " · gl forced" : ""}  (fps = presented frames/s; p50/p99/max = ms of game JS per frame)`);
console.table(results);
