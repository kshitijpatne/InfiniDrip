# InfiniDrip — Project State

_Last updated: after Slice 47. Update this after every slice (and commit it WITH the code)._

**Governing plan:** MVP-PLAN.md (operative — the 6-month execution plan) and
ROADMAP.md (strategic — full competitor analysis + long-term scope + the cut
list) are the current planning documents, added after Slice 44. This file
remains the engineering status log; it does not restate their content.

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
work. The engine is fully garment-general: **tee, fitted (darted), and skirt**
all run through one `GarmentRecipe`-driven pipeline (draft → grade → POM →
check → nest → edit → export), plus **real-world exports** (projector SVG /
A0 PDF with a verified calibration square) and a **guided 5-step journey** to
a valid export. Repo: github.com/kshitijpatne/InfiniDrip

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

**Slices 45, 46, and 47 are all built.** MVP-PLAN.md Month 1's Electron line
is now fully done except auto-update, which stays deliberately unscoped —
there is no real release feed to point it at yet, and code that compiles
against nothing to update FROM can't be honestly verified, which this
project doesn't ship. Two things remain outside the codebase, and neither is
code: sewing the sample-size tee and filling in the Fit Record by hand, and
starting the code-signing certificate procurement (MVP-PLAN.md §1.4) — a
lead-time blocker, worth starting regardless of signing itself not being
scoped yet. **Immediate next slice: the Month 2 component-architecture
design doc, reviewed before any code** (MVP-PLAN.md Months 2–3; also folds
in ROADMAP.md Priority 1.3's shared croquis library). No garment drafted by
this engine has been physically validated yet; that remains the single
highest-priority open risk in the project until a
Fit Record comes back filled in.

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
s47=633 (2 new: menu-dispatch routes through the real button not a duplicate path, mount() never throws with electronAPI entirely absent; menu/window-state/identity/title are a second e2e gate, npm run electron:verify-menu[-packaged], 4 checks × 2 environments × 2 runs, all passing)
