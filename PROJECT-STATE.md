# InfiniDrip — Project State

_Last updated: after Slice 79 (Phase C3 croquis library).
Tank rework
step 4 is complete for automated and rendered verification; physical sewn
validation has not occurred and is intentionally deferred. Update this after
every slice and commit it WITH the code._

**Governing plan:** `docs/planning/MVP-PLAN.md` (operative — the 6-month execution plan) and
`docs/planning/ROADMAP.md` (strategic — full competitor analysis + long-term scope + the cut
list) are the current planning documents, added after Slice 44. This file
remains the engineering status log; it does not restate their content.

**Maintainer decisions confirmed after the Slice 65 handoff:** no physical
garment validation has occurred; the sequence is physical Tank validation →
fix any real-world failures → build polo end-to-end → Phase C3; Tank neckline width
must become user-adjustable; every meaningful garment aspect should be
adjustable, with invalid combinations detected by guidance and paired with
actionable corrections; code signing has not started; every future garment
requires a durable research document equivalent to
`docs/research/garments/TANK-RESEARCH.md`; and
`docs/research/ASSET-RESOURCES.md` supersedes
`apparel_design_resources.md`. See `docs/PROJECT-DECISIONS.md` for the durable
record.

**Polo V1 (2026-09-11):** all geometry decisions are locked: collar-plus-stand,
loose tee body/current sleeve, self-knit lightly stabilized folded placket,
14 cm × 3 cm finished placket, three buttons at 3.5 cm centres, 2 cm finished
stand, 5 cm pointed collar leaf, and no V1 side vents. Slice 69 drafted the
front slit, tee body/sleeve reuse, both folded placket pieces, and the layered
collar/stand with warning-only geometry guardrails. Slices 71–72 made Polo a
full selectable recipe with live persisted design controls and visual/output
routing. Slice 73 now records the final cross-size/export proof; physical sewing
and fit validation remain outstanding.

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
work. The engine is fully garment-general: **tee, darted tee, tank, polo, and
skirt** all run through one `GarmentRecipe`-driven pipeline (draft → grade →
POM → check → nest → edit → export), plus **real-world exports** (projector
SVG / A0 PDF with a verified calibration square) and a **guided 5-step
journey** to a valid export. Repo: github.com/kshitijpatne/InfiniDrip

## Stack & rules
TypeScript · SVG · Vite · Vitest (jsdom for UI). Strict TS, 100% coverage held
(build fails <95%). Pure functions everywhere except the thin UI layer. See
ARCHITECTURE.md for the layer map.

## Workflow
Build in numbered slices, grouped into a feature/epic when no maintainer
decision is needed. Codex owns the sandbox/reality check, implementation,
durable-doc updates, rendered/output inspection, tests, commit, and push; the
maintainer remains the final authority for every major decision. Stop for a
major bug, structural redesign, material ambiguity, or required product review.
Every slice deliberately records model and reasoning level, stays token-efficient
without weakening test quality, runs the full coverage gate (100%), TypeScript,
production build, parsed export checks, and practical visual review. Commit
**PROJECT-STATE.md, ARCHITECTURE.md, and affected durable context in the same
commit as the behavior they describe.** Never claim physical fit or production
readiness until a real sample is cut, sewn, measured, and recorded.

## Slices done
F2. **(Fable) Guided journey UI** — the locked wireflow over the existing views:
    a coached **Start → Measure → Fit → Refine → Output** path (5 steps, ≤ 5 to a
    valid export), driven by a pure `ui/journey.ts` (step map, disclosure map,
    checklist, markup) + thin app.ts glue. **Progressive disclosure**: Start
    front-loads nothing; Measure reveals controls + Pattern/Body (landing on the
    body view, Slice-30 hover intact); Fit adds fabric + the style target;
    Refine unlocks Check/Edit; Output reveals Size run/Spec/Nesting + every
    export. **Onboarding**: first-run welcome card (Start the tour / Skip);
    per-step coach lines; journey persisted as versioned JSON
    (`patternworks_journey_v1`), so a reload resumes mid-tour and graduates to
    "done" (everything unlocked, chips become shortcuts). **Checklist**: "N of 5
    to an exportable design", every undone row naming its next action (no
    dead-ends); the production row obeys the honesty gate — `checksOk` alone
    cannot tick it while `measurementsPlausible` is false. **Light celebration**
    on export: dismissible, and it withholds the green ✓ while any input is
    implausible (same gate as the check banner and style ✓). No badges, points,
    or streaks. All F2 acceptance criteria self-checked; verified live in
    `npm run dev`. (530)
F1. **(Fable) Real-world export system** — two new writers on the existing export
    spine (`flatten → layout → writer`), beside SVG/DXF/PDF. (1) **Projector
    file** (`export/projector.ts`): one seamless cm-true SVG canvas, never tiled;
    every graded size on its own toggleable layer (Inkscape layer convention,
    `id="size-<LABEL>"`), sizes tree-ring-anchored per piece slot; bold
    projector-weight lines/labels/notches; cut-on-fold pieces **unfolded to full
    width** (`export/unfold.ts` mirrors the x=0 fold; single-layer fabric has no
    fold). (2) **A0 copyshop file** (`export/a0.ts`): one-page portrait-A0 PDF
    (landscape optional), whole pieces shelf-packed to the page width via
    `nestPieces`, piece labels + notches + grainlines, kept folds marked
    "PLACE ON FOLD". Both embed the LOCKED **10 cm × 10 cm calibration square**
    labelled "10 cm" (`export/calibration.ts`). Tests follow the SVG-bug lesson:
    projector validated by a REAL DOMParser parse measuring geometry out of the
    DOM (unfolded front sew width == (chest+ease)/2, exact); A0 validated by a
    REAL pdf-lib structural parse (page size in pt, the square measured at
    exactly 10 cm in points from the decoded content stream). Existing
    SVG/DXF/PDF/tech-pack outputs proven **byte-identical** to main\@4f7e796 by
    SHA-256 baseline (`regression.test.ts`). New buttons: Projector (whole-run,
    layered) + A0 (per-size picker). Boundary: geometry is NEVER scaled to fit —
    an extreme size can honestly outgrow even A0. (493)
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
64. Tank reality-check — rendered the Tank through body, assembled, pattern,
    guidance, and export paths and closed the confirmed practical gaps without
    redesigning the garment. Both Tank previews now reuse the exact curved
    `sleevelessArmhole()` geometry used by the draft. `neckWidthEase` is a
    user-adjustable finished-width delta from the derived default, persisted
    leniently with plausibility bounds and actionable neckline guidance. Tank
    tech-pack materials are selected from the active fabric family (woven vs
    knit), while the existing knit construction remains the default fallback.
    Added focused geometry, persistence, guidance, UI, and export tests.
    Gates: 59 files / 801 tests / 100% coverage, TypeScript check, production
    build, and parsed visual/export evidence. Physical sewn validation remains
    outstanding. Next: polo end-to-end, unless physical validation finds a
    Tank failure first.
65. Tank UX clarity — completed Body-view hover ownership for `strapWidth`,
    `neckDrop`, and `neckWidthEase`, including exact curved armhole/neckline
    overlays. Controls now show the derived finished chest/hip result so ease
    is understood as wearing room, while drafting math remains unchanged.
    Renamed the product-facing Fitted garment to Darted tee; recipe id and
    geometry remain stable. Added UI tests. Next: physical Tank validation,
    then polo. Slice 66 resolved strap semantics: `strapWidth` is finished
    span from neckline edge to armhole start; v1 saves migrate old strap-point
    values to this span under save version 2.
67. Tank/pre-polo Body view — Body tab now renders labeled Front and Back
    schematics together. Each panel uses the active recipe's derived neckline,
    exact tank armhole curve, and shared measurement hover metadata; front-only
    `neckDrop` guidance is not shown on the back. Existing nesting utilization
    readout was re-verified and required no new implementation. Physical sewn
    validation remains outstanding.
68. Polo foundation — added `Piece.marks` for internal cut, fold, placement,
    button, and buttonhole construction data, explicitly separate from exterior
    edges and seam allowance. Canvas plus true-scale SVG, DXF, tiled PDF, A0,
    and projector exports now preserve those marks; projector mirrors off-fold
    marks but keeps an on-fold mark singular. Added recipe-owned option schema
    support and version-3 save/load persistence for per-garment numeric options,
    separate from body `Measurements`. No polo garment geometry was drafted.
    Existing tee/darted-tee export regression hashes remain byte-identical.
    Gates: full coverage, TypeScript, production build, parsed export evidence.
    Next: Slice 69 polo front slit and folded placket pieces.
69. Polo shell — drafted loose tee front/back and current set-in sleeve with a
    true centre-front internal 14 cm slit, not a fake centre-front seam. Added
    two separate folded placket pieces: 3 cm finished outer face + 3 cm inner
    facing, 1 cm attachment/turn-under allowances, fixed 3.5/7/10.5 cm button
    or buttonhole centres, fold/attachment/reinforcement marks, and raw slit
    attachment stitch interfaces. `MarkRef` now lets a real internal cut line
    participate in a measured stitch while preserving exterior-edge-only
    notches. Default shell seams pass. Collar/stand are intentionally absent;
    next: Slice 70 collar, stand, option guardrails, and neckline stitches.
70. Polo collar/stand — completed the V1 collar-plus-stand draft with separate
    upper/under pointed collar and outer/inner stand half-pieces, each cut on
    centre-back fold so physical layer quantity is represented directly. Stand
    lower edge matches the actual front+back half-neckline; both collar bases,
    both stands, and collar outer seams are declared/measured stitches. Defaults
    are 2 cm finished stand and 5 cm pointed leaf. Polo options now draft
    verbatim and issue exact warning corrections for V1 ranges, insufficient
    button clearance, hem conflict, and stand/leaf conflict; no silent clamp.
    Physical sewing still must validate collar roll, stand curvature, placket
    flatness, and stabilizer behavior. Next: Slice 71 recipe integration.
71. Polo recipe pipeline — Polo is now selectable and passes draft, grade, POM,
    check, spec, nesting, tech-pack, and cutting-export pipelines through the
    existing generic recipe system. It has nine physical pieces, complete
    notch/grainline declarations, Polo-specific POMs, knit/stabilizer/buttons
    BOM, production construction order, and Polo fit-target labels. Parsed
    SVG/DXF proof includes all pieces plus slit/button/buttonhole marks; Tee and
    Darted tee baselines stay protected. Next: Slice 72 live option UI,
    persistence routing, assembled/Body Polo visual, and output review.
72. Polo live controls and visual/output routing — Polo's finished placket
    length/width, stand height, and collar-leaf depth now render as recipe-owned
    controls and persist in the existing version-3 options map, separate from
    body measurements. Live values route through draft, guidance, check, grade,
    nesting, all per-size cutting files, projector, and tech pack. Body and
    assembled schematic views show selected collar/stand, placket, and three
    buttons on the front only; this is a dimension-honest flat schematic, not
    drape simulation. Invalid typed combinations remain drafted and receive
    actionable warnings. Gates include default and altered-option DOM/render
    proof. Next: Slice 73 cross-size/export final gate and readiness evidence.
73. Polo cross-size/export final gate — graded XS–XL with altered live options,
    full nine-piece marker, stitch/readiness report, true-scale SVG/DXF/PDF,
    layered projector SVG, A0, and four-page tech-pack outputs were parsed with
    real consumers. All digital gates pass and established export baselines are
    unchanged. This is production-readiness evidence for sewability only; no
    physical sewing, fit, collar roll, placket recovery, or wash validation has
    occurred. Next: digital product-contract work, then Phase C3; physical
    sampling remains deferred unless explicitly reopened.
74. Polo digital UX and output audit — Pattern view now shelves the nine pieces
    into readable construction groups instead of one crowded strip. Body and
    assembled views share a neckline-following stand and pointed collar-leaf
    schematic; the old perpendicular rectangular collar was a misleading
    decorative representation. Polo finished-option rows now spotlight their
    corresponding Body-view features. The audit also confirms the Edit view is
    currently a front-only in-memory manual override: it does not flow into the
    assembled preview, checks, grading, or exports, so it is not yet a complete
    final-design editing workflow. All export writers remain digitally tested
    with real parsers/consumers; no physical sampling is planned at this time.
    Gate: 858 TypeScript tests / 100% coverage, typecheck, production build,
    visual browser review, parsed export suite, and unchanged legacy hashes.
    Next: resolve the Edit-view product contract, then Phase C3; physical
    sampling remains deferred until explicitly reopened by the maintainer.
75. Build hygiene fix — the root TypeScript check now uses `noEmit`, preventing
    `npm run build` from writing JavaScript test/module siblings into `src/`.
    Those generated siblings could cause Vite to resolve a missing `.js` module
    after cleanup and leave the dev app blank. A clean build emits only to the
    existing Vite `dist/` output. Physical sampling remains deferred.
    Gate: full test suite, 100% coverage, production build, clean source tree,
    and fresh dev-server DOM load.
76. Polo digital reference cleanup — the Pattern canvas now gives each narrow
    placket/collar component a title lane sized for its label, and construction
    labels are reduced and offset beside compact marks. The Body and assembled
    schematics now draw a neckline-following stand with collar leaves pointing
    down onto the chest, matching the real polo convention shown in the
    reference sketches. This is a digital schematic correction only; physical
    sampling remains deferred.
    Gate: focused render tests, full coverage, typecheck, production build, and
    fresh browser screenshots of Pattern, Body, and assembled views.
77. Polo V2 fidelity backlog committed — `POLO-RESEARCH.md` now records the
    required collar/stand geometry review, back-neck representation, placket
    shaping review, and explicit decisions for the reference's longer-back
    hem/side slit, sleeve rib, and Polo-specific grading. `docs/planning/ROADMAP.md`
    carries this as committed item 2.2a, standby until a future Polo
    refinement/version-upgrade slice is assigned. No implementation changes are
    included; current V1 scope remains unchanged and physical sampling remains
    deferred. Next: resolve the Edit-view product contract, then Phase C3.
