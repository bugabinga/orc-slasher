#!/usr/bin/env node
// Phone smoke test for dist/orc-slasher.html: emulated touch device (no
// sticks: hold-to-run, tap-to-walk, tap-to-focus, flick and 2nd finger dash),
// menus by tap, wide view, portrait "turn your phone". Exits 1 on failure.
//
//   node tools/mobile_test.mjs [--file path.html] [--shots dir]
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1];
const file = path.resolve(args.file || "dist/orc-slasher.html");
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(path.join(execSync("npm root -g").toString().trim(), "playwright")); }

const browser = await playwright.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 851, height: 393 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const errors = [];
page.on("pageerror", e => errors.push(e.message));
const results = [];
const check = (name, ok, info = "") => { results.push({ check: name, ok: ok ? "✓" : "✗", info: String(info) }); };
const wait = ms => page.waitForTimeout(ms);
const shot = async n => { if (args.shots) await page.screenshot({ path: path.join(args.shots, `mobile_${n}.png`) }); };

await page.goto("file://" + file);
await page.waitForFunction(() => typeof assetsLeft !== "undefined" && assetsLeft === 0);
await wait(300);
// game px -> client px (2D path: no CRT warp)
const toClient = (x, y) => page.evaluate(([x, y]) => {
  const r = canvas.getBoundingClientRect(), s = Math.min(r.width / VW, r.height / VH);
  return [r.left + (r.width - VW * s) / 2 + x * s, r.top + (r.height - VH * s) / 2 + y * s];
}, [x, y]);
const touches = async (type, pts) => {
  const tp = [];
  for (const p of pts) { const [x, y] = await toClient(p.x, p.y); tp.push({ x, y, id: p.id }); }
  await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: tp });
};
const tap = async (x, y) => { await touches("touchStart", [{ x, y, id: 1 }]); await wait(60); await touches("touchEnd", []); await wait(250); };
const rectMid = r => [r.x + r.w / 2, r.y + r.h / 2];
const G_ = (f, a) => page.evaluate(f, a);

check("wide view on a 20:9 phone", await G_(() => VW) > 480, await G_(() => "VW " + VW));
check("atlas packed", await G_(() => atlasPages.length >= 1 && Object.entries(IMG).every(([n, i]) => i.atl || n === "font_atlas")), await G_(() => atlasPages.length + " page(s)"));
await shot("title");
await tap(240, 150);
check("tap title -> hero select", await G_(() => G.state) === "cls", await G_(() => G.state));
await shot("cls");
await tap(...rectMid(await G_(() => clsRects[0])));
check("tap hero -> gun shop", await G_(() => G.state) === "select", await G_(() => G.state));
await tap(...rectMid(await G_(() => selectRects[0])));
check("tap gun -> play", await G_(() => G.state) === "play", await G_(() => G.state));
await G_(() => { player.hp = player.stats.maxHp = 1e9; clearZombies(); spawnQueue = [{ type: "walker", at: 9999 }]; G.sayQ = []; });
await wait(600);

// hold to run toward the finger, release to stop
let x0 = await G_(() => player.x);
await touches("touchStart", [{ x: (await G_(() => VW)) - 40, y: 135, id: 1 }]);
await wait(900);
const x1 = await G_(() => player.x);
await touches("touchEnd", []);
await wait(400);
const v1 = await G_(() => Math.hypot(player.vx, player.vy));
check("hold right of hero -> runs right", x1 - x0 > 40, `moved ${Math.round(x1 - x0)}px`);
check("release -> stops", v1 < 5, `speed ${v1.toFixed(1)}`);
check("no dash from a hold", await G_(() => player.dashCd) === 0);
await shot("hold");

// tap the street -> walk there
await G_(() => { player.dashCd = 0; });
// a walkable spot ~60px away with no prop or zombie to grab
const [gx, gy] = await G_(() => {
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * Math.PI * 2, wx = player.x + Math.cos(a) * 60, wy = player.y - 6 + Math.sin(a) * 40;
    if (!walkAt(Math.floor(wx / TILE), Math.floor((wy + 6) / TILE))) continue;
    let clear = !nearestEnemy({ x: wx, y: wy }, 30);
    for (const c of cellsIn(wx - 30, wy - 30, wx + 30, wy + 30)) for (const p of c.props) if (Math.hypot(p.x - wx, p.y - 8 - wy) < 24) clear = false;
    if (clear) return [wx - G.cam.x, wy - G.cam.y];
  }
  return [player.x - G.cam.x - 60, player.y - G.cam.y];
});
const goalW = await G_(([gx, gy]) => [gx + G.cam.x, gy + G.cam.y], [gx, gy]);
await tap(gx, gy);
check("tap street -> walk-to goal", await G_(() => touch.goal), "");
await wait(1500);
const dGoal = await G_(([wx, wy]) => Math.hypot(player.x - wx, player.y - 6 - wy), goalW);
check("arrives at tapped spot", dGoal < 12 || await G_(() => !touch.goal), `${dGoal.toFixed(1)}px off`);

