# InfiniDrip UI Bug Ledger

Baseline: Slice 93 live UI audit, 2026-09-12
Phase: `BUGFIX` before Epic 3
Status at creation: all records `Open`

This is the durable record for the UI/UX audit. Stable IDs remain traceable
after implementation, commit, push, or later closure. The baseline came from a
live audit of all six garments and their user-facing views, including narrow
viewport behavior, invalid values, Save/Load, exports, and journey transitions.
No console runtime errors were observed during that audit.

## Record fields

- `Severity`: impact (`S1` critical through `S4` minor).
- `Priority`: execution order (`P1`, `P2`, or `P3`).
- `Epic`: one of the three `EPIC-BUGFIX-*` milestones.
- `Status`: `Open`, `In progress`, `Blocked`, `Fixed`, `Verified`, `Closed`, or
  `Won't fix` with a recorded decision.
- `Root cause`: confirmed cause when known; otherwise an initial hypothesis that
  must be replaced with evidence during the fix.
- `Fix slice`: the slice that changes behavior.
- `Commit/PR`: immutable implementation reference once available.
- `Verification`: tests, live reproduction, and rendered/output evidence.

## `EPIC-BUGFIX-P1`

### BUG-UI-001 — Fixed shell does not reflow at narrow widths

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S2`, status `Closed`.
- Evidence: at 390px, document width was about 754px; at 768px, guidance and
  toolbar panels collided or became unreadably narrow.
- Root cause: the app shell is a fixed multi-column flex layout without a
  responsive breakpoint or wrapping strategy. Source: `src/ui/view.ts:341`.
- Done when: the primary workflow is usable at supported narrow widths with no
  horizontal overflow or overlapping controls; live viewport evidence is saved
  in the verification record.
- Fix slice: BF-P1-06. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: the shell used fixed flex columns, a 300px workspace
  minimum and non-wrapping control rows with no narrow-width breakpoint.
- Tests: responsive markup assertions and the full app/view suite; a real 390px
  viewport check found no overflowing element or document horizontal overflow.
- Live/rendered/output evidence: at 390×844 the controls, journey, toggles and
  preview stack and wrap within the viewport; the responsive screenshot was
  inspected. No unsupported device claim is made.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-002 — Negative-ease guidance contradicts the Ease input

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: Spandex guidance recommends approximately `-8 cm`; entering `-8`
  leaves `-8` visible while drafting and guidance use `0`.
- Root cause: the UI minimum is `0` while the ease model supports negative ease;
  change handling clamps silently. Sources: `src/ui/controls.ts:15`,
  `src/drafting/ease.ts:24`.
- Done when: supported negative ease is represented consistently, or an invalid
  combination is explicitly rejected with an actionable field-level correction;
  displayed and drafted values cannot diverge.
- Fix slice: BF-P1-01. Commit/PR: `8f44f05`.
- Root cause confirmed: range minimum 0 and `applyChange` clamp replaced -8 with 0.
- Tests: controls and P1 DOM regressions verify verbatim -8 and real draft output.
- Live/rendered/output evidence: negative-ease draft and -8 guidance inspected in
  the live app; see `docs/planning/BUGFIX-P1-EXECUTION.md`.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-003 — Out-of-range input is silently clamped and left displayed

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: Chest `20` remained visible while geometry/guidance used the clamped
  value `60`, with no field error or invalid styling.
- Root cause: UI change handling clamps to bounds rather than preserving an
  invalid value as an explicitly diagnosed state. Source: `src/ui/controls.ts:34`.
- Done when: every invalid value is visible as invalid with a direct correction,
  and no hidden replacement occurs.
- Fix slice: BF-P1-01. Commit/PR: `8f44f05`.
- Root cause confirmed: clamp on input and replacement on blur; blank was converted to zero.
- Tests: empty/range/finite bounds, focus retention, disabled export and Edit recovery.
- Live/rendered/output evidence: Chest 20 remains visible with associated 60–160
  correction and paused draft, then recovers; see `docs/planning/BUGFIX-P1-EXECUTION.md`.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-004 — Finished measurement totals do not update live

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S2`, status `Closed`.
- Evidence: Chest changed from `100` to `120`; guidance changed but the visible
  summary remained `Finished chest: 110 cm`.