78. Edit-view product contract clarified — Edit is explicitly an exploratory,
    front-piece-only preview. Dragging handles or using dart tools does not alter
    measurements, the assembled preview, checks, grading, nesting, persistence,
    or exports; Reset returns to the current parametric draft. This slice makes
    the existing quarantine visible and testable without claiming that a local
    SVG mutation is part of the final design. The underlying design model must
    change in a future, separately scoped slice if Edit is promoted to a
    final-design override: that slice must define persistence, size/grading
    semantics, downstream validation, and export behavior before implementation.
    Physical sampling remains deferred until explicitly reopened. Next: Phase C3
    after the model-backed Edit decision is either accepted or deliberately
    deferred.
79. Phase C3 croquis library — added render-only upper/lower croquis geometry
    with explicit front, side, and back entry points. The library keeps figure
    scaffolding separate from drafting and exports; side figures are available
    as honest schematic envelopes but are not exposed as a new UI tab in this
    slice. Existing Body and assembled outputs remain unchanged. No measurement,
    Piece/Block, grading, export, or Edit-model changes were made. Next: Slice 80
    requires a new scope decision; physical sampling remains deferred.
63. Tank rework, step 3 — real strap/armhole geometry for the tank, AND a
    scope change requested by Kshitij mid-slice that reshaped the whole
    approach: rather than the engine picking a single "correct" strap width
    (the open question left at the end of research), EVERY new dimension
    this slice touches ships as a real, user-adjustable measurement —
    `strapWidth` and `neckDrop` joined `Measurements` itself, with
    plausibility bounds, a UI slider, and save/load support, exactly like
    chest/shoulderWidth/etc. always have. "No measurement of any garment
    should be limited to just one specific width... the guidance engine
    already handles telling the user when values aren't synergetic" — the
    engine's job is to draft what's asked and flag what doesn't fit
    together, never to decide the answer for the person.
    New `drafting/armhole.ts` (`sleevelessArmhole()`), mirroring
    `necklineEdge()`'s shape: a real curve from the strap point to the
    underarm that cuts further in than the sleeved curve (TANK-RESEARCH.md
    Finding 2 — the underarm point itself never moves, only the curve's
    shape does), plus two "warn, never clamp" guardrails (strap narrower
    than the neckline; strap as wide as the full shoulder). `bodice.ts`
    gained an optional `strapWidth` — undefined draws the exact old sleeved
    armhole (byte-identical for tee/fitted), a value swaps in the new curve.
    `tank.ts` rewritten: `tankFrontNeckline`/`tankBackNeckline` are now
    functions of `Measurements` (frontDrop reads the live `m.neckDrop`), and
    `draftTank` passes `m.strapWidth` to both panels. Widening the strap
    surfaced a real, independent bug caught by `stitchChecks` failing
    during verification, not predicted in advance: since `strapWidth` is
    now literally the shared shoulder point for both panels, this is
    actually SIMPLER than Slice 62's `TANK_BACK_NECKLINE` workaround, not
    an addition to it — one shared value, both panels read it, seam matches
    by construction.
    A second pre-existing gap found and partially closed: `necklineEdge()`
    and `sleevelessArmhole()` both compute "warn, never clamp" guidance
    notes, but NOTHING in the codebase was reading them — every caller
    (`bodice.ts`, `fitted.ts`) destructured `notes` and silently dropped it.
    This was harmless while every neckline param was a fixed recipe
    constant nobody could push out of range; it stops being harmless the
    moment `neckDrop`/`strapWidth` are live sliders. Fixed for the tank
    specifically (`tankGuidance` now recomputes and surfaces both
    functions' notes) — flagged, not fixed wholesale, since the same gap
    exists for every OTHER neckline call too and fixing that generally is
    a separate, later decision, not assumed here.
    Render layer: found, and fixed proactively rather than waiting to be
    told a third time, that `render/body.ts`/`render/garment.ts` still drew
    the tank's shoulder corner at the full sleeved `shoulderHalf` — the
    exact "preview doesn't match the real pattern" gap Slice 61 fixed for
    the neckline, just never checked for the strap because the strap didn't
    exist as a concept until this slice. Both views gained an optional
    `strapWidth` (undefined = old sleeved behaviour, byte-identical);
    `body.ts`'s `shoulderWidth`/`armholeDepth` edge-highlight overlays also
    had to move to the real strap point, or they'd float visibly past the
    actual drawn silhouette — the measurement's own DIMENSION line (the
    labelled arrow) is unaffected, only which part of the outline it
    highlights.
    `recipe.ts`'s `frontNeckline`/`backNeckline` changed from static values
    to functions of `Measurements` (a real, necessary type change, not
    optional) — tee/fitted's just ignore the argument.
    Verified: 790/790 tests, 100% coverage, fresh-clone `git apply` + full
    gate + production build, all three views (body/garment/actual cut
    pattern) re-rendered and visually cross-checked at multiple strap
    widths — front and back always match. `regression.test.ts`'s 8/8
    baseline untouched (this never touches `drafting/tshirt.ts` or
    `drafting/fitted.ts`'s output). Gate: 59 files / 790 tests / 100% (25
    new: 8 in the new armhole.test.ts, +8 tank.test.ts, +3 persist.test.ts,
    +3 body.test.ts, +3 garment.test.ts; 0 changed from Slice 62's own
    count elsewhere). File set: 2 new (`armhole.ts`, `armhole.test.ts`), 16
    modified. Next: Tank rework step 4 — final confirmation that everything
    here is backed by reason before calling the Tank rework closed; polo
    stays parked until then.
62. Tank rework, step 2 (the neckline curve itself) — found because Slice 61
    worked exactly as intended. Kshitij flagged, with screenshots, that the
    neckline on the tee, fitted, AND tank — front and back — read as a sharp
    V-plunge, not a crew or scoop. Rendered it myself (not just trusted the
    report) and sampled the actual Bézier numerically to confirm before
    touching anything: the curve spent most of its length hugging the
    centre-fold before flaring out only in the last 20%, on both crew and
    Slice-60's scoop. Root cause, confirmed by checking tangent directions
    at both curve endpoints: `neckline.ts`'s `control1` sat directly above
    centre-front (`point(0, depth * c1)`) — same x as the curve's own start
    point — which gives a VERTICAL tangent at the fold. Every independent
    pattern-drafting source checked (5 of them, cross-referenced) states the
    same rule: a curved neckline must meet centre front/back at a RIGHT
    ANGLE to the fold, or mirroring it on the fold creates exactly the
    spike Kshitij saw — "In the Folds" describes the identical failure mode
    from real drafting, unprompted. Not a Slice 61 regression: this
    construction dates to Slice 55/56, in the actual cut pattern piece too,
    not just the previews — Slice 61 simply rendered it faithfully
    everywhere at once for the first time, which is what made it visible.
    Fix: `control1`/`control2` rebuilt as a true quarter-ellipse (the
    standard 0.5523 cubic-Bézier circle-approximation constant), each
    control point pinned on the axis that makes its tangent perpendicular to
    the line it meets. Second finding, verified by direct construction, not
    assumed: once the tangent rule holds, the curve's shape is FULLY
    determined by its two endpoints — there's no degree of freedom left for
    "rounder control points," so Slice 60's `scoopControlFactors` literally
    cannot express a different shape any more. This matches what the
    drafting sources say a scoop actually is: the same curve as crew, just
    deeper and wider. `scoopControlFactors`/`crewControlFactors` deleted;
    scoop is now crew geometry + `frontDrop`/`widthEase`, and `tank.ts`
    declares `{widthEase: 1.5, frontDrop: 5}` — a starting decision,
    rendered and eyeballed (no universal scoop spec exists per the sources),
    not a sourced exact. Widening the front's neckline surfaced a REAL
    structural bug the moment it was applied, caught by `stitchChecks`
    failing, not assumed away: the shoulder TIP point never moves, so
    widening only the front's neckline shortened its shoulder edge relative
    to the back's, breaking the seam match. Fixed with a new
    `TANK_BACK_NECKLINE` (same `widthEase` as the front, depth unchanged) —
    both shoulder points now move together. `regression.test.ts`'s tee/
    fitted SVG/DXF/PDF/tech-pack baseline DELIBERATELY moved (Kshitij's
    explicit sign-off, requested before building) — the old "byte-identical"
    bytes encoded the spiked curve, so preserving them would have meant
    preserving the bug. Verified: full suite 765/765, 100% coverage, clean
    build, fresh-clone `git apply` dry run before delivery, AND rendered and
    visually re-inspected every view (tee/fitted/tank, body + garment) —
    the actual failure mode here was screenshots the tests couldn't have
    caught, so the tests alone were never going to be the final check. Gate:
    58 files / 765 tests / 100%. File set: 0 new, 7 modified (`neckline.ts`,
    `neckline.test.ts`, `tank.ts`, `tank.test.ts`, `recipe.ts`,
    `neckline-path.test.ts`, `regression.test.ts`). Next: Tank rework step 3
    (the original step 2) — real armhole/strap geometry for the tank,
    researched per the standard below. See the renumbered Active directive.
