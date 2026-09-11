# InfiniDrip — Resume Log (staging)

_Running collection of resume-worthy lines, takeaways, and proof points, captured as
the project develops. **STATUS: STAGING — not for resume use yet.** Pull lines onto a
resume only after the project clears the readiness threshold (bottom of this doc)._

## Rules for this log (do not break)
1. **Every line carries a proof anchor** — a commit hash, test count, file path, a
   number, or a named artifact. No anchor → it doesn't go in.
2. **Every line is marked `[Earned]` or `[Pending]`.** Earned = provable today.
   Pending = we want to say it, but the work isn't done. Never present a Pending line
   as Earned.
3. **No fluff, no LLM filler, no adjective inflation.** This project's whole identity
   is that a test which mirrors its output proves nothing. A resume line with no
   evidence is the same failure. Write like the reviewer will open the commit.
4. **Raw, not polished.** This is a staging log. Final phrasing happens when a line
   is pulled onto the resume, tuned to the target role.

---

## Headline options (the project summary line)
- `[Earned]` **InfiniDrip / patternworks** — a local-first parametric sewing-pattern
  CAD tool in strict TypeScript that drafts production-ready garment patterns from
  body measurements, on a garment-agnostic engine + declarative `GarmentRecipe`
  registry that drives every view (pattern, size run, spec, nest, check, edit,
  export). Guided **Start → Measure → Fit → Refine → Output** UI reaches a valid
  real-world export in ≤ 5 coached steps. 100%-enforced test coverage.
  _Anchor: repo github.com/kshitijpatne/InfiniDrip; Fable merge c88ab9f, 530 tests,
  100% held._
- `[Earned]` **Drafts multiple garment types from one shared engine** — a basic tee
  and a fitted/bust-darted recipe run through the same engine, grader, POM engine,
  checker, nesting, editor, and export spine. Adding a garment (same family) is
  adding a recipe, not touching engine code.
  _Anchor: Slices 19–20, `drafting/recipe.ts`, `drafting/fitted.ts`; Tee/Fitted
  toggle in the Pattern view._

## Engineering rigor & correctness
- `[Earned]` Enforced **100% test coverage** with a hard build gate (fails below
  95%); **530 tests** at the Fable merge, held across a 14-slice run (s22-b → F2)
  that included one pure refactor, three correctness-bug slices, a full UX
  pressure-test pass, and a second-developer epic.
  _Anchor: Fable merge c88ab9f, `npm run coverage`; test-count line in
  PROJECT-STATE.md (s30=396 → s34=445 → F1=493 → F2=530)._
- `[Earned]` **Found and fixed a latent SVG-export bug that survived 13 development
  cycles** because the tests asserted against the generated output instead of
  validating the format. Replaced the self-referential assertions with a real
  DOMParser parse test (jsdom via a `// @vitest-environment jsdom` docblock) that
  gates on: no `parsererror`, `<svg>` root, 6 polygons + 3 labels.
  _Anchor: `src/export/svg.ts`, Slice 22-b (327 → 328 tests). Bug present since
  Slice 9._
  _Interview-ready framing: "self-referential tests hid a real bug; I replaced them
  with format-level parse checks."_
- `[Earned]` **Applied that lesson to seam allowance and found two more real bugs**
  in the export pipeline that had shipped since the export layer existed. Replacing
  "outline got bigger" assertions with perpendicular-distance measurement from the
  cutting line back to each sewing edge exposed both: (1) the corner offset slid
  along the bisector by `d`, so a 1 cm allowance came out **0.707 cm** at a right
  angle; fixed with an exact 2×2 solve (`w·nIn = dIn`, `w·nOut = dOut`), which also
  makes unequal per-edge allowances fall out for free. (2) Nothing zeroed a fold
  edge, so every exported tee's cutting line ran 1 cm past centre-front — **+4 cm
  of chest on every export since Slice 9**. Fold edges now take zero allowance.
  _Anchor: Slice 26 (360 → 368 tests), `drafting/allowance.ts`, `render/canvas.ts`.
  Same lesson as the SVG bug, in a new domain._
- `[Earned]` **Applied that lesson a third time on the new real-world exports.** F1
  is validated by DOMParser (measures the unfolded projector geometry out of the
  parsed DOM: unfolded front sew width == `(chest+ease)/2`, exact) and by pdf-lib
  (structural parse of the A0 file; the calibration square measured at exactly
  10 cm in points from the decoded content stream). Same "test the format, not the
  output" discipline, on a new writer, day one.
  _Anchor: F1 (ff9ca01), `src/export/projector.test.ts`, `src/export/a0.test.ts`;
  445 → 493 tests._