- Root cause: controls are not rerendered during draw even though totals are
  computed in controls markup. Sources: `src/ui/view.ts:49`, `src/ui/app.ts:208`.
- Done when: all derived totals update from the current state without stale
  summaries or focus loss.
- Fix slice: BF-P1-02. Commit/PR: `ba98cbb` (`Slice BF-P1-02: unify digital verdicts [BUG-UI-004, BUG-UI-005, BUG-UI-012]`).
- Root cause confirmed: Controls were rendered only on mount/garment switch; draw now updates the finished chest/hip text in place without replacing focused inputs.
- Tests: P1 DOM regressions, original app/view/journey suites; 73 files / 921 tests,
  100% coverage, TypeScript/build, parsed export consumers and eight unchanged hashes.
- Live/rendered/output evidence: Chest 120 immediately shows 130 cm; woven count
  6.5 withholds every green verdict and disables export; corrected count restores
  digital pass. Screenshot and actual diff inspected. See `docs/planning/BUGFIX-P1-EXECUTION.md`.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-005 — Invalid design options do not gate readiness or exports

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: woven button count `8` produced guidance warnings, while Check said
  `Ready to cut`, Style remained green, and exports remained enabled.
- Root cause: Check, Style, and journey gates use sewability/plausibility but do
  not consume recipe option guidance. Sources: `src/guidance/garment-check.ts:64`,
  `src/ui/view.ts:316`.
- Done when: every invalid state has one consistent verdict across Guidance,
  Style, Check, journey, and exports.
- Fix slice: BF-P1-02. Commit/PR: `ba98cbb` (`Slice BF-P1-02: unify digital verdicts [BUG-UI-004, BUG-UI-005, BUG-UI-012]`).
- Root cause confirmed: UI green states consumed geometry/plausibility but omitted recipe warnings. A shared current-state verdict now gates Guidance, Check, Style, journey and all six export handlers.
- Tests: P1 DOM regressions, original app/view/journey suites; 73 files / 921 tests,
  100% coverage, TypeScript/build, parsed export consumers and eight unchanged hashes.
- Live/rendered/output evidence: Chest 120 immediately shows 130 cm; woven count
  6.5 withholds every green verdict and disables export; corrected count restores
  digital pass. Screenshot and actual diff inspected. See `docs/planning/BUGFIX-P1-EXECUTION.md`.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-006 — Save/Load does not round-trip the active workspace

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: saving a Woven Shirt draft and reloading reopened Tee. Active garment,
  style, material/stretch choice, view, export size, and nesting scope are not
  all saved.
- Root cause: persistence stores only a subset of measurements, fabric, and
  garment options. Sources: `src/ui/persist.ts:1`, `src/ui/app.ts:36`.
- Done when: a saved workspace restores all intentionally persistent state, with
  documented migration behavior for older saves.
- Fix slice: BF-P1-03. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: the save payload contained measurements, fabric and
  options only; active recipe and other workspace choices were transient UI state.
- Tests: version-4 workspace round-trip and app restart/load DOM regressions cover
  garment, style, material, view, export size, nesting scope, width, color and options.
