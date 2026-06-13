# Performance Audit Report — words-0.4

**Methodology:** 6-dimension audit (algorithms, workers, vue-reactivity, loading, storage, build-measure) with adversarial verification. Each of 37 candidate findings was challenged by two independent skeptics — one attacking correctness (does the code actually do what the finding claims?) and one attacking impact (does it matter in practice?). 22 survived; 15 were rejected. A completeness gap check added 2 more findings in CSS/animation. Findings from multiple dimensions describing the same root cause are merged below.

**Architecture context:** Vue 3.5 + Pinia 3 word game, ~7,200 lines TypeScript/Vue, Vite 8, Cloudflare Pages. AI opponent runs in a web worker pool. The app's dominant asset is a 1.89 MB gzipped dictionary that decodes to 42.7 MB.

---

## Tier 1 — High Impact

### 1. Dictionary binary is a 42.7 MB fixed-width trie, reducible 75x

**Files:** [Dictionary.ts:44](src/domain/models/dictionary/Dictionary.ts:44), [public/dictionary.bin.gz](public/dictionary.bin.gz)

Each of the 395,187 trie nodes stores 27 int32 values (1 final flag + 26 child slots = 108 bytes), but the average node has only 1.0 children — 94.6% of all int32s are zero. The structure is a pure tree with zero suffix sharing. Empirical DAWG minimization collapses it to 54,847 nodes / 127,533 edges; a byte-packed encoding is ~565 KB raw / ~353 KB gzipped.

