# InfiniDrip — Complete Handoff Knowledge Base

_Compiled by Claude (chat session) on 2026-09-10/11, for handoff to a new coding
agent with NO access to this conversation, prior Claude chats, project memory,
uploaded documents, or artifacts. Everything the receiving agent needs is meant
to be in this one document. Facts are labeled **[Verified]** (checked directly
against the git repo, a running test suite, or an exact PK-doc quote),
**[Decision/Intent]** (a choice the maintainer — Kshitij — made or stated, not
independently re-derivable from code), **[Inference]** (my own reasonable
conclusion from evidence, not stated outright anywhere), or **[Missing/
Uncertain]** (a gap, a conflict, or something I could not confirm)._

_This document was produced by inspecting: (1) the live GitHub repository at a
fresh clone of `main`, HEAD `01399a15f9d5ff5552f97a1276871ce424218cbb`; (2) the
following Project Knowledge documents as currently stored: `PROJECT-STATE.md`,
`ARCHITECTURE.md`, `COMPONENT-ARCHITECTURE.md`, `MVP-PLAN.md`, `ROADMAP.md`,
`SLICES-BRIEF.md`, `RESUME-LOG.md`, `FABLE-BRIEF.md`, `MARKETPLACE-GOALS.md`,
`TOOLS-RESEARCH.md`, `ASSET-RESOURCES.md`, `README.md`, and
`indiateecmtgots.csv`; (3) a fresh `npm install`, `tsc --noEmit`,
`vitest run --coverage`, and `npm run build` run against that exact clone,
today. `TANK-RESEARCH.md` does not exist as a document anywhere — its content
below is reproduced from this chat session's own output, the only place it
exists (see §7)._

---

## 1. Project identity and vision

**[Verified/Decision]** InfiniDrip (package name `patternworks`) is a
lightweight, **local, browser-based (with an Electron desktop shell) 2D
sewing-pattern designer**, built from scratch in strict TypeScript. Its one-
line promise (MVP-PLAN.md §2): *"Design a garment from a real component
library, fit it to your own measurements, and export true-scale cutting files
that produce a garment which actually fits — as a desktop app you download and
own."*

**What it does today [Verified, from README.md + repo inspection]:**
measurement-driven drafting of a real garment block; live SVG render that
rebuilds from scratch on any measurement change; a 2D annotated body-view
figure with hover-linked dimension/edge highlighting; guidance (geometric
sewability checks + plausibility/proportional-coherence warnings, "warn never
clamp"); target-fit style presets that report the exact cm delta to reach a
named style; parametric grading across a size run with an auto-measured POM
spec sheet; a three-page tech-pack PDF; a fabric-nesting estimator (single
garment or whole graded run as one marker); a production-readiness pass/fail
checker; freeform manual piece editing (drag points/curve handles, with
Reset); true-scale SVG/DXF export and a tiled print-at-home PDF, at any graded
size; local save/load; a guided 5-step onboarding journey (Start → Measure →
Fit → Refine → Output).

**Target users [Decision/Intent, MVP-PLAN.md §7.1 + ROADMAP.md]:** indie
makers / home sewers — self-serve, download-and-use, no vendor layer,
design-choice-led.

**Core problem being solved [Decision/Intent, MVP-PLAN.md §2 "Positioning"]:**
positioned against Tailornova (broad-and-shallow — users report its
silhouettes/necklines/sleeves are basic enough that stylistic changes still
need manual pattern adaptation). InfiniDrip's bet is **depth and correctness
in a narrower band**, not breadth — "the physical-fit guarantee is the
differentiator no competitor in our tier advertises."

**Product principles [Verified, repeated verbatim across PROJECT-STATE.md and
ARCHITECTURE.md as standing rules]:**
- A clean **engine / recipe split** — the drafting engine never names a
  specific garment; everything garment-specific lives in a declarative
  `GarmentRecipe`. Adding a new garment variant should be "hours, not a
  slice-run" once the component architecture is finished (later literally
  tested and passed — Slice 59).
- **100% test coverage, enforced by the build** (the `vitest.config.ts`
  coverage thresholds are 95%, but the team's own working standard, confirmed
  every slice, has been 100% since early on).
- **Byte-identity regression gates** on the actual exported cutting files
  (SVG/DXF/PDF/tech-pack) for tee and fitted — a refactor slice must never
  silently move the shipped bytes; only two deliberate, signed-off exceptions
  exist so far (Slice 45's tech-pack page addition; Slice 62's neckline curve
  fix — see §6).
- **"Warn, never clamp"** — guidance/plausibility checks report problems in
  plain English; they never silently auto-correct a measurement.
- **Honest boundaries, stated up front**: this is a schematic drafting tool,
  not a drape simulator or production CAD. The assembled garment view is
  explicitly logged as "a schematic, not a drape simulation." Nesting is
  "an estimator." The checker verifies **sewability**, explicitly **not
  fit**.
- **No garment ships without a real, cross-checked source** for any
  construction/drafting number that isn't itself derived from a body
  measurement — this became an explicit, load-bearing rule during the Tank
  rework (§6) after finding hardcoded numbers that were never actually
  checked against anything.
- **Verification means checking the actual rendered/drafted output, not
  just that tests pass** — a standing principle, stated explicitly in
  ARCHITECTURE.md, that recurred and was extended three times (Slices 61,
  62, 63 — see §6) after each extension found a NEW class of the same bug.

**Non-negotiables carried into any future team [Decision/Intent, MVP-PLAN.md
§5]:** 100% coverage gate, byte-identity regression hashes, verify-against-
fresh-clone, and "never letting an agent edit tests to make them pass."

### MVP / v1 / longer-term scope definitions

**[Decision/Intent — MVP-PLAN.md, "the operative plan," created after Slice
44, superseding ROADMAP.md's own timeline for execution purposes though
ROADMAP.md remains the strategic reference]:**

