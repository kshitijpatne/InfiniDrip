# InfiniDrip — Architecture

How the app fits together, in plain language. Read the top to re-orient; skim the
layers when you need detail. Updated every slice with only need-to-know changes.

**Governing plan:** as of Slice 44, MVP-PLAN.md (operative — the 6-month
execution plan) and ROADMAP.md (strategic — competitor analysis + long-term
scope + the cut list) are the current planning documents. This file describes
the engine as it exists; it does not restate the forward plan.

**Architectural fork, Phase A complete (Slice 51), Phase B complete (Slice 56):**
`COMPONENT-ARCHITECTURE.md` is the design doc for the Interface/Stitch/
Component work below — read it before touching `drafting/`. Seam knowledge
is now real, declared data: every `Block` carries a required `stitches`
field (`readonly Stitch[]`), populated by each recipe's own draft function
— `sleevedTopStitches(frontSideEdges, hasDart)` for tee/fitted (one builder,
two call sites, differing only in which front edges form the side seam and
whether a dart exists), a plain `SKIRT_STITCHES` constant for the skirt
(only one variant, no builder needed). `garmentReport`
(`guidance/garment-check.ts`) assembles a garment's full check list from
TWO sources now, in a fixed order that preserves the pre-migration ordering
exactly: `stitchChecks(b, b.stitches)` first, then `recipe.checks(b, m)` for
whatever isn't a stitch — a hem or waist meeting the fold square, a property
of ONE panel with no "other side" to compare against. The old hand-written
seam/cap/dart checks in `tshirt-checks.ts`/`skirt.ts` are gone; what
remains there (`dartLegCheck`, `frontHemWidth`) are genuinely independent
utilities, kept because they're still used and tested on their own, not
migration leftovers.

Slice 51 (A3) closed the last Phase-A gap: **matched notches now read their
edge name off the stitch they mark**, via `matchedNotch(stitch, side, t,
edgeIndex?)` in `stitch.ts`. `tshirt-notches.ts` (tee), `fitted-tables.ts`,
and `skirt.ts`'s notch tables no longer re-type an edge name a stitch already
declares — so a matched-seam notch can't silently drift from the seam it
marks the way two independently hand-typed table entries could. NOT
derived, deliberately: the armhole/sleeve-cap notches, because the stitch
they'd come from (sleeve-cap ease) is multi-edge AND eased — there's no
single matched point on a seam whose whole point is that its two sides
*aren't* the same length. Those stay hand-authored, same boundary logic as
the panel-owned hem/waist-square checks. Byte-identity gated: `tee`/`fitted`
SVG output (which embeds resolved notch positions) is unchanged per
`regression.test.ts`'s SHA-256 baseline; skirt has no export baseline, so
its notch table is instead proven field-for-field against the pre-migration
literal values in `stitch.test.ts`. Phase A (stitches as data) is now fully
closed; Phase B (components) is next.

Slice 52 (B1) opened Phase B: `component.ts` adds `ComponentResult` (a
component's pieces by role, its own internal stitches, and the interfaces
it exposes for another component to sew onto) and `assembleComponents`, the
ordered merge helper that turns N `ComponentResult`s + a recipe's connecting
stitches into a `Block`. Zero consumers yet — tee/fitted/skirt keep drafting
exactly as before — so this is pure new infrastructure, proven only against
synthetic data. B2 (extract Bodice) is where a real recipe consumes it for
the first time, which is also the first real test of whether the shape is
right.