- Live/rendered/output evidence: a woven-shirt workspace was saved, changed, loaded,
  and remounted; all controls, selected states and the rendered view matched.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-007 — Load updates rendering without synchronizing visible controls

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S2`, status `Closed`.
- Evidence: saved button count `6`, changed field to `7`, then loaded; preview
  used `6` while the field still displayed `7`. Loading Charcoal changed the
  garment but left Indigo visually selected.
- Root cause: Load refreshes only measurement inputs and drawing; option inputs
  and swatch selection state are not refreshed. Sources: `src/ui/app.ts:447`,
  `src/ui/app.ts:569`.
- Done when: every restored value has one visible control state and visual
  selection state agrees with the rendered recipe.
- Fix slice: BF-P1-03. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: Load updated measurements and the drawing but never rebuilt
  recipe option controls, garment selection, swatch state, or workspace selectors.
- Tests: app DOM regressions verify restored option value, garment/material pressed
  state, style/stretch/view/size/width/scope controls and a fresh mount.
- Live/rendered/output evidence: restored woven preview and Side/Nesting selections
  were inspected in the live app; control state agreed with the rendered output.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-008 — Save accepts values that persistence later rejects

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: UI accepted Length `100`; Save reported `Saved ✓`; Load reported
  `Nothing saved` because persistence validation allows only through `90`.
- Root cause: UI and persistence bounds are separate and inconsistent. Source:
  `src/ui/persist.ts:42`.
- Done when: one shared validation contract governs edit, save, load, guidance,
  and status messaging; a rejected save explains why.
- Fix slice: BF-P1-03. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: UI and persistence had separate bounds; Length 100 was
  accepted in the UI but rejected by the old persistence contract.
- Tests: shared `FIELDS`/`inputError` validation covers save, load, edit and status;
  invalid current saves preserve the prior stored workspace and explain the error.
- Live/rendered/output evidence: invalid Length 110 and incomplete Chest are retained
  visibly, Save reports the exact correction, and Load preserves the previous save.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-009 — Export cancellation or failure can report success

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: Electron returns `{saved:false}` on cancellation, but the renderer
  ignores the result and marks the journey exported. Browser downloads are also
  marked complete immediately after clicking the anchor.
- Root cause: export result/error handling is fire-and-forget. Sources:
  `src/ui/app.ts:496`, `electron/main.cts:170`.
- Done when: only a confirmed successful write marks export complete; cancel and
  failure show distinct, actionable feedback.
- Fix slice: BF-P1-04. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: Electron's save promise was ignored and browser anchor
  clicks were treated as proof of a completed filesystem write.
- Tests: P1 DOM regressions cover confirmed success, cancellation, rejection,
  browser-start failure and celebration dismissal; full app/journey suite passes.
- Live/rendered/output evidence: browser download reports “Download started” and
  leaves Files exported incomplete; desktop cancellation/failure report distinct
  actionable messages. No physical or production claim is made.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-010 — Export completion is not invalidated by later changes

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: after export, changing Chest or switching garments left
  `Files exported ✓` active for the new design.
- Root cause: journey export state is not dirtied when recipe, measurements, or
  options change. Source: `src/ui/app.ts:507`.
- Done when: any output-affecting change makes the previous export stale and the
  journey clearly identifies what must be exported again.
- Fix slice: BF-P1-04. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: journey export state had no dirty transition when the
  recipe, measurements, options or export/workspace choices changed.
- Tests: P1 DOM regression confirms a successful export is cleared after a later
  measurement change; all relevant app/journey tests pass.
- Live/rendered/output evidence: changing the current design removes the Files
  exported completion state and restores the next-action prompt.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-011 — Woven assembled preview omits or misplaces construction details

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S1`, status `Closed`.
- Evidence: preview lacks collar/stand silhouette, point collar leaf, sleeve band,
  curved hem, and back yoke; yoke guide is drawn across the front. Collar leaf
  depth changes the pattern but not the assembled preview.
- Root cause: `wovenShirtFrontDetails()` draws a small subset of front-only
  details and does not consume the complete component contract. Source:
  `src/render/garment.ts:148`.
- Done when: front and back preview geometry visibly matches the drafted woven
  components and every live option that claims visual impact changes the preview.
- Fix slice: BF-P1-05. Commit/PR: `65fcc86` (`Slice BF-P1-03–06: complete workspace, export, woven preview, responsive fixes [BUG-UI-001, BUG-UI-006–011]`).
- Root cause confirmed: the preview emitted only partial front details and placed
  a yoke guide across the front; it omitted the collar/stand, sleeve band,
  curved hem and back-only yoke contract.
- Tests: 23 garment-render tests, woven app route regressions and all parsed woven
  export consumers pass; full P1 gate is recorded below.
- Live/rendered/output evidence: front/back detail groups, live button count,
  collar/stand, pocket/placket, back yoke, sleeve band, curved hem and vent cues
  were inspected in the rendered app; live option changes alter the SVG.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-012 — Digital checks use production-readiness language

- Tags: `BUGFIX`, `EPIC-BUGFIX-P1`, `P1`, `S2`, status `Closed`.
- Evidence: Check says `Ready to cut` and Guidance says `Looks production-ready`,
  although the project has no physical sewing/fit validation.