61. Tank rework, step 1 — fix the render bugs completely, systemically (the
    plan agreed after Slice 60, item 1 of 4). Two confirmed bugs, both fixed
    at the root, not patched per-garment: (1) `render/body.ts`'s `bodyHalf =
    m.chest * 0.22` replaced with `derive(m).chestWidthHalf` — the real
    half-width every recipe actually drafts (27.5 vs the old wrong 22 at
    STANDARD_M). (2) Both `body.ts` and `garment.ts` drew a fixed placeholder
    neckline curve regardless of shape; both now call the real
    `necklineEdge()` through a new shared helper, `render/neckline-path.ts`
    (`necklinePathCommand`) — one function turns a `necklineEdge()` result
    into the mirrored SVG path fragment, used by both callers, so a crew,
    v, or scoop reads correctly on both views for the first time. Required
    one real design decision: `GarmentRecipe` gained optional
    `frontNeckline`/`backNeckline: NecklineParams` so the views know what
    each garment actually drafted — tee/fitted declare `NECKLINE_DEFAULT`
    explicitly (matching their draft, which passes nothing), tank declares
    `TANK_FRONT_NECKLINE`, a constant now exported from `tank.ts` and
    imported (not re-typed) into `recipe.ts`, closing off the exact kind of
    drift that caused the Slice 60 bug. The mandated audit of
    `render/skirt-figure.ts` found the SAME bug class on the skirt side:
    `figureOf()`'s `waistHalf`/`hipHalf` used an independent `waist * 0.20`
    / `hip * 0.22` guess (dropping ease) a few lines away from
    `renderSkirtGarment`'s correct formula in the very same file. Fixed by
    extracting `skirtWidths()` into `skirt.ts` as the one shared source;
    both the panel draft and both figure views now read it. Every new test
    proves the SYNC directly (reads the real `derive()`/`necklineEdge()`/
    `skirtWidths()` output and checks the rendered SVG against it), not just
    that a value updated — including a new `recipe.test.ts` block that
    redrafts each top garment and confirms `recipe.frontNeckline`/
    `backNeckline` reproduce the actual drafted edge, front AND back, for
    tee/fitted/tank. One pre-existing test legitimately updated, not
    reverted: `app.test.ts` asserted the assembled view's neckline matched
    `/Q /` — that was checking for the bug's own signature (the old
    placeholder), so it now checks for the real `/C /` cubic curve instead.
    Nothing here touches `drafting/` output or `export/` — confirmed by
    `regression.test.ts`'s 8/8 SHA-256 baseline passing unmodified, exactly
    as predicted before building. Gate: 58 files / 764 tests / 100%
    (14 new: 3 body.test.ts, 3 garment.test.ts, 2 skirt-figure.test.ts, 3
    recipe.test.ts, 3 in the new neckline-path.test.ts). File set: 2 new
    (`render/neckline-path.ts`, `render/neckline-path.test.ts`), 13 modified
    (`skirt.ts`, `skirt-figure.ts`, `tank.ts`, `recipe.ts`, `render/index.ts`,
    `body.ts`, `garment.ts`, `app.ts`, plus their 5 test files). Verified in
    `npm run dev`: tee/fitted/tank body view now matches the pattern/
    assembled view at the same measurements; tank's neckline visibly reads
    as a scoop, not a crew. Next: step 2 of the Tank rework plan — build the
    tank properly, with real armhole/strap geometry (not reused from the
    sleeved bodice), researched and recorded in `TANK-RESEARCH.md` per the
    standard below, with the styles-achievable-via-parameters-vs-needing-
    princess-seams split proposed and agreed before building.
60. Finish the tank properly — two real gaps flagged by Kshitij after Slice
    59, neither swept under "the tank was cheap": (1) the neckline choice
    was a shortcut, not a decision — v was picked only because it was the
    sole non-crew shape with real curve math, not because it's right for a
    tank (a tank is normally a deep, round scoop); (2) `render/garment.ts`
    (assembled view) and `render/body.ts` (measurement-dimension figure)
    both took only `Measurements`, no recipe — genuinely garment-blind, so
    both drew a tank as a short-sleeve tee (`m.sleeveLength`/`m.bicep`
    still exist on the object even when a garment's `fields` array doesn't
    expose them). `body.ts`'s own file header ("the figure only bends
    where we have a number... honesty is the whole point") made this a
    real violation of its own stated design, not just an aesthetic gap.
    Fixed both. New real curve math in `neckline.ts`: `scoopControlFactors`
    (0.85/0.8 front/back depth factor vs crew's 0.55/0.6, 0.65 vs crew's
    0.45 width factor) — a genuinely new design decision with no prior spec
    to match, unlike crew's byte-identical-inherited numbers; flagged as
    starting values, not claimed exact. `necklineEdge` now accepts "crew",
    "v", AND "scoop" (only "boat" still throws). `tank.ts`'s front switched
    from v to scoop. `renderGarment`/`renderBody` both gained a `hasSleeve`
    param (default `true` — tee/fitted byte-identical, confirmed:
    `regression.test.ts`'s 8/8 baseline and every pre-existing render test
    passed unmodified); `false` drops the sleeve extension, the dashed
    armhole "seam" (nothing sews to a bound edge), and the Sleeve/Bicep
    dimension lines entirely. `app.ts` computes `hasSleeve =
    recipe.fields.includes("sleeveLength")` — same idiom as the existing
    `isTop` check — and threads it through both call sites. Real gap found
    and closed during verification, not assumed away: the first mutation
    test (hardcoding `hasSleeve = true` in `app.ts`) was caught by NOTHING
    — every existing test proved the render FUNCTIONS work correctly in
    isolation, but nothing proved `app.ts` actually wires them right. Added
    a real DOM-level integration test (`app.test.ts`) that clicks the tank
    button and inspects the rendered SVG; re-ran the same mutation and
    confirmed it now fails immediately, before reverting — this is
    literally the bug Kshitij reported, now gated. Also mutation-tested the
    scoop math independently. Gate: 57 files / 750 tests / 100%. File set:
    10 modified (`neckline.ts`, `neckline.test.ts`, `tank.ts`,
    `tank.test.ts`, `render/garment.ts`, `render/garment.test.ts`,
    `render/body.ts`, `render/body.test.ts`, `ui/app.ts`, `ui/app.test.ts`),
    no new files. Next: polo (Slice 61) — the user's pick over a second
    long-sleeve garment, since sleeve length is already adjustable on the
    tee without a separate recipe. Polo needs a genuinely new piece (a
    collar, plus a partial button placket) — real new design surface,
    closer in kind to Waistband (Slice 57) than to the tank.
59. Component architecture Phase C2 — THE REAL TEST (COMPONENT-ARCHITECTURE.md
    §9): "add a genuinely new variant — a tank... it should take hours, not
    a slice-run. If it doesn't, Phase B is not finished." It did: new file
    `tank.ts` (~90 lines) + one real capability added to `bodice.ts` +
    5-line `TANK_STYLES` table + one `GarmentRecipe` object in `recipe.ts`.
    Zero engine-layer files touched — checked before building, not assumed:
    the garment picker, the "is this a top" figure logic, and the style
    panel all already walk `GARMENTS`/`recipe.fields` generically; adding
    `TANK` to the `GARMENTS` array was the only wiring needed outside the
    new/touched recipe files. The one real new capability: `BodiceParams`
    gained an optional `necklineParams?: NecklineParams` (defaults to
    `NECKLINE_DEFAULT`, so tee/fitted's output is provably unaffected —
    every pre-existing test, incl. `regression.test.ts`'s 8/8 baseline,
    passed unmodified). This is the wiring Slice 56 explicitly deferred
    ("nothing outside neckline.test.ts can reach a non-default value yet...
    building that now would be backwards from how every prior slice proved
    itself") — the tank is that real second consumer, finally needing it.
    `draftTank`: `bodice(front, {necklineParams: v-neck})` + `bodice(back)`
    (crew, unchanged) + shoulder/side stitches only, no sleeve, no cap-ease.
    Reused verbatim, not rewritten: `sleevedTopPanelChecks`/`frontHemWidth`
    from `tshirt-checks.ts` (read first to confirm neither is actually
    sleeve-specific despite the file name — they're not). NOT reusable:
    `sleevedTopGuidance` (calls `rolePiece(block,"sleeve")`, would throw) —
    new `tankGuidance` is the same function minus `armholeMatch`.
    `TANK_POMS` = `TSHIRT_POMS`'s first 7 entries (the last 3 are
    sleeve-only). `TANK_NOTCHES` mirrors the tee's own shoulder/side
    pattern, no armhole/cap notches (nothing sews to a tank's armhole — a
    finished, bound edge, not a seam). New `tank.test.ts`: structure
    (2 pieces, no sleeve role, v-neck front is a LINE, crew back is a
    CURVE), stitch correctness, `tankGuidance` never throws and still
    surfaces ease/armhole/shoulder warnings, POM/notch counts, and full
    end-to-end grading + `garmentReport` through the generic engine.
    Verified beyond unit tests: ran the REAL export pipeline
    (`exportSvg`/`exportDxf`/`exportTechPack`/`guide`) on a drafted tank —
    2 pieces, a V-shaped neckline path in the SVG, clean tech pack and DXF,
    real guidance notes. Mutation-tested: swapped the front's neckline
    shape back to crew and confirmed the v-neck test caught it immediately,
    before reverting. Gate: 57 files / 735 tests / 100%. File set: 2 new
    (`tank.ts`, `tank.test.ts`), 5 modified (`bodice.ts`, `recipe.ts`,
    `recipe.test.ts`, `style.ts`, `drafting/index.ts`). **Phase B/C's core
    claim is now empirically proven, not just argued.** Next (C3): a
    croquis library (ROADMAP Priority 1.3) — or, given how cheap the tank
    was, a second genuinely new garment might be worth more evidence before
    moving on; worth discussing before committing to C3's scope.
58. Component architecture Phase C1 (COMPONENT-ARCHITECTURE.md §5, §9) —
    re-express the skirt via components. Small, mechanical: Slice 57
    already did most of this incidentally (the waistband is a real
    `Component`, `draftSkirt` already ran through `assembleComponents`).
    What was left: `panel(m, name)` (the skirt's own real implementation
    since Slice 1) was still hand-wrapped into `ComponentResult` objects
    inline, twice, inside `draftSkirt`, instead of going through a real
    `Component` the way `bodice` does. New `skirtPanel: Component
    <SkirtPanelParams>` closes that — `{position, silhouette}`, mirroring
    `bodice`'s `{position}` pattern exactly, exposing a `waist` interface
    (unused today, same posture as `bodice`'s `armhole` before Sleeve
    existed to consume it). `silhouette: "straight" | "flare"` per §5's
    taxonomy; `"flare"` throws — the block's whole premise (its own file
    header: "waist darts / A-line flare are a later refinement"), typed
    now so the taxonomy doesn't need a breaking change later, same posture
    as Neckline's unimplemented shapes. Scoping note carried from Slice 58
    planning: §5's "two real consumers before extraction" rule is about
    NOT inventing a speculative abstraction — `panel` already existed and
    was already the skirt's real implementation; this slice wraps it in
    the shape everything else in Phase B/C uses, for consistency, not
    because a second consumer needs it yet. Byte-identical: `panel`'s own
    geometry is untouched, so every pre-existing test passed unmodified,
    including `regression.test.ts`'s 8/8 baseline and all of Slice 57's
    skirt tests (front/back piece content unchanged, notches/allowances/
    POMs untouched, since none of those reference `panel` directly).
    New tests in `skirt.test.ts`: the Component contract (role-keyed piece,
    `waist` interface, no internal stitches), the flare throw, and that
    `draftSkirt`'s front/back pieces ARE `skirtPanel`'s output. Verified
    empirically: disabled the silhouette guard and confirmed the throw
    test failed immediately, before reverting. Gate: 56 files / 723 tests
    / 100%. File set: 2 modified (`skirt.ts`, `skirt.test.ts`), no new
    files. Next (C2, the real test of Phase B/C): add a genuinely new
    variant — a tank (bodice + no sleeve + different neckline) — and it
    should take hours, not a slice-run. If it doesn't, Phase B isn't
    actually finished, whatever the checklist said at Slice 57.
57. Component architecture Phase B5 (COMPONENT-ARCHITECTURE.md §5, §9) —
    Waistband, Phase B's first genuinely NEW component (not a refactor: no
    waistband code existed anywhere to extract). §5's taxonomy only
    sketches `depth`/`closure`; the real design was scoped and flagged
    before building. New file `waistband.ts`: a plain strip cut on the fold
    — same convention as the skirt's own front/back panels — sized to
    `(waist+ease)/2` (doubled by the fold = the full finished circumference,
    the same number the existing "Waist (finished)" POM already reports, by
    construction). `closure` (`"button"|"hook"`) is deliberately
    geometry-inert: real waistbands are cut identically regardless of
    hardware — unlike Neckline's `shape`, where an unimplemented value would
    have changed the curve, `closure` genuinely has nothing to implement at
    the drafting layer. Course-corrected during build from the originally
    scoped "closure adds a width overlap": that would have broken the
    seam-length match against front+back's combined waist edges for no real
    benefit, since the overlap isn't part of the sewn seam. `draftSkirt` now
    wires it in for real via `assembleComponents` — skirt has NO
    byte-identity gate (`regression.test.ts` only covers tee/fitted), so
    unlike B2-B4 this slice does NOT preserve prior output; `skirt.test.ts`'s
    piece-count assertion and `stitch.test.ts`'s stitch-count/golden-master
    comparisons were updated to the new correct shape, not preserved.
    `garment-check-golden.ts`'s `SKIRT_GOLDEN_REPORTS` regenerated from a
    REAL run of post-change `garmentReport(SKIRT, m)` — per that file's own
    rule, correct only because it records a new *intentional* truth, not to
    paper over a break. `SKIRT_NOTCHES` gained the front/back/waistband
    join-point notches, derived via `matchedNotch` off the new waistband
    stitch (not hand-typed) — front at t=1 on its own waist edge, back at
    t=0, waistband at t=0.5 on its combined "seam" edge, all three the same
    physical point. `WOVEN_SKIRT_ALLOWANCES` gained `fold: 0` / `seam: 1`
    for the waistband's own edges. New `waistband.test.ts`: the Component
    contract, real geometry (half-circumference formula, edge names, depth
    genuinely applied), the closure-inertness claim proven directly
    (button vs. hook produce `toEqual` identical geometry, not just
    asserted in a comment), and the real `draftSkirt` wiring (role present,
    finished length matches the existing POM by construction, grades in
    order across the size run). Verified beyond unit tests, per project
    discipline (bugs get caught by rendering, not trusting coverage): ran
    the REAL export pipeline end-to-end — `exportSvg`/`exportDxf`/
    `exportTechPack` on a drafted skirt — confirmed 3 pieces, a "WAISTBAND"
    label in the SVG, "Waistband" in the tech pack, clean DXF output.
    Mutation-tested twice: corrupted the half-circumference formula
    (caught immediately — 6 tests across 3 files) and the notch edge
    index, both reverted after confirming failure. Gate: 56 files / 720
    tests / 100%. File set: 2 new (`waistband.ts`, `waistband.test.ts`), 6
    modified (`skirt.ts`, `skirt.test.ts`, `stitch.test.ts`,
    `garment-check-golden.ts`, `recipe.ts`, `drafting/index.ts` barrel
    export). Phase B is fully closed (B1-B5); next is Phase C — re-express
    the skirt via components (C1, arguably already substantially true
    after this slice), then the real test: a tank (bodice + no sleeve +
    different neckline) in hours, not a slice-run (C2). If it isn't,
    Phase B isn't actually finished, whatever the checklist says.
56. Component architecture Phase B4, part 2 of 2 (COMPONENT-ARCHITECTURE.md
    §6, §9) — the real behaviour change, scoped before building (no prior
    agreed design existed for any of this). `necklineEdge` now implements
    "v" for real: a straight line (`kind:"line"`) from cNeck to hps, no
    curve — the true-to-life V, two straight seams meeting at a point.
    `widthEase` genuinely widens `neckWidthHalf` (shared, so front/back stay
    shoulder-seam-compatible); `frontDrop` genuinely deepens the front only
    (back's depth is untouched by it, proven directly). Both §6 guardrails
    are real: `necklineEdge` takes `shoulderHalf`/`armholeDepth` and returns
    `notes: readonly Note[]` — warns (never blocks) when the effective
    width reaches the shoulder seam or the front depth reaches the armhole,
    both boundary-tested at the exact trigger value, both independently and
    together. "scoop"/"boat" still throw — no curve math exists for them
    anywhere, and §6 always scoped them to the shirt block, not invented
    here. Scoping decision made explicit before coding: `NecklineParams` is
    STILL not threaded through `BodiceParams` or any recipe — a v-neck tee
    isn't draftable end-to-end yet, only the capability is real and proven
    by direct tests. Wiring it to something a person can actually reach is
    its own later slice, once a UI control exists to drive it; building
    that now, nothing able to test it against, would be backwards from how
    every prior Phase B slice proved itself. Byte-identical at
    NECKLINE_DEFAULT: `bodice.ts`/`fitted.ts`'s calls now pass the 2 new
    required params (`shoulderHalf`, `armholeDepth` — always already in
    scope at both call sites) but every pre-existing test, incl.
    `regression.test.ts`'s 8/8 SHA-256 baseline, passed unmodified — the
    guardrails are mathematically silent at default measurements.
    `neckline.test.ts` rewritten for the new signature: crew geometry
    (unchanged from Slice 55) + v geometry + widthEase/frontDrop application
    + both guardrails solo and combined + the "no live code path reaches
    scoop/boat" throws + the 3 byte-identity equivalence checks. Verified
    empirically: disabled the shoulder-seam guardrail's condition and
    confirmed 2 tests failed immediately, before reverting. Gate: 55 files
    / 709 tests / 100%. File set: 4 modified (`neckline.ts`,
    `neckline.test.ts` rewritten, `bodice.ts`, `fitted.ts`), no new files
    this slice. Phase B: B1 ✅ B2 ✅ B3 ✅ B4 ✅ (both parts). Next
    (B5): extract Waistband/hem treatment — the last item on Phase B's own
    list before Phase C (re-express the skirt via components, then the real
    test: a tank in hours not a slice-run).
55. Component architecture Phase B4, part 1 of 2 (COMPONENT-ARCHITECTURE.md
    §6, §9) — extract Neckline, default-only, byte-identical. New file
    `neckline.ts`: `NecklineParams`/`NECKLINE_DEFAULT` typed per §6's full
    spec (all 4 shapes, `widthEase`, `frontDrop`), but `necklineEdge` only
    IMPLEMENTS `shape: "crew"` — the only case anything drafts today.
    Deliberately narrower than §6's end state, and flagged as such before
    building: throws for `"v"`/`"scoop"`/`"boat"` (not just scoop/boat —
    real v-curve math isn't designed anywhere yet, and building it now would
    be exactly the behaviour-change work the NEXT slice is scoped for), and
    throws on non-zero `widthEase`/`frontDrop` too rather than silently
    ignoring them (nothing calls them non-default yet, but a param that's
    quietly a no-op is a footgun once one becomes live). Guardrail checks
    (`neckWidthHalf+widthEase>=shoulderHalf`, `frontNeckDepth+frontDrop>=
    armholeDepth`) deferred to that same next slice — untestable at
    defaults, no live code path to exercise them yet. The 0.55 (front) /
    0.6 (back) control-point factor — previously `bodice.ts`'s
    `necklineControl1Factor`, passed in from outside — moves INTO
    `necklineEdge` as `crewControlFactor(position)`: genuinely part of what
    a crew neckline is, not something a bodice should own. `bodice.ts` and
    `fitted.ts`'s `draftFittedFront` both now call `necklineEdge` instead of
    each hand-drawing the same curve — closes a SECOND duplication B2 had
    explicitly flagged and left alone (fitted's front neckline matching the
    tee's only "by construction", not by a shared code path). Byte-
    identical: every pre-existing test passed unmodified, incl.
    `fitted.test.ts`'s "reuses the tee front's neckline... verbatim" check
    and `regression.test.ts`'s 8/8 SHA-256 baseline. New `neckline.test.ts`
    proves the crew geometry directly (front/back control-factor
    difference), all four throw paths (v, scoop, boat, non-zero
    widthEase/frontDrop — none reachable from any recipe yet, exercised
    only by calling `necklineEdge` directly), and that `draftFront`/
    `draftBack`/`draftFittedFront`'s neckline edges ARE `necklineEdge`'s
    output, not independent copies. Verified empirically: corrupted the
    back's control factor (0.6 → 0.55) and confirmed `regression.test.ts` +
    `neckline.test.ts` + `tshirt.test.ts` failed 9 tests across 2 files
    immediately, before reverting. Gate: 55 files / 702 tests / 100%. File
    set: 2 new (`neckline.ts`, `neckline.test.ts`), 3 modified (`bodice.ts`,
    `fitted.ts`, `drafting/index.ts` barrel export). Phase B: B1 ✅ B2 ✅
    B3 ✅ B4 part 1 ✅. Next (B4 part 2): the actual behaviour change — real
    "v" curve math, widthEase/frontDrop wired to do something, guardrails
    built and exercised for real.
54. Component architecture Phase B3 (COMPONENT-ARCHITECTURE.md §2.4, §5) —
    the real fix, not just infrastructure. New file `sleeve.ts`: the cap-
    fitting machinery (`capCurves`, `solveCapHeight`, `CAP_EASE`) moved out
    of `tshirt.ts` wholesale, behind `sleeve`, a `Component<SleeveParams>`
    taking `targetArmhole: number` instead of re-deriving it internally.
    §2.4's latent coupling: `draftSleeve` used to fit its cap to
    `armholeLength(m)` — a RE-DRAFTED tee bodice — not the bodice actually
    in the block being assembled; harmless today only because fitted's front
    happens to reuse the tee front's exact armhole curve. Fixed at both real
    consumers: `draftTshirt` now measures the armhole off the front/back
    pieces it just drafted via `bodice`, and `draftFitted` — also converted
    to `assembleComponents` this slice — measures it off `draftFittedFront`'s
    OWN armhole edge, not a generic one. `draftFront`/`draftBack`/
    `draftSleeve`/`armholeLength` all stay exported from `tshirt.ts` as thin
    legacy wrappers (still re-deriving, as before) for direct callers/tests;
    production drafting no longer goes through them. Byte-identical at
    STANDARD_M by construction (doc's own prediction): every pre-existing
    test passed unmodified, including `fitted.test.ts`'s
    `rolePiece(block,"sleeve")).toEqual(draftSleeve(m))` and
    `regression.test.ts`'s 8/8 SHA-256 baseline. New `sleeve.test.ts` proves
    the Component contract (role-keyed piece, no stitches/interfaces,
    targetArmhole genuinely changes the drafted cap — not just coverage from
    indirect use) and, explicitly, that `draftFitted`'s armhole is now
    measured off the real darted front (`dartedFront.name === "fitted
    front"`), not assumed identical to the generic tee's. Verified
    empirically: temporarily dropped the back's armhole from `draftTshirt`'s
    targetArmhole sum and confirmed `regression.test.ts` +
    `tshirt.test.ts` + `sleeve.test.ts` all failed immediately (5 tests),
    before reverting. Gate: 54 files / 692 tests / 100%. File set: 2 new
    (`sleeve.ts`, `sleeve.test.ts`), 3 modified (`tshirt.ts`, `fitted.ts`,
    `drafting/index.ts` barrel export). Phase B: B1 ✅ B2 ✅ B3 ✅. Next
    (B4): extract Neckline, default-only first (byte-identical), then a
    separate slice adding shape/widthEase/frontDrop (a real behaviour
    change, §2.5's neckline gap) — kept as two slices on purpose, not one.
53. Component architecture Phase B2 (COMPONENT-ARCHITECTURE.md §2.2, §5) —
    the FIRST real consumer of B1's `assembleComponents`. New file
    `bodice.ts`: `bodicePanel`, the exact shared 90% §2.2 measured between
    `draftFront`/`draftBack` (same hps/shoulder/underarm/sideHem, same
    shoulder/armhole/side/hem edges with the same control points),
    parameterised by the three things they actually differed on — neck
    depth, the neckline curve's first control point, and the centre edge's
    name — plus `bodice`, the `Component<BodiceParams>` that supplies those
    three for `position: "front" | "back"` and exposes an `armhole`
    interface for a later Sleeve component (B3) to read. `draftFront`/
    `draftBack` in `tshirt.ts` are now thin wrappers over `bodice(...)
    .pieces.front/back` — kept exported as-is so `armholeLength`,
    `fitted.ts`'s `draftBack` reuse, and existing tests don't change.
    `draftTshirt` itself now calls `assembleComponents` instead of `block`
    directly — real use, not synthetic. Scope deliberately narrow: this
    closes ONLY the draftFront/draftBack duplication B2 names. The fitted
    front shares the same neckline/shoulder/armhole prefix but diverges into
    dart edges and a shifted hem — real, different geometry, not folded into
    `bodice` here; flagged as a candidate for a later slice, not assumed.
    Byte-identical: `tshirt.test.ts`'s existing golden-point assertions
    (exact edge coordinates) passed unmodified, and `regression.test.ts`'s
    8/8 SHA-256 baseline (tee + fitted SVG/tech-pack) passed unmodified —
    fitted is included because it reuses `draftBack`. New `bodice.test.ts`
    proves the Component contract directly (role-keyed pieces, no internal
    stitches, `interfaces.armhole` names the right edge) and that
    `draftFront`/`draftBack` ARE `bodice`'s output, not a re-derivation of
    it (`toEqual`, not just "produces the same numbers"). Verified
    empirically: corrupted the back panel's neckline control-point factor
    and confirmed both `regression.test.ts` and the existing `tshirt.test.ts`
    golden-point tests failed immediately, before reverting. Gate: 53 files
    / 686 tests / 100%. File set: 2 new (`bodice.ts`, `bodice.test.ts`), 2
    modified (`tshirt.ts`, `drafting/index.ts` barrel export). Next (B3):
    extract Sleeve, taking `targetArmhole` from the assembled bodice —
    fixes §2.4.
52. Component architecture Phase B1 (COMPONENT-ARCHITECTURE.md §9) — first
    slice of Phase B. New file `component.ts`: `ComponentResult` (pieces by
    role, internal stitches, exposed interfaces), `Component<P>` (a pure
    `(m, params) => ComponentResult` fn, same shape as a garment's own
    `draft`), and `assembleComponents(results, connectingStitches?)`, which
    merges component results — in the order a recipe builds them, since a
    later component may depend on an earlier one's exposed interface (the
    sleeve needs the assembled bodice's armhole, §2.4) — plus the recipe's
    own connecting stitches, into a `Block`. Deliberately narrow, same
    posture as A1: NO existing recipe touched. Tee/fitted/skirt keep
    drafting exactly as they do today; zero consumers this slice, so zero
    byte-identity risk — the merge helper is proven against synthetic
    ComponentResults, not real garment geometry. `assembleComponents` throws
    on a role claimed by more than one component rather than silently
    letting the later one win — same "surface a mismatch immediately"
    posture `rolePiece` already takes. Verified empirically: temporarily
    disabled the duplicate-role guard and confirmed the test that names it
    fails immediately, before reverting. Gate: 52 files / 680 tests / 100%.
    File set: 2 new (`component.ts`, `component.test.ts`), 1 modified
    (`drafting/index.ts`, barrel export only). Next (B2): extract Bodice —
    the FIRST real consumer, and the first real test of whether this shape
    holds up outside a synthetic test.
51. Component architecture Phase A3 (COMPONENT-ARCHITECTURE.md §9) — closes
    Phase A. A matched notch exists *because* two edges are sewn together, so
    it should read its edge name off the stitch that sews them, not a second,
    independently hand-typed table entry that could silently drift from it.
    New `matchedNotch(stitch, side, t, edgeIndex?)` in `stitch.ts`, returning
    the same `{edgeName, t}` shape `NotchRule` needs — deliberately structural
    rather than importing `NotchRule` from `render/notch.ts`, since that file
    already imports the drafting barrel and a value import back would be a
    real drafting → render cycle. `edgeIndex` (default 0) picks which edge of
    a multi-edge interface carries the notch — the side seam is 2 edges
    (sideUpper/sideLower); the notch sits on sideLower, index 1, same as the
    hand table always placed it. Applied to `tshirt-notches.ts` (tee: shoulder,
    side, sleeve-underarm notches now derived from `sleevedTopStitches(["side"],
    false)`), `fitted-tables.ts` (fitted front: shoulder + side, derived from
    `sleevedTopStitches(["sideUpper","sideLower"], true)`), and `skirt.ts`
    (both balance notches derived from `SKIRT_STITCHES[0]`). Deliberately NOT
    derived: the armhole/sleeve-cap notches (t=0.33 / capLeft / capRight) —
    their stitch is the sleeve-cap-ease interface, multi-edge AND eased, so
    there's no single matched point the way an ordinary 1:1 seam has one.
    Those stay hand-authored, same boundary as A2's panel-owned hem/waist-
    square checks. Verified empirically, not assumed: temporarily corrupted
    the fitted side-seam's `edgeIndex` (1 → 0, picking sideUpper instead of
    sideLower) and confirmed `regression.test.ts`'s SHA-256 gate caught it
    immediately, before reverting. Proof this slice owed: each derived notch
    table compared field-by-field against the literal pre-migration hand
    values in `stitch.test.ts` (tee front/back/sleeve, fitted front, skirt
    front/back) — skirt has no export byte-identity baseline, so this is its
    only byte-level proof. `regression.test.ts`'s existing tee/fitted SHA-256
    baseline (unchanged from Slice 34) is the other half of the gate and
    passed unmodified — confirms zero export-writer output moved. Gate: 51
    files / 671 tests / 100%. File set: 5 modified (`stitch.ts`,
    `stitch.test.ts`, `tshirt-notches.ts`, `fitted-tables.ts`, `skirt.ts`),
    zero new files. Phase A (stitches as data) is now fully closed; Phase B
    (components) is next.