Slice 53 (B2) closed that test: `bodice.ts` extracts the exact ~90%
`draftFront`/`draftBack` shared (§2.2) — same construction points, same
edges, same control points — parameterised by the three things that
actually differed (neck depth, neckline control point, centre edge name).
`draftFront`/`draftBack` stay exported from `tshirt.ts` as thin wrappers
over the new `bodice` Component, so nothing downstream (armholeLength,
fitted's `draftBack` reuse, existing tests) had to change. `draftTshirt`
now calls `assembleComponents` for real. Deliberately NOT touched: the
fitted front. It shares `bodice`'s neckline/shoulder/armhole prefix but then
diverges into dart edges and a shifted hem — genuinely different geometry
past that point, not the same duplication B2 was scoped to close. Folding it
into `bodice` (a `dart?` param, per §5's taxonomy) is a real candidate for a
later slice, not assumed here.

Slice 54 (B3) is the first Phase-B slice that's a real FIX, not just
infrastructure or extraction. §2.4's latent coupling — `draftSleeve` fit its
cap to a re-drafted generic tee bodice, not the bodice actually in the block
being assembled — is closed at both real consumers. `draftTshirt` measures
the armhole off the `bodice` pieces it just drafted; `draftFitted` (now also
on `assembleComponents`) measures it off `draftFittedFront`'s own armhole
edge, not a generic one. The new `sleeve.ts` Component takes
`targetArmhole: number` as a param instead of re-deriving it — so a future
bodice whose armhole genuinely differs (raglan, dropped shoulder, a shirt
block) can no longer silently get a sleeve fitted to the wrong number.
Byte-identical at STANDARD_M by construction, exactly as §2.4 predicted:
fitted's front reuses the tee front's exact armhole curve, so the "fixed"
number and the old re-derived one come out numerically equal — the fix is
structural (measuring the real thing), not a value change.

Slice 55 (B4 part 1) extracted Neckline — deliberately narrower than §6's
full spec. `neckline.ts`'s `NecklineParams` is typed with all four shapes
now, but `necklineEdge` implements only `"crew"`, throwing for `"v"`/
`"scoop"`/`"boat"` and for any non-zero `widthEase`/`frontDrop` (a silently-
ignored param would be a footgun once one becomes reachable). The 0.55/0.6
control-point factor moved from `bodice.ts` into `necklineEdge` itself — it
was always part of what "crew" means, not a bodice concern. `bodice.ts` AND
`fitted.ts`'s `draftFittedFront` both call it now, closing a second
duplication B2 had flagged and left alone: fitted's front neckline matched
the tee's only by construction before, not by a shared code path. B4 part 2
(the real fix) is where "v" gets actual curve math, widthEase/frontDrop get
wired to do something, and the guardrails get built and exercised for real —
none of that has a live code path yet, so building it now would be
speculative.

Slice 56 (B4 part 2) closed Phase B: `necklineEdge` implements real "v"
geometry (a straight line to a point — no curve, the true-to-life V),
applies `widthEase`/`frontDrop` for real, and returns real `notes` for
both §6 guardrails (shoulder-seam width, armhole-depth front drop), neither
of which can fire at `NECKLINE_DEFAULT`. Deliberately NOT done, decided
before coding: `NecklineParams` still isn't threaded through `BodiceParams`
or any recipe — nothing outside `neckline.test.ts` can reach a non-default
value yet. A v-neck tee isn't draftable end-to-end; that wiring is its own
slice, once a UI control exists to drive and test it against — building it
speculatively now would be backwards from how every prior Phase B slice
proved itself against something real. Byte-identical at
`NECKLINE_DEFAULT`: `bodice.ts`/`fitted.ts` now pass 2 new required params
(`shoulderHalf`, `armholeDepth`, always already in scope) but every
pre-existing test, including the SHA-256 baseline, passed unmodified — the
guardrails are mathematically silent at default measurements.

**Phase B is now fully closed: B1 (types) → B2 (Bodice) → B3 (Sleeve, fixed
§2.4) → B4 (Neckline, both parts).** Next is Phase C: re-express the skirt
via components (C1), then the real test — a tank (bodice + no sleeve +
different neckline) in hours, not a slice-run (C2). If it isn't, Phase B
isn't actually finished, whatever the checklist says.

`Block` importing `Stitch` from `stitch.ts` — which itself imports `Block`
from `block.ts` — is a real circular reference, resolved with `import type`:
type-only imports are erased at compile time and never enter the runtime
module graph, so the cycle exists only at the type level, which TypeScript
resolves without complaint. Confirmed empirically (`tsc --noEmit` raised no
cycle-related errors), not assumed.

The migration's safety net is a FROZEN golden master
(`drafting/garment-check-golden.ts`) — real `garmentReport` output for tee/
fitted/skirt across several measurement points, captured and verified
correct BEFORE any production code changed, then used as the comparison
target throughout. This matters specifically because Slice 49's own
equivalence tests compared declared stitches against `recipe.checks` — a
comparison that would have become self-referential (or simply wrong) the
moment `recipe.checks` was narrowed to panel-only, exactly the "a test that
mirrors the output proves nothing" trap this project's testing discipline
exists to catch. Recorded truth from before the change, not the thing being
changed, is what makes the proof real.

## The one big idea

Everything runs off **one object: `measurements`** (your body numbers, in cm).
Change a number and the whole picture is rebuilt from scratch — there's no hidden
state to fall out of sync, because every layer is just a *function* of those
numbers:

The UI is the only part that isn't a pure function: it catches your typing and
presses "rebuild." (The one deliberate exception is the freeform **Edit** view —
see the `edit/` layer below — which holds a hand-edited snapshot that is a manual
override, explicitly outside the parametric flow.)

## The layers

**geometry — the alphabet.**
A `Point` is `{x, y}` in centimetres (real cm, so it maps to real cloth).
`distance` is just Pythagoras. A curve is a *Bézier*: it runs start → end, and its
two control points are **magnets** that bend the line toward them without ever
touching it. `cubicLength` measures a curve by walking it in tiny steps and adding
them up — quietly the most important tool in the whole app.

**drafting — measurements become a pattern.**
A `Piece` is a closed outline of named `Edge`s (each one a straight line or a
curve). Drafting drops a few construction points (neck, shoulder, underarm, hem)
and connects them. Edges carry *names* ("armhole", "side") so other layers can ask
a piece "how long is your armhole?" The clever bit: the sleeve cap's height is
**solved** — a quick guess-and-check loop finds the height that makes the cap the
same length as the armhole.

*This is also exactly what makes Slice 48's component work additive rather
than a rewrite: every edge is already named, which is the one precondition a
formal `Interface`/`Stitch` layer needs. Today a seam relationship (front
shoulder ↔ back shoulder) exists only as a hand-written assertion inside the
checker — construction knowledge encoded in its own verification, backwards.
`COMPONENT-ARCHITECTURE.md` covers why and how that becomes declared data.* The garment-specific recipe also lives here: the
t-shirt drafting math, its **notch rules** (`tshirt-notches.ts`), its **fabric/ease
guidance** tables (`ease.ts`), its **grade table** (`tshirt-grade.ts`), and its
**POM list** (`tshirt-pom.ts`). Two pure engines also live in drafting: **grading**
(`grading.ts` — re-draft the block over a size run) and **POM measuring** (`pom.ts`
— read a measurement off the live geometry).

**render — pattern becomes a picture.**
Pure translation, no decisions. `pieceToPath` walks a piece's edges into one SVG
string (`M` move, `L` line, `C` curve, `Z` close). Everything is a **string**, not
live page elements — which is why it tests without a browser (you just search the
text). This layer also draws the seam-allowance cutting line, **notches and
grainlines** (`notch.ts`), the graded **nest** (`nest.ts` — overlaid size outlines
as tree rings), the **fabric nest** (`fabric.ts` — the shelf-packed pieces on a
bolt, for the estimator), and the **freeform editor** (`editor.ts` — the piece
outline plus its draggable handle dots). On screen, cm × a scale = pixels.

**export — the pattern leaves the screen.**
Screen drawing is for *looking*; export is for *making*, so it's its own layer with
one shared spine. `flattenPiece` turns each piece into two true-scale point loops —
the **sew line** and the **cut line** — and `layoutPieces` packs them side by side.
Thin format writers ride on top: `exportSvg`, `exportDxf` (CUT/SEW layers), and
`exportPdf` (tiled, print-at-home). Two **real-world writers** (Fable F1) sit
beside them on the same spine: `exportProjectorSvg` (one seamless cm-true
canvas, a toggleable Inkscape-convention layer per graded size, cut-on-fold
pieces unfolded to full width via `unfold.ts`) and `exportA0Pdf` (single-page A0,
whole pieces shelf-packed via `nestPieces`, kept folds marked "PLACE ON FOLD").
Both embed the locked 10 cm calibration square (`calibration.ts`) — the scale
anchor the user verifies before cutting. Their tests parse the files with real
parsers (DOMParser / pdf-lib) and measure geometry out of the parsed result;
`regression.test.ts` pins the pre-F1 writers byte-identical by SHA-256. The **nesting estimator** (`nesting.ts`) is a
sibling helper on this spine, and the **graded marker** (`marker.ts`) feeds it the
whole size run at once (size-labelled) instead of one garment. A width-aware **shelf pack** onto a bolt with a true
(polygon-area, shoelace) utilization read-out. It leaves the cutting-file exports
untouched (rotating pieces there would misplace the SVG notches/grainlines, which
are re-derived from the original piece), and it carries no rotation — under a
grain-constrained bounding box, rotation is geometrically inert.

**guidance — the chef tasting the soup.**
Each check is one fact you could verify with a tape measure: "cap matches armhole,"
"shoulder shouldn't pass the side seam," "armhole not too shallow." The UI also
feeds in a **fabric ease note** here — advice, never an instruction the engine acts
on. Guidance grew up into the **production-readiness checker** (`check.ts` engine +
`tshirt-check.ts` recipe): the same tape-measure facts, rolled into one pass/fail
"can this be made?" verdict (matched seams, cap ease within a band, hem square to
the fold, notches/grain declared, the size run grows monotonically). The engine
primitives are garment-agnostic; which edges pair up and what the thresholds are is
recipe.

**Sewability is not fit (Slice 45).** The checker above verifies geometry — do
seam lengths agree, is the hem square — and never claimed otherwise. Closing
that gap needs a real body, not more geometry: `drafting/fit-compare.ts` reads
every POM off the exact block that gets cut (`sampleSpec`, the same block the
tech-pack sketch draws), and `compareFit` checks a real sewn garment's
measurements against that prediction, per-POM, against each POM's own declared
tolerance. `withinTolerance` is `true`/`false` when a tolerance exists and
`null` when it doesn't — never an invented pass on a number the POM was never
given a tolerance for. There is no in-app field to type the actual numbers back
in yet; the loop closes on paper via the tech-pack's 4th page.

**Body view ↔ controls linking (Slices 29–30).** The body figure is the one place
a measurement becomes visible as a body, so it carries the teaching load. It emits
two parallel maps, both keyed by the measurement FIELD name:
- `data-dim="<field>"` — the dimension line (what the number *is*), Slice 29.
- `data-edge="<field>"` — the outline segments the number *shapes*, Slice 30.

The UI owns no geometry: one `spotlight(field)` in app.ts lifts groups whose field
matches to opacity 1 and drops the rest to 0.15. The silhouette is grouped as
`data-edge="figure"` — deliberately never a field name, so it always falls to the
dimmed state and the UI needs no special case for it. Ownership is
non-overlapping (each segment belongs to exactly one measurement), so a hover has
one unambiguous answer. Because the body SVG is re-rendered on every change, the
spotlight is re-applied after each draw via `activeDim`.

**A figure is a BODY; a garment is drawn ON it (Slice 43).** `renderSkirtBody` draws
two shapes: a `data-part="silhouette"` lower body (waist → hip flare → crotch → two
legs to y=118) and a `data-part="cloth"` skirt draped just outside it. Nothing is
drawn above the waist line — a head or shoulder stub would be decoration carrying no
data, and the tee's stub is a legacy the skirt does not inherit. The legs are
structural rather than measured: they exist so a hem always lands ON a body, and they
outrun the longest hem the length slider allows. Because a hip is shaped by a CURVE,
`data-edge="hip"` is a pair of `<path>` overlays, not `<line>`s — the edge overlay
must follow the outline, never its chord. A silhouette is emitted from a CHAIN of
cubic segments that can be walked in either direction, so the left side is the right
side reversed; emitting both sides forwards produces a path that never visits the far
hip, and every "right width / right height" test still passes on it.

**Three tiers of validation (Slice 31 built tiers 2–3; 32–34 surface them).** The
geometric checks answer one question — *does the pattern sew together?* Real use
showed that's necessary but not sufficient: a chest of 160 cm sews together fine,
so the app declared it production-ready. `guidance/plausibility.ts` adds two tiers,
both **warnings, never clamps** (the app cautions; the user decides):
- **Anthropometric plausibility** (`plausibilityChecks` + `MEASUREMENT_BOUNDS`) —
  is each number sane for a real adult garment?
- **Proportional coherence** (`coherenceChecks` + `RATIO_BOUNDS`: chest↔shoulder,
  chest↔length, bicep↔chest) — are the numbers sane *relative to each other*? This
  catches an internally mismatched set even when each value passes its own bound.
`guide()` folds all three tiers into one note list, and `guidanceMarkup` heads the
panel with a verdict ("⚠ N to review" / "✓ Looks production-ready"). Every note is
stateful (names its current value) and leads with a severity ICON from the exposed
`SEVERITY_ICON` map (⚠ / ℹ / ✓) so severity is never colour-only — Fable's journey UI
reads the same map rather than inventing glyphs.

**Garment-scoped (Slice 41).** Both tiers take `recipe.fields` and only judge a
bound or ratio when every field it needs is in that set — a field the garment
doesn't expose (chest, on a skirt) sits frozen at its default and must never be
flagged. `guide()` and every `app.ts` reader of `measurementsPlausible`/
`implausibleFields` pass `recipe.fields` through; the tee exposes every field these
tiers touch, so its behaviour is unchanged.

**Body vs finished (`drafting/facets.ts`, Slice 34).** A raw number is ambiguous on
its own — "Chest 100" could be the wearer or the shirt. Each field is classified as
a BODY measurement (taken off a person; the garment may add ease) or a FINISHED
dimension (a garment size chosen directly), and where ease applies the finished value
is exposed: chest gains full ease (mirrors the draft's `(chest+ease)/4`), the sleeve
gains half (`bicep + ease*0.5`). Every classification traces to how the draft USES
the number, so it can't drift from the geometry. `measurementFacet` / `MEASURE_ROLE`
/ `roleTag` are the exposed data — the last of the Phase-A contract Fable's F2 renders
(it labels; it never recomputes ease). The honest-
surfacing half (Slice 32) makes green *conditional*: `measurementsPlausible(m)` — no
out-of-range field, no bad ratio — is the single gate the UI reads. While it is
false, the check view's "Ready to cut" banner and the style panel's "you're making a
X ✓" both withhold green, and every out-of-range field gets an amber outline (driven
by `implausibleFields`, the same list `plausibilityChecks` now builds on). So a set
that sews together (`report.ok` true) but is an impossible body can never *read*
validated.

WHERE THE BOUNDS COME FROM (a plan correction worth recording). The roadmap assumed
bounds could be read off "the size chart grading already uses". There is no such
chart: grading is RELATIVE — per-step deltas (`TSHIRT_GRADE`) around the user's own
base, so a chest of 160 just shifts the whole run up, it never falls "off" anything.
The only absolute human-scale number in the engine is `STANDARD_M`. So the bounds
are DECLARED in `plausibility.ts`, seeded from published adult apparel ranges and
centred on `STANDARD_M` (each ~50% of its range), deliberately loose — they catch
the absurd, not the merely unusual. The table stays SHARED across garments, but since
Slice 41 it is READ through `recipe.fields`, so each garment is only ever judged on
the measurements it actually exposes — a skirt is never told its chest is wrong.
Adding `hipDepth` in Slice 42 exercised exactly that: it sits in the same table, and
the tee is structurally blind to it.

**The raw measurement set** is `chest, shoulderWidth, bicep, length, armholeDepth,
sleeveLength, waist, hip, hipDepth, ease`. Adding one means touching six registries
in lockstep — the `Measurements` struct + `STANDARD_M`, `MEASUREMENT_BOUNDS`,
`MEASURE_ROLE` (facets), `FIELDS` (controls), `persist`'s BOUNDS + read, and the
`fields` list of every recipe that wants it. A field added after v1 is read
LENIENTLY in `persist` (defaulted from `STANDARD_M`, never required) so older saves
keep loading — `waist`/`hip` (s37) and `hipDepth` (s42) all work this way.

**No drafting constant that a body actually varies may stay a constant.** `hipDepth`
was `HIP_DROP = 20`, duplicated in the draft and the figure and driven by nothing;
Slice 42 made it a real field. When such a constant becomes editable it can open
failure modes that were previously unreachable, and the fix is a guidance note, not
a clamp — `skirtGuidance` warns when `length <= hipDepth` would fold the panel over
itself.

**style — declare a target, see the gap (prescriptive).**
A style is a **box of ranges** per measurement. You **pick a target fit** and the
panel reports the signed distance to it on every axis (e.g. "Ease +9 cm", "Length
−13 cm"), and confirms once you're inside every range. Selecting a target **writes
no measurement** — you close each gap yourself with the sliders.

**edit — freeform, on purpose outside the parametric flow.**
A pure engine for moving points on *any* piece. `pieceHandles` exposes a piece's
draggable **handles** — a **vertex** at each corner, plus two **control** magnets
per curve edge. `moveHandle(piece, handle, to)` returns a NEW piece with that
handle dragged, moving both edges that share a vertex so the outline stays closed.
`nearestHandle` is hit-testing; `editorViewBox` + `viewboxPointToCm` map the pointer
into cm. It's garment-agnostic and knows nothing about t-shirts. `moveHandle` is the
reusable primitive dart manipulation will later rotate around an apex.

**ui — the only impure layer.**
`mountApp` holds the `measurements`, builds the page once, then wires each input:
on change it makes a **new** measurements object and calls `draw()`, which rebuilds
canvas + guidance + style. A **View** toggle swaps the main canvas between
**Pattern**, the graded **Size run** (nest), the **Spec** sheet, the **Nesting**
estimate, the production-readiness **Check**, and the freeform **Edit** view. The
export buttons live here too. **Save/Load** (`persist.ts`) serialise measurements +
fabric to `localStorage` as versioned, validated JSON. The **Edit** view snapshots
the front into `editedFront`; three thin mouse handlers (down/move/up) turn a drag
into `moveHandle` calls, a **Reset** button re-drafts from measurements, and the
snapshot never feeds back into `measurements` — freeform is a manual override, so
the parametric core stays consistent everywhere else.

## Why it stays clean

- **Pure functions = cheap tests.** Most layers are "inputs → outputs," so a test
  is one line: feed known numbers, check the answer. That's why 100% coverage came
  easily and why the lower layers need no browser.
- **Strict TypeScript = free enforcement.** Unused code is a *compile error*, and
  the build fails if coverage ever drops below 95%.

## Where things live

  geometry/   points, distance, Bézier + curve length; rotation about a pivot
  drafting/   measurements -> pieces; t-shirt recipe; notch rules; fabric/ease
              guidance; grading engine + grade table; POM measuring + POM list;
              dart engine (dart.ts) + fitted/darted recipe (fitted.ts);
              the garment registry (recipe.ts) + the shared Block type (block.ts:
              role-keyed piece collection; blockPieces = engine, rolePiece = recipe);
              AllowanceSpec (allowance.ts) — per-edge seam allowance, recipe-owned
  render/     pieces -> SVG string; seam allowance; notches + grainlines; graded
              nest; fabric nest; freeform editor; garment view; body view; theme
              (body view = measurements -> annotated figure, engine-independent;
              it emits TWO tagged maps the UI drives — `data-dim` per dimension
              line, `data-edge` per outline segment a measurement shapes)
  export/     pieces -> true-scale cutting files (SVG, DXF, tiled PDF); shared
              layout spine; nesting estimator (shelf pack + utilization);
              tech-pack document (techpack.ts — 3-page sketch + POM table + BOM;
              callout leaders driven by an optional Pom.anchor on the front);
              real-world files (projector.ts — layered seamless SVG; a0.ts —
              one-page A0 PDF; unfold.ts — mirror-on-fold; calibration.ts —
              the 10 cm scale square both embed)
  guidance/   tape-measure checks; production-readiness checker, recipe-driven
              (check.ts primitives + garment-check.ts)
  style/      style table; target-fit gap (prescriptive)
  edit/       freeform edit engine: handles, moveHandle, hit-test, viewbox/pointer
  ui/         the impure shell; sliders, fabric + style selectors, a Tee/Fitted
              garment toggle, the view toggle
              (Pattern/Size run/Spec/Nesting/Check/Edit), freeform drag handlers,
              save/load persistence; the guided journey (journey.ts — pure step/
              disclosure/checklist maps + markup; app.ts applies them: a coached
              Start→Measure→Fit→Refine→Output path that progressively reveals
              the views, persists to localStorage, and celebrates an export
              honestly — no green while measurements are implausible)

## A change, start to finish

You type Length = 80 → `applyChange` makes a new measurements object → `draw()`
re-drafts the pieces → the canvas redraws longer, guidance re-checks, the style
panel re-reads the gap, and — if you're in Size run / Spec / Nesting / Check view —
that view recomputes around the new numbers. One input, one rebuild, everything
stays consistent. (The Edit view is the deliberate exception: its snapshot is a
manual override and only a Reset re-syncs it to the measurements.)

## Engine vs. recipe (how new garments get added)

Two kinds of code live here. The **engine** doesn't care what garment it is —
geometry, the Piece/Edge model, the renderer, seam allowance, the notch engine
(`notch.ts`), the grading loop (`grading.ts`), the POM query helpers (`pom.ts`),
the nest renderers (`nest.ts`, `fabric.ts`), export + the nesting estimator, the
checker primitives (`check.ts`), the recipe-driven report (`garment-check.ts`), the
freeform edit engine (`edit/`), and the dart engine (`dart.ts`). The
**recipe** is the garment-specific part — the drafting math, the guidance rules,
the style table, the notch rules (`tshirt-notches.ts`), the fabric/ease guidance
(`ease.ts`), the grade increments (`tshirt-grade.ts`), the POM list
(`tshirt-pom.ts`), the fitted/darted front (`fitted.ts` + `fitted-tables.ts`), and
the per-garment check spec. All of it is bundled into one `GarmentRecipe`
(`recipe.ts`), which is the only thing the engine is handed.

Adding a new garment in the SAME family (a top) = writing a new recipe. A
structurally different garment (a bottom) does NOT yet plug in — be honest about
where the split is real:

  REAL (garment-agnostic today): grading, POM engine, layout, SVG/DXF/PDF export,
  nesting, renderBlueprint, the edit engine, and Block itself (s25).

  SKIRT PROVES THE SPLIT (s38): a structurally different garment — `drafting/skirt.ts`,
  front/back panels with no sleeve/armhole/neckline — runs through the whole engine
  (draft, recipe-owned checks/guidance, grade, POM, export, nest, readiness) with
  only a recipe added and registered in GARMENTS. The garment toggle, controls (now
  re-rendered per garment's `fields`), and plausibility all follow.

  NO TEE-SHAPED SPOTS REMAIN (as of s40). The two figures were the last: the assembled
  view (`renderGarment`) and the body view (`renderBody`) were tee-hardcoded, so app.ts
  now gates both on `isTop` and draws `renderSkirtGarment` / `renderSkirtBody` (in
  `render/skirt-figure.ts`) for the skirt. The style suggester became recipe-owned in
  s39 (`recipe.styles`: `TEE_STYLES` / `SKIRT_STYLES`). The app is fully garment-general
  — every engine and UI surface reads the recipe rather than assuming a tee.

  Skirt bridge, COMPLETE: Block (s25) → recipe-owned checks (s35) → recipe-owned
  guidance (s36) → per-garment Measurements (s37) → the skirt recipe (s38).

  The post-s40 review queue is CLOSED: guidance garment-scoping (s41), `hipDepth` as
  a real field (s42), and the skirt body croquis rebuilt against it (s43).

## Where the roadmap plugs in (what's left, slices 19–20)

**Already built:** notches & grainlines; fabric/ease guidance; grading (tree-ring
nest); the POM spec sheet; the **nesting estimator** (`export/nesting.ts` +
`render/fabric.ts`); the **production-readiness checker** (`guidance/check.ts` +
`guidance/tshirt-check.ts`); the **freeform editor** (`edit/` engine +
`render/editor.ts` + an Edit view in `ui`); and the **fitted/darted recipe**
(`drafting/dart.ts` engine + `drafting/fitted.ts`), shown via a Tee/Fitted toggle in
the Pattern view.

  *Note on the editor's shape:* an earlier version of this map predicted the editor
  would be "a new impure surface, a sibling of `ui`." It landed lighter than that:
  the geometry is a **pure `edit/` engine**, and the interaction is just another
  **view inside the existing `ui` shell** (three mouse handlers), not a second
  mount. Same capability, less machinery — flagged here so the map matches reality.

- **Tech-pack document (15b).** The measured spec sheet is done; what's left is
  packaging: a flat sketch with callout leaders, a PDF doc writer on the export
  spine, and editable BOM/construction stubs. New writer on the export spine.
- **Fitted/darted recipe (19) — built.** The dart is baked into the outline as two
  named leg edges meeting at the apex, so the apex is a real vertex dart manipulation
  can rotate.
- **Garment generalization (20) — built.** A `GarmentRecipe` (`drafting/recipe.ts`)
  bundles the draft fn, notch table, POM list, grade rule, size run, and check spec.
  Every view reads it; `gradeRun` takes the draft fn; `Pom.measure` takes the shared
  `Block`; `renderBlueprint` and `exportSvg` take notches as a parameter instead of
  importing the tee's table. Adding a garment touches no engine file.
- **Dart manipulation + truing (21) — built.** `transferDart` pivots the wedge about
  the apex onto another straight seam, anchoring the fold so it never moves; every
  seam length survives (the conservation law, tested). `trueSeam` blends the corner
  the old dart leaves behind. Both are pure engine in `drafting/dart.ts`, on top of
  `geometry/rotate.ts`; the Edit view drives them.

- **Per-size export (22) — built.** `drafting/grading.ts` exposes `draftAtSize` —
  one garment drafted at one grade step — which `gradeRun` now uses internally, so
  the size picker, the Spec sheet, and the Size-run nest all agree on what a size is.
  The export buttons draft the picked size and name the file `<garment>-<SIZE>`.

- **Tech-pack document (23) — built, now 4 pages (45).** `export/techpack.ts`
  composes a PDF on the tiled-PDF spine: real-piece flat sketch (base size) +
  graded POM table + recipe BOM/construction + a **Fit Record** page (45) — the
  same POMs at the sample size, blank ruled space for a real sewn measurement.
  Callout leaders are opt-in per POM via `Pom.anchor?`. The first render of the
  Fit Record page had a real bug — a hardcoded-cm header ran text off the page
  edge — caught by rendering the PDF to an image and looking at it, the same
  discipline that caught the Slice 43 silhouette bug. Fixed by sizing every
  column off `page.width`; a regression test now parses the real rule
  coordinates out of the content stream and checks they stay inside the page,
  on both supported page sizes.

- **Body view (24) — built.** `render/body.ts`: measurements → an annotated
  upper-body figure, engine-independent. Its lower-body sibling is
  `render/skirt-figure.ts` (`renderSkirtBody`, rebuilt in s43): a real croquis with
  legs, plus the skirt drawn as separate cloth over it, annotating all four raw
  skirt fields (waist, hip, hipDepth, length).

- **Block generalization (25) — built.** `Block` is a role-keyed piece collection;
  the engine walks `blockPieces`, only a recipe names a role via `rolePiece`.

- **Seam allowance (26) — built, two bugs fixed.** Per-edge `AllowanceSpec` on the
  recipe; the corner offset is now exact (2×2 solve, was 0.707 cm at a right angle)
  and fold edges take zero (was +4 cm of chest). The two hardcoded constants are gone.

- **POM tolerances (27) — built.** Each POM carries an optional ±; a Tol column in
  the Spec view and the tech-pack PDF.

- **Graded marker (28) — built.** `gradedMarker` nests the whole size run on one
  bolt (size-labelled), as a Single/Marker toggle on the Nesting view.

- **Slider ↔ body-view linking (29) — built.** Body dimensions are tagged
  `data-dim`; hovering a measurement row spotlights its dimension. Pure UI.

**What was left as of Slice 29, now closed:** a structurally different garment (a
bottom) plugs in as of the skirt bridge (Slices 35–43) — recipe-owned checks,
recipe-owned guidance, per-garment `Measurements`, the skirt recipe itself, and
both views all shipped. See the "Sewability is not fit" and Fit Record notes
above for what replaced "photo→pattern → upcycle planner" as the next honest
gap (ROADMAP.md §1.5 cut photo→pattern from v1 entirely — active research
frontier, not a buildable feature on this timeline).

## Desktop shell (Slices 46–47)

The app was, until this slice, exactly "a locally hosted webpage" — `npm run
dev` and a browser tab. `electron/main.cts` + `electron/preload.cts` change
that without forking any renderer code: a `BrowserWindow` loads the identical
app (dev: the Vite dev server; packaged: the same `dist/` `npm run build`
already produces), and the ONLY new capability is one IPC channel,
`save-file` — the renderer asks main to save, main owns the native dialog and
the actual `fs.writeFile`, `contextIsolation` stays on throughout.
`src/ui/app.ts`'s `download()` checks `window.electronAPI` first and falls
back to the pre-Slice-46 Blob/`<a>` trick when it's absent, so the app is
still, correctly, a plain website when it isn't running inside Electron.

Both source files are `.cts`, not `.ts` — TypeScript always compiles a `.cts`
file to CommonJS regardless of the root `package.json`'s `"type": "module"`,
which is the one thing this layer needed to not fight the rest of the build
over. `electron/tsconfig.json` is a separate, Node-context config; the
`src/`-scoped `tsc --noEmit` gate and the 100%-coverage Vitest suite never see
this directory at all.

**This layer has its own gate, and it is deliberately NOT the Vitest suite.**
`electron/verify-save.cjs` launches the real Electron app via Playwright's
official Electron support, stubs only the native OS save dialog (the one
piece that can't be scripted), clicks a real export button, and confirms a
real file with real content lands on disk — proving the actual IPC round
trip, which a jsdom-based unit test cannot do (jsdom has no real IPC, no real
dialog, no real filesystem). Run via `npm run electron:verify` (needs `npm
run dev` running separately) or `electron:verify-packaged` (against a real
`electron-builder` output); needs a display (`xvfb-run` in CI/containers).

**Product identity, made consistent everywhere (Slice 47).** `app.setName
("InfiniDrip")` runs before `whenReady()` — without it, `app.getName()`
returns `"Electron"` in dev mode (verified: it does not read `package.json`
at all when launched by pointing electron directly at a `.cjs` file rather
than a directory). The actual LIVE bug, though, was `index.html`'s own
`<title>` tag — visible in every browser tab, and in the desktop window
chrome too since Electron syncs its window title to the page's `<title>` by
default. Both `package.json`'s `name` and the electron-builder `appId` also
carried the project's old internal name; `linux.executableName` is now
pinned explicitly rather than left to electron-builder's default (which
derives from `package.json`'s `name`, not `productName` — a real,
platform-specific inconsistency worth not depending on implicitly).

**A real `Menu`, not the Electron default.** `buildMenu()` in `main.cts`
gives File a working Export submenu — the same six kinds as the Output
step's buttons, same labels — while keeping Edit/View/Window at Electron's
already-sensible defaults (undo/redo/cut/copy/paste/select-all all
genuinely worked before this slice too; that was checked empirically, not
assumed, before any code was written to "fix" something that wasn't
broken). A menu click sends one IPC message naming which export was picked;
`app.ts` clicks the real matching button rather than main owning any export
logic, so the menu and the mouse are provably one code path.

**Window-state persistence uses synchronous file I/O on purpose** — the one
deliberate exception to the async pattern the rest of this layer follows.
The state file is a few dozen bytes, written once on the window's `close`
event; an async write there risks the process exiting before it lands
(Electron does not wait for a fire-and-forget promise before quitting),
silently losing the save on every ordinary quit. Sync removes that race
entirely rather than requiring an `event.preventDefault()`/`finally()`
dance to paper over it.

`electron/verify-menu-and-window.cjs` extends the Slice 46 e2e pattern: a
real launch, a real click on the real native menu via Electron's own Menu
API (Playwright cannot click an OS-level menu), a real resize → close →
relaunch → check-bounds round trip on the SAME profile (persistence is the
point), and a real `win.title()` check. Four checks, run against both dev
mode and a real unsigned `electron-builder` output.

Explicitly not here yet: code signing (MVP-PLAN.md §1.4, a separate
procurement track with its own lead time) and auto-update — there is no
real release feed to point it at yet, and code that compiles against
nothing to update FROM is not something this project ships unverified.
