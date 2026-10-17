#!/usr/bin/env node
// Where does a frame go? CPU self-time (CDP sampling profiler) plus, with
// --ops, every canvas call per frame grouped by caller (count, ms, pixels).
// Canvas raster shows up as drawImage / fillRect / "(program)", not as the
// JS function that issued it — the --ops table is how you find the caller.
//
//   node tools/profile.mjs [--file path.html] [--scene horde] [--throttle 4] [--gl force] [--ops]
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1]?.startsWith("--") ? true : process.argv[i + 1] ?? true;
const file = path.resolve(args.file || "dist/orc-slasher.html");
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(path.join(execSync("npm root -g").toString().trim(), "playwright")); }

const SCENES = {
  walk: { keys: ["KeyD", "KeyS"], setup: () => { G.cls = "marine"; newRun("rifle"); } },
  horde: { setup: () => { G.cls = "heavy"; newRun("minigun"); spawnQueue = []; for (let i = 0; i < 200; i++) spawnEnemy("walker"); } },
  boom: { setup: () => { G.cls = "demo"; newRun("rocket"); spawnQueue = []; for (let i = 0; i < 140; i++) spawnEnemy("walker"); } },
};
const browser = await playwright.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
for (const [name, sc] of Object.entries(SCENES)) {
  if (args.scene && args.scene !== name) continue;
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const cdp = await page.context().newCDPSession(page);
  if (+args.throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: +args.throttle });
  await page.goto("file://" + file + (args.gl === "force" ? "?gl=force" : ""));
  await page.waitForFunction(() => typeof assetsLeft !== "undefined" && assetsLeft === 0);
  await page.keyboard.press("Enter");
  await page.evaluate(`(${sc.setup})()`);
  await page.evaluate(() => { if (typeof skipIntro === "function") skipIntro(); }); // measure play, not the cinematic
  await page.evaluate(() => { player.stats.maxHp = 1e9; player.hp = 1e9; });
  await page.waitForTimeout(1000);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  await cdp.send("Profiler.start");
  const ops = args.ops ? page.evaluate(() => new Promise(res => {
    const P = CanvasRenderingContext2D.prototype, orig = {}, stat = new Map();
    const names = ["drawImage", "fillRect", "fill", "stroke", "strokeRect", "save", "restore", "clip", "putImageData", "getImageData"];
    let frames = 0;
    for (const op of names) {
      orig[op] = P[op];
      P[op] = function (...a) {
        const site = new Error().stack.split("\n")[2].trim().replace(/^at /, "").replace(/ \(.*:(\d+):\d+\)$/, ":$1");
        const t = performance.now(), r = orig[op].apply(this, a), d = performance.now() - t;
        const px = op === "drawImage" ? (a.length >= 5 ? a[a.length - 2] * a[a.length - 1] : (a[0].width || 0) * (a[0].height || 0)) : 0;
        const k = op + " < " + site, s = stat.get(k) || stat.set(k, { n: 0, ms: 0, px: 0 }).get(k);
        s.n++; s.ms += d; s.px += px;
        return r;
      };
    }
    const f0 = window.frame;
    window.frame = now => { frames++; f0(now); };
    setTimeout(() => {
      for (const op of names) P[op] = orig[op];
      window.frame = f0;
      res([...stat].sort((a, b) => b[1].ms - a[1].ms).slice(0, 20).map(([k, s]) =>
        `${(s.n / frames).toFixed(1).padStart(7)}/f ${(s.ms / frames).toFixed(3).padStart(7)}ms/f ${(s.px / frames / 1000).toFixed(0).padStart(5)}kpx/f  ${k}`));
    }, 3000);
  })) : null;
  if (sc.keys) for (const k of sc.keys) { await page.keyboard.down(k); await page.waitForTimeout(3000); await page.keyboard.up(k); }
  else await page.waitForTimeout(6000);
  const { profile } = await cdp.send("Profiler.stop");
  const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map();
  let total = 0;
  for (let i = 0; i < profile.samples.length; i++) {
    const cf = byId.get(profile.samples[i]).callFrame, us = profile.timeDeltas[i] || 0;
    const k = (cf.functionName || "(anonymous)") + (cf.url ? ":" + (cf.lineNumber + 1) : "");
    self.set(k, (self.get(k) || 0) + us); total += us;
  }
  console.log(`\n=== ${name} · cpu self-time (dist line numbers)`);
  for (const [k, us] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`${(us / 1e3).toFixed(0).padStart(6)}ms ${(us / total * 100).toFixed(1).padStart(5)}%  ${k}`);
  if (ops) { console.log(`--- canvas calls per frame`); console.log((await ops).join("\n")); }
  await page.close();
}
await browser.close();