50. Component architecture Phase A2 (COMPONENT-ARCHITECTURE.md §9) — the
    migration lands. `Block.stitches` is now REQUIRED (§11 Q4's boundary);
    all three recipes declare their real stitches (`sleevedTopStitches` for
    tee/fitted, a plain `SKIRT_STITCHES` constant for skirt — no builder
    needed, there's only one skirt variant); `garmentReport` combines
    `stitchChecks(b, b.stitches)` with `recipe.checks(b, m)`, narrowed to
    panel-only (a hem or waist square to the fold — a property of one
    panel, not a seam). `dartLegCheck`/`frontHemWidth` deliberately
    untouched — independently useful, independently tested elsewhere.
    A real, solved circular-import risk, flagged at scoping time and
    confirmed rather than assumed: `stitch.ts` imports `Block` from
    `block.ts`, so `block.ts` importing `Stitch` back would be a genuine
    cycle. Used `import type { Stitch }` — erased at compile time, never
    touches the runtime module graph — and verified empirically: after the
    change, `tsc` raised zero complaints about the cycle, only the expected
    downstream call-site errors. The self-referential trap flagged when
    scoping this slice was real and required a real fix, not just caution:
    A1's equivalence tests compared declared stitches against
    `recipe.checks`, which THIS slice narrows to panel-only — comparing
    against it post-migration would either be vacuous or, since it no
    longer contains the stitch checks at all, would simply fail. Fixed by
    capturing a golden master (`garment-check-golden.ts`) — real
    `garmentReport` output, frozen as literal data, BEFORE any production
    code changed — and proving it byte-identical to live output first
    (a dedicated sanity test), mutation-tested (corrupted one detail
    string, confirmed the sanity test caught it, regenerated clean) BEFORE
    trusting it as the safety net for the rest of the slice. `stitch.ts`'s
    equivalence tests now compare the REAL production `b.stitches` (not a
    parallel test-only table that could drift) against golden-master
    truth. Mutation-tested the whole migration, not just the golden master:
    swapped `hasDart: false → true` on the tee's real stitch declaration —
    caught immediately, and more loudly than a numeric mismatch: the tee's
    front genuinely has no dart edges, so `pieceEdge` threw "no edge named"
    rather than silently reporting a wrong-but-plausible number. Two other
    test files directly tested the deleted functions
    (`tshirt-checks.test.ts`, `skirt.test.ts`) and needed real rewrites, not
    just call-site patches; `recipe.test.ts` asserted on `recipe.checks`
    directly and was fixed to read from `garmentReport` — the real
    production combination — instead. Gate: 51 files / 660 tests / 100%;
    byte-identity regression 8/8, confirming zero export-writer file moved.
    File set: 15 modified + 2 new (the golden master + its sanity test).
49. Component architecture Phase A1 (COMPONENT-ARCHITECTURE.md §9) —
    `drafting/stitch.ts`: `EdgeRef`/`Interface`/`Stitch` as pure data, plus
    `interfaceLength` and `stitchChecks`, both reusing the SAME primitives
    (`matchLengths`, `inBand`) the hand-written checks already called, not a
    reimplementation of check logic — only of how a seam's two sides are
    named and summed. Per §11 Q4, `Block` is untouched: no recipe declares a
    stitch yet, this is a pure library sitting alongside the existing
    checks, zero blast radius. The proof this slice owed: stitch tables
    declared as data (mirroring `tshirt-checks.ts`/`skirt.ts` exactly) run
    through `stitchChecks` on REAL drafted blocks and compared field-by-field
    (name, ok, AND detail string) against the REAL existing check functions
    — not "looks equivalent," byte-for-byte. Held across 4 tee points, 3
    fitted points, 3 skirt points, including one deliberately implausible
    chest (160cm) — the project's "warn, never clamp" philosophy means an
    implausible number still drafts and still must check out correctly.
    Confirms the design doc's own claim with numbers: tee's 4 stitch-
    derivable checks match exactly (hem-square, index 4, correctly excluded
    — a panel property, not a stitch); fitted's are ALL 5 checks
    stitch-derivable, a clean result since `hemSquareToFold=false` for
    fitted; skirt's 1 stitch-derivable check matches, with hem-square AND
    waist-square correctly excluded as the two panel checks. Mutation-tested
    before trusting the pass: dropped `back.armhole` from the cap-ease
    interface, confirmed all 4 tee-point tests fail with a clear ok
    true→false diff, restored. Gate: 50 files / 654 tests / 100% (21 new,
    all in `stitch.ts`/`stitch.test.ts`); byte-identity regression untouched
    (8/8) — confirms zero recipe, `Block`, or export-writer file changed.
    File set: 2 new files + a one-line barrel export addition, nothing else.
48. Component Architecture Design — a document, not code (MVP-PLAN.md
    Months 2–3, "the multiplier"; ROADMAP.md's own evidence for why it comes
    first: FreeSewing's 2026 "Library" refactor exists because they added
    garments before componentising and had to refactor out the resulting
    dependency tangle). Read the actual code before proposing anything —
    `Edge`/`Piece`/`Block` already have the right shape (every edge is
    already named, which is what makes any of this additive rather than a
    rewrite); what's genuinely missing is a formal `Interface`/`Stitch`
    concept, since seam relationships today live only as hand-written
    assertions inside the checker (`tshirt-checks.ts`), which is
    construction knowledge encoded backwards, in its own verification. Found
    a real, currently-harmless coupling with numbers, not a guess:
    `draftSleeve` fits its cap to a re-drafted TEE bodice
    (`armholeLength(m)`), not the bodice actually in the block being
    assembled — measured identical today (41.691/41.691) only because
    fitted's front reuses the same points; any future bodice with a
    different armhole would get a silently wrong sleeve. GarmentCode (ETH
    Zurich, SIGGRAPH Asia 2023) supplied the reference vocabulary
    (Edge/Panel/Component/Interface) and, concretely, its own shipped
    component list (bodice, sleeve, collar, skirts, pants) validates our
    Priority 2 target rather than just inspiring it. Proposed:
    `EdgeRef`/`Interface`/`Stitch` types + `Block.stitches`, proving 6 of 8
    current sewability checks (including the darted front's multi-edge side
    seam and the sleeve-cap-spans-front-and-back case) become one generic
    function over declared data — the remaining 2 ("hem/waist square to the
    fold") are correctly identified as panel properties, not stitches, and
    stay recipe-owned. The Slice 47 neckline finding resolved here, not as a
    standalone measurement: a `NecklineParams` component parameter
    (`shape`/`widthEase`/`frontDrop`), byte-identical at its default,
    scoped and guarded (warn-never-clamp) rather than a raw global input —
    exactly FreeSewing's own conclusion (options scoped to a part, not the
    whole pattern). Four decisions, reviewed and answered before any Phase A
    code: `backNeckDepth`'s non-scaling left as-is for MVP; neckline ships
    crew+v now, scoop+boat with the Month 4 shirt block (the type declares
    all four so the taxonomy doesn't take a breaking change later; the other
    two throw "not implemented" rather than render silently wrong);
    `Piece` stays, `Interface`/`Stitch`/`Component` are additive, not a
    rename; `Block.stitches` optional in Phase A1, required from A2 — an
    exact one-slice boundary, not an indefinite transitional state.
    Migration is strangler-fig, ~17–26 slices across three phases (A:
    stitches as data, B: components, C: prove the multiplier — adding a
    tank should take hours not a slice-run, or Phase B isn't finished),
    every phase byte-identity gated, with a standing rule carried
    throughout: never refactor and change behaviour in the same slice.
    Not a coding slice — no test-count change. `COMPONENT-ARCHITECTURE.md`
    is the full document; read it before Slice 49.
47. App menu + window state + a real product identity (rest of MVP-PLAN.md
    Month 1's Electron line). Two premises checked empirically before
    building on them, one right and one wrong: Electron already ships a full
    default menu (undo/redo/cut/copy/paste/select-all all genuinely worked,
    confirmed by a real `Ctrl+C` that copied `"100"` off the chest field) —
    so "fix broken shortcuts" was never the real gap. `app.getName()`
    returning `"Electron"` in dev mode WAS real, confirmed the same way.
    Built: a real `Menu` (File > Export mirrors all six export buttons
    exactly — main only names which kind was picked over IPC, `app.ts`
    clicks the real matching button, so the menu is provably the same code
    path as the mouse, never a second implementation; standard Edit/View/
    Window). Window-state persistence — deliberately SYNCHRONOUS file I/O,
    not the async pattern used everywhere else in `electron/`: an async
    write on the `close` event risks the process exiting before it lands,
    silently losing the save on every ordinary quit. A second, unplanned
    fix rode along once `app.getName()` was actually inspected: the packaged
    build reported the raw npm package name, not `"Electron"` — and a
    process-wide name sweep for consistency (not just this bug) found
    `index.html`'s `<title>` tag was the ACTUAL live bug — visible in every
    browser tab and, since Electron syncs window title to the page's own
    `<title>` by default, the desktop window chrome too — plus `package.json`'s
    `name`/`appId`, the packaged Linux binary's filename (was `patternworks`
    on disk, verified before AND after the fix), and **`ARCHITECTURE.md`'s
    own header, wrong through three prior full-file deliveries (43, the MVP
    rewrite, 45) and never caught until this sweep**. New
    `electron/verify-menu-and-window.cjs`: real launch, clicks the real
    native menu via Electron's own Menu API (Playwright cannot click an OS
    menu), a real resize→close→relaunch→check-bounds round trip on the SAME
    profile, and a real `win.title()` check — 4 checks, run against both dev
    mode and a real unsigned `electron-builder` output, twice each for
    stability. `src/` gate: 49 files / 633 tests / 100% (2 new: the menu-
    dispatch path proven to route through the SAME button the mouse uses,
    and a guard that mounting without `electronAPI` at all never throws).
    Anchor: commit TBD (this slice).
46. Electron shell — the desktop packaging spike (MVP-PLAN.md Month 1). The
    app was, honestly, "a locally hosted webpage called an app" until now; this
    slice makes it a real downloadable desktop app. `electron/main.cts` +
    `electron/preload.cts` (both `.cts` — TypeScript always compiles these to
    CommonJS regardless of the root package.json's `"type": "module"`, the one
    thing that needed to not fight the rest of the build): a `BrowserWindow`
    loads the SAME app that already runs in a browser tab — zero renderer code
    forked — plus one IPC channel, `save-file`, so a native save dialog can
    replace the browser's Blob-download trick. `src/ui/app.ts`'s `download()`
    now checks `window.electronAPI` first (set by the preload's
    `contextBridge`) and falls back to the exact unchanged Blob/`<a>` path when
    it's absent — additive, not a fork; every existing export test still
    exercises the browser path unmodified. TWO REAL BUGS, neither found by
    `tsc --noEmit` or the coverage gate:
    (1) Vite's default absolute asset paths (`/assets/index-*.js`) resolve to
    the filesystem root under Electron's `file://` loading, so the packaged
    app's script 404'd silently and never mounted — no error, just a blank
    window. Found by actually launching the packaged build, not by trusting
    the compile. Fixed with a new `vite.config.ts` (`base: "./"`); confirmed
    the plain `npm run dev` server is unaffected.
    (2) The first "it hangs" during verification was a false alarm mis-chased
    as a bug: Electron persists `localStorage` across launches by default (the
    same persistence that makes the app usable across restarts), so a SECOND
    test run against a REUSED profile correctly skipped the already-completed
    welcome card — the app was working the whole time. Root-caused by
    launching with a fresh `--user-data-dir` per run and confirming the
    failure disappeared; logged as a lesson because it's exactly the kind of
    thing that could get "fixed" by breaking something that wasn't broken.
    New `electron/verify-save.cjs`: launches the REAL Electron app (main +
    preload + the real built renderer) via Playwright's official Electron
    support, stubs only the native OS save dialog (the one piece a script
    can't click), clicks a real export button, and confirms a real file with
    real SVG content lands on disk — the round-trip a jsdom unit test
    fundamentally cannot prove, since jsdom has no real IPC, no real dialog,
    no real filesystem. Run via `npm run electron:verify` (dev, needs `npm run
    dev` running separately) or `electron:verify-packaged` (against a real
    `electron-builder` output). This is a NEW, separate gate from `npm run
    coverage` — it needs a display (`xvfb-run` in CI/containers) and a real
    Electron binary, and is not part of the 100%-coverage Vitest suite.
    Verified both the dev-mode path and a real unsigned `electron-builder`
    "dir" packaging output (mac/win/linux configured; only linux buildable in
    this container — mac/win need their native toolchains, untested here).
    Explicitly NOT in this slice: code signing (separate procurement track,
    MVP-PLAN.md §1.4), auto-update, app-menu/window-state polish — the rest of
    MVP-PLAN.md Month 1. `src/` unaffected beyond `app.ts`'s one new branch:
    48 files still 100% covered, only `app.ts` grew a test. (631)
45. Fit Validation Loop — the checker verifies sewability, never fit, and says so
    honestly; this slice builds the harness to close that gap. New pure module
    `drafting/fit-compare.ts`: `sampleSpec(recipe, m)` reads every POM off the
    EXACT block that gets cut (`recipe.draft(m)`, the same block the tech-pack
    sketch draws), so the sketch, the printed sheet, and the comparator can
    never quietly disagree about "predicted." `compareFit(predicted, actual)`
    returns a per-POM delta and `withinTolerance` — `true`/`false` when the POM
    has a declared tolerance, `null` when it doesn't (never an invented pass on
    a number it wasn't given a tolerance for, the same honesty rule the printed
    tolerance column already follows). The tech-pack PDF grows a 4th page, the
    Fit Record: every POM's predicted value plus blank ruled space for a real,
    hand-measured value after sewing — a print-and-write sheet, not an
    interactive form (this writer only emits plain ASCII text streams). REAL BUG,
    not found by a failing test: the first render's blank-fill header (Fabric /
    Sewn by / Date) used hardcoded cm offsets — the Date rule ran off the page
    edge, and Sewn-by's rule struck through Date's own label. Found by rendering
    the actual PDF to an image and looking at it, same discipline as the Slice 43
    silhouette bug. Fixed by sizing every column off `page.width`, not a fixed
    cm offset; verified visually across tee, fitted, and skirt after the fix.
    New regression gate parses the real rule-line coordinates out of the PDF
    content stream and asserts they stay inside the page, on both supported page
    sizes — the kind of test that would have caught the bug automatically.
    Updated two existing callout-count tests that legitimately changed (every
    POM label now also appears on page 4) and the tech-pack byte-identity
    baseline only — svg/dxf/pdf hashes untouched, confirming the blast radius is
    exactly the tech-pack writer. The loop still closes on paper, not in-app: no
    UI field exists yet to type actual measurements back in; that's a deliberate
    boundary, not an oversight (MVP-PLAN.md Month 1). (630)
44. Demo artifact — the coached journey to a real export, captured live off the
    running app, not staged. A scripted Chromium run against a fresh clone's
    actual `npm run dev` walks the real DOM: welcome card → Start → Measure →
    Fit → Refine → Output via `#journey-next`, hovers a measurement row to
    trigger the live Slice 29/30 spotlight, opens Check to a live "✓ Ready to
    cut" verdict, clicks `#export-projector`, and captures the file Chromium
    actually downloaded. The calibration claim is verified by PARSING the
    downloaded file's own SVG source (`width="10" height="10"` in a
    1-unit-=-1cm viewBox) — not the on-screen label. Ships as a 9-frame GIF +
    10 screenshots + the downloaded `tee-projector.svg` itself, so the claim
    is checkable without re-running anything. RESUME-LOG.md updated: demo
    artifact moved Pending → Earned; also caught and fixed a second stale
    Pending claim ("structurally different garment — not started"), true
    since Slice 43. Readiness threshold now 5 of 5. Not a coding slice — no
    test-count change. Anchor: commit `e6fd79d` (Slice 43 baseline).