- `[Earned]` **Byte-identity regression gate went systemic.** The Slice-25 one-off
  ("18 outputs hashed byte-identical to prove a refactor") got promoted into a
  permanent guardrail: `regression.test.ts` pins existing SVG / DXF / PDF /
  tech-pack outputs by **SHA-256 baseline against main@4f7e796**, catching any
  silent drift on unrelated commits.
  _Anchor: F1, `src/export/regression.test.ts` (8 of the 48 new tests are this
  gate). Baseline pinned at commit 4f7e796._
- `[Earned]` **Classifications verified against real geometry, not assumption.**
  The body-vs-finished measurement facets classify each raw field by how the
  drafting code *uses* the number (chest gains full ease, mirroring the draft's
  `(chest+ease)/4`; the sleeve gains half). Verified: at every ease, the facet's
  finished-chest value equals `4 × chestWidthHalf` off the actual drafted piece.
  _Anchor: Slice 34 (4f7e796), `src/drafting/facets.ts` + `facets.test.ts`;
  431 → 445 tests._
- `[Earned]` **Proved a pure refactor didn't change behavior by hashing 18 outputs
  byte-identical to the previous commit** (SVG / DXF / PDF / tech-pack / nest /
  blueprint / check / guidance × tee + fitted, plus garment + body views) —
  standing on top of the 100% coverage gate, not instead of it.
  _Anchor: Slice 25 (972bbc7); 355 → 360 tests, 18-output hash match._
- `[Earned]` Strict TypeScript throughout; **pure functions everywhere except a thin
  UI layer**, making the core engine deterministic and fully unit-testable. Refactor
  proof: `tsc` caught a site a grep missed (`render/nest.ts` indexed the block
  dynamically off a hardcoded `PIECE_TYPES` — never appeared in a `.front` search).
  _Anchor: ARCHITECTURE.md; Slice 25 refactor notes._

## Architecture & design judgment
- `[Earned]` **Engine / recipe separation, executed under load.** A `GarmentRecipe`
  bundles the draft fn, notch table, POM list, grade rule, size run, check spec,
  seam-allowance spec, tech-pack stubs; the engine (grading, POM, render, export,
  checker, editor, dart engine) is handed one and never names a garment. Extent is
  logged honestly: real for grading / POM / layout / SVG-DXF-PDF export / nesting /
  blueprint render / editor / `Block`; still tee-shaped for `Measurements` (no
  waist/hip), `garment-check.ts` seam pairs, `guidance.ts` armhole-match, the style
  table, and the garment + body views.
  _Anchor: `drafting/recipe.ts`, Slice 20; extent inventory in ARCHITECTURE.md and
  SLICES-BRIEF.md._
- `[Earned]` **`Block` is a role-keyed piece collection, not a fixed struct.**
  `blockPieces(b)` is the engine walk; `rolePiece(b, role)` is the recipe ask
  (throws if absent — chosen over `undefined` because `noUncheckedIndexedAccess` is
  off). Role ≠ piece name: the fitted garment's "front" ROLE holds a piece NAMED
  "fitted front". A name-keyed lookup would have silently broken the fitted garment.
  _Anchor: Slice 25, `drafting/block.ts`._