- Root cause: UI copy does not distinguish digital sewability checks from real-
  world validation. Sources: `src/ui/view.ts:70`, `src/guidance/garment-check.ts:13`.
- Done when: status copy accurately states what was digitally checked and avoids
  physical fit or production claims.
- Fix slice: BF-P1-02. Commit/PR: `ba98cbb` (`Slice BF-P1-02: unify digital verdicts [BUG-UI-004, BUG-UI-005, BUG-UI-012]`).
- Root cause confirmed: Legacy UI wording overstated geometry checks. Status now describes digital checks and explicitly identifies pending physical validation.
- Tests: P1 DOM regressions, original app/view/journey suites; 73 files / 921 tests,
  100% coverage, TypeScript/build, parsed export consumers and eight unchanged hashes.
- Live/rendered/output evidence: Chest 120 immediately shows 130 cm; woven count
  6.5 withholds every green verdict and disables export; corrected count restores
  digital pass. Screenshot and actual diff inspected. See `docs/planning/BUGFIX-P1-EXECUTION.md`.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

## `EPIC-BUGFIX-P2`

### BUG-UI-013 — Intrinsic SVG aspect ratios create tiny or giant work areas

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Closed`.
- Evidence: Woven Pattern is a thin strip; Woven Side is about 1441px tall;
  Marker is about 1144px; Edit is about 1119px. No fit, max-height, zoom, or
  pan behavior exists.
- Root cause: SVGs use width `100%` with unconstrained viewBox aspect ratios.
  Sources: `src/render/croquis-view.ts:45`, `src/render/canvas.ts:165`.
- Done when: each view has a predictable initial fit and usable inspect/zoom
  behavior without pushing the workflow below an unreasonable scroll distance.
- Fix slice: BF-P2-01. Commit/PR: pending (BF-P2-01 behavior commit).
- Root cause confirmed: linear component placement produced a very wide, short
  woven SVG and the UI rendered every intrinsic ratio directly with no bounded
  inspection surface. Portrait Side/Edit canvases consequently expanded the
  page instead of providing a local inspection area.
- Tests: canvas shelf-layout regression; inspection markup, body-focus,
  persistence, zoom and app view regressions; 166 focused tests pass.
- Live/rendered/output evidence: at the live 1280×720 viewport, woven Pattern
  now renders viewBox `0 0 178.5 239.6` at 387×520 inside the inspection frame;
  the upper Side schematic is capped at 170×520 and centered; Front focus is
  564×423. Fit/zoom controls were exercised from 100% to 125% and back. No
  physical-fit or production-readiness claim is made.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-014 — Pattern, nesting, and marker labels collide or become unreadable

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: Woven pieces are shown in one linear row; nesting and marker labels
  overlap heavily at normal UI scale.
- Root cause: layout is linear and label placement has no collision strategy,
  legend, or piece focus mode. Source: `src/render/canvas.ts:44`.
- Done when: piece identity, size, grain, fold, and marks can be read and
  inspected at normal scale or through an explicit focus affordance.
- Fix slice: BF-P2-01. Commit/PR: pending (BF-P2-01 behavior commit).
- Root cause confirmed: linear shelves had no row wrapping or title lane, so
  woven pieces and their construction labels were compressed into one strip.
  The bounded inspection frame now gives the full shelf layout a readable
  initial fit and explicit zoom affordance.
- Tests: linear shelf-wrap renderer regression plus the focused app/view/render
  suite; 166 focused tests pass.
- Live/rendered/output evidence: woven Pattern was inspected in the live app;
  all component labels, fold/grain/mark text remain in the rendered SVG and the
  wrapped view fits the local inspection frame without page-wide horizontal
  overflow at 1280×720.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-015 — Body croquis figures and annotations are too small

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: front/back figures render side by side at roughly 230px each with
  tiny annotations; there is no single-figure zoom/focus mode.
- Root cause: the pair view gives both figures equal space without a readable
  scale or inspection control. Source: `src/render/body.ts:212`.
- Done when: front and back dimensions can be read without relying on browser
  zoom or horizontal layout luck.
- Fix slice: BF-P2-01. Commit/PR: pending (BF-P2-01 behavior commit).
- Root cause confirmed: the only Body presentation was a side-by-side pair,
  giving each annotated figure half the available width. A bounded frame and
  explicit Front/Back focus now let one figure use the available inspection
  area while preserving the combined view.
- Tests: app regression verifies single-figure Body focus, selected state and
  zoom reset; body markup and persistence tests cover the new modes.
- Live/rendered/output evidence: woven Front focus produced one named SVG at
  564×423 in the 1280×720 live viewport; Front + Back remains available as a
  combined view. No browser-zoom dependence is required.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-016 — Side view has poor context and an extreme vertical footprint

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: Side is labelled only `Side`, renders a long narrow schematic, and
  gives no clear indication that it is render-only rather than measured side
  construction data.
- Root cause: the view exposes the croquis contract without a visible semantic
  explanation and inherits its narrow viewBox. Source: `src/render/croquis-view.ts:45`.
- Done when: Side clearly states its purpose/limits and occupies a usable,
  consistent canvas area.
- Fix slice: BF-P2-01. Commit/PR: pending (BF-P2-01 behavior commit).
- Root cause confirmed: the Side croquis had a narrow intrinsic viewBox and
  only a terse label. The new inspection frame caps its rendered height and
  centers it; the existing explicit SIDE · SCHEMATIC label remains the honest
  indication that it is a render-only envelope with no side-specific inputs.
- Tests: app lower/upper Side regression plus bounded inspection presentation
  coverage; the live app was reviewed at 1280×720 with no page-sized vertical
  expansion.
- Live/rendered/output evidence: Side renders at 170×520 inside the scrollable
  local viewport and visibly says `SIDE · SCHEMATIC`. Physical validation is
  deferred.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-017 — Assembled preview is always present without ownership or collapse

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: the assembled garment remains below Pattern, Body, Spec, Check,
  Nesting, Marker, Side, and Edit, with no `Assembled preview` heading or hide
  control.
- Root cause: `garmentHost` is appended for every view unconditionally. Source:
  `src/ui/app.ts:195`.
- Done when: users can distinguish the active analytical view from the preview
  and control whether the preview occupies the page.
- Fix slice: BF-P2-02. Commit/PR: pending (BF-P2-02 behavior commit).
- Root cause confirmed: `garmentHost` received raw assembled SVG markup with no
  semantic owner or local visibility state. It now renders an Assembled preview
  section with a persistent collapse/expand control while the analytical canvas
  remains separately titled and owned.
- Tests: view markup covers both expanded and collapsed states; app regression
  toggles the preview twice and confirms the owner/title remains present.
- Live/rendered/output evidence: the live 1280×720 app was toggled to Hide
  preview and back to Show preview; `aria-expanded` and rendered visibility
  agreed without changing the active Pattern/Body inspection.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-018 — Woven options are dense, ungrouped, and under-explained

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: thirteen construction options appear in one long block, with no
  groups, helper text, units, or clear mapping to garment features.
- Root cause: option metadata exposes labels and numeric fields but not semantic
  grouping or contextual help. Source: `src/drafting/shirt-contract.ts:38`.
- Done when: options are grouped by construction area, values have correct units,
  and each field explains its effect and valid correction path.
- Fix slice: BF-P2-02. Commit/PR: pending (BF-P2-02 behavior commit).
- Root cause confirmed: `GarmentOption` exposed only labels and numeric bounds,
  so the thirteen woven controls rendered as one unlabelled list with generic
  units. Option metadata now supplies construction groups, units, and a short
  feature/correction explanation; the UI renders native fieldsets and help
  text while preserving raw live values.
- Tests: option metadata/contract, grouped-control markup, unit and help
  assertions, plus app woven-route regressions; 122 focused tests pass.
- Live/rendered/output evidence: the live Woven shirt controls show five groups
  (Neck & collar, Front closure, Back yoke, Pocket, Sleeve & hem), `buttons` on
  count, `cm` on dimensional choices, and per-field correction help. No
  physical construction claim is made.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-019 — Woven option spotlight dims the body without highlighting anything

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S3`, status `Closed`.
- Evidence: hovering/focusing yoke depth dims the entire body canvas to `0.15`
  opacity but highlights no matching feature.