43. Skirt body croquis (3 of 3 from the s40 review — the review queue is
    CLOSED) — `renderSkirtBody` rebuilt as a real lower-body figure: nothing
    above the waist (the old head/shoulder stub is gone), a waist→hip flare,
    a crotch, two legs run to y=118 (past the 100 cm hem the length slider
    allows), and the skirt drawn as a separate cloth shape draped outside the
    body. `hipDepth` gets its own `data-dim` (deferred from 42), so all four
    raw skirt fields are annotated. THREE REAL BUGS, none found by a failing
    test: (1) both legs traced in the same direction, so the outline skipped
    the LEFT HIP entirely — every envelope test (widest point, deepest point,
    viewBox fit) stayed green; found by reading the emitted `d` string, fixed
    by modelling a leg as a reversible chain of cubic segments so the left
    leg walks crotch → inner → ankle → outer → hip; (2) the hip dimension
    label collided with the crotch apex at shallow `hipDepth` — moved above
    the hip line, safe now that the head stub is gone; (3) waist 140 / hip 60
    (reachable, warned) made the cloth widest at the WAIST, not the hip, so a
    gutter sized off the hip alone ran the dim lines through the figure — the
    first gate written for this was itself wrong (a viewBox-containment test
    passed on the broken code, because the figure never left the viewBox,
    only overran the dim lines) and was replaced. Guardrails mutation-tested:
    bug (1) fails 4 gates, bug (3) fails 1, envelope tests stay green in both
    cases. Blast radius hashed against origin: only `skirt.body` changed
    (50bd2073→70da7d14); tee/fitted/skirt drafts, blueprints, DXF, and the
    skirt assembled view all byte-identical. (611)