// flick -> dash
await G_(() => { player.dashCd = 0; });
await touches("touchStart", [{ x: 200, y: 140, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: 230, y: 140, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: 260, y: 140, id: 1 }]);
await touches("touchEnd", []);
check("flick -> dash", await G_(() => player.dashCd > 0), await G_(() => "cd " + player.dashCd.toFixed(2)));

// holding + second finger -> dash, movement keeps going
await G_(() => { player.dashCd = 0; });
await touches("touchStart", [{ x: 60, y: 135, id: 1 }]);
await wait(300);
const steer = await G_(() => touch.id);
await touches("touchStart", [{ x: 60, y: 135, id: 1 }, { x: 400, y: 200, id: 2 }]);
await wait(50);
const dashed2 = await G_(() => player.dashCd > 0);
const stillHeld = steer !== -1 && await G_(id => touch.id === id, steer);
await touches("touchEnd", []);
check("2nd finger -> dash", dashed2);
check("2nd finger doesn't steal the steering", stillHeld);

// tap a zombie -> focus fire on it
await G_(() => { for (let i = 0; i < 6; i++) spawnEnemy("walker", { x: player.x + 70 - i * 3, y: player.y + (i - 3) * 22 }); for (let i = 0; i < ZOMBIES.n; i++) ZO[ZOMBIES.dense[i]].warmup = 0; });
await wait(50);
// an on-screen zombie (spawnEnemy moves ones placed inside buildings)
const zt = await G_(() => { for (let i = 0; i < ZOMBIES.n; i++) { const z = ZO[ZOMBIES.dense[i]], x = z.x - G.cam.x, y = z.y - G.cam.y; if (x > 60 && x < VW - 60 && y > 70 && y < VH - 30) return [x, y, z.e]; } return [0, 0, -1]; });
await tap(zt[0], zt[1]);
check("tap zombie -> focused", await G_(e => !!focus.z && focus.e === e, zt[2]), await G_(e => JSON.stringify({ fe: focus.e, e, goal: touch.goal, alive: eAlive(e) }), zt[2]));
await shot("focus");
await wait(1500);
check("focused zombie gets shot", await G_(e => !focus.z || focus.z.hp < focus.z.maxHp || focus.z.dead, zt[2]));

// tap a car -> focus fire on it until it burns
await G_(() => { clearZombies(); focus.z = null; });
const car = await G_(() => {
  for (const c of cellsIn(G.cam.x, G.cam.y, G.cam.x + VW, G.cam.y + VH)) for (const p of c.props) {
    const x = p.x - G.cam.x, y = p.y - 8 - G.cam.y;
    if (p.dk === "car" && !p.gone && p.state === 0 && x > 40 && x < VW - 40 && y > 70 && y < VH - 30 && Math.hypot(p.x - player.x, p.y - player.y) < player.stats.range) return [x, y, p.hp];
  }
  return null;
});
if (car) {
  await tap(car[0], car[1]);
  check("tap car -> focused", await G_(() => !!focus.p && focus.p.dk === "car"));
  await wait(1500);
  check("focused car takes fire", await G_(hp0 => !focus.p || focus.p.hp < hp0 || focus.p.state !== 0, car[2]));
} else check("tap car -> focused", true, "skipped: no car in range on this map");

// portrait: turn-your-phone card + pause
await page.setViewportSize({ width: 393, height: 851 });
await wait(300);
check("portrait -> 'turn your phone'", await G_(() => getComputedStyle(document.getElementById("rotate")).display === "flex"));
check("portrait -> run paused", await G_(() => G.paused));
await shot("portrait");
await page.setViewportSize({ width: 851, height: 393 });
await wait(200);
check("no page errors", errors.length === 0, errors.join(" | "));

await browser.close();
console.table(results);
process.exit(results.every(r => r.ok === "✓") ? 0 : 1);
