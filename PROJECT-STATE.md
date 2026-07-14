# InfiniDrip — Project State

_Last updated: after Slice 24. Update this after every slice (and commit it WITH the code)._

## What it is
A lightweight, local 2D sewing-pattern designer in TypeScript. Type body
measurements → it drafts a real t-shirt pattern, renders it on a blueprint canvas
with seam allowances, notches, and grainlines, catches mistakes (guidance), lets
you pick a **target fit** and shows the exact gap to reach it, advises on ease from
fabric stretch, shows an assembled garment view with fabric colour, grades the
pattern into a size run (a tree-ring **nest**), auto-measures a **spec sheet**
across sizes, **estimates fabric usage** (a width-aware nesting layout with a
utilization read-out), runs a plain-English **production-readiness check** (one
pass/fail verdict), lets you **freeform-edit** a piece by dragging its points,
exports true-scale SVG + DXF + a tiled print-at-home PDF, and saves/loads your
work. Repo: github.com/kshitijpatne/InfiniDrip

## Stack & rules
TypeScript · SVG · Vite · Vitest (jsdom for UI). Strict TS, 100% coverage held
(build fails <95%). Pure functions everywhere except the thin UI layer. See
ARCHITECTURE.md for the layer map.

## Workflow
Build in numbered slices. Each: Claude verifies in its own env → delivers a
Claude Code prompt (new files full, existing files as surgical patches, verbatim
header) → gate is `npm run coverage` (expected test count + 100%) AND `npm run dev`
(feature visible) → commit + push. **Docs (this file, ARCHITECTURE.md,
SLICES-BRIEF.md) are committed in the same commit as the code they describe.**

## Slices done
1. geometry core (points, distance, Bézier + curve length)
2. drafting engine (measurements → t-shirt block)
3. render layer (pieces → blueprint SVG)
4. live measurement controls UI (58 tests)
5. guidance engine + sleeve-cap-fitted-to-armhole (72)
6. style suggester — current + nearby styles with cm deltas (82)
7. assembled garment view + fabric swatches (89)
8. seam allowance (cutting line) (94)
9. export layer — true-scale SVG + DXF cutting files, with Download buttons (103)
   [bugfix, post-s22: SVG tags were authored as HTML entities (&lt;/&gt;) from this
   slice on, so exported .svg wouldn't open in a browser ("Start tag expected");
   DXF/PDF unaffected. It went undetected because assertions matched the escaped
   output. Now emits real markup, guarded by a DOMParser parse test (no parsererror,
   <svg> root, 6 polygons + 3 labels). 327 → 328 tests.]
10. tiled PDF export — page-split + overlap + registration marks (119)
11. save/load — versioned JSON in localStorage, validated, with status feedback (139)
12. notches & grainlines — derived as rules on live pieces, grade for free (155)
13. ease/fabric guidance + prescriptive style target (171)
14. grading / size runs — re-draft over a size table → tree-ring nest; a Pattern /
    Size run view toggle (187)
15. tech pack (part 1) — auto-measured POM spec sheet across the size run, in a
    Spec view (202)
16. nesting / fabric estimator — width-aware shelf-pack of the cut pieces on a bolt,
    with a fabric-length + true (polygon-area) utilization read-out, in a Nesting
    view (219)
17. production-readiness checker — guidance grown into one pass/fail verdict
    (matched seams, cap ease, square-at-fold hem, notch/grain declared, size run
    grows), in a Check view (239)
18. freeform edit mode — drag a piece's vertices and curve controls to reshape it;
    edits are a manual override, Reset re-drafts from measurements; in an Edit view
    (257)
19. fitted/darted recipe — first non-tee garment: a bust-darted front (dart baked
    into the outline, apex marked), with the tee's back + sleeve reused; a
    Tee/Fitted toggle swaps the Pattern view (268)
20. garment generalization — a `GarmentRecipe` registry drives EVERY view (pattern,
    grade, spec, nest, check, edit, export); the engine no longer names a t-shirt.
    Fixes the Slice 19 side-seam bug; adds the dart-leg check; hides the bolt-width
    box outside the Nesting view (285)
21. dart manipulation + truing — pivot a dart about its apex onto another seam
    (same wedge, same fit, different seam), then blend the corner it leaves behind;
    driven from the Edit view (321)
22. per-size export — a size picker in the export area drafts the chosen graded
    size (via `draftAtSize`) and emits `<garment>-<SIZE>.<ext>`; scopes only the
    exports, every other view keeps its job (327)