42. hipDepth as a real measurement (2 of 3 from the s40 review) — the waist-to-hip
    vertical was a hard-coded `HIP_DROP = 20` duplicated in `drafting/skirt.ts` AND
    `render/skirt-figure.ts`, driven by no measurement. It is now a real
    `Measurements` field, joining the same six registries waist/hip did in s37:
    struct + `STANDARD_M` (default 20), `MEASUREMENT_BOUNDS` (12–35),
    `MEASURE_ROLE` (body, non-circumference — ease never applies to a vertical
    drop), `FIELDS` (slider 10–40), `persist` BOUNDS + a LENIENT read (old saves
    lack it, so it defaults rather than rejecting), and `SKIRT.fields`. Both
    constants deleted; draft and both figures read `m.hipDepth`.
    Default 20 == the old constant, so the skirt draft, both skirt figures, and
    tee/fitted guidance all hashed BYTE-IDENTICAL to origin. Making the field
    editable opened a failure mode that was unreachable while it was frozen — a hem
    at or above the hip line folds the panel over itself — so `skirtGuidance` gained
    a warn-never-clamp note for `length <= hipDepth`. `hipDepth` deliberately does
    NOT grade (real grading nudges it ~0.3 cm/size; adding it would move every graded
    skirt POM and forfeit the byte-identity gate) — a later refinement. The body
    figure has no `data-dim="hipDepth"` yet: left to 43, which redesigns it. (599)
41. Guidance garment-awareness (bugfix, 1 of 3 from the s40 screenshot review) —
    `plausibilityChecks`/`coherenceChecks`/`implausibleFields`/`measurementsPlausible`
    (`guidance/plausibility.ts`) now take `fields: (keyof Measurements)[]` and only
    judge a bound/ratio if every field it needs is in that set. Fixes a real bug: on
    the skirt, `chest` sits frozen at its STANDARD_M default (the skirt has no chest
    control), so shortening the skirt used to trip a spurious "Body length and chest
    look out of proportion" warning about a field the user never touched. `guide()`
    and all four `app.ts` call sites now pass `recipe.fields`. Tee unaffected: its
    7 fields already cover everything the 3 `RATIO_BOUNDS` touch and everything its
    own controls can push out of range — verified byte-identical across a 14-case
    measurement battery (the only 2 divergent cases force waist/hip out of range on
    the tee, a state its UI can never actually produce, since tee doesn't expose
    those fields). Two bugs from the same review remain queued: `hipDepth` as a real
    field (42), and the skirt body-figure redesign against it (43). (583)
40. Skirt figures — the LAST tee-shaped spot closed (app is fully garment-general).
    New `render/skirt-figure.ts`: `renderSkirtGarment` (assembled front/back panels,
    fabric-filled, waist→hip→hem) and `renderSkirtBody` (annotated lower-body figure
    with waist/hip/length dimension lines + `data-dim`/`data-edge` hover overlays like
    the tee). Both gated in app.ts on `isTop`. Fixes a real s38 bug: the assembled
    "PATTERN" view was drawing a fixed tee for the skirt (via `derive()` → chest) that
    didn't even respond to hip; it now draws a skirt that does. Both skirt placeholders
    removed; `unavailablePanel` deleted (dead code). Measurement-honest: the waist→hip
    taper is drawn because a skirt MEASURES both (unlike the tee); girths marked
    "(circ)". Tee byte-identical (garment d7d012c2, body 893568b0, style b9e41eb2). (573)
39. Recipe-owned styles + skirt style set (UI-honesty pass, part 1) — the style
    suggester is no longer tee-only. The style TABLE moved onto `recipe.styles`
    (`TEE_STYLES` for tee/fitted, new `SKIRT_STYLES`: Mini/Knee/Midi/Maxi + Fitted/
    Relaxed skirt); the style functions (`matchStyle`/`styleNames`/`nearbyStyles`/
    `currentStyles`/`styleSuggestions`) now take the table as an argument. The skirt's
    style panel shows real targets instead of a placeholder; `targetStyle` resets to
    the garment's first style on switch (so `matchStyle` never throws). Pure refactor
    for the tee: its style panel is byte-identical (b9e41eb2 / 18a14acd / 288a1de6).
    The body-view figure is the last tee-shaped spot (Slice 40). (565)
38. The SKIRT recipe (skirt bridge COMPLETE — thesis proven) — a structurally
    different garment runs through the whole engine with only a recipe added: it
    drafts (front/back panels, waist→side→hem→centre, no sleeve/armhole), checks
    READY, grades a waist/hip/length POM run, exports, and nests — all for free.
    New `drafting/skirt.ts` (draft + recipe-owned `skirtChecks`/`skirtGuidance` +
    grade/POM/notch tables); `SKIRT` assembled in recipe.ts and registered in
    GARMENTS (the toggle picks it up). Deferred bits from s37 landed: waist/hip
    plausibility bounds, `SKIRT_GRADE` deltas, and controls re-render + listener
    re-wiring on garment switch. Body view + style panel show an honest placeholder
    for the skirt (real lower-body figure + skirt styles = a later UI slice). Tee
    byte-identical (controls aa9c18d6, guide db6b584b, report a64eca53). (561)
37. Per-garment Measurements (skirt bridge, step 3) — `Measurements` gains required
    `waist` + `hip` (struct, not a generic bag — compile-time safety kept), and each
    recipe declares `fields: (keyof Measurements)[]`, the measurement set it uses, in
    order. `controlsMarkup(m, fields)` renders only that set, so a lower-body garment
    can show waist/hip and hide chest/sleeve. Forced total-records updated
    (`persist.BOUNDS`, `facets.MEASURE_ROLE`); persist migrates leniently — old saves
    with no waist/hip load with STANDARD_M defaults rather than erroring. Tee/fitted
    declare the same 7 upper-body fields, so tee output is byte-identical (controls
    aa9c18d6, guide db6b584b, report a64eca53). Deferred to the skirt recipe:
    plausibility/grade waist-bounds, body-view waist/hip, controls re-render on
    garment switch. (547)
36. Recipe-owned guidance (skirt bridge, step 2) — the guidance twin of s35. The
    tee guidance (`armholeMatch`, `easeRange`, `armholeDepthCheck`, `shoulderCheck`)
    moved to `drafting/tshirt-guidance.ts` (`sleevedTopGuidance`) and hangs off the
    recipe as `recipe.guidance(block, m)`. `guide()` is now `guide(recipe, m)` and
    GARMENT-AGNOSTIC — it runs the recipe's guidance then the sanity tiers, never
    naming a sleeve, so a sleeveless recipe runs through it (tested). `Note` / `Level`
    / `SEVERITY_ICON` extracted to a dependency-free `guidance/note.ts` so the recipe
    can speak in Notes without a drafting↔guidance cycle (re-exported from guidance
    for existing importers). Pure refactor: tee+fitted guide() output hashes
    byte-identical (e68c3e2d). (541)
35. Recipe-owned sewability checks (skirt bridge, step 1) — `garment-check.ts` is now
    GARMENT-AGNOSTIC. The tee/fitted seam/cap/hem/dart checks moved to
    `drafting/tshirt-checks.ts` (`sleevedTopChecks`) and hang off the recipe as
    `recipe.checks(block, m)`; the size-run orders by `recipe.sizeMetric`. The
    checker now owns only the truly universal checks (every piece declares notches;
    the graded run grows in order) and never reaches for a "sleeve", so a sleeveless
    garment runs through it instead of throwing (proven with a stub panel recipe).
    Pure refactor for tee+fitted: both reports hash byte-identical to s34
    (TEE a64eca53, FITTED be5a47b7). `CheckSpec` retired. (538)