- Root cause: option rows are wired into the generic spotlight listener, while
  the body SVG has no matching option markers. Sources: `src/ui/app.ts:116`,
  `src/ui/app.ts:412`.
- Done when: every spotlight-capable row either highlights a real matching region
  or is not presented as spotlight-capable.
- Fix slice: BF-P2-03. Commit/PR: pending (BF-P2-03 behavior commit).
- Root cause confirmed: option rows reused measurement spotlight wiring, but the
  woven assembled detail SVG exposed only a subset of option markers and the
  spotlight searched the analytical canvas alone. Every woven option now has a
  matching assembled-detail marker and the spotlight searches both surfaces.
- Tests: woven renderer asserts all thirteen option markers; app regression
  focuses every woven option and confirms its matching detail stays visible.
- Live/rendered/output evidence: focusing Woven `Back yoke depth` in the live
  Body route kept the matching assembled yoke detail at opacity 1; all marker
  keys were inspected in the rendered SVG. Rows without a matching feature are
  not presented by this route.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-020 — Material/stretch and color controls are duplicated and can conflict

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Closed`.
- Evidence: two visible controls are both labelled `FABRIC`; one changes guidance
  only and the other changes garment color. Selecting Spandex for the woven shirt
  gives negative-ease advice without a compatibility explanation.
- Root cause: material/stretch advice and visual color are presented under the
  same label with no explicit scope or compatibility layer. Sources:
  `src/ui/view.ts:86`, `src/ui/view.ts:174`.
- Done when: material, stretch, and color have distinct names and incompatible
  combinations are clearly explained or prevented by guidance.
- Fix slice: BF-P2-03. Commit/PR: pending (BF-P2-03 behavior commit).
- Root cause confirmed: the stretch/material selector and color swatches shared
  the word FABRIC while their effects were different; woven shirts could also
  receive knit-only advice with no compatibility warning. Labels now say
  Material / stretch and Color, with visible scope text; a knit selected for a
  woven shirt adds a warning and gates digital readiness without changing the
  user's choice.
- Tests: swatch/material markup and app compatibility-gate regressions; 74 app
  tests plus renderer/view suites pass.
- Live/rendered/output evidence: live Woven + Spandex blend shows the distinct
  material/color controls, the stable-woven warning, and disabled SVG export;
  the selected material remains visible. No physical or production claim is
  made.
- Closed by/date: Codex, 2026-09-12. Final status: Closed.

### BUG-UI-021 — Button-count validation uses wrong units and noisy semantics

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: button count `8` produces `6–7 cm`, plus separate range and whole-
  number warnings. The UI does not state that six/seven placket buttons exclude
  one additional collar-stand button.
- Root cause: generic range-copy logic appends `cm` to every option and emits
  overlapping warnings without semantic helper text. Source: `src/drafting/shirt.ts:554`.
- Done when: count, spacing, and length units are correct and the collar-stand
  button rule is visible wherever the control is edited or reviewed.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-022 — Export size scope is ambiguous

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: a generic `Size` picker sits beside all exports, while Tech Pack and
  Projector export the full graded run rather than the selected size. No scope
  explanation is visible.
- Root cause: one picker is visually adjacent to exports with different scope
  semantics. Source: `src/ui/app.ts:523`.
- Done when: each export clearly states per-size or whole-run scope and the
  selected size cannot be mistaken for the export scope.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-023 — First-run journey has duplicate actions, bypassable steps, and no finish state

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: Start shows Start, Skip, Next, Skip-tour, and clickable future steps;
  clicking Output immediately unlocks the complete surface. After export, Output
  remains `5 Output` rather than becoming complete.
- Root cause: all journey chips accept clicks regardless of progression and the
  final step has no completion transition. Source: `src/ui/journey.ts:164`.
- Done when: onboarding has one clear primary action, progression rules are
  explicit, shortcuts are available only after graduation, and Output completes
  after a confirmed export.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-024 — Returning to Start can display a stale hidden view

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: after visiting Side and returning to Start, the view selector was
  hidden but the canvas still contained the Side SVG.
- Root cause: journey disclosure hides controls without resetting or explaining
  the active view. Source: `src/ui/app.ts:284`.
- Done when: each journey landing state has a defined active view and never shows
  an inaccessible stale canvas.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-025 — Accessibility semantics and editor keyboard access are incomplete

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: live audit found zero headings, no landmarks, no named SVGs, and no
  pressed/selected state for most view/garment buttons. Edit handles are pointer-
  only.
- Root cause: visual panels/buttons/SVGs lack semantic roles and accessible
  names; edit interaction has no keyboard/numeric alternative. Sources:
  `src/ui/view.ts:187`, `src/ui/view.ts:221`, `src/ui/app.ts:313`.
- Done when: headings/regions, selected states, SVG names, keyboard operation,
  focus states, and equivalent editor input are available and tested.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-026 — Guidance is global, distant, and not field-associated

- Tags: `BUGFIX`, `EPIC-BUGFIX-P2`, `P2`, `S2`, status `Open`.
- Evidence: warnings appear in a separate guidance panel with no inline field
  association or direct correction affordance; at narrow widths the panel is
  effectively off-screen.
- Root cause: guidance is rendered as a global note list rather than metadata
  linked to individual controls. Source: `src/ui/view.ts:70`.
- Done when: warnings identify the field/option that caused them, provide an
  actionable correction, and remain reachable at supported viewport widths.
- Fix slice: —  Commit/PR: —  Verification: —

## `EPIC-BUGFIX-P3`

### BUG-UI-027 — Tee defaults to confusing woven/no-stretch material guidance

- Tags: `BUGFIX`, `EPIC-BUGFIX-P3`, `P3`, `S3`, status `Open`.
- Evidence: the default Tee opens with `Cotton woven` and no-stretch guidance,
  which conflicts with the user’s likely knit-tee mental model.
- Root cause: the first stretch-material entry is used as the default for every
  garment. Source: `src/ui/app.ts:56`.
- Done when: defaults are garment-appropriate or the material choice is clearly
  required before interpreting ease guidance.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-028 — Style helper copy says inputs are sliders

- Tags: `BUGFIX`, `EPIC-BUGFIX-P3`, `P3`, `S4`, status `Open`.
- Evidence: visible helper says `Adjust the sliders`, but controls are numeric
  inputs.
- Root cause: stale copy from an earlier control design. Source: `src/ui/view.ts:142`.
- Done when: helper copy describes the actual interaction and its effect.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-029 — Journey garment copy is stale

- Tags: `BUGFIX`, `EPIC-BUGFIX-P3`, `P3`, `S4`, status `Open`.
- Evidence: journey copy says users can switch between Tee and Darted tee despite
  six garments being available.
- Root cause: fixed onboarding copy was not updated as the registry grew. Source:
  `src/ui/journey.ts:125`.
- Done when: journey copy is registry-aware or accurately describes the current
  garment set.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-030 — Single and Marker controls do not explain scope

- Tags: `BUGFIX`, `EPIC-BUGFIX-P3`, `P3`, `S3`, status `Open`.
- Evidence: Nesting controls are labelled only `Single` and `Marker`; users are
  not told whether these mean one selected size, a base size, or the full grade.
- Root cause: terse labels omit the distinction between nesting modes. Source:
  `src/ui/view.ts:278`.
- Done when: each mode states its scope and output consequence in the control
  label or adjacent helper text.
- Fix slice: —  Commit/PR: —  Verification: —

### BUG-UI-031 — Product hierarchy and swatch discoverability are weak

- Tags: `BUGFIX`, `EPIC-BUGFIX-P3`, `P3`, `S4`, status `Open`.
- Evidence: the UI has no visible product heading, panel titles are styled divs
  rather than headings, and color swatches expose names only through hover or
  accessible metadata.
- Root cause: the shell prioritizes compact toolbars over semantic hierarchy and
  visible naming. Sources: `src/ui/view.ts:29`, `src/ui/view.ts:88`.
- Done when: the product and major sections have a clear visual/semantic
  hierarchy and color choices are discoverable without hover.
- Fix slice: —  Commit/PR: —  Verification: —

## Closure record

For every fix, append or update the affected entry with:

```text
Status: Fixed | Verified | Closed
Fix slice: BF-...
Root cause confirmed: ...
Commit/PR: ...
Tests: ...
Live/rendered/output evidence: ...
Closed by/date: ...
```

Do not remove the original reproduction. If the diagnosis changes, preserve the
initial hypothesis and add the confirmed cause below it.