- `[Earned]` **Engine/recipe split proven across a structurally different
  garment family, not just a variant within one.** A skirt — narrower at the
  waist than the hip, no sleeves, no neckline — runs through the identical
  engine: draft, grading, POM, checker, nesting, editor, export, style
  suggester, and both views (assembled + annotated body), with only a recipe
  added and registered. This closes the extent inventory the Slice 20 bullet
  below logged as still tee-shaped (`Measurements`, the checker's seam pairs,
  guidance's armhole check, the style table, the garment + body views) — every
  one of those six spots is now garment-general, closed slice by slice rather
  than declared done in one pass: guidance (41), the last hard-coded constant
  (`hipDepth`, 42), and the body-view figure itself (43, which also caught and
  fixed three real bugs by reading the emitted SVG rather than trusting a
  passing test).
  _Anchor: Slices 38–43, commit `e6fd79d`; `drafting/skirt.ts`,
  `render/skirt-figure.ts`; test count 561 → 611 across the run._
- `[Earned]` **Single-source-of-truth grading** — `gradeRun` routes through the
  same `draftAtSize` function as base drafting, so the size picker, the Spec sheet,
  and the Size-run nest cannot drift; grading is not a parallel code path.
  _Anchor: Slice 22, `drafting/grading.ts`._
- `[Earned]` **Per-edge, recipe-owned seam allowance.** `AllowanceSpec { default,
  byEdge }` on each garment recipe replaced two hardcoded constants (`ALLOWANCE` in
  app.ts, `SEAM_ALLOWANCE` in canvas.ts). Tee spec: hem 2, neckline 0.6, folds 0,
  else 1.
  _Anchor: Slice 26, `drafting/allowance.ts`._
- `[Earned]` **Quarantined freeform edit layer** — manual edits live in an override
  layer that never writes back into measurements, protecting measurement-derived
  points-of-measure from corruption. Reset re-drafts from measurements.
  _Anchor: `edit/` layer; Slice 18._
- `[Earned]` **Dart engine with a tested conservation law.** `transferDart` pivots
  the wedge about the apex onto another straight seam, anchoring the fold so it
  never moves; every seam length survives the pivot, apex + wedge angle unchanged,
  legs stay equal — all tested. `trueSeam` blends the corner the pivoted dart
  leaves behind, at an honest ~4 mm seam-length cost that gets re-checked.
  _Anchor: Slice 21, `drafting/dart.ts` on top of `geometry/rotate.ts`._
- `[Earned]` **Two-tier guidance: geometric self-consistency + anthropometric
  plausibility, both pure, both warn-never-clamp.** `guidance/plausibility.ts`
  adds MEASUREMENT_BOUNDS (per-field absolutes) and RATIO_BOUNDS (chest↔shoulder,
  chest↔length, bicep↔chest — catches an internally mismatched set even when each
  value passes its own bound). Bounds are declared constants seeded from published
  adult ranges centred on `STANDARD_M`, NOT read off the grading size chart —
  because grading is delta-based around the user's base, so no absolute chart
  exists (a plan correction that shipped honestly instead of hiding a made-up
  source).
  _Anchor: Slice 31 (e9b69d9), `src/guidance/plausibility.ts`; 396 → 412 tests._
- `[Earned]` **One gate the UI reads.** `measurementsPlausible` is the single pure
  predicate the check banner, style panel, and F2 export celebration all consult
  before showing a green signal. `implausibleFields` is built on
  `plausibilityChecks` — one source of truth, not parallel state. Chest 160 still
  sews together (`report.ok` true) but the banner reads "⚠ Sews together, but
  check the flagged measurements" — the falsely-validated screenshot is dead.
  _Anchor: Slice 32 (caeea47), `src/guidance/plausibility.ts`, `src/ui/app.ts`,
  `src/ui/view.ts`; 412 → 429 tests._
- `[Earned]` **Severity as a data primitive, not baked-into-markup.** Slice 33
  exposed `SEVERITY_ICON = {ok:"✓", info:"ℹ", warn:"⚠"}` as a single glyph datum
  the panel reads and downstream UI reuses — colour-blind safe by construction
  (severity is an icon, not just a colour). Every guidance message is stateful
  (names the current value) and ends in one plain verdict.
  _Anchor: Slice 33 (f894fa3), `src/guidance/guidance.ts`; 429 → 431 tests._
- `[Earned]` **UI-driven linking via non-overlapping tagged maps.** The body figure
  emits two parallel maps keyed by measurement field: `data-dim` (the dimension
  line) and `data-edge` (the outline segments the number shapes). One
  `spotlight(field)` helper in `app.ts` replaced two duplicated highlight blocks;
  the silhouette is tagged `data-edge="figure"` — deliberately never a field name —
  so it always falls to the dimmed state and needs no UI special case.
  _Anchor: Slices 29–30, `render/body.ts`, `ui/app.ts`; 381 → 396 tests._

## Product & scope judgment
- `[Earned]` **T-shirt is complete end-to-end** — draft → live render → guidance
  (geometric + plausibility) → target-fit style → assembled view → seam allowance
  → notches + grainlines → save/load → parametric grading (tree-ring nest) →
  auto-measured POM spec sheet → fabric-nesting estimator + graded marker →
  production-readiness checker → freeform edit → fitted/darted second recipe →
  dart manipulation → **tech-pack document** → per-size export → body view +
  slider linking → **real-world exports** (projector SVG + A0 PDF with locked
  calibration square) → **guided journey UI** to first valid export.
  _Anchor: Slices 1–34 + F1 + F2; PROJECT-STATE.md "What it is" section._
- `[Earned]` **Auto-measured POM spec sheet.** Each point of measure is a live
  geometry query on named edges (`seam` length via `cubicLength`, `spanX` / `spanY`
  between named points), run across the graded sizes so the table fills itself —
  grading a POM is free.
  _Anchor: Slice 15, `drafting/pom.ts`._
- `[Earned]` **POM tolerances as a property of the POM, not the size.** Same ±1.3
  at XS and XL — one "Tol" column, not per-cell values. Rendered in the Spec view
  and the tech-pack PDF; `pdfString` maps `±` → `+/-` to stay ASCII-clean.
  _Anchor: Slice 27._
- `[Earned]` **Nesting estimator** — width-aware shelf pack on a bolt with a true
  (polygon-area, shoelace) utilization read-out, not a bounding-box flatter. Under
  a grain-constrained bbox, rotation is inert (0°/180°/mirror give identical boxes;
  90° tips the grain), so rotation wasn't built — a shipping decision documented
  rather than hidden.
  _Anchor: Slice 16, `export/nesting.ts`, `render/fabric.ts`._
- `[Earned]` **Graded marker** — the whole size run nested on one bolt via the same
  `nestPieces` estimator fed a bigger pile; `markerPieces` size-labels each piece
  so 15 shapes aren't all "FRONT". Tee marker: 15 pieces / 285 cm / 58% used, vs
  the single 3 pieces / 76 cm / 44% — the run packs tighter (more pieces fill
  shelf gaps), which is exactly why factories cut markers. Estimator, not a
  production marker.
  _Anchor: Slice 28, `export/marker.ts`._
- `[Earned]` **Three-page tech-pack document** — real-piece flat sketch (base size),
  graded POM table, recipe BOM + construction stubs; rides the same PDF spine as
  the tiled export (`assemblePdf` / `pt` shared out of `pdf.ts`, tiled writer
  untouched). Callout leaders are opt-in per POM via `Pom.anchor?: (block) => Point`
  (tee: 5 anchors; fitted: 3). BOM/construction became **edit-as-DATA** on the
  recipe, not a live in-app editor — narrowing the old roadmap word "editable" was
  flagged and confirmed, not done silently.
  _Anchor: Slices 23a/23b, `export/techpack.ts`._
- `[Earned]` **Real-world exports for actual cutting** — two writers on the
  existing `flatten → layout → writer` spine: (1) **projector SVG**
  (`export/projector.ts`) — one seamless cm-true canvas (never tiled), every
  graded size on its own toggleable Inkscape-convention layer
  (`id="size-<LABEL>"`), tree-ring-anchored per piece slot, cut-on-fold pieces
  **unfolded to full width** via `export/unfold.ts` (mirror about x=0); (2) **A0
  copyshop PDF** (`export/a0.ts`) — one-page portrait A0, whole pieces
  shelf-packed via the existing `nestPieces` (reused, not duplicated), kept folds
  marked "PLACE ON FOLD". Both embed the **LOCKED 10 cm × 10 cm calibration
  square** (`export/calibration.ts`). Boundary: geometry is NEVER scaled to fit —
  an extreme size can honestly outgrow even A0.
  _Anchor: F1 (ff9ca01), `src/export/projector.ts` / `a0.ts` / `unfold.ts` /
  `calibration.ts`; 445 → 493 tests._
- `[Earned]` **Per-size export** — a size picker in the export area drafts the
  chosen graded size through `draftAtSize` (the exact path Spec / Nest use, so all
  three agree) and emits `<garment>-<SIZE>.<ext>`. Scopes only the exports; every
  other view keeps its job.
  _Anchor: Slice 22._
- `[Earned]` **Guided journey UI: five coached steps to a valid export.** The
  Start → Measure → Fit → Refine → Output wireflow ships as a **pure**
  `ui/journey.ts` (step map, per-step disclosure map, honest progress checklist,
  welcome / celebration markup, versioned localStorage persistence
  `patternworks_journey_v1`) + thin app.ts glue. Progressive disclosure: Start
  front-loads nothing; Measure reveals controls + Pattern/Body (landing on the
  body view, Slice-30 hover intact); Fit adds fabric + style target; Refine
  unlocks Check/Edit; Output reveals Size run/Spec/Nesting + every export.
  Onboarding: welcome card, per-step coach lines, resumable mid-tour, graduates
  to "done" with everything unlocked. Acceptance: **first-time user reaches a
  valid export in ≤ 5 coached steps** — tested and verified live in `npm run dev`.
  _Anchor: F2 (97cd687), `src/ui/journey.ts` + `journey.test.ts`; 493 → 530 tests._
- `[Earned]` **Demo artifact: the coached journey to a real export, captured
  live off the running app — not staged.** A scripted Chromium run against a
  fresh clone's actual `npm run dev` server walks the real DOM: dismisses the
  welcome card, advances Start → Measure → Fit → Refine → Output via the real
  `#journey-next` button, hovers a measurement row to trigger the live Slice
  29/30 body-view spotlight, opens the Check view to a live "✓ Ready to cut"
  verdict, clicks the real `#export-projector` button, and captures the actual
  file Chromium downloaded. The calibration claim is verified the way this
  project verifies everything — parsed, not eyeballed: the downloaded file's
  own SVG source reads `<rect ... width="10" height="10">` inside a
  `viewBox="0 0 194.267 101.348"` where 1 unit = 1 cm, confirmed by grep against
  the file on disk, not the on-screen "10 cm" label. 9-frame GIF plus the 10
  source screenshots plus the downloaded `tee-projector.svg` itself all ship
  together, so the claim is checkable without re-running anything.
  _Anchor: Slice 44, commit `e6fd79d` (Slice 43 baseline);
  `infinidrip-journey-demo.gif`, `screenshots/00…09-*.png`,
  `tee-projector.svg`._
- `[Earned]` **Honesty gate held all the way to the celebration.** The plausibility
  work (Slices 31/32) is consumed one layer up: the F2 checklist's production row
  cannot tick while `measurementsPlausible` is false, and the export celebration
  withholds its green ✓ under the same gate. Same predicate the check banner and
  style ✓ use — the "geometry passes but numbers are insane" hole cannot leak
  through anywhere in the UI. Carried through by a **different developer** without
  touching guidance logic.
  _Anchor: F2 commit message; `src/ui/app.ts`, `src/ui/journey.ts`._
- `[Earned]` **Body view as measurement teaching surface** — an annotated
  upper-body figure drawn from the six raw inputs, girths marked "(circ)" because
  the drawn span is a width not a circumference, straight torso sides because no
  waist is measured, a fixed-proportion head for orientation only. Explicitly not
  anatomical; the honesty rules are the feature.
  _Anchor: Slice 24, `render/body.ts`._
- `[Earned]` **Honest scope boundaries** — the assembled-garment view is a
  schematic, explicitly not a drape simulation; nesting is an estimator, not a
  production marker; the checker verifies sewability (geometry), not fit; A0
  export doesn't scale-to-fit; the calibration square is the only truth-check
  users get. Every feature's boundary is documented before it's shipped.
  _Anchor: PROJECT-STATE.md "Honest boundaries" section; SLICES-BRIEF.md._
- `[Earned]` **Advisory-not-autonomous product principle** — the tool surfaces
  guidance (geometric, plausibility, ease from fabric stretch, target-fit style
  gaps) but the user dials in the values; selecting a target style writes no
  measurement, plausibility warnings never clamp. Consistent design filter across
  features, including the Slice 13 mid-build change from "auto-apply ease as a
  pre-draft transform" to "guidance only" and the Slice 31 warn-never-clamp
  guidance families.
  _Anchor: Slice 13 note in PROJECT-STATE.md; Slice 31 in SLICES-BRIEF.md;
  `drafting/ease.ts`, `guidance/plausibility.ts`, `style/`._

## Research & data (marketplace track)
- `[Earned]` **Reverse-engineered an undocumented public JSON API** behind the GOTS
  certified-supplier database; harvested and enriched **1,333** India manufacturing
  records with full per-facility detail.
  _Anchor: MARKETPLACE-GOALS.md, Chunk 1; `india-tee-cmt-gots.csv`._
- `[Earned]` **Built a precision sourcing funnel** — 3,154 India entities → 1,333
  manufacturing → 712 tee-capable → 148 CMT-only → 72 contactable.
  _Anchor: Chunk 1 funnel table._
- `[Earned]` **Sized the true addressable supply and killed a false assumption** —
  established a ~1,800-unit job-work denominator and proved that a registry-built
  vendor directory structurally serves the wrong customer tier (verification and
  tier-fit are inversely correlated).
  _Anchor: MARKETPLACE-GOALS.md, Chunk 2._
- `[Earned]` **Competitive teardown → evidence-driven pivot** — analysed Sewport and
  Maker's Row, found both failed to monetize the vendor side, and reframed the
  revenue thesis from a premise into an open question the research must answer.
  _Anchor: MARKETPLACE-GOALS.md, Chunk 0._

## Process / ways of working
- `[Earned]` **Supervisory AI-assisted development discipline** — verified every
  change against a fresh clone of `origin/main`, shipped verbatim patches with
  explicit test-count gates, and treated an AI agent "fixing failing tests" as a
  defect signal rather than progress.
  _Anchor: slice-delivery methodology; PROJECT-STATE.md, SLICES-BRIEF.md._
- `[Earned]` **Slice-based delivery** — feature work broken into small numbered
  slices, each gated on both `npm run coverage` (exact test count + 100%) and a
  visible-on-screen check before commit. Gate uses `tsc --noEmit` + `npx vitest run
  --coverage` (never `npm run build`, which emits `.js` next to sources and makes
  Vitest double-count).
  _Anchor: SLICES-BRIEF.md workflow section._
- `[Earned]` **Two-model developer split (engine + presentation) executed under
  load and held.** Second-developer (Fable) shipped two epics — F1 real-world
  exports + F2 guided journey UI — onto a codebase already at 445 tests and 100%
  coverage. Merge landed clean: `tsc --noEmit` passed, tests 445 → 530, coverage
  held. **File-ownership map held throughout: no engine, drafting-recipe, or
  guidance-logic file was touched.** Interface freeze on `app.ts` held. Seven
  pre-declared guardrails (design freeze before build, logic before presentation,
  interface freeze, byte-identity regression gate, real-parser + calibration-square
  scale test, branch-only delivery, F1-first budget) applied and honoured.
  _Anchor: Fable merge c88ab9f; commit message file-ownership statement; F1 =
  `src/export/{projector,a0,unfold,calibration,regression}.ts`, F2 =
  `src/ui/journey.ts` + `app.ts` glue._
- `[Earned]` **Refactor / regression gate: byte-identical output hashes.** Started
  as a one-off (Slice 25 hashed 18 outputs to prove a pure refactor). Now a
  systemic gate: `regression.test.ts` (F1) pins existing SVG / DXF / PDF /
  tech-pack outputs by SHA-256 baseline against `main@4f7e796`, catching any
  silent drift across future commits.
  _Anchor: Slice 25 notes + F1 `src/export/regression.test.ts`._

---

## Not yet earned (holding pen — write the line when it's true)
- `[Pending]` **Deployed / hosted** — the README + `npm run dev` gets a stranger
  from clone to a running coached app; a live hosted URL would strengthen this.
- `[Pending]` Any usage claim ("used by N makers…") — needs real users; do not
  write until true.
- `[Pending]` Independent-reviewer validation (GPT / Gemini reviewer role)
  executed — adds a credibility signal that the engine was externally checked.
  Reviewer brief drafted, not run.

## Readiness threshold (pull lines onto the resume only when ALL are true)
- [x] T-shirt is complete end-to-end (through tech pack export + real-world
      exports). _Slice 23a/23b + F1._
- [x] At least one second garment recipe drafts on the shared engine. _Slice 19
      (fitted/darted front) + Slice 20 (GarmentRecipe drives every view)._
- [x] Repo has a README that lets a stranger run it; a live demo or one-command
      run. _README + `npm run dev`; F2 makes the running app a coached
      first-export demo._
- [x] A visible proof-of-work artifact exists (demo GIF / screenshots).
      _Slice 44, commit `e6fd79d`; `infinidrip-journey-demo.gif` — the coached
      Start → Output journey to a real Projector SVG export, calibration
      square verified in the file's own source, not the label._
- [x] Test suite still green at 100% coverage at the tag you'd link. _611 tests
      at Slice 43 (`e6fd79d`), the commit the demo was captured against._

**Status: 5 of 5 boxes checked.** All five readiness-threshold boxes are now
true and anchored. That does not make every `[Earned]` line above resume-ready
as written — rule 4 still applies (raw log, not polished copy) — but the
project has cleared its own bar. Pulling lines onto an actual resume is a
separate, deliberate step: tune to the target role, re-verify the anchor is
still current, and don't drag the whole log over unedited.