24. body view — an annotated upper-body figure (render/body.ts) drawn from the
    measurements; each raw input is a dimension line on the body, girths marked
    "(circ)", straight torso (no waist is measured). New "Body" view toggle.
    Measurement-layer only — touches none of the drafting engine (355)
23b. tech-pack callouts — a `Pom.anchor?` (a point on the front piece) drives
    callout leaders from a left gutter to the anchored POMs on the sketch (tee 5,
    fitted 3); table-only POMs get no leader (348)
23a. tech-pack document (part a) — a 3-page PDF on the export spine: real-piece
    flat sketch (sample size) + graded POM table + recipe BOM/construction stubs;
    a Tech Pack export button. NOT tied to the per-size picker. Callout leaders
    land in 23-b (343)

**Slice 13 note (design changed mid-build):** ease did NOT become an auto-applied
pre-draft transform. Instead: (a) **fabric/ease is guidance only** — the app
suggests an ease value from the fabric's stretch % and shows a plain-English note,
but the user owns the ease slider and dials it in by hand; nothing is written for
them. (b) The **style suggester became prescriptive** — you pick a target fit from
a dropdown and the panel shows the signed gap to it on every axis (e.g. "Ease +9
cm", "Length −13 cm"), confirming when you're there. Selecting a target changes no
measurement. This replaced the old descriptive "here are nearby styles" panel and
removed the redundancy between a separate Fit control and the style list.

**Slice 15 note (tech pack split into two passes):** the *measured heart* shipped
in Slice 15 — a POM spec sheet where each point of measure is a live geometry
query on named edges (`seam` length via `cubicLength`, `spanX`/`spanY` between
named points), run across the graded sizes so the table fills itself and grades
for free. The tech-pack *document* — a flat sketch with callout leaders, a PDF
doc writer on the export spine, and editable BOM/construction stubs — is a
deferred second pass (call it 15b), packaging around this core.

**Slice 16 note (rotation is inert, so it wasn't built):** for a grain-constrained
bounding-box pack, 0°/180°/mirror all yield the identical box and 90° tips the
grain sideways, so "grain-constrained rotation" cannot tighten this nest — real
savings need polygon (no-fit-polygon) nesting, which is out of scope. Nesting was
therefore shipped as an honest width-aware **shelf pack** (a sibling helper), and
the cutting-file exports were left on the existing translation-only `layoutPieces`
(rotating there would misplace SVG notches/grainlines, which are re-derived from
the original piece). Utilization uses true polygon area (shoelace), not the
bounding box, so it doesn't flatter the result.

**Slice 17 note (scoped to what a tee can honestly prove):** five real checks
shipped (seven rows). **Dart legs** and **smooth transitions** were left out (the
tee has no dart; smooth-transition is a fuzzy fit call, not a hard gate), and
right-angle-at-fold was scoped to the **hem** rather than the neckline (the shipped
neckline meets the fold on a vertical tangent by design — a checker slice shouldn't
retroactively flag intended geometry). Those arrive with the fitted/darted recipe.

**Slice 18 note (freeform vs. the parametric core):** freeform editing is the first
thing that stores geometry NOT derived from `measurements`. To protect the "one
source of truth" invariant it's quarantined: the Edit view snapshots the **front**,
edits are a manual override held only in the editor's state, they do **not** feed
back into measurements, and **Reset** re-drafts from the current measurements. The
reusable payload is a pure `moveHandle(piece, handle, to)` primitive — the exact
machinery dart manipulation (Slice 20) will rotate around an apex.

**Slice 19 note (first non-tee garment; dart representation):** the fitted recipe
reuses the tee's back and sleeve untouched and swaps in a darted front — proof that
a new garment is a new *recipe*, not a new app. The bust dart is modelled as two
named leg edges in the outline meeting at the apex (the correct *open* flat pattern
drawing), so it renders for free and the apex is a real vertex `moveHandle` can grab
in Slice 20. Scoped to the Pattern view via a Tee/Fitted toggle; the other views and
the `Pom` `TshirtBlock` type stay tee-shaped until a later slice generalises them.

**Slice 20 note (generalization, and a Slice 19 correction):** shipping the fitted
front exposed a real bug — its side seam was one dart intake (4 cm) SHORTER than the
back's, because the dart's mouth opens on that seam and closing the dart shortens it.
The draft now runs the side seam longer by the intake, so front and back match once
the dart is sewn (verified: 46.00 vs 46.00 cm). The consequence is an untrued,
side-slanted front hem — correct for an open flat pattern. The generalization made
this visible: `GarmentRecipe` lets the checker run on ANY garment, and the first
thing it did on the fitted block was demand the seams match. `render/canvas.ts` and
`export/svg.ts` no longer import the tee's notch table (a layering violation, now
fixed — they take notches as a parameter).

**Slice 21 note (what "truing" actually turned out to mean):** earlier notes said
truing would *level the front hem*. Working the geometry showed that was imprecise.
The dart's mouth sits on the side seam, so pivoting the dart away heals that seam —
but leaves a **kink there of exactly the dart angle** (18.361° on the standard
block). Truing is blending that kink straight, which costs ~4 mm of seam length.
Dart tools live in the **Edit view** (the quarantined override sandbox, per the
roadmap), not in the recipe: a transferred dart changes the piece's orientation
relative to the fold, which would silently invalidate the flat-span POMs in the Spec
sheet. Keeping it in the editor avoids claiming a spec we haven't earned.

## Roadmap (what's left)
Ordering principle: **ride the export spine + pure engine first; defer the heavy
freeform editor until darts need it.** Dependency spine (✓ = done):
notches ✓ → ease ✓ → grading ✓ → tech pack ✓ (spec sheet; doc pass pending) →
nesting ✓ → checker ✓ → editor ✓ → fitted recipe → darts.

- **15b. Tech-pack document** (deferred second pass) — flat sketch with callout
  leaders + a PDF doc writer on the export spine + editable BOM/construction stubs.
  The measured spec sheet (Slice 15) feeds it directly.
- ✓ 16. Nesting / fabric estimator (done — width-aware shelf pack; a helper, not a marker)
- ✓ 17. Production-readiness checker (done — guidance rolled into one pass/fail verdict)
- ✓ 18. Freeform edit mode (done — drag vertices + curve controls; override, not parametric)
- ✓ 19. Fitted/darted recipe (done — bust-darted front; tee back+sleeve reused; Pattern view)
- ✓ 20. Garment generalization (done — recipe registry; every view garment-aware)
- ✓ 21. Dart manipulation + truing (done — pivot about the apex; blend the kink)
- ✓ 22. Per-size export (done — export any graded size's cutting files)

The t-shirt is finished end-to-end, the engine carries a second darted garment,
and you can export any size. Next is the **tech-pack document (Slice 23)** — a flat
sketch + POM table + BOM/construction stubs, built on the per-size export plumbing
this slice added. Then the later features (2D body view → photo→pattern → upcycle).

Later: 2D body view → photo→pattern (Feature A) → upcycle planner (Feature B).

## Honest boundaries
Assembled view is a schematic, not a drape simulation. Photo features estimate
proportions (a photo has no scale) — "get close, then refine." Export files are in
centimetres (documented in code); the DXF is a minimal R12 (entities-only) — opens
clean (0 audit errors in ezdxf), but a picky tool may ask you to confirm "cm" on
import. The PDF is a minimal ASCII PDF-1.4 — opens in any PDF reader; 21 pages on
A4 for standard-M measurements (7 cols × 3 rows), tiles overlap 1 cm for taping.

Per feature (so we don't overclaim):
- **Ease**: guidance, not an auto-transform — the app *suggests* a value from the
  fabric's stretch % and explains it, but the user owns the ease number and dials
  it in manually. A heuristic, not drape physics.
- **Style**: prescriptive — you declare a target fit and the panel shows the gap on
  every axis; it never changes a measurement for you. The user closes the gaps.
- **Notches**: style is non-standardized — we pick one convention and document it;
  DXF notch representation may need a confirm on import (same caveat as our R12 DXF).
- **Save/Load**: persists measurements + fabric to localStorage (versioned JSON,
  bounds-validated); clears/migrates safely on a bad or wrong-version save.
- **Grading**: proportional re-draft around the user's measurements as base size,
  not editable grade-rule node-shifting; quality depends on the grade increments
  (the nest's tree-rings make a bad grade visible at a glance). Per-size **export**
  is built: a size picker drafts the chosen step through `draftAtSize` (the exact
  path the Spec/Nest views use, so all three agree) and emits `<garment>-<SIZE>`
  files. Boundary: it exports ONE size's pieces per download, not a graded *marker*
  (all sizes nested on one bolt) — that's separate marker-making. The size picker is
  export-local; and because both current garments share one size run, it's built at
  mount from the base garment — a future garment with its own sizes would want the
  picker rebuilt on garment switch (noted, not needed yet).
- **Tech pack**: the spec sheet auto-reads finished-garment measurements off the
  drafted geometry (front/back symmetric, so front stands in for the body); it's a
  credible measured spec, not a manufacturability guarantee. Tolerances, BOM, and
  how-to-measure are user-owned scaffolding, coming with the 15b document pass.
- **Nesting**: bounding-box / grain-constrained **shelf pack** only; no concave
  interlock (no no-fit-polygon), no rotation (inert under grain+bbox), plain fabric
  only (no nap/stripe/defect). It's an estimator and a layout helper, not a
  production marker. Don't quote efficiency vs commercial CAD.
- **Checker**: verifies **sewability (geometry)**, not fit — a muslin still decides
  fit. Knows intentional ease ≠ error (per the Slice 5 cap logic). Currently five
  checks; a **dart-leg** check runs on any darted garment (it arrived with the
  fitted block). Smooth-transition remains out (a fuzzy fit call). The checker is
  fully garment-driven: it reads the recipe's check spec, notches, and size run.
- **Fitted / dart**: the first non-tee recipe reuses the tee's back and sleeve and
  swaps in a darted front. The bust dart is baked into the outline as two named leg
  edges meeting at the apex (so it renders truthfully and the apex is a real vertex
  for dart manipulation). Its side seam runs one dart-intake longer than the back's,
  so the two match once the dart is sewn shut — which means the **open front hem
  slants down at the side**. That is a correct *untrued* flat pattern; **truing**
  (levelling the hem after the dart closes) lands with dart manipulation, and until
  then the fitted front declares `hemSquareToFold: false` so the checker doesn't
  flag intended geometry.
- **Garments**: a `GarmentRecipe` (drafting/recipe.ts) carries everything
  garment-specific — draft fn, notch table, POM list, grade rule, size run, and the
  check spec. Every view is driven by it. The engine (grading, POM, render, export,
  checker) no longer imports a t-shirt table. Adding a garment = adding a recipe.
  Both garments share one body grade rule; a garment-specific grade is a later edit.
- **Dart manipulation**: `transferDart` pivots the wedge about the apex onto another
  **straight** seam (curved targets like the neckline/armhole would need Bézier
  splitting — not built). The fold is always the anchor and never moves. The
  conservation law is real and tested: every seam length survives the pivot, the
  apex and wedge angle are unchanged, and the legs stay equal. The mouth *widens*
  the farther the dart sits from the apex — same angle, longer legs. That's correct.
- **Truing**: moving a dart off a seam leaves a corner in it, exactly the size of
  the dart angle. `trueSeam` blends two straight edges into one. Honest cost: a
  straight line is shorter than the bent path, so that seam loses a little length
  (~4 mm on the standard block) and must be re-checked against its partner. Truing
  only handles straight seams, and only the Edit view offers it.
- **Editor**: freeform drag of one piece (the **front**) — a manual override, not a
  parametric change. Edits don't write back to measurements and don't survive a
  Reset (which re-drafts). It ignores the fold constraint on purpose (freeform means
  freeform). It's the interaction gate for darts, not a full pattern CAD yet
  (single piece, no add/delete points, no undo history).
- **Darts**: geometrically faithful but fit still needs a muslin; the basic tee has
  no dart, so 20 is gated on a fitted recipe (19).

## Research context
Roadmap derives from a competitive landscape study (Seamly2D/Valentina,
Tailornova, Fabra, Knitup, Gerber/Lectra/Optitex). Closest technical analog:
Seamly2D. Closest mission analog: Tailornova. Differentiators we're leaning into:
parametric grading (nearly free given the engine), auto POM/tech-pack export,
fabric-aware ease guidance, and the plain-English production-readiness checker
(a positioning nobody else owns). Full per-feature rationale lives in the research
thread.

## Test counts (proof a slice landed)
s4=58, s5=72, s6=82, s7=89, s8=94, s9=103, s10=119, s11=139, s12=155, s13=171,
s14=187, s15=202, s16=219, s17=239, s18=257, s19=268, s20=285, s21=321, s22=327
(+1 post-s22 SVG-export bugfix = 328), s23a=343, s23b=348, s24=355