**What it costs:**
- 42.7 MB resident RAM for the entire session (on a budget phone with 2-3 GB total)
- 1.89 MB first-visit transfer (96% of the app's total payload) vs ~353 KB after fix
- 100-300 ms of boot decompression on low-end mobile
- Cache-miss-bound AI trie walks (108-byte nodes span two cache lines; working set vastly exceeds L2/L3)

**Fix:** Re-encode as a sparse DAWG with variable-width child lists (bitmap + popcount for O(1) child lookup). Update `Dictionary.getNode`/`forEachNodeChild`/`isNodeFinal`. **Effort: large.**

*Confirmed by 3 independent dimension finders; adversarial verification reproduced every measurement exactly.*

---

### 2. Dictionary fetch delayed behind a fully serialized 5-stage boot chain with no preload

**Files:** [index.html](src/interface/index.html), [index.ts:11](src/interface/index.ts:11), [Application index.ts:31](src/application/index.ts:31), [MainStore.ts:310](src/interface/stores/MainStore.ts:310)

The 1.89 MB dictionary download cannot start until: (1) main JS downloads and executes (57 KB gz), (2) a locale JSON dynamic import completes (extra RTT for a 2 KB chunk), (3) Vue mounts and Suspense runs Layout's async setup, (4) IndexedDB opens and replays the full event log, (5) only then does `bootDictionary()` call `fetch()`. The game board stays on a progress fallback the entire time.

There is no `<link rel="preload">` anywhere in `index.html`, so the browser's preload scanner never sees the app's largest asset.

**What it costs:**
- 300-500 ms of dead network time on desktop; 500 ms - 1s+ on mobile before the dominant transfer even begins
- Directly extends the user-visible loading screen on every first visit

**Fix:** (1) Add `<link rel="preload" href="/dictionary.bin.gz" as="fetch" crossorigin>` to index.html. (2) Start the fetch eagerly in `Application.create` in parallel with the IndexedDB load. **Effort: small.**

*Confirmed from 4 independent dimensions (workers, loading, storage, build-measure). Verified: the COEP/crossorigin modes are compatible; no double-download.*

---

## Tier 2 — Medium Impact

### 3. Left-extension traversal walks the forward trie in reversed-prefix order

**File:** [TurnGenerationService.ts:151](src/domain/services/generation/turn/TurnGenerationService.ts:151)

The generator extends leftward from each anchor using the same forward trie used for rightward extension. After placing tiles at positions anchor-1, anchor-2, the trie path is the *reverse* of the board prefix. When the traversal forks right, it re-walks its own just-placed tiles, producing trie paths matching no real word.

**What it costs:**
- Plausibly 2-5x of total DFS work per High-difficulty turn is wasted exploring dead-end branches
- The High-difficulty AI can **never** find words requiring 2+ new tiles left of an anchor — a correctness bug that weakens the AI in every match (independently reproduced with a harness: rack {A,C,S}, dict {AT,CAT,SCAT,TAS}, tile T on board → SCAT is never found)
- Per-turn cost is usually masked by the 2,000 ms opponent response pad, but measurable on slow devices

**Fix:** Either (a) rebuild as a GADDAG, or (b) restructure to Appel-Jacobson left-part enumeration. **Effort: large.**

---

### 4. Worker pool initialization blocks first render

**File:** [Application index.ts:63](src/application/index.ts:63)

`bootDictionary()` awaits `worker.init()`, which spawns up to 8 module workers, each fetching/compiling a 25 KB worker chunk, and waits for all to post `Ready`. Workers aren't needed until the first opponent turn (which requires a user move first and is padded to 2,000 ms minimum).

**What it costs:** ~30-100 ms desktop, 100-300 ms low-end mobile, on every page load, extending the loading screen.

**Fix:** Fire-and-forget `worker.init()`; await the stored promise lazily inside `CommandsService` before the first `stream()` call. The 2s pad absorbs any residual init latency. **Effort: small.**

---

### 5. Worker pool spawn/compile serialized after dictionary download

**File:** [Application index.ts:59-63](src/application/index.ts:59)

Workers are constructed only after the full dictionary download + decompress completes, but worker spawn + script compile has zero dependency on the dictionary bytes.

**What it costs:** ~30-100 ms desktop, 100-300 ms low-end mobile of wasted overlap opportunity.

**Fix:** Construct workers immediately when `bootDictionary` starts; post `Init` with the buffer once it arrives. **Effort: small.**

---

### 6. Locale JSON dynamic import adds a serial RTT before `app.mount()`

**File:** [LocalesPlugin.ts:49](src/interface/plugins/LocalesPlugin/LocalesPlugin.ts:49), [index.ts:11](src/interface/index.ts:11)

A variable `import()` builds a separate 2 KB chunk that Vite cannot modulepreload. `Interface.start()` awaits it before mounting — so even the loading screen waits for an extra RTT to load 1.4 KB of JSON for the only locale that exists (`'en'`).

**What it costs:** ~20-60 ms broadband, 100-300 ms cellular, on every cold load.

**Fix:** Statically import the `'en'` locale; keep dynamic import only in the `watch(this.type)` locale-switch handler. **Effort: small.**

---

### 7. `scheduler.yield()` is `queueMicrotask` — validation runs pre-paint on every tile placement

**Files:** [BrowserSchedulerGateway.ts:13](src/infrastructure/gateways/BrowserSchedulerGateway.ts:13), [MainStore.ts:97](src/interface/stores/MainStore.ts:97)

The app intends to paint the placed tile before running validation, but `yield()` resolves as a microtask (same event-loop task). Per tile click: Vue flush 1 → synchronous dictionary validation → IndexedDB append initiation → second `boardVersion` bump → ~225-450 computed re-evaluations → Vue flush 2 → *then* paint.

**What it costs:** ~1-3 ms extra tap-to-paint on desktop, ~5-10 ms on low-end mobile, on every tile placement (the app's primary interaction).

**Fix:** Use native `scheduler.yield()` where available, `MessageChannel` fallback. Existing `pendingValidationId` debounce handles the longer gap. **Effort: small.**

---

### 8. No `Cache-Control` for hashed `/assets/*`

**File:** [public/_headers](public/_headers)

Only `dictionary.bin.gz` gets `immutable` caching. The four content-hashed Vite bundles (JS 57 KB, CSS 8 KB, worker 7 KB, locale 1 KB) receive no `Cache-Control`, so Cloudflare serves them with ETag-only. Every repeat visit revalidates all chunks.

**What it costs:** ~1-2 RTTs of conditional requests on every return visit (~40-100 ms broadband, 200-600 ms LTE/3G). This is the common case for a casual game.

**Fix:** Add `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` to `_headers`. Hashed filenames make this safe. **Effort: small (2 lines).**

---

### 9. 42.7 MB dictionary buffer in every worker message (non-SAB fallback)

**File:** [CommandsService.ts:127](src/application/services/CommandsService.ts:127)

`dictionary.buffer` is included in every per-turn `stream` input. In production (COOP/COEP → SharedArrayBuffer), this is ~free. But the code explicitly supports non-isolated contexts (`HttpLoaderGateway.ts:9`), where every opponent turn structured-clones 42.7 MB per partition — up to 8 copies ≈ 340 MB of serialization.

**What it costs:** Zero in production (SAB path). In the fallback: 85-170 MB/turn on iOS/webviews, with real OOM/jetsam risk.

**Fix:** Drop `buffer` from per-turn input. Workers already cache the dictionary from `Init`. **Effort: small.**

---

### 10. Dictionary decompress is non-streaming (~85 MB transient memory spike)

**File:** [HttpLoaderGateway.ts:8-12](src/infrastructure/gateways/HttpLoaderGateway.ts:8)

Three serial materializations: (1) `response.arrayBuffer()` buffers the full 1.89 MB compressed body, (2) `DecompressionStream` output collected into a 42.7 MB `ArrayBuffer`, (3) copied into a 42.7 MB `SharedArrayBuffer`. Peak: ~85 MB+ for a 42.7 MB steady-state allocation.

**What it costs:** ~10-20 ms copy time; ~43 MB of avoidable transient allocation at boot (GC/eviction pressure on low-RAM phones).

**Fix:** Pre-allocate SAB (size from a build-time constant), stream `DecompressionStream` chunks directly into it. Also overlaps inflate with download. **Effort: medium.** *(Largely subsumed if Finding #1 is implemented.)*

---

## Tier 3 — Low Impact

### 11. `Intl.NumberFormat` constructed per animation frame

**File:** [LocalesPlugin.ts:55](src/interface/plugins/LocalesPlugin/LocalesPlugin.ts:55)

`getLocalizedNumber` creates a fresh `Intl.NumberFormat` on every call. The `v-animate-number` directive calls it once per rAF frame per animated element. After each turn, 2-3 elements animate for 500 ms ≈ ~60-90 constructions ≈ ~1.6 ms CPU on desktop, plausibly 0.3-1 ms/frame on low-end mobile.

**Fix:** Cache the formatter per locale. **Effort: small (one-liner).**

---

### 12. No event-log compaction

**File:** [Game.ts:251](src/domain/Game.ts:251), [Events.ts:16](src/domain/events/Events.ts:16)

Every tile placement records 3+ events (TilePlaced, Unvalidated marker, full ValidationResult). Undos add more. All are replayed at boot via `Game.createFromEvents`. A long fidgety match accumulates 500-1500 events; boot replay is ~5-30 ms on low-end mobile.

**Fix:** Compact on `TurnSaved`: drop cancelled place/undo pairs and intermediate validation results. **Effort: medium.**

---

### 13. CSS shimmer forces infinite main-thread paint loop

**File:** [LayoutMainGridOutlineTooltip.vue:48](src/interface/components/by-hierarchy/Layout/LayoutMain/LayoutMainGrid/LayoutMainGridOutline/LayoutMainGridOutlineTooltip.vue:48)

`animation: shimmer 3s linear infinite` animates `background-position` (not compositor-animatable). Active whenever a pending placement scores >29 points — exactly while the user sits thinking, potentially for minutes. Forces continuous frame production (~60-120 fps) on an otherwise idle page.

**What it costs:** ~150-300 mW extra on phones while active; prevents power-saving idle; pins adaptive-refresh displays at high Hz. Not a frame-budget problem (painted area is ~40x25 px).

**Fix:** Translate a wider gradient layer via `transform` instead of animating `background-position`. **Effort: small.** *(Note: the specific ::before construction proposed by the audit finder had geometry errors — needs correct sizing.)*

---

### 14. Full-viewport `blur(1rem)` transition at match end

**File:** [Layout.vue:81-84](src/interface/components/by-hierarchy/Layout/Layout.vue:81)

When `matchIsFinished`, the entire layout (header + 225-cell grid + footer ≈ ~900 elements) gets `filter: blur(1rem)` plus `opacity: 0.5`, transitioned over 250 ms. No `will-change`/`contain` hint exists. The blurred layer stays resident until restart.

**What it costs:** ~15 frames of full-viewport blur at the least latency-sensitive moment in the app. Only a stuttery fade on low-end mobile GPUs. ~15-30 MB retained GPU memory.

**Fix:** Add a semi-opaque scrim to the restart overlay; transition only `opacity` instead of `filter`. **Effort: small.**
