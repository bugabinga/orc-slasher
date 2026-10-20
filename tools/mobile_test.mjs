#!/usr/bin/env node
// Phone smoke test for dist/orc-slasher.html: emulated touch device (run
// stick in the lower right, tap / 2nd finger dash, auto-aim), menus by tap,
// wide view, portrait "turn your phone". Exits 1 on failure.
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
await page.evaluate(() => { localStorage.removeItem("orcslasher_learned"); learned.desk = learned.touch = 0; });
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

check("crisp: whole device px per game px", await G_(() => VIEW_K > 0 && Math.abs(canvas.getBoundingClientRect().height * devicePixelRatio - VH * VIEW_K) < 1.5), await G_(() => `${VW}x${VH} @${VIEW_K}x`));
check("phone gets a bigger UI (fewer rows)", await G_(() => VH < 250 && VW >= 400));
check("atlas packed", await G_(() => atlasPages.length >= 1 && Object.entries(IMG).every(([n, i]) => i.atl || n === "font_atlas")), await G_(() => atlasPages.length + " page(s)"));
await shot("title");
await tap(240, 150);
check("tap title -> hero select", await G_(() => G.state) === "cls", await G_(() => G.state));
await shot("cls");
await tap(...rectMid(await G_(() => clsRects[0])));
check("tap hero -> gun shop", await G_(() => G.state) === "select", await G_(() => G.state));
await tap(...rectMid(await G_(() => selectRects[0])));
check("tap gun -> play", await G_(() => G.state) === "play", await G_(() => G.state));
await wait(300);
check("hero has landed (short drop-in)", await G_(() => !introLocked() && player.dropZ === 0));
await G_(() => { player.hp = player.stats.maxHp = 1e9; clearZombies(); spawnQueue = [{ type: "walker", at: 9999 }]; G.sayQ = []; });
await wait(600);

// the run stick, lower right: drag = run that way, release = stop
const home = await G_(() => stickHome());
await G_(() => { clearZombies(); spawnQueue = [{ type: "walker", at: 9999 }]; player.hp = player.stats.maxHp = 1e9; });
let x0 = await G_(() => player.x);
await touches("touchStart", [{ x: home.x, y: home.y, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: home.x + 12, y: home.y, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: home.x + 24, y: home.y, id: 1 }]);
await wait(700);
const x1 = await G_(() => player.x);
check("stick grabbed where it's drawn", await G_(([hx, hy]) => stick.id !== -1 && stick.bx === hx && stick.by === hy, [home.x, home.y]));
await touches("touchEnd", []);
await wait(400);
const v1 = await G_(() => Math.hypot(player.vx, player.vy));
check("drag stick right -> runs right", x1 - x0 > 40, `moved ${Math.round(x1 - x0)}px`);
check("release -> stops", v1 < 5, `speed ${v1.toFixed(1)}`);
check("stick doesn't dash", await G_(() => player.dashN === DASH_MAX));
check("stick taught 'move'", await G_(() => (learned.touch & LEARN_MOVE) !== 0));
await shot("stick");

// floating: a thumb anywhere in the lower right becomes the stick's centre
const fx = Math.round(home.x - 70), fy = Math.round(home.y - 20);
await touches("touchStart", [{ x: fx, y: fy, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: fx, y: fy - 22, id: 1 }]);
await wait(500);
check("stick floats to the thumb", await G_(([x, y]) => Math.abs(stick.bx - x) < 2 && Math.abs(stick.by - y) < 2 && player.vy < -40, [fx, fy]), await G_(() => `base ${stick.bx.toFixed(0)},${stick.by.toFixed(0)} vy ${player.vy.toFixed(0)}`));
await touches("touchEnd", []);
await wait(300);

// tap anywhere else -> dash
await tap(120, 120);
check("tap -> dash", await G_(() => player.dashN === DASH_MAX - 1), await G_(() => "charges " + player.dashN));
check("tap taught 'dash'", await G_(() => (learned.touch & LEARN_DASH) !== 0));
await wait(1300);

// running + a second finger -> dash, the stick keeps steering
await touches("touchStart", [{ x: home.x, y: home.y, id: 1 }]);
await wait(30); await touches("touchMove", [{ x: home.x - 24, y: home.y, id: 1 }]);
await wait(300);
const n0 = await G_(() => player.dashN);
await touches("touchStart", [{ x: home.x - 24, y: home.y, id: 1 }, { x: 100, y: 100, id: 2 }]);
await wait(60);
const dashed2 = await G_(n => player.dashN < n, n0);
await touches("touchMove", [{ x: home.x - 24, y: home.y, id: 1 }]);
await wait(300);
const stillHeld = await G_(() => stick.id !== -1 && player.vx < -40);
await touches("touchEnd", []);
check("2nd finger -> dash", dashed2);
check("2nd finger doesn't steal the stick", stillHeld);

// the gun aims itself on touch
await G_(() => { spawnEnemy("walker", { x: player.x + 60, y: player.y }); for (let i = 0; i < ZOMBIES.n; i++) { const z = ZO[ZOMBIES.dense[i]]; z.warmup = 0; z.x = player.x + 60; z.y = player.y; } player.reloadT = 0; player.ammo = clipSize(); });
await wait(600);
check("auto-aim fires on touch", await G_(() => player.ammo < clipSize() || player.reloadT > 0));

check("all learned -> saved", await G_(() => JSON.parse(localStorage.getItem("orcslasher_learned")).touch === LEARN_ALL));
await G_(() => { newRun("rifle"); });
check("next run: no hint line", await G_(() => hint.start.touch === LEARN_ALL));
check("drop-in is short", await G_(() => DROP_T <= 0.4));
await G_(() => skipIntro());

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
