# Performance rules for this repo

How to write fast JS for `src/game.js`. Read this before touching the
update or render loop. Every rule below either comes from a cited source or
was measured here with `tools/bench.mjs` (see "Measuring").

Budget: one frame = 16.7 ms at 60 fps. We aim for **p99 work < 8 ms** in
the real rAF loop on the bench scenes, so slower devices still hold 60.

## 1. Measure first, then change one thing

- `node tools/bench.mjs` runs headless Chromium on `dist/orc-slasher.html`
  and prints per-scene frame times (p50 / p99 / max) for the **real**
  `requestAnimationFrame` loop. Run it before and after every optimization;
  keep the numbers in the commit message.
- Do **not** benchmark by calling `updatePlay()` + `renderWorld()` in a tight
  synchronous loop: the browser never presents, queued raster work piles up
  and flushes in bursts that look like 30 ms spikes in whatever draw call
  happens to trigger the flush. (Measured here; it cost us an afternoon.)
- Spikes that move between functions when you stub things are GC or GPU
  flushes, not slow code. Look for allocations instead.

## 2. JavaScript engine (V8 / JSC / SpiderMonkey)

From web.dev "Performance tips for JavaScript in V8":

- **Stable object shapes.** Create every property in the object literal or
  constructor, always in the same order. Never add a property later
  (`e.foo = …` on some enemies only) — it forks the hidden class and turns
  monomorphic property access polymorphic. Don't `delete`; set `null`/`0`.
- **Monomorphic call sites.** A function should see the same argument types
  and shapes every call. Don't pass a number one time and a string the next.
- **Number kinds.** Keep a variable either integer (SMI) or double, not both.
  Arrays of only doubles are unboxed and fast; don't mix objects into
  numeric arrays.
- **Arrays.** No holes, no `delete arr[i]`, contiguous indices from 0.
  Preallocate small fixed-size arrays; grow big ones.
- **try/catch** around a call, not around a hot body.

## 3. Garbage collection: allocate nothing per frame