34. Body-vs-finished measurement facets (last of Opus Phase A) — a displayed number
    is no longer ambiguous. New `drafting/facets.ts` classifies each raw field as a
    BODY measurement (taken off a person; garment may add ease) or a FINISHED garment
    dimension, and — where ease applies — exposes the finished value: chest gains full
    ease (`+ease`, mirrors the draft's `(chest+ease)/4`), the sleeve gains half
    (`bicep + ease*0.5`). Classifications trace to how the draft USES each number, not
    to assumption; verified against real geometry (facet finished-chest == 4×
    chestWidthHalf at every ease). `measurementFacet` / `MEASURE_ROLE` / `roleTag` are
    exposed data for Fable's F2; the control rows now carry a static "body · circ" /
    "finished" tag. (445)
33. Guidance message-quality pass (colour-blind safe, Fable-facing) — every guidance
    message is now stateful (names the current value) and ends in a plain verdict, and
    severity is shown as an ICON, not colour alone. `easeRange` no longer goes silent
    in range — it returns a positive "Ease is 10 cm — a comfortable amount" note;
    `shoulderCheck` names the offending width. New exported datum `SEVERITY_ICON`
    (`{ok:"✓", info:"ℹ", warn:"⚠"}`) is the single source of glyphs the panel renders
    and Fable's F2 will reuse — Phase-A data, not baked-in markup. (431)
32. Verdict & honest surfacing (the UI half of the sanity tiers) — geometry passing
    can no longer masquerade as validated. A top-line guidance verdict ("⚠ N to
    review" / "✓ Looks production-ready") heads the panel; implausible inputs get an
    amber outline at the field; and the two green signals — the check view's "Ready
    to cut" banner and the style panel's "You're making a X ✓" — withhold green
    while `measurementsPlausible` is false. New pure helpers `implausibleFields`
    (which fields to flag) and `measurementsPlausible` (the one gate the UI reads);
    `plausibilityChecks` now builds on `implausibleFields` (one source of truth).
    chest 160 sews together (`report.ok` true) yet the banner now reads "⚠ Sews
    together, but check the flagged measurements" — the falsely-validated screenshot
    is dead (429)
31. Plausibility & proportional-coherence checks — two new pure-function guidance
    families in `guidance/plausibility.ts`, both WARN, never clamp. (1) Absolute
    per-measurement bounds (`MEASUREMENT_BOUNDS`) for a real adult garment; (2)
    proportional coherence (`RATIO_BOUNDS`: shoulder↔chest, length↔chest,
    bicep↔chest) that catches an internally mismatched set even when each value
    passes its own bound. `guide()` folds both in after the geometric checks, so a
    chest of 160 — which sews together fine and used to draft silently — now raises
    four warnings. Bounds are DECLARED here, seeded from published adult ranges and
    centred on STANDARD_M: grading is relative (deltas around the user's base), so
    there was no size chart to read a ceiling/floor from — the roadmap's assumed
    source didn't exist. `ease` stays with easeRange (no double-warn) (412)
30. Hover highlights the outline too — the measurement→EDGES map, sibling of
    Slice 29's measurement→dimension map. `renderBody` now emits `<g data-edge=
    "<field>">` overlay segments tracing the outline each number shapes
    (shoulderWidth→shoulder slopes, armholeDepth→underarm diagonals, chest→side
    seams, length→hem, sleeveLength→arm outer edges, bicep→cuffs), drawn on top of
    the silhouette in its own colour/weight so they're invisible at rest. The
    silhouette is grouped as `data-edge="figure"` — never a field name, so it
    always dims and needs no UI special case. One `spotlight()` helper replaced the
    two duplicated highlight blocks in app.ts. Verified by external parse: every
    overlay endpoint lands on a real silhouette vertex, and no segment is owned by
    two measurements (396)
29. Slider ↔ body-view linking — each body dimension is wrapped in `<g data-dim=
    "<field>">` and each measurement row carries `data-dim-row="<field>"`; hovering
    or focusing a row spotlights that dimension and fades the rest (survives the
    body redraw via `activeDim`). Six raw inputs map to six dimensions; `ease` has
    none (it isn't a body measurement). Pure UI — no engine touched (386)
28. Graded marker — `gradedMarker(recipe, m, width)` nests the WHOLE size run on
    one bolt (via `markerPieces`, which size-labels each flat piece "<SIZE> <piece>"
    so 15 shapes aren't all "FRONT"). Same `nestPieces` estimator, bigger pile. The
    Nesting view gains a Single/Marker toggle. Tee marker: 15 pieces, 285 cm, 58%
    used vs the single 3 pieces / 76 cm / 44% — the run packs tighter. Still an
    estimator, not a production marker (381)
27. POM tolerances — each POM carries an optional `tolerance?` (cm, ±); it's a
    property of the point of measure, not the size, so it shows as one "Tol ±"
    column in the Spec view and a "Tol +/-" column in the tech-pack PDF (ASCII in
    the PDF, since pdfString maps ± to '?'). POMs without one show a dash. Tee +
    fitted authored: girths ±1.3, widths/armholes ±0.6, lengths ±1.0-1.3, small
    details ±0.3, dart intake ±0.5 (374)
26. Seam allowance done right — TWO REAL BUGS FIXED. (1) The corner offset slid
    along the bisector by `d`, so a 1 cm allowance was 0.707 cm at a right angle;
    it is now an exact 2x2 solve (`w·nIn = dIn`, `w·nOut = dOut`). (2) The cutting
    line ran 1 cm PAST the fold, adding **4 cm of chest** to every exported tee;
    fold edges now take zero allowance. Allowance is per-edge (`AllowanceSpec`)
    and recipe-owned — the two hardcoded constants (`ALLOWANCE` in app.ts,
    `SEAM_ALLOWANCE` in canvas.ts) are gone. Tee: hem 2, neckline 0.6, folds 0,
    everything else 1. Both bugs hid behind tests that asserted the outline "got
    bigger", never by how much — same lesson as the SVG bug (368)
25. Block generalization — `Block` is now `{ roles: Record<string, Piece> }` with
    `block()`, `blockPieces()` (engine: iterate) and `rolePiece()` (recipe: ask by
    role; throws if absent). Role ≠ piece name (the fitted "front" role holds a
    piece named "fitted front"). Size-run columns now derive from the block's
    roles instead of a hardcoded triple. Pure refactor: all 18 export/render
    outputs verified byte-identical to s24. Step 1 of 5 toward a skirt (360)
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

## Active directive: Tank rework (agreed after Slice 60, before Slice 61)

**Why this exists.** Slice 60 was reported "finished" — 100% coverage, all
tests green, mutation-tested — but Kshitij compared the body view and the
assembled view side by side and found the body view drew a visibly different
torso shape from the actual pattern, from the SAME measurements. Root cause
(confirmed, not guessed): `render/body.ts`'s `bodyHalf = m.chest * 0.22` is
an independent, never-reconciled approximation of what `derive()` actually
computes as `chestWidthHalf = (chest + ease) / 4` — different formula,
`ease` silently dropped, and at STANDARD_M the two even invert the taper
direction (22 vs 22.5 vs the real 27.5 vs 22.5). This is a genuine
"silently wrong," not a stylistic simplification — `body.ts`'s own file
header says "honesty is the whole point." A second, same-root-cause bug: the
body view's neckline is a fixed placeholder curve, never synced to whichever
real shape (crew/v/scoop) the garment actually drafts. Neither bug was
introduced by the tank — both are pre-existing in the shared upper-body
renderer, just newly VISIBLE once a sleeveless silhouette removed the
sleeve's distraction from the rest of the shape. 100% test coverage proved
the code does what it was told; it never proved what it was told was
correct. That gap is the actual finding here, not just the two bugs.

**Standing principle this establishes, going forward, for every garment —
not just the tank:** a garment recipe may not silently reuse another
garment's geometry (an armhole curve, a body-width formula) without an
explicit, stated reason. Slice 59's tank literally reused the sleeved
bodice's armhole curve — built to fit a sleeve — unmodified, for a
sleeveless garment. That was never flagged as a simplification at the time.
Every garment needs a verified, independently-reasoned visual identity;
"it happened to reuse cleanly" is not the same claim as "it's correct for
this garment," and the two must not be conflated again.

**Research standard, going forward, for every future garment:** the
free-sketch PDFs Kshitij provided are visual/proportional reference ONLY —
useful for confirming relative proportions and naming distinct style
targets, NOT usable as numeric pattern data (no dimensions, no seam
allowances, no construction specs). Real numeric dimensions and construction
specs must come from genuine web research (drafting references, published
brand spec/size charts, sewing-pattern drafting tutorials), cross-checked
against at least two independent sources before being treated as a standard
— never recycled from one of our own existing garments' numbers, and never
presented as sourced when it's actually an estimate. Findings get recorded
in a durable repository doc, `docs/research/garments/TANK-RESEARCH.md`, following
the same convention as `docs/research/TOOLS-RESEARCH.md` and
`docs/research/ASSET-RESOURCES.md` — a persistent, checkable record,
not a one-off chat answer, so the NEXT new garment after the tank has a
repeatable process instead of starting from zero.

**The plan, in order (renumbered after Slice 62 — the neckline curve itself
turned out to be a second, deeper bug under step 1, not part of step 2):**
1. ~~**Fix the render bugs completely, systemically — not a tank patch.**~~
   **DONE — Slice 61.** `render/body.ts`'s chest-width formula and neckline
   sync, for EVERY upper-body garment (tee, fitted, tank), fixed via a real
   `necklineEdge()` call through a new shared helper
   (`render/neckline-path.ts`), not a placeholder curve. `render/garment.ts`
   got the same fix. The mandated audit of `render/skirt-figure.ts` found
   the identical bug class (`waistHalf`/`hipHalf` computed independently of
   `skirt.ts`'s real formula) and fixed it the same way — one shared
   `skirtWidths()` function, both consumers read it. "No missing link left
   unfixed" confirmed FOR THE RENDER LAYER: nothing else in `render/`
   independently re-derives a number `derive()`/`skirt.ts` already compute
   correctly. (It did not, and was never claimed to, cover the underlying
   curve CONSTRUCTION in `drafting/neckline.ts` — that's step 2.)
2. ~~**Fix the neckline curve construction itself.**~~ **DONE — Slice 62.**
   Slice 61 rendering the real curve everywhere is what exposed that the
   curve itself — `neckline.ts`, dating to Slice 55/56 — didn't meet the
   centre-front/back fold at a right angle, which is what spiked into a
   visible V once mirrored. Rebuilt as a true quarter-ellipse; `scoop` is
   now crew geometry + depth/width (no curve shape of its own — see the
   Slice 62 log entry above for the full reasoning and the sources).
   `regression.test.ts`'s tee/fitted export baseline moved, deliberately,
   with sign-off requested and given before building.
3. ~~**Build the tank properly and completely**, integrating real styling
   depth.~~ **DONE — Slice 63.** Real armhole/strap geometry for the tank
   (`drafting/armhole.ts`), researched per the standard above
   (`docs/research/garments/TANK-RESEARCH.md`) and NOT reused from the sleeved bodice. The
   parameters-vs-princess-seams split was resolved by the research itself,
   not assumed: `TANK_STYLES` has no style that varies by anything other
   than ease/length, and princess seams are for bust/waist contouring no
   current tank style asks for — so no princess seams, no new named styles,
   confirmed before building. A real scope change came from Kshitij mid-
   slice, ahead of the numeric strap-width call the research had left open:
   rather than the engine resolving that open question by picking a
   winner, `strapWidth` AND `neckDrop` both shipped as genuine
   user-adjustable measurements (joined `Measurements` itself, with
   plausibility bounds and a UI slider) — the standing principle now is
   that no garment dimension gets hardcoded to one value when the person
   could reasonably want a different one; the guidance engine's warn-never-
   clamp checks are what keep an extreme combination visible, not an
   engine-side ceiling on the input itself.
4. ~~**Confirm everything works correctly and is backed by reason**~~ **DONE — Slice 64.** Every
   dimension traceable to a source, every visual claim checked against the
   actual rendered output (not just against test assertions), before
   calling it done. **Largely satisfied by Slice 63's own verification**
   (fresh-clone dry run, all three views re-rendered and cross-checked at
   multiple strap widths). Slice 64 closed the confirmed drift: both Tank
   previews now use the exact curved armhole, neckline width is adjustable
   from its derived default with guardrails, and Tank tech-pack materials
   follow the selected fabric family. Automated gates and visual DOM checks
   pass; physical sewing remains an explicit maintainer validation item.
5. **Then, and only then, move on** — build the polo end-to-end, then
   complete Phase C3. This sequence was confirmed by Kshitij after the Slice 63
   handoff; polo remains parked until step 4 and any real-world failures it finds
   are closed.

## Roadmap — superseded by MVP-PLAN.md (kept below for slice-history context only)
The engine/recipe thesis is proven end-to-end: tee, fitted, and skirt — three
structurally different garments — all run through one recipe-driven pipeline,
with zero tee-shaped spots remaining (closed slice by slice: 35 checks, 36
guidance, 37 Measurements, 38 the skirt recipe itself, 39 styles, 40 both skirt
figures, 41 guidance garment-awareness, 42 hipDepth as a real field, 43 the
skirt body croquis rebuilt). The Fable epic (F1 real-world exports, F2 the
guided journey) merged clean on top, and Slice 44 captured the demo artifact
proving the coached journey reaches a real, calibration-verified export.

**As of Slice 44 the project moved from tactical slice-by-slice planning to a
strategic MVP plan.** The dependency spine below is COMPLETE; the roadmap
prose that used to follow it (skirt bridge → UX pressure test → photo/upcycle
features) is now either done or superseded — do not follow it. The live plan
lives in two project-knowledge docs:
- **ROADMAP.md** — full competitor analysis (Tailornova, FreeSewing,
  GarmentCode, CLO/Optitex/Lectra), the honest 145–235-slice full-scope
  estimate, and everything explicitly cut from v1 (photo→pattern
  reconstruction, the vendor marketplace database, 3D drape simulation, the
  tailored jacket).
- **MVP-PLAN.md** — the operative 6-month, ~117-slice execution plan: Month 1
  physical-fit validation + Electron packaging, Months 2–3 component
  architecture (the multiplier — study GarmentCode's decomposition first),
  Month 4 the woven shirt block, Month 5 trousers + surface design, Month 6
  beta. Velocity is measured from this repo's own `git log` (4.7 slices/week
  actual across 44 slices), not guessed.

**Slices 45–48 are all built.** MVP-PLAN.md Month 1's Electron line is done
except auto-update (deliberately unscoped — no real release feed to verify
against). **The component-architecture design doc is AGREED**
(`COMPONENT-ARCHITECTURE.md`) — all four open decisions answered, ready for
Phase A. Two things remain outside the codebase, and neither is code: sewing
the sample-size tee and filling in the Fit Record by hand, and starting the
code-signing certificate procurement (MVP-PLAN.md §1.4) — a lead-time
blocker, worth starting regardless of signing itself not being scoped yet.
**Phase A of the component-architecture migration is COMPLETE** — stitches
are real, declared data on every recipe's block, `garmentReport` reads them
generically, and the hand-written seam checks that used to encode
construction knowledge backwards (inside their own verification) are gone.
Byte-identity held at every step, proven against a frozen golden master, not
a live comparison that could have quietly become self-referential.
**Immediate next slice: Phase B** (COMPONENT-ARCHITECTURE.md §9) —
`Component`/`ComponentResult` types, then extracting Bodice (collapsing the
`draftFront`/`draftBack` duplication) and Sleeve (fixing the latent
armhole-coupling risk documented in §2.4: the sleeve currently fits itself
to a re-derived tee bodice rather than the one actually in the block).
No garment drafted by this engine has been physically validated yet; that
remains the single highest-priority open risk in the project until a Fit
Record comes back filled in.

Dependency spine (✓ = done, all done):
notches ✓ → ease ✓ → grading ✓ → tech pack ✓ (spec sheet + document) →
nesting ✓ → checker ✓ → editor ✓ → fitted recipe ✓ → darts ✓ → body view ✓ →
Block generalization ✓ → skirt bridge ✓ (checks/guidance/Measurements/
styles/figures, recipe-owned) → real-world export ✓ → guided journey ✓ →
demo artifact ✓ (Slice 44).

_The detailed "History:" sub-list previously here duplicated slices already
described above under "Slices done" (30–34) and has been removed rather than
kept as a second stale copy._

- ✓ **30 (D). Hover highlights the outline too** (done) — a measurement→edges map
  alongside the dimension-line map; hovering/focusing a row lifts the outline
  segments that measurement shapes to opacity 1 and fades the rest to 0.15. Pure
  UI, no engine touched.
- ✓ **31 (A). Plausibility & proportional-coherence checks** (done) — two pure
  guidance families in `plausibility.ts`, both **warn, never clamp**: (1) absolute
  per-measurement bounds (`MEASUREMENT_BOUNDS`); (2) proportional coherence
  (`RATIO_BOUNDS`: chest↔shoulder, chest↔length, bicep↔chest) catching a mismatched
  set even when each value passes its own bound. Correction found while building:
  grading is RELATIVE (deltas around the user's base), so the "size chart grading
  already uses" the plan named does not exist — bounds are instead DECLARED, seeded
  from published adult ranges and centred on STANDARD_M. `guide()` now warns on
  chest 160 (four notes) where it used to draft silently.
- ✓ **32 (C). Verdict & honest surfacing** (done) — a top-line guidance verdict
  ("⚠ N to review" / "✓ Looks production-ready"); implausible inputs get an amber
  outline at the field; the check banner and the style ✓ withhold green while
  `measurementsPlausible` is false. chest 160 sews yet reads "⚠ Sews together, but
  check the flagged measurements" — the falsely-validated screenshot is dead.
- ✓ **33 (B). Guidance message-quality pass** (done) — every message is stateful
  (names the current value) and ends in a plain verdict; `easeRange` now gives a
  positive in-range note instead of silence. Severity is an icon (`SEVERITY_ICON`
  = ⚠ / ℹ / ✓), rendered alongside colour so it survives colour-blindness/greyscale.
  `SEVERITY_ICON` is exposed data — Fable's F2 renders it, never redefines it.
- ✓ **34 (E). Body-vs-finished facets** (done) — `drafting/facets.ts` classifies
  each field body/finished and exposes the finished value where ease applies (chest
  +ease, sleeve +ease*0.5), traced to real draft usage. Control rows carry a static
  "body · circ" / "finished" tag; `measurementFacet` is the exposed datum Fable's F2
  renders. Completes Opus Phase A.

Then: the **skirt** recipe itself, once `Measurements` carries waist/hip. The
generalization is now well underway — Block (s25) and the checker (s35) are
garment-agnostic; guidance and `Measurements` are the remaining tee-shaped pieces.

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
  **Slice 45 built the harness for exactly this gap** (`drafting/fit-compare.ts`
  + the tech-pack's 4th page): sewability ≠ fit, and the harness doesn't paper
  over that — it exists so an actual sewn garment's measurements can be checked
  against the prediction, per POM, against each POM's own declared tolerance.
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
  garment-specific — draft fn, notch table, POM list, grade rule, size run, check
  spec, guidance, and styles. Every view is driven by it; the engine never imports
  a t-shirt table. **Three recipes ship: tee, fitted (darted), and skirt** — one
  structurally different garment family (no sleeve/armhole/neckline), proving the
  split holds across families, not just variants within one (Slices 35–43). What
  does NOT yet exist: component reuse BETWEEN recipes — the skirt's waistband and
  the tee's hem are two separate hand-written implementations, not shared parts.
  Building that (sleeve / neckline / collar / cuff / waistband as interchangeable,
  parameterised components) is Months 2–3 of MVP-PLAN.md and the top architectural
  priority right now. All garments share one body grade rule; a garment-specific
  grade is a later edit.
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
**Superseded by ROADMAP.md §1** (Slice 44's deeper, current competitive analysis).
Original landscape study (Seamly2D/Valentina, Tailornova, Fabra, Knitup,
Gerber/Lectra/Optitex) still holds; added since: **FreeSewing** (our closest
architectural peer — code-defined parametric patterns; their 2026 "Library"
refactor is a direct warning to build components BEFORE garments, which is why
that's Months 2–3 of MVP-PLAN.md and not later) and **GarmentCode** (ETH Zurich,
SIGGRAPH Asia 2023 — the strongest available reference for that component
architecture). Differentiators, updated: parametric grading, auto POM/tech-pack
export, fabric-aware ease guidance, the plain-English production-readiness
checker, and — new, and the one that actually matters — **physically verified
fit**, which no competitor in our tier claims.

## Test counts (proof a slice landed)
s4=58, s5=72, s6=82, s7=89, s8=94, s9=103, s10=119, s11=139, s12=155, s13=171,
s14=187, s15=202, s16=219, s17=239, s18=257, s19=268, s20=285, s21=321, s22=327
(+1 post-s22 SVG-export bugfix = 328), s23a=343, s23b=348, s24=355, s25=360, s26=368, s27=374, s28=381, s29=386, s30=396, s31=412, s32=429, s33=431, s34=445,
F1=493 (48 new: 9 unfold, 17 projector, 12 A0, 8 byte-identity regression, 2 UI),
F2=530 (37 new: 27 journey unit, 10 app journey-flow)
s35=538 (8 new: 6 tshirt-checks unit, 2 garment-agnostic stub)
s36=541 (net +3: sleevedTopGuidance + agnostic guide payoff; tee-guidance tests moved)
s37=547 (net +6: fields filter, waist/hip facets+persist round-trip+lenient migration)
s38=561 (14 new: skirt draft/checks/guidance/POM + garment-switch UI + waist/hip bounds)
s39=565 (4 new: recipe-owned style table + skirt style set; tee style panel unchanged)
s40=573 (8 new: skirt assembled + body figures, real-SVG-parse + geometry; tee unchanged)
s41=583 (10 new: garment-scoped plausibility/coherence tiers + guide()/app.ts skirt bugfix regression; tee byte-identical)
s42=599 (16 new: hipDepth field across 6 registries, measured-vertex figure gates, hem-clears-hip warn, legacy-save compat; skirt draft + both figures + tee/fitted guidance all byte-identical),
s43=611 (net +12: skirt body croquis rebuilt — path-connectivity + mirror-symmetry + crotch + dim-gutter + cloth-outside-body gates; tautological hip>waist test deleted; only skirt.body changed, every other output byte-identical),
s44: no test-count change (non-coding slice — demo capture; RESUME-LOG.md updated, not the repo),
s45=630 (19 new: 11 fit-compare unit incl. inclusive-tolerance boundary + null-when-no-tolerance + missing-label throw; 8 net tech-pack — new Fit Record page tests + page-bounds regression gate + 2 updated callout counts; tech-pack byte-identity baseline updated, svg/dxf/pdf untouched),
s46=631 (1 new: app.test.ts's electronAPI branch; the desktop shell itself — electron/main.cts, preload.cts, verify-save.cjs — is a new e2e gate outside the Vitest suite entirely, verified separately via npm run electron:verify[-packaged]),
s47=633 (2 new: menu-dispatch routes through the real button not a duplicate path, mount() never throws with electronAPI entirely absent; menu/window-state/identity/title are a second e2e gate, npm run electron:verify-menu[-packaged], 4 checks × 2 environments × 2 runs, all passing),
s48: no test-count change (design doc, not code — COMPONENT-ARCHITECTURE.md agreed, ready for Phase A),
s49=654 (21 new, all in stitch.ts/stitch.test.ts: interfaceLength + stitchChecks unit tests on synthetic data, plus the real equivalence proof — 4 tee points + 3 fitted points + 3 skirt points, field-by-field against the actual hand-written checks, mutation-verified. Zero other file's test count changed.),
s50=660 (net +6: golden-master sanity tests (3) + skirtPanelChecks/allSkirtChecks coverage (2) + sleevedTopStitches/sleevedTopPanelChecks rewrite (net, replacing the deleted sleevedTopChecks tests) — 15 files modified, 2 new; byte-identity regression 8/8 unchanged, confirming the migration touched zero export-writer output)
s51=671 (11 new, all in stitch.test.ts: 4 matchedNotch unit tests + 3 TSHIRT_NOTCHES + 2 FITTED_NOTCHES + 2 SKIRT_NOTCHES field-by-field equivalence tests against the pre-migration literal tables; 5 files modified, 0 new; regression.test.ts's 8/8 tee/fitted SHA-256 baseline unchanged, confirming zero export-writer output moved)
s52=680 (9 new, all in the new component.test.ts: 2 Component/ComponentResult shape tests + 7 assembleComponents tests incl. multi-component role-order, stitch-concatenation-order, connecting-stitches-appended-after, and the duplicate-role throw, mutation-verified; 2 new files (component.ts, component.test.ts), 1 file modified (index.ts barrel export only); zero existing recipe touched, so no byte-identity risk this slice)
s53=686 (6 new, all in the new bodice.test.ts: 4 Component-contract tests (role-keyed pieces, no internal stitches, correct armhole interface, front/back neckline depths differ) + 2 draftFront/draftBack-ARE-bodice's-output equivalence tests; 2 new files (bodice.ts, bodice.test.ts), 2 files modified (tshirt.ts, index.ts barrel export); tshirt.test.ts's pre-existing golden-point assertions + regression.test.ts's 8/8 SHA-256 baseline (tee + fitted) both passed unmodified, mutation-verified via a corrupted neckline control factor)
s54=692 (6 new, all in the new sleeve.test.ts: 3 Component-contract tests (role-keyed piece, no stitches/interfaces, targetArmhole genuinely used) + 1 draftSleeve-IS-sleeve's-output equivalence test + 2 §2.4-fix proof tests (draftTshirt/draftFitted measure the REAL assembled armhole, draftFitted's off the actual darted front by name); 2 new files (sleeve.ts, sleeve.test.ts), 3 files modified (tshirt.ts, fitted.ts, index.ts barrel export); every pre-existing test incl. fitted.test.ts's sleeve equivalence check and regression.test.ts's 8/8 baseline passed unmodified — byte-identical at STANDARD_M by construction, mutation-verified by dropping the back's armhole from the target sum and confirming 5 tests across 3 files failed immediately)
s55=702 (10 new, all in the new neckline.test.ts: 3 crew-geometry tests (point placement, front/back control-factor difference, params-default-to-NECKLINE_DEFAULT) + 4 deliberately-unimplemented tests (throws on v, scoop, boat, non-zero widthEase, non-zero frontDrop) + 3 draftFront/draftBack/draftFittedFront-ARE-necklineEdge's-output equivalence tests; 2 new files (neckline.ts, neckline.test.ts), 3 files modified (bodice.ts, fitted.ts, index.ts barrel export); every pre-existing test incl. fitted.test.ts's neckline-verbatim check and regression.test.ts's 8/8 baseline passed unmodified, mutation-verified by corrupting the back control factor and confirming 9 tests across 2 files failed immediately)
s56=709 (net +7 vs s55, neckline.test.ts rewritten for the new 6-arg necklineEdge signature: crew tests kept + v-geometry, widthEase/frontDrop application, guardrail solo/combined/silent-at-default, and the narrowed scoop/boat-only throw tests added; 0 new files, 4 modified (neckline.ts, neckline.test.ts, bodice.ts, fitted.ts); every pre-existing test, incl. regression.test.ts's 8/8 baseline, passed unmodified — byte-identical at NECKLINE_DEFAULT despite both call sites gaining 2 new required params; mutation-verified by disabling the shoulder guardrail's condition and confirming 2 tests failed immediately)
s57=720 (net +10 new in waistband.test.ts (Component contract, geometry, closure-inertness proven directly, real draftSkirt wiring) + skirt.test.ts/stitch.test.ts updated in place for the new 3-piece/2-stitch skirt shape — NOT preserved unmodified, since skirt has no byte-identity gate; garment-check-golden.ts's SKIRT_GOLDEN_REPORTS regenerated from a real post-change garmentReport run, per that file's own "regenerate only before a behaviour change" rule; 2 new files, 6 modified; regression.test.ts's 8/8 tee/fitted baseline untouched since neither recipe was touched; verified against the real export pipeline (SVG/DXF/tech-pack), not just unit tests; mutation-verified twice)
s58=723 (3 new, all in skirt.test.ts: the skirtPanel Component-contract test, the flare-throws test, and the draftSkirt-front/back-ARE-skirtPanel's-output equivalence test; 0 new files, 2 modified (skirt.ts, skirt.test.ts); every pre-existing test passed unmodified, incl. regression.test.ts's 8/8 baseline and every Slice-57 skirt test — panel()'s own geometry never changed; mutation-verified by disabling the silhouette guard and confirming the throw test failed immediately)
s59=735 (12 new, all in the new tank.test.ts: structure/neckline-kind/stitch tests (4) + tankGuidance never-throws + 2 guidance-content tests (3) + notch/POM-count tests (2) + 3 end-to-end tests (registry fields, graded spec sheet grows in order, full garmentReport passes); 2 new files (tank.ts, tank.test.ts), 5 modified (bodice.ts — gained optional necklineParams, recipe.ts, recipe.test.ts, style.ts, index.ts); every pre-existing test incl. regression.test.ts's 8/8 baseline passed unmodified since necklineParams defaults preserve tee/fitted exactly; verified against the real export pipeline (SVG/DXF/techpack/guidance), not just unit tests; mutation-verified by swapping the tank's front neckline back to crew and confirming immediate failure)
s60=750 (net +12 vs s59: 3 new scoop-geometry tests in neckline.test.ts (replacing the old throws-on-scoop test, since scoop is real now) + 1 updated tank.test.ts assertion (scoop vs crew control-factor comparison, replacing the old v-vs-crew kind check) + 4 new sleeveless-garment tests in garment.test.ts + 6 new sleeveless-figure tests in body.test.ts + 2 new DOM-level integration tests in app.test.ts (tank draws without a sleeve in both views; tee still draws WITH one); 0 new files, 10 modified; regression.test.ts's 8/8 baseline and every pre-existing render/body/garment test passed unmodified — hasSleeve defaults to true; the app.test.ts integration tests exist specifically because the first mutation test against a hardcoded app.ts wiring bug was caught by NOTHING until they were added — see the slice-60 log entry)
s61=764 (14 new: 3 body.test.ts (chest-width sync, real front-collar geometry, scoop-vs-crew collar differs) + 3 garment.test.ts (real front-collar geometry, changing only the front neckline moves only the front path, defaults to crew) + 2 skirt-figure.test.ts (real waist/hip sync, body/garment agreement across waist/hip/ease combos) + 3 recipe.test.ts (tee/fitted/tank's declared frontNeckline/backNeckline reproduce the actual drafted edge) + 3 in the new neckline-path.test.ts (curve emits two mirrored halves, V emits two lines not a curve, control points mirror correctly); 2 new files (render/neckline-path.ts, render/neckline-path.test.ts), 13 modified; regression.test.ts's 8/8 SHA-256 baseline unchanged by construction — nothing here touches drafting/ output or export/; one pre-existing app.test.ts assertion legitimately updated (it was checking for the OLD placeholder curve's "/Q /" signature — the bug's own fingerprint — now checks for the real "/C /" cubic curve), not reverted)
s62=765 (net +1: neckline.test.ts's crew "different control-point factors" test replaced with a right-angle-tangent proof (front AND back), its scoop-specific tests replaced with a byte-identical-to-crew-at-same-depth/width proof; tank.test.ts's scoop-vs-crew test rewritten for depth-only distinction + 1 new shoulder-alignment test (net +1 here); neckline-path.test.ts's mirror test fixed for a rounding-precision false failure, not a real bug. regression.test.ts's tee/fitted SVG/DXF/PDF/tech-pack baseline DELIBERATELY regenerated — Kshitij's explicit sign-off requested and given before building, since the old baseline encoded the exact spiked curve being fixed; this is only the 2nd time since Slice 34 this baseline has moved (1st: Slice 45's tech-pack-only page addition). 0 new files, 7 modified (neckline.ts, neckline.test.ts, tank.ts, tank.test.ts, recipe.ts, neckline-path.test.ts, regression.test.ts); verified on a fresh clone via plain `git apply` + full gate + production build, not just in the working copy; every OTHER test (structure, stitch-matching, POMs, checks) passed unmodified, confirming the blast radius is exactly the neckline curve's shape)
s63=790 (25 new: 8 in the new armhole.test.ts (strap/underarm points, cuts-in-vs-straight-line proof, guardrails) + 8 tank.test.ts (strapWidth/neckDrop actually wired into the real drafted edges, front-only neckDrop, both new guardrails surfacing through tankGuidance) + 3 persist.test.ts (round-trip + pre-Slice-63 lenient load + out-of-range default, mirroring hipDepth's own precedent) + 3 body.test.ts (real strap point, byte-identical when omitted, moves with strapWidth) + 3 garment.test.ts (same, both panels); 2 new files (drafting/armhole.ts, drafting/armhole.test.ts), 17 modified (measurements.ts, plausibility.ts, controls.ts, facets.ts, drafting/index.ts, bodice.ts, tank.ts, tank.test.ts, recipe.ts, recipe.test.ts, app.ts, persist.ts, persist.test.ts, render/body.ts, render/body.test.ts, render/garment.ts, render/garment.test.ts); regression.test.ts's 8/8 baseline untouched by construction (never touches tshirt.ts/fitted.ts output); verified on a fresh clone via plain `git apply` + full gate + production build + all three views (body/garment/actual pattern) re-rendered and visually cross-checked at 3 strap widths, front and back matching at every one)
s74=858 (2 new tests: readable Polo shelf layout and Polo option-to-Body-feature spotlight; shared Polo schematic refactor and browser visual audit; full coverage remains 100%, legacy export hashes unchanged)