- **MVP / v1 (6-month plan, ~117 slices budgeted at 4.5 slices/week, estimated
  range 94–155 slices):**
  - **In-scope garment blocks:** knit top (tee, fitted tee — have; tank —
    have; long-sleeve tee — planned), woven bodice + collar/placket/cuff
    (button-up shirt short+long sleeve, blouse, women's woven top, **polo** =
    knit body + woven placket/collar), skirt (have; length variants), trouser
    (casual pants, joggers, shorts). "~10–12 named garments," but the real
    number is combinatorial via components.
  - **In-scope components:** Sleeve (set-in/raglan/sleeveless; short/¾/long) ·
    Neckline (crew/v/scoop/boat) · Collar (shirt collar+stand / polo) ·
    Placket · Cuff · Waistband · Pocket (patch/inseam) · Dart placement ·
    Hem & vent.
  - **In-scope surface design:** prints, patches, colour blocking, fabric
    preview, placement spec into the tech pack. Explicitly NOT embroidery
    machine formats (DST/PES) — "that's a v2 file-writer."
  - **In-scope platform:** Electron desktop app, signed installers for
    Windows + macOS, offline-capable, native file save, auto-update
    scaffold.
  - **Explicitly OUT of MVP** (stated as "not cancelled — the post-launch
    2–3 year roadmap, to be built by a team"): hoodie/zip jacket, tailored
    blazer, jeans (denim-specific), photo→pattern reconstruction, upcycle
    helper, measuring assistant, vendor marketplace, 3D drape simulation,
    embroidery machine file formats, mobile, cloud sync, multi-user.
  - **The three things that must be true at launch:** (1) It fits — verified
    physically on every block shipped. (2) It's a real app — signed,
    downloadable, installs/runs offline. (3) Real design choices — a
    component system, not 10 fixed garments.
  - **Hard rule:** "no garment block ships without one physically sewn
    validation." **This has NOT yet been confirmed for anything — see §2 and
    §5, this is the single most important open risk in the project.**

- **The six-month month-by-month plan (MVP-PLAN.md §4), with exit criteria:**
  - **Month 1 — De-risk and containerise (~18 slices).** Fit Validation Loop
    (POM-prediction-vs-actual harness). Sew the tee, offline, record honestly.
    Electron shell (main process, native file save, app menu, window state,
    auto-update scaffold). Start code-signing procurement. **Exit: a
    physically sewn tee that fits, and a signed installer a stranger can
    download and run.**
  - **Months 2–3 — Component architecture (~40 slices).** "The multiplier...
    skipping or rushing this is the single most likely way the project
    fails." Design doc first (became `COMPONENT-ARCHITECTURE.md`), reviewed
    before code. Re-express tee/fitted/skirt as components, byte-identity
    gated. Structural primitives (dart placement, pocket, placket, vent).
    Component-aware checks/guidance/grading/POM. Side view + shared croquis
    library folded into this phase's exit (not built separately). **Exit:
    adding a garment variant takes hours, not a slice-run; existing three
    garments byte-identical.**
  - **Month 4 — Woven shirt + knit variants (~18 slices).** Woven bodice,
    collar+stand, placket, cuff, yoke. Tank/long-sleeve tee/polo/blouse via
    components. Sew one button-up. **Exit: 8+ garments, one physically
    validated woven shirt.**
  - **Month 5 — Trousers + surface design (~18 slices).** Trouser block
    (explicit warning: "budget extra for the crotch curve — it is the
    hardest single curve in patternmaking"). Surface design layer. Sew one
    trouser. Beta recruitment starts. **Exit: 10–12 garments, prints/colour
    working, trouser validated.**
  - **Month 6 — Beta and hardening (~23 slices).** First-time-user onboarding,
    bug-fix reserve, docs/help, 10–20 real makers with sewn-and-photographed
    testimonials. **Exit: launch-ready build + testimonials.**

- **Longer-term / post-launch (ROADMAP.md, explicitly cut from v1, "not
  cancelled"):** photo→pattern reconstruction, upcycle helper, vendor
  marketplace (there IS a separate, currently-active research track for this
  — see `MARKETPLACE-GOALS.md` in §7/§8, explicitly required to "not draw from
  the 117-slice budget"), 3D drape simulation, tailored blazer, hoodie/zip
  jacket, jeans, mobile, cloud sync, multi-user, embroidery file formats.

**[Decision still open, MVP-PLAN.md §7, stated as "not blocking week 1" but
never resolved in anything I found through Slice 63]:** customer-segment
confirmation; pricing model (one-time purchase vs subscription — needed "by
month 4 for beta messaging," i.e. was due and I found no resolution);
open-source posture / "why pay for this" messaging; whether the vendor track
runs at all before post-launch; fabric width as a draft-time input (flagged,
not scheduled).

---

## 2. Exact current status

**[Verified — fresh clone, this session, 2026-09-10/11]**
- **Repo:** `https://github.com/kshitijpatne/InfiniDrip.git`
- **Branch:** `main`. **Remote state:** `main` is up to date with
  `origin/main`; working tree clean (nothing to commit) immediately after a
  fresh clone.
- **HEAD commit:** `01399a15f9d5ff5552f97a1276871ce424218cbb`, committed
  `2026-09-10 19:57:49 -0400`. Message: *"Slice 63: real tank strap/armhole
  geometry — strapWidth and neckDrop become genuine user-adjustable
  measurements."*
- **Other branches on the remote:** `origin/fable/f1-realworld-exports` — an
  old feature branch from the Fable epic (F1, real-world exports). Given the
  dependency spine in PROJECT-STATE.md marks "real-world export ✓," this
  branch's work is presumed already merged to `main` long ago — but I did
  NOT independently diff this branch against main. **[Missing/Uncertain]**
  worth checking before assuming it's safe to delete.
- **Last 5 commits on `main`:**
  ```
  01399a1 Slice 63: real tank strap/armhole geometry — strapWidth and neckDrop become genuine user-adjustable measurements
  db707b7 Slice 62: rebuild the neckline curve — meet the fold at a right angle, scoop = crew + depth/width
  0661fa9 Slice 61: Tank rework step 1 — fix chest-width and neckline sync, render-layer wide
  51980e5 Slice 60: finish the tank — real scoop neckline, fix garment-blind render views
  a2f5d76 Slice 59: Component architecture Phase C2 — the tank, the real test (passed)
  ```
- **Test/build gate, verified fresh, this session:** `npx tsc --noEmit` →
  clean, zero errors. `npx vitest run --coverage` → **59 test files, 790
  tests, all passing, 100% statements/branches/functions/lines across every
  single file** (verified — not summarized from a doc; I ran it myself
  against the exact HEAD commit above). `npm run build` (`tsc && vite build`)
  → clean, `dist/assets/index-C7nIHnAH.js` 92.05 kB / 29.05 kB gzip.
- **Regression baseline:** `src/export/regression.test.ts`'s 8 SHA-256 hashes
  (tee/fitted × SVG/DXF/PDF/tech-pack) — passing at HEAD. This baseline has
  moved exactly twice since it was first recorded (Slice 34, commit
  `4f7e796`): once at Slice 45 (tech-pack only, +1 page), once at Slice 62
  (all 8, deliberately, the neckline curve fix — see §6).
- **No uncommitted work, no stashes, no worktrees found** on a fresh clone.
- **No servers/previews were left running.**

### Latest completed slice — exact acceptance criteria satisfied

**Slice 63** (see §6 for full rationale). Scope: (1) new
`drafting/armhole.ts` giving the tank a real strap/armhole curve instead of
silently reusing the sleeved bodice's curve; (2) `strapWidth` and `neckDrop`
promoted from hardcoded recipe constants to genuine user-adjustable
`Measurements` fields (plausibility bounds, UI slider, save/load support);
(3) two pre-existing gaps found and fixed: guidance notes from
`necklineEdge()`/`sleevelessArmhole()` were being silently discarded
everywhere (fixed for the tank specifically), and the body/garment preview
views were still drawing the tank's shoulder corner at the full sleeved
`shoulderHalf` instead of the real strap point (fixed proactively).
**Acceptance criteria satisfied, verified by me directly:** clean
`tsc --noEmit`; 790/790 tests passing, 100% coverage on every file; clean
production build; verified on a **fresh clone** via a plain `git apply` of
the patch set (not just the working copy); the export regression baseline
(8/8) untouched; all three views (body, garment/assembled, and the actual
cut pattern piece) re-rendered to PNG and visually inspected at three
different strap widths (12/15/20 cm), front and back matching at every
value.

### Last substantive action, by whom, when

**[Verified]** The last substantive action was the Slice 63 code delivery
(Claude Code prompt with 17 file patches + 2 new files), built and verified
by **Claude (this chat session)** in a sandboxed clone, delivered to Kshitij
as a paste-into-Claude-Code prompt, applied by **Kshitij via Claude Code**,
then pushed to `main` by Kshitij — confirmed by cloning fresh afterward and
confirming byte-for-byte. Timestamp: commit `2026-09-10 19:57:49 -0400`.

Immediately after that, Kshitij asked for Slice 64 to begin; the current
handoff request is the very next message in the conversation — no further
slice work has started.

### Any running servers, open previews, pending patches, stashes

**[Verified] None.**

---

## 3. Complete roadmap

### Immediate next task

**[Decision/Intent — PROJECT-STATE.md's own "Active directive: Tank rework"
section, renumbered after Slice 63]:**

**Slice 64 = Tank rework step 4: final confirmation.** *"Confirm everything
works correctly and is backed by reason — every dimension traceable to a
source, every visual claim checked against the actual rendered output (not
just against test assertions), before calling it done."* PROJECT-STATE.md
notes this step is **"largely satisfied by Slice 63's own verification...
kept as an open line item for a final pass... not because anything specific
is known to be missing."**

**After that (step 5): "Then, and only then, move on — polo... explicitly
parked until this is finished."**

### Ordered remaining work for the active Tank rework

**[Verified — PROJECT-STATE.md's own numbered plan, current status of
each]:**
1. ~~Fix the render bugs completely, systemically~~ — **DONE, Slice 61.**
2. ~~Fix the neckline curve construction itself~~ — **DONE, Slice 62.**
3. ~~Build the tank properly (real armhole/strap geometry)~~ — **DONE, Slice
   63,** plus the strapWidth/neckDrop scope change (§6).
4. **Confirm everything works and is backed by reason** — **OPEN, next
   slice (64).**
5. **Then move on — polo is next**, explicitly parked until step 4 closes.

**Is polo still next after the Tank work? [Verified/Decision] Yes,
explicitly** — PROJECT-STATE.md states this in exactly those words. No
other garment has been proposed as the alternative. (Phase C3 of the
component migration — a shared croquis library — was floated as a possible
alternative BEFORE the Tank rework consumed Slices 60–63; never
re-confirmed against polo afterward. **[Missing/Uncertain]** — worth a
direct one-line confirmation with Kshitij, see §10.)

### The authoritative six-month MVP plan

Fully reproduced in §1 (MVP-PLAN.md). **Current position within it:** the
plan's own schedule budgets Months 2–3 (component architecture) at ~40
slices, roughly slices 51–90. We are at Slice 63 — inside that window, but
the work since Slice 59 (Tank rework, 60–63) is bug-fixing/hardening
discovered DURING Phase C2, not new construction. **[Inference]** the
project is likely running behind MVP-PLAN.md's own slice budget for exiting
Months 2–3 if "40 slices" assumed reaching Phase C3 and Month 4 by slice
~90 on schedule — not stated as a concern anywhere I found, my own
arithmetic only.

### Medium- and long-term roadmap

Fully described in §1 (ROADMAP.md). Priorities in ROADMAP's own order:
**0** (de-risk — done/superseded by MVP-PLAN Month 1). **0.5** (small
independent wins — NOT all scheduled; only a nesting waste-% readout was
pre-approved as pull-in-whenever). **1** (the multiplier — component
architecture — largely done, C3 undecided). **2** (garment library, in
dependency order). **3** (surface design). **4** (differentiators, "after
the core is real").

**Cut from v1** — same list as MVP-PLAN.md §3.5, plus ROADMAP.md separately
talks itself out of as not-software-tractable: **photo→pattern
reconstruction** (§1.5, concluded not honestly buildable at claimed
fidelity) and **the vendor marketplace** (§1.6, "this is not a software
problem" — hence the separate, non-slice-budget `MARKETPLACE-GOALS.md`
research track).

**Timeline reality check (ROADMAP.md §3):** ROADMAP's own honest arithmetic
concluded the FULL scope needs an estimated **145–235 slices**, which does
not fit 4–6 months — exactly why MVP-PLAN.md exists as a deliberately
narrower, fixed-scope 117-slice subset. The two documents are not in
conflict; ROADMAP is the honest larger ambition, MVP-PLAN is the disciplined
subset actually being executed.

### Dependencies, sequencing, risks, gates, decision points

Fully covered in MVP-PLAN.md §6 (risks/kill criteria, reproduced in §1) and
ROADMAP.md §5. **The single dominant risk, repeated across nearly every
document: no garment has been physically sewn and verified to fit.** Every
other roadmap item is explicitly sequenced behind this.

### Items proposed, deferred, cut, superseded, or rejected

- **Superseded:** the old tactical slice-by-slice "Roadmap" prose that used
  to live in PROJECT-STATE.md — explicitly marked "do not follow it,"
  replaced by MVP-PLAN.md + ROADMAP.md as of Slice 44.
- **Deferred:** Phase C3 (croquis library) — flagged, not scheduled,
  overtaken by the Tank rework. Electron auto-update — "deliberately
  unscoped — no real release feed to verify against." Code-signing
  certificate — flagged as needing to start "week 1"; **[Missing/
  Uncertain]** no confirmation found that it was ever started.
- **Cut:** everything in MVP-PLAN.md §3.5 / ROADMAP.md's "Cut from v1"
  list.
- **Rejected outright, with reasoning given:** photo→pattern reconstruction;
  a general-purpose pattern CAD; GarmentCode's Python stack; auto-generated
  construction order; 3D drape/cloth simulation.
- **A live, separate research track:** vendor/marketplace work in
  `MARKETPLACE-GOALS.md` — explicitly required not to draw from the coding
  budget.

---

## 4. Architecture and implementation

### Current layer/module map

**[Verified — directly from the repo, `src/` tree]:**
```
src/
  geometry/      Point, curve math (cubic Bezier sampling), rotation.
  drafting/      The engine + every garment recipe. Pure functions:
                 measurements.ts (Measurements interface, STANDARD_M, derive()),
                 facets.ts (body-vs-finished measurement role classification),
                 piece.ts (Piece/Edge/Point model), block.ts (Block, rolePiece),
                 component.ts (Component/ComponentResult, assembleComponents),
                 stitch.ts (EdgeRef/Interface/Stitch, interfaceLength, stitchChecks),
                 bodice.ts (shared Bodice component — front/back panel,
                   neckline + shoulder/armhole + side/hem, parameterised by
                   necklineParams and, since Slice 63, an optional strapWidth),
                 sleeve.ts (Sleeve component, fits itself to the ASSEMBLED
                   bodice's real armhole, not a re-derived one — a Slice 54 fix),
                 neckline.ts (necklineEdge() — crew/v/scoop/boat shape
                   construction; rebuilt in Slice 62 to meet the centre-front
                   fold at a right angle),
                 armhole.ts (NEW Slice 63 — sleevelessArmhole(), the tank's
                   real strap+armhole curve, mirrors neckline.ts's pattern),
                 waistband.ts, tshirt.ts / fitted.ts / skirt.ts / tank.ts
                   (the four recipes' draft() functions),
                 recipe.ts (GarmentRecipe interface + TEE/FITTED/TANK/SKIRT),
                 dart.ts, grading.ts, tshirt-grade.ts, fitted-tables.ts,
                 tshirt-checks.ts, tshirt-guidance.ts, tshirt-notches.ts,
                 tshirt-pom.ts, pom.ts, ease.ts, allowance.ts,
                 fit-compare.ts, garment-check-golden.ts.
  guidance/      check.ts, garment-check.ts (garmentReport — the generic
                 pass/fail engine), guidance.ts, note.ts (Note shape),
                 plausibility.ts (MEASUREMENT_BOUNDS — per-field "usual"
                 ranges, separate from tighter geometry-aware warnings).
  render/        shape.ts (pieceToPath — the actual cut-pattern canvas),
                 canvas.ts (renderBlueprint — technical drafting-table view),
                 body.ts (annotated 2D body-view figure), garment.ts
                 (assembled-garment preview), skirt-figure.ts (skirt's own
                 figures — deliberately NOT unified with body.ts/garment.ts),
                 neckline-path.ts (NEW Slice 61 — shared function turning a
                 necklineEdge() result into an SVG path, used by both body.ts
                 AND garment.ts), allowance.ts, notch.ts, nest.ts, fabric.ts,
                 editor.ts, theme.ts.
  edit/          edit.ts — freeform piece-editing data model.
  export/        svg.ts, dxf.ts, pdf.ts (tiled), a0.ts (single-sheet
                 projector, calibrated), calibration.ts, techpack.ts,
                 nesting.ts, marker.ts, layout.ts, projector.ts, unfold.ts,
                 regression.test.ts (the byte-identity gate).
  style/         style.ts — named target-fit style presets per garment.
  ui/            app.ts (mountApp — DOM wiring), controls.ts (FIELDS — the
                 per-measurement UI slider registry), view.ts, persist.ts
                 (serialize/deserialize save/load, lenient-fallback pattern
                 for fields added after a save format shipped), journey.ts.
  main.ts        Vite entry point.
electron/        main.cts, preload.cts (both .cts — always CommonJS
                 regardless of package.json's "type":"module"),
                 verify-save.cjs, verify-menu-and-window.cjs (a SEPARATE e2e
                 gate outside the Vitest suite, Playwright vs the real app).
```

Every layer directory has an `index.ts` barrel (`export * from "./x"`);
layers import each other's barrels, not individual files.

### Data flow

**[Inference, synthesized from code reading]:** `Measurements` (one flat
object holding every field any garment might need — a garment that doesn't
use a field still carries it, unused) → each `GarmentRecipe.draft(m)` builds
a `Block` (named `Piece`s, each a closed loop of `Edge`s, assembled from
`Component`s stitched together per a declared `Stitch[]`) → `Piece`s feed
FOUR independent, pure consumers, each re-deriving from the same
`Measurements`/`Block` rather than reading a cached result: **checking**
(`garmentReport` — generic, recipe-driven; plus `plausibility.ts`'s
separate per-field bound check), **rendering** (three independent SVG
renderers — the real cut-pattern canvas, the body-view figure, the
assembled-garment preview — sharing geometry only through
`derive()`/`necklineEdge()`/`sleevelessArmhole()`; this is the exact seam
that produced the Slice 60–63 bug chain, see §6), **editing** (a manual
override layer with its own Reset-from-measurements), **grading** (re-runs
`draft()` at each graded size, feeding the POM sheet, tree-ring nest, and
whole-run marker), and **export** (four independent writers —
SVG/DXF/PDF/tech-pack — the ones `regression.test.ts` byte-identity-gates).

### GarmentRecipe and component/stitch architecture

**[Verified]:** `GarmentRecipe` — every garment implements: `name`, `label`,
`fields`, `styles`, `draft`, `notches`, `guidance`, `checks`,
`grade`/`sizes`, `sizeMetric`, `techPack`, `allowances`, and (since Slice
61/63) `frontNeckline`/`backNeckline`/`strapWidth` — **these three are now
FUNCTIONS of `Measurements`, not static values** (changed Slice 63 because
`neckDrop`/`strapWidth` became live user-adjustable fields; TEE/FITTED
supply functions that ignore their argument and return the same default). A
`Component` is `(m, params) => ComponentResult` (`{pieces, stitches,
interfaces}`). `assembleComponents([...], stitches)` combines components'
pieces + a declared `Stitch[]` into one `Block`. `stitchChecks(block,
stitches)` DERIVES sewability checks from the stitch declarations, not
hand-written per garment.

**Component-architecture migration status [Verified]:**
- **Phase A (stitches as data): COMPLETE.**
- **Phase B (components): COMPLETE.** B2 Bodice (Slice 53), B3 Sleeve fixing
  a latent armhole-coupling bug (Slice 54), B4 Neckline (Slices 55–56), B5
  Waistband (Slice 57).
- **Phase C: C1 and C2 done, C3 undecided/deferred.** C1 skirt via
  components (Slice 58). **C2 — "the real test" — DONE, PASSED at Slice
  59.** C3 (shared croquis library) — not done, overtaken by the Tank
  rework.

**Standing migration rule [Verified, quoted]:** *"Never refactor and change
behaviour in the same slice. A refactor slice must produce byte-identical
output. A behaviour slice must not move code."*

### All garment-specific behavior and current limitations

**[Verified]:**
- **Tee** (`tshirt.ts`): crew neckline, set-in sleeve fitted to the real
  armhole. Fields: chest, shoulderWidth, bicep, length, armholeDepth,
  sleeveLength, ease.
- **Fitted** (`fitted.ts`): bust-darted tee variant — same fields. **Its
  front panel is drafted with its OWN independent armhole/neckline
  construction, NOT via `bodice.ts`'s shared `bodicePanel`** — confirmed
  directly this session. A future fix to `bodice.ts`'s sleeved-armhole path
  does NOT automatically reach `fitted.ts`'s front panel. A real,
  documented architectural seam, not itself a bug.
- **Skirt** (`skirt.ts`): waist/hip/hipDepth/length/ease, no neckline. Own
  separate render figures (`skirt-figure.ts`), deliberately not unified
  with `body.ts`/`garment.ts`.
- **Tank** (`tank.ts`): chest, shoulderWidth, length, armholeDepth,
  strapWidth, neckDrop, ease. No sleeve component (the armhole is a raw,
  bound/finished edge — a real garment convention). Front neckline: scoop
  (`{shape:"scoop", widthEase:1.5, frontDrop: m.neckDrop}`). Back: crew,
  same widthEase as front (required so the shared shoulder/strap point
  keeps both shoulder seams matching in length — tested for explicitly).
  Named styles (`TANK_STYLES`): Fitted/Classic/Relaxed/Crop/Longline tank —
  **all five vary ONLY by ease and length**, verified directly, none
  implies a different silhouette.
- **No polo, no woven shirt, no trouser, no long-sleeve tee exist yet.**

### Invariants, regression baselines, test philosophy, mutation checks

**[Verified]:**
- **100% coverage on every file** (not just aggregate), confirmed directly
  this session.
- **Export byte-identity baseline** — 8 SHA-256 hashes, first recorded
  Slice 34 (pre-F1, commit `4f7e796`), moved exactly twice (Slice 45
  tech-pack-only; Slice 62 all 8, deliberate, sign-off obtained first).
- **Test philosophy** ("a test which mirrors its output proves nothing" —
  also appears in `RESUME-LOG.md`): new tests compute their expected value
  from the SAME real function under test (e.g. calling the real
  `necklineEdge()` inside a test) rather than a hardcoded literal, so a
  future change can't silently desync test from reality.
- **Verify-against-fresh-clone**: standard final step of every recent slice
  delivery — a plain `git apply` of the exact patch set against a brand-new
  `git clone`, full gate run there, before handoff.
- **"Never edit an assertion to make it pass"** — stated in `FABLE-BRIEF.md`
  and MVP-PLAN.md §5. The few times a test needed updating, the slice log
  documents WHY the old assertion was checking a bug's own signature rather
  than a real requirement.
- **A distinct, separate Electron e2e gate**, outside the 100%-coverage
  Vitest number: `npm run electron:verify[-packaged]` and
  `electron:verify-menu[-packaged]`, Playwright vs the real built app.
  Verified passing as of Slices 46–47. **[Missing/Uncertain]** not
  re-run by me this session (requires a full Electron launch); nothing in
  Slices 48–63 touched `electron/` at all per `git log`.

### Electron/runtime setup and local development commands

**[Verified — `package.json`]:**
```bash
npm install                          # one-time
npm run dev                          # Vite dev server (browser)
npm run build                        # tsc && vite build
npm run test                         # vitest run
npm run test:watch                   # vitest (watch mode)
npm run coverage                     # vitest run --coverage
npm run electron:build-main          # tsc -p electron/tsconfig.json
npm run electron:dev                 # build main, then `electron .`
npm run electron:pack                # full build + electron-builder
npm run electron:verify              # Playwright e2e vs dev-mode Electron
npm run electron:verify-packaged     # same, vs a real electron-builder output
npm run electron:verify-menu[-packaged]  # native-menu/window-state e2e gate
```
`main` entry: `dist-electron/main.cjs`. Electron `^44.1.0`, `electron-builder
^26.15.3`, Playwright `^1.62.1` (used ONLY for the Electron e2e gates — no
browser UI Playwright tests found). Builder targets: mac (`dir`, unsigned —
`identity: null`), win (`dir`), linux (`dir`). **No evidence code-signing
was ever actually set up** — consistent with MVP-PLAN.md's own note that it
was flagged as needed but not yet built into the packaging config.

### File-ownership / multi-agent conventions — the Fable/Opus split

**[Verified, `FABLE-BRIEF.md` §0, quoted]:** *"Opus owns LOGIC — the
drafting engine, garment recipes, guidance checks, the verdict function, and
the skirt. Fable owns PRESENTATION + OUTPUT — the guided journey UI and the
export writers."* A scoped, two-feature epic (F1 export writers, F2 guided
journey) — **both marked done in PROJECT-STATE.md's dependency spine.**

**[Inference, strongly supported]:** this split is **NOT currently
binding**. Since Slice 44, and very visibly across Slices 59–63 in this
session, a SINGLE agent has freely modified `drafting/` (old "Opus-only"),
`guidance/`-adjacent code, AND `render/`/`ui/` (old "Fable" domain) in the
same slices, with no file-ownership process in play. State this plainly to
the next agent: one workflow, one agent via Claude Code, no live
file-ownership partition today. MVP-PLAN.md §5 plans to use the component
architecture itself as the FUTURE ownership seam once a team is hired — a
stated future intent, not implemented today.

---

## 5. Product and UX state

### Every implemented user-facing feature

Reproduced from README.md's own list, all **[Verified]** present in the
current codebase: measurement-driven drafting; live canvas; 2D body view
with hover-linked highlighting; guidance (geometric + plausibility +
proportional-coherence, warn-never-clamp); target-fit styles; grading
(tree-ring nest + POM sheet with per-row tolerances); tech pack (3-page
PDF); fabric estimate (nesting, single or whole graded run); production-
readiness checker; freeform edit (drag + Reset); export (SVG/DXF at any
size + tiled PDF); save/load.

**Additionally confirmed:** a fitted/darted second garment with dart
pivot+true manipulation; a skirt (structurally different, proving engine
generality); a tank (proving the component architecture's "hours, not a
slice-run" claim); a guided 5-step onboarding journey; real-world export
calibration (verified 10cm square on the A0 projector export); an Electron
desktop shell with native file save and app menu.

### Guided-journey behavior

**[Verified, `FABLE-BRIEF.md` §F2]:** a progressively-disclosed 5-step flow
(Start → Measure → Fit → Refine → Output), built as the fix for "the #1
barrier" to a first-time user reaching a valid export. Captured in a demo
artifact at Slice 44. **[Missing/Uncertain]** not re-walked live by me this
session; relying on PK docs' own confirmation plus `app.test.ts`'s passing
tests as indirect evidence of no regression.

### Save/load format and migration behavior

**[Verified — `src/ui/persist.ts`]:** JSON, versioned (`SAVE_VERSION` + a
`v` field), with a deliberate **lenient-fallback pattern** for any
`Measurements` field added after the save format shipped — each has a
`[min, max]` entry in a `BOUNDS` table; `deserialize()` defaults to
`STANDARD_M`'s value if a saved value is out of range OR simply absent
(an old save). First established for `waist`/`hip`/`hipDepth` (Slice 42),
reused for `strapWidth`/`neckDrop` (Slice 63). **This is the established
convention for any future new Measurements field.**

### Export formats and known compatibility caveats

**[Verified]:** SVG, DXF, tiled print-at-home PDF, single-sheet A0
projector PDF (verified 10cm calibration square), 3-page tech-pack PDF.
All exported "at any graded size." **[Missing/Uncertain]** no specific
compatibility caveats documented anywhere I found.

### Honest limitations — stated explicitly, repeatedly

**[Verified — the single most consistently repeated fact in the project]:**
- **"No garment produced by this tool has ever been cut and sewn"**
  (ROADMAP.md §0). **"No garment drafted by this engine has been physically
  validated yet; that remains the single highest-priority open risk in the
  project"** (PROJECT-STATE.md, written right after Slice 48). **No later
  statement found, through Slice 63, that this has since been resolved.**
  **[Missing/Uncertain — the most important unresolved question, see §10.]**
- The assembled garment view is explicitly a schematic, not a drape
  simulation.
- The checker verifies sewability, explicitly not fit.
- Nesting is "an estimator," not production-grade.
- The tank's armhole/strap curve shape has no sourced construction spec —
  a "starting decision, rendered and eyeballed," explicitly flagged as such
  (unlike the neckline curve, which had a hard, sourced rule).
- Guidance notes from `necklineEdge()`/`sleevelessArmhole()` are still only
  surfaced for the tank — every other caller silently discards them.

### Known UX bugs, visual defects, technical debt, edge cases

**[Verified]:**
- **Resolved this session:** the neckline V-spike bug (Slice 62), the
  tank's chest-width/neckline-sync bug (Slice 61), the tank's sleeveless-
  tee-shaped armhole/strap (Slice 63).
- **Still open, explicitly flagged:** guidance notes discarded for every
  neckline caller except the tank. `fitted.ts`'s front panel bypasses
  `bodice.ts`'s shared component. Neckline `widthEase` still a fixed
  constant for the tank, not yet user-adjustable (flagged as "a real
  candidate for the same treatment later, not assumed here").
- **[Inference]** given the pattern of each fix exposing one deeper
  pre-existing bug, Slice 64's confirmation pass may well surface something
  similar — worth the next agent being alert to this pattern, not a
  specific predicted bug.

---

## 6. Decisions and research

### Every important accepted decision and its rationale

**[Verified]:**

1. **Component architecture over hand-written-per-garment** — the "two real
   consumers" rule avoids over-abstraction; measured duplication evidence
   (COMPONENT-ARCHITECTURE.md §2.2) proved the old `draftFront`/
   `draftBack` duplication was real.

2. **"No silent geometry reuse"** — adopted after Slice 60, EXTENDED three
   more times:
   - **Slice 61:** `render/body.ts` used its own ungrounded `chest * 0.22`
     formula instead of `derive().chestWidthHalf`; neither `body.ts` nor
     `garment.ts` drew the real neckline shape (a fixed placeholder curve
     instead). Fixed via a new shared `render/neckline-path.ts`. The
     mandated audit found the IDENTICAL bug class already in
     `render/skirt-figure.ts` (an independent, wrong `waist*0.20`/
     `hip*0.22` formula a few lines from the correct one in the same file)
     — fixed via a new shared `skirtWidths()`.
   - **Slice 62:** rendering the neckline faithfully (Slice 61's fix) is
     what made a pre-existing Slice 55/56 bug VISIBLE — Kshitij flagged,
     with screenshots, a sharp V-plunge instead of a crew/scoop, everywhere.
     Root cause, confirmed by sampling the actual Bezier curve and checking
     tangent directions: the curve's centre-front control point sat on the
     SAME axis as the curve's own start point, giving a VERTICAL tangent at
     the fold — **every independent drafting source checked (5,
     cross-referenced) states a curved neckline must meet centre front/back
     at a RIGHT ANGLE to the fold, or mirroring it spikes.** Rebuilt as a
     true quarter-ellipse (standard 0.5523 Bezier circle-approximation
     constant). Direct, unplanned consequence: once the tangent rule holds,
     the curve's shape is fully determined by its two endpoints — no
     freedom left for "rounder control points" — so `scoopControlFactors`
     (Slice 60) was deleted outright; scoop is now crew geometry plus
     depth/width. **`regression.test.ts`'s export baseline was deliberately
     moved — the first time since Slice 45 — with Kshitij's explicit
     sign-off requested and given BEFORE building.**
   - **Slice 63:** two more pre-existing gaps found during verification:
     guidance notes silently discarded everywhere; render previews still
     drawing the tank's shoulder at the full sleeved point.

3. **Real armhole/strap geometry for the tank, researched before building**
   (Slice 63, `TANK-RESEARCH.md`, fully reproduced §7). Key findings: strap
   width is measured as an inset from the neckline or shoulder edge in
   every source, never "the full shoulder"; the two source framings found
   DISAGREED (5–8cm from the neckline vs. 1–1.5in inset from the shoulder
   edge) — NOT silently resolved by picking one; armhole DEPTH doesn't
   change for a sleeveless garment, only the CURVE SHAPE does, cutting
   further in than a sleeve-cap-accommodating curve; no current tank style
   needs princess seams (checked directly against `TANK_STYLES` before
   researching princess seams in the abstract).

4. **The Slice 63 scope-changing decision [Decision/Intent, Kshitij's own
   words, as close to verbatim as I can reconstruct]:** *"why do we need to
   limit our engine to a wider or narrower strap? instead we should make it
   a range so that the user can make the decision at their own
   discretion... no measurement of any garment should be limited to just
   one specific width, it should always be a range of values that the user
   can play around with... the guidance engine already handles the task of
   letting the user know that the selected measurements are synergetic."*
   This reshaped Slice 63 mid-flight: `strapWidth` AND `neckDrop` both
   shipped as genuine user-adjustable `Measurements` fields rather than the
   engine resolving the open research question by picking a winner. **This
   is now a standing principle**: no garment dimension gets hardcoded to a
   single engine-chosen value when the person could reasonably want a
   different one; the guidance engine's warn-never-clamp checks are what
   keep an extreme combination visible, not an engine-side ceiling.

5. **The two-model Fable/Opus file split** (F1/F2 epic only) — NOT
   currently active (see §4).

### Every unresolved decision or open assumption

**[Verified/flagged]:** whether Phase C3 (croquis library) or polo comes
next (leaning polo per the more recent statement, not re-confirmed after
the Tank rework began). Pricing model, customer-segment lock, open-source
posture (all due by month 4 per MVP-PLAN.md §7, unresolved in everything I
found). Whether code-signing procurement was ever started. **Whether ANY
garment has been physically sewn yet** — the single biggest unresolved
question (§5, §10). Whether `origin/fable/f1-realworld-exports` is stale
and safe to delete. Whether neckline `widthEase` should get the same
user-adjustable treatment `strapWidth`/`neckDrop` just got.

### Tank armhole/strap research — completed vs. still required

**Completed** (Slice 63, fully reproduced §7): strap-width sourcing (with
the two-source disagreement explicitly flagged, not resolved by fiat —
resolved instead by making it user-adjustable); armhole depth-vs-shape
distinction; princess-seam scoping (resolved: not needed for any current
tank style).

**Still required, if wanted:** no numeric consensus was ever reached on
which strap-width VALUE looks best for which named style — this may not
even be "required" any more since it's now explicitly the user's call, not
the engine's (worth confirming with Kshitij before assuming more research
is wanted). Nothing researched yet on collar/placket/cuff (Month 4 scope)
or trouser crotch-curve construction (Month 5 scope, flagged as "the
hardest single curve in patternmaking").

### Which tank styles are parameter-only vs. requiring new structure

**[Verified, directly checked, Slice 63]:** **ALL FIVE current named tank
styles (Fitted, Classic, Relaxed, Crop, Longline) are parameter-only** —
each varies only by `ease` and `length` ranges. **None requires princess
seams or any other new structural element.** Verified by reading the actual
style definitions BEFORE researching princess seams in the abstract,
specifically to avoid assuming a structural need that wasn't real. A
genuinely different-silhouette tank style (fitted-through-bust, racerback,
etc.) proposed later is a separate, later design decision, not pre-built or
assumed here.

### External sources that materially influenced decisions

**[Verified, from this session's own web research]:** For the neckline
right-angle-tangent rule (Slice 62): five independent pattern-drafting
sources, cross-referenced, all agreeing on the 90-degree-at-the-fold rule —
one source ("In the Folds") independently described the exact failure mode
InfiniDrip hit, as a known drafting mistake. For the tank strap/armhole
research (Slice 63): Nastix Patterns' tank generator (strap width as a
distinct input); ShunVogue's tank-drafting guide (three pages, "2–3in /
5–8cm from the neckline"); ComfyThreads' tank-fit guide ("1–1.5in in from
the shoulder edge" — the source of the disagreement flagged above, and the
source for the muscle-tank deep-armhole observation); three independent
t-shirt-to-tank DIY conversion guides (UNIONBAY, You Make It Simple, Our
Everyday Life); TREASURIE, Couture Counsellor, and M. Mueller & Sohn (three
sources on what princess seams are for). **None of these exact source URLs
were saved into a persistent bibliography file** — they exist only in this
chat session's searches and in `TANK-RESEARCH.md`'s own prose (§7). **Flag
for the next agent:** if exact URLs are needed later, they are not
recoverable except by re-running the same searches.

---

## 7. Full context-document recovery

### MVP-PLAN.md
**Existed/exists:** Yes, currently, as a **Project Knowledge document**
(confirmed NOT in git — `git log --all --diff-filter=A` across every
branch returns zero commits ever adding this filename). **Last known
version:** "created after Slice 44" per its own text; no separate version
marker. **Contents:** faithfully reproduced (paraphrased, not
character-for-character) in §1 and §3 above. **Why absent from git
[Inference, strongly supported]:** this project deliberately keeps its
PLANNING/STRATEGY documents in Project Knowledge (chat-iterable) while
PROJECT-STATE.md and ARCHITECTURE.md — the two docs that must travel WITH
the code — ARE committed (confirmed: both exist in git at HEAD,
byte-identical to their PK copies). A deliberate, consistent split.

### ROADMAP.md
**Existed/exists:** Yes, PK-only, not in git (same check). **Reproduced:**
§1 and §3 above. **Why absent:** same reasoning as MVP-PLAN.md.

### COMPONENT-ARCHITECTURE.md
**Existed/exists:** Yes, PK-only, not in git. **Reproduced:** §4 above (the
migration-phase status in full; the earlier design-rationale sections §1–8
are accurately represented by §4's architecture description, not
reproduced verbatim). **Why absent:** same reasoning.

### SLICES-BRIEF.md
**Existed/exists:** Yes, PK-only, not in git. **What it actually is
[Verified]:** the STANDING BRIEFING TEMPLATE pasted at the start of each
new slice-planning chat — its opening paragraph is word-for-word identical
to the first message of the conversation that produced this handoff. A
living/reusable prompt, not a status log; its feature-list prose is
necessarily somewhat behind the latest slice (currently reads as of "Slice
44" even though still in active use at Slice 63) — **this is expected, not
an error.** PROJECT-STATE.md is the authoritative status source. **Why
absent from git:** a chat-tool artifact, not documentation meant to travel
with the code.

### RESUME-LOG.md
**Existed/exists:** Yes, PK-only, not in git. **What it actually is
[Verified]:** Kshitij's own personal resume-bullet staging log —
proof-anchored, `[Earned]`/`[Pending]`-tagged, explicitly "STAGING — not
for resume use yet." **Not project status documentation** — a personal
career artifact, not authoritative about anything technical.

### TANK-RESEARCH.md
**Existed/exists: this is the one genuinely, fully missing document.**
Never committed to git, and — unlike the other five — **never uploaded to
Project Knowledge either.** It exists ONLY as this chat session's own
generated output, delivered to Kshitij as a file attachment in-conversation
but never re-uploaded to durable storage (an oversight in my own prior
delivery, corrected by reproducing it fully below). PROJECT-STATE.md's
Slice 63 log entry and Active-directive section both cite it by name
multiple times, which is presumably why the handoff prompt flagged it as
"referenced but absent." **Complete verbatim reconstruction, from this
session's own original output (I am the original author — this is the
actual content, not a reconstruction from uncertain memory):**

> # Tank research — strap width & armhole geometry
>
> Started Slice 63, per the Tank rework plan's research standard
> (PROJECT-STATE.md): real numeric dimensions and construction specs from
> genuine web research, cross-checked against at least two independent
> sources, never recycled from our own existing garments' numbers, never
> presented as sourced when it's actually an estimate.
>
> ## What's actually wrong today
>
> `draftTank()` calls the SAME `bodice()` component tee/fitted use,
> unmodified, for both the strap (shoulder edge) and the armhole curve.
> That means today's "tank" is really a sleeveless tee: its shoulder point
> sits at the full `shoulderHalf` (22.5 cm at STANDARD_M) — the same point
> a set-in sleeve would attach to — and its armhole curve is the curve
> shaped to smoothly fit a sleeve cap.
>
> ## Finding 1 — strap width is its own dimension, not the full shoulder
>
> Every tank-specific drafting source found measures the strap as a
> distance IN from the neckline point along the shoulder line:
>
> - Nastix Patterns' tank generator lists "strap width" as a shaping input
>   distinct from shoulder width, alongside armhole depth and neckline
>   width.
> - ShunVogue's from-scratch tank drafting guide: "From the upper end of
>   the neckline, measure 2 to 3 inches (5 to 8 cm) along the top for the
>   straps." Repeated across three separate how-to pages.
> - ComfyThreads' tank-fit guide, describing strap position on a finished
>   garment: "About 1 to 1.5 inches in from the outer edge of your
>   shoulder."
>
> **These two framings don't fully agree.** Measured from the NECKLINE
> side, 5–8 cm gives a strap tip roughly 12–15 cm from centre front at
> STANDARD_M (a narrow, spaghetti-adjacent strap). Measured as an INSET
> from the shoulder EDGE, 1–1.5 in (2.5–3.8 cm) gives a strap tip roughly
> 18.7–19.3 cm from centre — a much wider, "classic tank" strap. Both are
> real, sourced numbers; they likely describe different tank sub-styles.
>
> **Proposed number (superseded before building — see below):** the wider
> "classic tank" reading, strap tip at `shoulderHalf − 4 cm` (≈18.5 cm),
> since `TANK_STYLES` had no slim-strap variant to justify going narrow.
>
> ## Finding 2 — armhole DEPTH doesn't change; armhole SHAPE does
>
> Every drafting source treats "armhole depth" as the same input
> regardless of sleeved or sleeveless — matches how `m.armholeDepth`
> already works. What changes is the CURVE between the strap point and the
> underarm:
>
> - ComfyThreads: "the armhole should end just below your shoulder
>   joint... muscle tanks have deep armholes on purpose."
> - Three independent t-shirt-to-tank DIY conversion guides (UNIONBAY, You
>   Make It Simple, Our Everyday Life) independently describe cutting the
>   armhole OUTSIDE/BELOW the existing sleeve seam.
>
> The mechanism: a sleeved armhole's curve is shaped to smoothly receive a
> sleeve cap. A tank has nothing to fit there, so the curve can — and per
> every source, should — cut further in, reading as a rounder, more open
> scoop.
>
> ## Finding 3 — no named tank style needs princess seams
>
> Checked directly against `style.ts`'s `TANK_STYLES`:
> ```
> Fitted tank:   ease [0, 4],  length [59, 74]
> Classic tank:  ease [5, 10], length [59, 74]
> Relaxed tank:  ease [11, 16], length [59, 74]
> Crop tank:     ease [0, 10],  length [40, 57]
> Longline tank: ease [5, 14],  length [78, 100]
> ```
> All five vary ONLY by ease and length. Cross-checked what princess seams
> are for (TREASURIE, Couture Counsellor, M.Mueller & Sohn): curved
> vertical panel seams shaping close-fitting garments through bust AND
> waist beyond a single dart. This project's mechanism for that is a bust
> dart (`fitted.ts`), not princess seams, and no tank style asks for it.
>
> **Conclusion: princess seams out of scope.** The strap width + armhole
> shape fix is a curve/dimension change, achievable entirely through
> `NecklineParams`-style parameters.
>
> ## Proposed scope for the build (pending confirmation)
>
> 1. A new derived strap point for sleeveless garments (proposed
>    `shoulderHalf − 4cm`, Finding 1).
> 2. A new armhole curve for sleeveless garments, cutting further in than
>    the sleeve-cap curve.
> 3. Underarm point stays at `chestWidthHalf`, unchanged (Finding 2).
> 4. No princess seams, no new named styles (Finding 3).
> 5. Likely a small new shared function, same pattern as `necklineEdge()`.
>
> **Not yet resolved, flagged for confirmation:** the strap-width
> discrepancy. Wide (18.5cm) "classic tank" or narrow (12–15cm)
> spaghetti-adjacent?

_(End of TANK-RESEARCH.md. Note: item 1's exact proposal and the closing
question were BOTH superseded by the Slice 63 scope change — strapWidth
became user-adjustable rather than the engine picking either number. The
rest — sourcing, Finding 2's mechanism, Finding 3's conclusion — remains
exactly as used in the actual build.)_

### FABLE-BRIEF.md, MARKETPLACE-GOALS.md, TOOLS-RESEARCH.md, ASSET-RESOURCES.md, README.md, indiateecmtgots.csv

Not named in the "absent" list, but confirmed present and read this
session — see §1, §4, §6, §8 for content/role. None are in git except
README.md (committed, content reproduced §1). `indiateecmtgots.csv` is raw
tabular research backing `MARKETPLACE-GOALS.md`'s vendor track — not fully
parsed (business research, not engineering-relevant), flagged for
completeness.

---

## 8. Repository and file ledger

### Context/documentation files and their last meaningful update

| File | Location | Last meaningful update (best known) |
|---|---|---|
| `PROJECT-STATE.md` | Repo (committed) + PK | Slice 63 (committed at HEAD) |
| `ARCHITECTURE.md` | Repo (committed) + PK | Slice 63 (committed at HEAD) |
| `README.md` | Repo (committed) | Stale — describes skirt as still "planned" though skirt/tank both ship |
| `MVP-PLAN.md` | PK only | "Created after Slice 44" |
| `ROADMAP.md` | PK only | Slice 44 era ("611 tests" baseline cited) |
| `COMPONENT-ARCHITECTURE.md` | PK only | Pre-Phase-A (~Slice 48–51 era) |
| `SLICES-BRIEF.md` | PK only | Describes project "as of Slice 44" by design (living template) |
| `RESUME-LOG.md` | PK only | Ongoing, exact date unknown |
| `FABLE-BRIEF.md` | PK only | Pre-Slice-44 (F1/F2 epic spec) |
| `MARKETPLACE-GOALS.md` | PK only | Own research-log section presumably tracks it; not read in full |
| `TOOLS-RESEARCH.md` | PK only | "Slice 44+" |
| `ASSET-RESOURCES.md` | PK only | Unknown exact slice |
| `TANK-RESEARCH.md` | **Nowhere durable** | Slice 63 — see §7 |
| `apparel_design_resources.md` | Repo (committed) | Present at HEAD; a link-list distinct in content/framing from `ASSET-RESOURCES.md` — **[Missing/Uncertain]** relationship between the two unclear, ask Kshitij |

### Source/test/config files changed in the Tank rework (Slices 61–63)

**[Verified]:** Slice 61: `render/body.ts`, `render/garment.ts`,
`render/neckline-path.ts` (new), `render/skirt-figure.ts`,
`drafting/skirt.ts`, `drafting/tank.ts`, `drafting/recipe.ts`, `ui/app.ts`,
plus matching test files (13 modified, 2 new). Slice 62:
`drafting/neckline.ts` (full rewrite), `drafting/tank.ts`,
`drafting/recipe.ts`, `export/regression.test.ts` (full rewrite, new
baseline), plus test files (7 modified). Slice 63:
`drafting/measurements.ts`, `guidance/plausibility.ts`, `ui/controls.ts`,
`drafting/facets.ts`, `drafting/index.ts`, `drafting/bodice.ts`,
`drafting/tank.ts` (full rewrite), `drafting/recipe.ts`, `ui/app.ts`,
`ui/persist.ts`, `render/body.ts`, `render/garment.ts`, plus test files (17
modified, 2 new — `armhole.ts`/`armhole.test.ts`).

### Generated, ignored, local-only, or machine-specific files

**[Verified, `.gitignore`]:** `node_modules/`, `dist/`, `dist-electron/`,
`release/`, `coverage/`, `.vite/`. **[Verified, discovered repeatedly this
session]:** running `tsc` (without `--noEmit`) inside `src/` leaves stray
compiled `.js`/`.test.js` files ALONGSIDE every `.ts` source file
(`tsconfig.json` has no apparent `outDir` separating build output from
source) — these are NOT gitignored (only `dist/`/`dist-electron/` are), so
**any agent must manually delete these stray `.js` files before
diffing/committing**, or `git status` fills with dozens of spurious
untracked files. Recommend flagging to Kshitij as worth a `tsconfig.json`
`outDir` fix.

### Information that exists only in chat and should be promoted

**[Verified/flagged, priority order]:**
1. **`TANK-RESEARCH.md`'s full content** (§7) — currently nowhere durable.
2. **Kshitij's exact Slice 63 scope-change wording** (§6, decision 4) —
   only in chat history and my paraphrase in PROJECT-STATE.md.
3. **The stray-`.js`-files build gotcha** (§8) — not written down anywhere.
4. **Whether the physical-sew-validation gap has closed** — see §5, §9,
   §10; if resolved, PROJECT-STATE.md needs updating; if not, keep it
   loudly flagged.

---

## 9. Conflicts and uncertainty — reconciling stale/contradictory statements

1. **"Immediate next slice: Phase B" vs. reality.** PROJECT-STATE.md
   contains this line inside a section it ITSELF labels "superseded... kept
   for slice-history context only." **Newest authoritative source: the
   numbered slice log at the top of PROJECT-STATE.md**, current through
   Slice 63. Do not read the superseded-section prose as current status.

2. **"Polo next" vs. "C3 worth discussing."** Slice 59's log entry floats
   C3 as worth discussing; every LATER "what's next" statement (the
   Active-directive section, rewritten through Slice 63) says polo is next
   with no mention of C3. **Newest authoritative source: the current
   Active-directive wording — polo is next.** Never explicitly
   re-litigated against C3 after the Tank rework began — worth a direct
   confirmation (§10).

3. **Recipe count.** ROADMAP.md §0 says "three recipes: tee, fitted, skirt"
   — written before the tank existed. **Newest authoritative source: the
   current `recipe.ts`, verified directly — FOUR recipes.** Simply an old
   document, not a real conflict.

4. **COMPONENT-ARCHITECTURE.md's migration plan** describes Phases A/B/C as
   a forward-looking PLAN written before any were built — not a status
   tracker. **Newest authoritative source for actual status:
   PROJECT-STATE.md's slice log**, confirming A/B/C1/C2 done, C3 not.

5. **README.md's "Status" section** says "Planned:... then a structurally
   different garment (a skirt)" — significantly stale; the skirt was built
   long ago and the tank (an even later, further proof of the same claim)
   is also done. **Newest authoritative source: PROJECT-STATE.md.**
   README.md needs an update pass, not done this session (out of scope for
   Slices 61–63).

6. **The Tank rework's own step numbering** was renumbered twice as deeper
   bugs were found mid-execution. **Not a conflict to resolve — an
   accurate record of genuine scope discovery. The CURRENT numbering (5
   steps, 1–3 done, 4 open, 5 = polo) is the one authoritative version.**
   Do not follow any earlier-numbered version from an older slice-log
   entry.

7. **Test counts across documents.** ROADMAP.md cites "611 tests."
   `RESUME-LOG.md`'s headline example cites "530 tests." **Current, verified
   number: 790 tests, 100% coverage, at HEAD (Slice 63)** — my own fresh
   run this session, cross-confirmed against PROJECT-STATE.md's own
   `s63=790` line. Every other citation is a historical snapshot, not
   current status.

---

## 10. Continuation instructions

### Exact recommended next slice

**Slice 64 — Tank rework step 4: final confirmation.** **[Decision/Intent,
already set — not my own recommendation, the stated next step]:**

- **Scope:** a closing-review pass across the ENTIRE Tank rework (Slices
  60–63), not new feature work. Confirm every dimension used anywhere in
  the tank's construction is traceable to a source (a real measurement, a
  sourced drafting rule, or an explicitly-flagged starting decision).
  Confirm every visual claim has actually been checked against real
  rendered output, not just test assertions — continue this session's own
  practice of rendering to PNG and visually inspecting at multiple
  measurement values.
- **Non-goals:** do not start polo. Do not build Phase C3 unless Kshitij
  explicitly redirects.
- **Files likely involved:** primarily a REVIEW pass — possibly none
  change. Most likely candidates for a lingering gap: `drafting/fitted.ts`
  (confirm its independent front-panel construction is intentional, not an
  oversight); anywhere else `necklineEdge()` is called without surfacing
  its `notes` (currently only the tank does); `armhole.ts`'s `SCOOP_PULL`
  constant (an eyeballed starting decision — worth a second look, possibly
  against real garment references now that the geometry is otherwise
  correct).
- **Acceptance criteria:** the same gate every recent slice used — clean
  `tsc --noEmit`, `npm run coverage` at 100% with an exact documented test
  count, `regression.test.ts`'s 8/8 baseline untouched unless a real,
  sign-off-confirmed reason to move it turns up, verified on a FRESH CLONE
  via `git apply`, all relevant views re-rendered to image and visually
  inspected.
- **Required research:** none anticipated unless the review turns up a
  specific new gap.
- **Stop/approval points:** if the review finds nothing wrong, close the
  Tank rework directive in PROJECT-STATE.md (mark step 4 done) and ask
  Kshitij to confirm moving to polo (step 5) — do NOT start polo
  unprompted. If the review DOES find something, treat it exactly like
  Slices 61–63 treated their own discoveries: stop, explain the finding
  plainly with rendered evidence (not just a code-read claim), and get
  explicit confirmation before building a fix, especially if it would move
  the export regression baseline again.

### What the next agent must ask Kshitij before touching code

1. **Has any garment produced by InfiniDrip actually been physically sewn
   and checked against a real body yet?** The single most important open
   question in the entire project — could not be confirmed either way.
2. **Is polo definitely next after Slice 64, or is Phase C3 (croquis
   library) worth reconsidering first?**
3. **Should `TANK-RESEARCH.md`'s content (reproduced in full, §7) be
   uploaded to Project Knowledge / committed to the repo now?**
4. **Is the unsigned `mac.identity: null` Electron-builder config still the
   intended state**, or has code-signing procurement happened somewhere not
   visible in the repo?
5. **Should `neckline.ts`'s `widthEase` (still a fixed recipe constant for
   the tank) get the same user-adjustable treatment `strapWidth`/
   `neckDrop` just got?**
6. **What's the relationship between the repo's `apparel_design_
   resources.md` and the PK-only `ASSET-RESOURCES.md`?**

---

## AUTHORITATIVE CURRENT STATE (paste this into a new agent's context)

**Project:** InfiniDrip (`patternworks`) — a local-first, TypeScript/SVG
parametric sewing-pattern CAD tool, with an Electron desktop shell. Repo:
`https://github.com/kshitijpatne/InfiniDrip.git`.

**HEAD:** `01399a15f9d5ff5552f97a1276871ce424218cbb` on `main`, up to date
with origin, clean working tree. Commit message: "Slice 63: real tank
strap/armhole geometry — strapWidth and neckDrop become genuine
user-adjustable measurements."

**Verified gate at HEAD (run fresh this session):** `tsc --noEmit` clean.
`vitest run --coverage`: **59 test files, 790 tests, all passing, 100%
coverage on every single file.** `npm run build` clean.
`export/regression.test.ts`'s 8/8 export byte-identity baseline passing
(moved deliberately, with sign-off, exactly twice ever: Slice 45 and
Slice 62).

**Four garment recipes exist:** Tee, Fitted (darted), Skirt, Tank — all
through one shared `GarmentRecipe`-driven engine (`draft → grade → POM →
check → nest → edit → export`), proven general-purpose by construction
(Phase C2 of the component-architecture migration, Slice 59, explicitly
"the real test," passed).

**Active initiative:** the "Tank rework" — three real geometry bugs found
and fixed in sequence (render-sync, Slice 61; neckline-curve construction
itself, Slice 62; real tank armhole/strap geometry PLUS `strapWidth`/
`neckDrop` promoted to genuine user-adjustable measurements at Kshitij's
explicit direction, Slice 63). **Step 4 (final confirmation) is the
immediate next task — Slice 64.** Polo is next after that, explicitly
parked until step 4 closes.

**The single most important open risk in the whole project, stated
repeatedly across multiple documents and never confirmed resolved in
anything available to me: no garment drafted by this engine has been
physically cut, sewn, and checked against a real body yet.** Confirm this
directly with Kshitij before assuming otherwise.

**Standing rules that govern every future slice:** 100% coverage, enforced;
byte-identity export regression gate, moved only with explicit sign-off;
"warn, never clamp" on all guidance; no garment dimension hardcoded to a
single engine-chosen value when the person could reasonably want a
different one (strapWidth/neckDrop precedent, Slice 63); "no silent
geometry reuse" — verification must check actual rendered output, not just
that tests pass, and this has needed re-extending three times already as
each fix exposed one level deeper; never edit a test assertion to force a
pass — re-copy the verbatim file instead; always verify the final delivery
on a fresh `git clone` + `git apply`, not just the working copy.

**Full detail on everything above — architecture, every document's
content, every decision's rationale, every known gap — is in the sections
above this block.**