GC runs when you allocate, and a major collection can freeze the loop for
5–30 ms ([gamedev.net, "Writing fast JavaScript for games"](https://www.gamedev.net/articles/programming/general-and-gameplay-programming/writing-fast-javascript-for-games-interactive-applications-r3516/)).
In the per-frame path (`updatePlay`, `render*`):

- No `[...arr]`, `.map/.filter/.flatMap/.slice`, object/array literals,
  closures (`() => …`), template strings you don't draw, or `Array.from`.
- **Removing from arrays while iterating:** don't `splice(indexOf(x), 1)`
  (O(n) each, O(n²) total) or iterate a copy. Use **in-place compaction**:
  walk with a read index, copy survivors down, then `arr.length = w`.
  For order-insensitive lists, **swap-and-pop**.
- **Reuse scratch arrays** (`scratch.length = 0`) for per-frame lists such
  as visible props or nearby cells.
- **Pool** short-lived objects (bullets, particles) when counts are high.
- **Typed arrays** (`Float32Array`, `Int32Array`, `Uint8Array`) for grids
  and per-frame numeric buffers (flow field, light uniforms).

## 4. Algorithms in the loop

- No O(n²) over entities. Use a **uniform spatial hash** (grid of cell →
  entity indices, rebuilt each frame from typed arrays) for separation,
  hit tests and nearest-enemy queries.
- Never iterate the whole map. The city is virtual: query `cellsIn()` /
  `tileType()` around the camera or player only.
- Cache what doesn't change per frame (floor chunks, prop lists per cell,
  pre-tinted sprites).

## 5. Canvas 2D

From MDN "Optimizing canvas" and web.dev "Improving HTML5 Canvas
performance":

- **Pre-render** repeated or expensive drawing (gradients, text, tinted
  sprites, light blobs) to an offscreen canvas once, then `drawImage` it.
  `createRadialGradient` per light per frame is expensive; a cached light
  sprite scaled with `drawImage` is not.
- **Integer coordinates** for `drawImage`/`fillRect` (we round already).
- **Avoid `ctx.filter`** (e.g. `brightness()` for hit flashes) and
  `shadowBlur` in the loop; use pre-tinted copies of sprites instead.
- **Minimize state changes** (`fillStyle`, `globalAlpha`, `save/restore`,
  transforms): group draws by style.
- **Layered canvases** for things that change at different rates (world vs
  HUD).
- Don't scale in `drawImage` when you can cache the scaled image.
- `{ alpha: false }` for opaque canvases.

## 6. WebGL2 post-processing

From MDN "WebGL best practices":

- Allocate textures once with `texStorage2D`, update per frame with
  `texSubImage2D`. Set `MIN_FILTER` explicitly (no mipmaps).
- **Upload DOM sources (our 2D canvases) at the start of the frame**,
  before `useProgram`/`bindFramebuffer`: those uploads flush the pipeline.
- Never call `getError`, `readPixels`, `getParameter`,
  `checkFramebufferStatus` or `getUniformLocation` per frame. Cache at init.
- Upload uniform arrays in **one** call from a preallocated `Float32Array`.
- Build all framebuffers at init; run blur/bloom passes at reduced
  resolution; use `RGBA8` targets (float targets aren't guaranteed).
- `mediump` for colour math, `highp` for coordinates; per-pixel cost
  = pixels × work, so do heavy work (lighting) at game resolution
  (480×270), and only cheap per-pixel work at screen resolution.
- Cap the output backing store (we cap at ~2.3 MP) — a 4K screen at DPR 2
  is 33 MP of fragment work.

## 7. Lessons measured in this repo

- Headless Chromium rasterises canvas and runs WebGL on the CPU
  (SwiftShader). There, `drawImage` dominates profiles and any WebGL
  presentation caps us near 20 fps. Real GPUs don't behave like that, so
  the game detects software GL (`softwareGL()`) and stays on 2D; measure
  the GL path with `--gl force` and treat its fps as a worst case.
- Copying offscreen layers onto the visible canvas costs real time on a
  CPU rasteriser (menu 3 ms → 13 ms at 4× throttle). The 2D path draws
  straight onto the visible canvas; only the WebGL path uses layers.
- A zero-filled `Int32Array` used as linked-list heads is a cycle waiting
  to happen: initialise "empty" sentinels (`-1`) explicitly.
- `putImageData`/path-drawing spikes that disappear when stubbed were the
  synchronous-loop artifact from §1, not slow code. Check with the rAF
  bench before "fixing" them.
- Light falloff matters more than light count: `(1-d/r)²` left lamps
  nearly invisible; a smoothstep falloff gives readable pools.
- **Find the caller of raster cost with `node tools/profile.mjs --ops`.**
  The CPU profile only says "drawImage" / "(program)"; the `--ops` table
  counts every canvas call per frame by call site. Game JS was ~3% of the
  frame; canvas calls and their deferred raster were the rest.
- **Count calls, not just pixels.** The pixel font drew one `drawImage` per
  glyph and the pager one `fillRect` per *pixel* (~500 calls/frame). Each
  string is now baked once into an LRU'd canvas per colour atlas
  (`textBitmap`): one call per string. Never draw text per glyph.
- **Soft things at low resolution.** The 2D darkness overlay (`destination-out`
  light blobs, full res) cost 1.3 ms/frame in one `drawImage` — the deferred
  raster of the blobs lands on the blit. Built at ¼ res and smoothly
  upscaled: 0.28 ms, same look.
- **Bake per-tile answers once, look them up per entity.** `flowDir` searched
  8 neighbours per zombie per frame and allocated a result; the downhill
  neighbour is now baked into `flowNext` right after each BFS (4×/s).
- **Pool big canvases, prefetch, repaint late.** A floor chunk is a 256 KB
  backing store: evicted ones go to `chunkPool`. `chunkWork` paints at most
  one chunk per frame — stale ones first (blasts mark chunks stale instead
  of deleting them; the old floor shows for a frame or two), then the ring
  just outside the view. Walking now paints 0 chunks on the visible path.
- Don't write DOM style every frame (`canvas.style.cursor`): write on change.
- **Never modify a big canvas you also draw from during play.** The first
  atlas packed mirror/tint variants on demand into the 2048² page: each
  change makes the browser snapshot the whole page (16 MB) on its next use
  → p99 4 ms → 18 ms, 134 ms spikes at 4×. Mirrors are now packed at load;
  the few tints made in play go on 512² pages. In general: static pages for
  static art, small scratch pages for anything written later.
- The sprite atlas is neutral on the CPU rasteriser (measured: same p50);
  its win is GPU canvases batching draws from one texture, which this
  headless setup can't measure.
- Before → after this pass (p50 ms, 1× | 4× throttle): walk 2.4 → 1.4 |
  13.9 → 5.8, horde 3.9 → 2.4 | 22 → 12.5, boom 4.0 → 1.9 | 21 → 9.9;
  4× fps walk 43 → 59, horde 30 → 39, boom 30 → 44.

## Sources

- web.dev — [Performance tips for JavaScript in V8](https://web.dev/articles/speed-v8)
- MDN — [Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- web.dev — [Improving HTML5 Canvas performance](https://web.dev/articles/canvas-performance)
- MDN — [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- gamedev.net — [Writing fast JavaScript for games & interactive applications](https://www.gamedev.net/articles/programming/general-and-gameplay-programming/writing-fast-javascript-for-games-interactive-applications-r3516/)
