# Epic 5 (EPIC-5) — Beginner-facing workspace redesign — Slices 114–121

Status: **PASS — Epic 5 exit, Slice 121, 2026-09-19.** The full project gate,
parsed-output gate, legacy-hash gate, accessibility audit, and rendered/live
matrix passed. Epic 4 remains closed.
This is the newly authorized workspace redesign, not a reopened garment-grammar
migration. Branch: `codex/ux-studio`; approved baseline: `816b9ff`.

## Goal and scope

Make InfiniDrip understandable and usable from first launch to export for a
person without pattern-design experience. Resolve all ten screenshot-backed
complaints and additional verified task failures. Keep measurements, meaningful
construction choices, seven garments, seven analysis views, the assembled
preview, grading, checks, nesting, persistence and all six output formats.

Research and observed reproduction: `docs/research/UX-REDESIGN-RESEARCH.md`.
Contributor packets: `docs/planning/UX-REDESIGN-HANDOFFS.md`.

No new garment family, final-design freeform Edit model, physical sampling,
drape simulation, proprietary color-library import, signing/release work,
production dependency upgrade, export baseline rewrite or production-readiness
claim. The final gate adds `axe-core` as a dev-only audit dependency.
Appearance scope is screen color and honest schematic texture/shine, not a
full surface-design/artwork system.

## Acceptance criteria

- At supported widths 1280/900/700/560/390, verify actual viewport dimensions,
  edit the last measurement and each construction group, and retain the active
  design and focused control in view. Test representative short heights and
  keyboard/text zoom; no off-screen focus or page-level horizontal overflow.
- Assembled replaces the canvas from each of the seven views and returns to
  the previous view without losing inputs, projection, transient Edit or context.
- Five stages expose relevant tools; skipping onboarding never marks design
  checks complete. Every blocked Next explains why and offers a working route
  to correct it. Back/revisit preserve state. All existing tools remain reachable.
- Grouped measurements/options have clear units, readable min/max rails,
  direct entry and click/hold +/−; keyboard and pointer paths agree. A guidance
  action reveals the correct group and field without hiding the canvas.
- Garment library and fit choices have distinct visual hierarchy and plain
  descriptions. Compatible untouched defaults do not introduce spurious
  warnings; explicit user material choices are preserved and checked.
- Appearance edits update the live assembled representation, support exact
  keyboard entry, and round-trip through saves. No appearance setting changes
  cutting geometry or implies physical fabric behavior.
- Every meaningful field/option has a truthful Body/feature highlight or an
  explicit route to the relevant projection. A missing target never dims the
  whole figure. Spatial notes remain legible, dismissible/recallable where
  advisory, remove when fixed, and retain ignored issues in Check. Blocking
  failures cannot be hidden into validity.
- Save/restore is always reachable and explains what is saved locally. Dirty
  replacement/discard has Cancel and clear consequences. Recovery handles
  unfinished input without accepting it for drafting/export. Undo/Redo must be
  deliberate and bounded; native text editing must not be hijacked.
- Export appears only after the Check stage, selected size precedes formats,
  each format explains purpose and size scope, and Single size nesting actually
  follows that size. Cancel, failure and changed-design paths remain truthful.
- Clean reusable UI modules; no parallel geometry source, framework rewrite,
  decorative callback layers or tests that assert only SVG presence/counts.

## Slice sequence

Codex owns architecture, shared state, implementation and final decisions.
Research/audit contributors use the disjoint worktrees in the handoff packet.
Use high reasoning only for difficult state/geometry root causes and final
integration; ordinary bounded markup/docs/test work uses lower intensity.

| Slice | Bounded scope / dependency | Verification before acceptance |
|---|---|---|
| 114 | Baseline audit, competitor/forum/video research, explicit interaction specification; no implementation | Actual branch and contributor diffs, live reproductions, source checks, research limitations, durable plan |
| 115 | Stable responsive shell, stage navigation, bounded/grouped inspector, integrated Assembled lens; depends on 114 | Focused state/DOM tests plus live field/canvas visibility, seven-view restoration and keyboard navigation; integration gate |
| 116 | Garment library, fit intent and material selection; depends on 115 | All seven selections, per-garment options/defaults, explicit-choice retention and guidance paths |
| 117 | Contextual color/appearance editor and backward-compatible appearance persistence; depends on 115–116 | Color conversion/input tests, actual appearance changes, old-save migration, full shared-contract gate |
| 118 | Cross-garment highlight contract, spatial guidance and ignored-advice review; depends on 115–116 | Registry-driven target semantics, front/back/Side alternatives, note lifecycles, no-clamp/blocker checks, rendered evidence |
| 119 | Persistent workspace safety, recovery, restore confirmation and bounded Undo/Redo; depends on 115–118 | Dirty/cancel/failed-storage/invalid-draft/old-save/reload/Edit-discard cases, full persistence-contract gate |
| 120 | Check-to-Export flow, format/size context, real selected-size nesting; depends on 115–119 | All output paths and cancellation, size mutation evidence, parsed consumers, unchanged legacy hashes |
| 121 | End-to-end beginner, accessibility and responsive audit; fix found failures; final integration. Trial `axe-core` as dev-only automated evidence, not as an accessibility certificate. | Entire full project gate, reviewed automated findings plus manual keyboard/focus/zoom/viewport evidence, and durable exit report; no deferred acceptance hidden as pass |

Numbers reserve sequence, not permission to skip acceptance. If a discovered
defect changes an invariant, document the decision before implementation; ask
the maintainer only when it needs a product/architecture/scope choice beyond
the authorized redesign.

## Full project gate

Run at shared-contract/export checkpoints and final integration, not repeatedly
during every CSS or focused-test iteration:

1. `npm test`
2. `npm run coverage` — 100% statements, branches, functions and lines
3. `npx tsc --noEmit`
4. `npm run build`
5. Parsed SVG, DXF, tiled PDF, A0 PDF, projector SVG and tech-pack consumers
6. `src/export/regression.test.ts` — all eight hashes unchanged
7. Real rendered/live matrix: seven garments, all controls/views, sizing,
   options/material/appearance, invalid/corrected/dismissed guidance, save/load/
   recovery, every export, supported widths, focus, zoom and visibility
8. Slice 121 only: reviewed `axe-core` results across major stage/dialog
   states; justified exclusions recorded; automation supplements rather than
   replaces the live accessibility matrix
9. Research, execution, PROJECT-STATE, ARCHITECTURE, decisions and bug records
   updated with exact commits and evidence; honest limitations and deferred fit

The previous 81-file/1,031-test pass is a baseline, not a test run for this work.

## Current checkpoint / final state

### Epic 5 exit — Slice 121 final integration gate — PASS — 2026-09-19

The history audit confirmed that Epic 4 closed at `816b9ff` (Slice 113) and that
the beginner-facing redesign starts afterward at Slice 114. The redesign is
therefore recorded as Epic 5; historical Epic 4 files and decisions are not
renamed or rewritten. The descriptive filename
`UX-REDESIGN-EXECUTION.md` remains stable, while its title and current status
identify the work as Epic 5.

Implementation commits, in order, are `9fb9e7e`, `c2c3bc0`, `022feac`,
`dac3980`, `b970861`, `1fc20cc`, `a3e7104`, `84ee51f`, `58ebd9c`, `0dc1507`,
`bd08991`, `2fe9a32`, `330acb9`, `b2781a9`, and `52ee690`. They cover the
research-backed workspace redesign, bounded stage/inspector shell, reversible
Assembled lens, garment/fit/material hierarchy, contextual appearance editor,
cross-garment highlights and spatial guidance, persistent recovery/history,
Check-to-Export context, selected-size nesting, and the final ARIA audit fixes.

Final automated gate:

- `npm test`: 85 files, 1,102 tests passed.
- `npm run coverage`: 85 files, 1,102 tests passed; statements, branches,
  functions, and lines are each 100%.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; Vite transformed 96 modules.
- Parsed output suite: 4 files, 18 tests passed for SVG, DXF, tiled PDF, A0
  PDF, projector SVG, tech-pack consumers, and the eight legacy regression
  cases. The eight unchanged SHA-256 hashes are the four Tee baselines
  (`3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d`,
  `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`,
  `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523`,
  `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1`)
  and four Fitted/Darted tee baselines
  (`cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c`,
  `e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6`,
  `184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff`,
  `8e89320bfa235c44ebb481b01012a43c7c1614ce27608ccbb49df31369bca8d2`).
- Slice 121 `axe-core` audit: 2 stateful tests passed across welcome, Measure,
  Style, assembled, Check, Export, More Views, and the dirty Load dialog. The
  jsdom color-contrast rule is excluded because it has no layout engine; color
  and focus/zoom contrast were reviewed in the live browser matrix.

Rendered/live evidence:

- All seven garments — Tee, Darted tee, Tank, Polo, Woven shirt, Skirt, and
  Trouser — traversed Garment → Measure → Style → Check → Export and exposed a
  working export action. Every Pattern, Body, Size run, Spec, Nesting, Check,
  and Edit view round-tripped through Assembled and returned to its prior view.
- Measurements, +/- click/hold, Boundary Rail endpoints, manual entry,
  appearance controls, guidance correction/ignore/recall, Save/Load recovery,
  selected-size nesting, and a real browser SVG download were exercised.
- Responsive checks at 1280×900, 900×900, 700×900, 560×844, and 390×844 found
  no page horizontal overflow; the inspector and inspection viewport retained
  bounded internal scrolling and a focused narrow-screen field stayed visible.
- The rebuilt final app smoke test confirmed the unique scroll-region label,
  Assembled toggle, Check copy, Export visibility, More Views menu, and a clean
  browser console (`[]`).

Limitations are explicit: digital checks and schematic previews do not prove
physical fit, sewn construction, drape, manufacturing readiness, or production
readiness. No garment has been physically sewn and validated; no such claim is
made by this exit.

Documentation/history audit before merge found only intended Markdown additions
and modifications versus `origin/main` and no documentation deletions. The
parallel OpenCode/Claude open-source research is included through `0dc1507`;
the Desktop Release research packet was already present in the approved
baseline and its blob matches the parallel OpenCode packet. The separate Claude
Electron shell-hardening result was reviewed but remains outside Epic 5 and is
not merged as an unverified platform change.

### Slice 120 — Check-to-Export context and selected-size nesting (historical checkpoint)

Slice 120 is implemented and committed in `330acb9` on `codex/ux-studio`. The
Export stage now leads with the selected-size picker, explains that it drives
the four selected-size files and Single size nesting, and gives each output a
concise visible purpose/scope description with an accessible description. The
existing export IDs, writers, cancellation paths, desktop menu route, and
whole-run semantics remain intact.

Single size nesting now uses the selected export step as the source for
`draftAtSize`; changing the picker updates the visible selected-size label and
redraws the nest. The graded marker remains all-size and independent of that
picker.

Changed paths: `src/ui/app.ts`, `src/ui/app.test.ts`, `src/ui/view.ts`,
`src/ui/view.test.ts`, and `src/ui/studio.css`.

Bounded verification: `npm run coverage` passed 84 files / 1,100 tests at 100%
for statements, branches, functions, and lines; `git diff --check` passed.
The separate TypeScript, production-build, parsed-output, legacy-hash, and
rendered/live matrix are still required by the final gate.

The remaining work recorded at this checkpoint was completed by Slice 121 and is
superseded by the Epic 5 exit report above.

### Slice 119B — unfinished-draft recovery and bounded Undo/Redo

Slice 119B is implemented in `bd08991` on `codex/ux-studio`. The slice adds a
separate `patternworks_recovery_v1` local envelope that preserves raw,
possibly incomplete draft values and presents explicit Recover/Discard choices
after reload or a navigation attempt. Invalid recovered drafts remain visibly
paused and cannot draft, Save, or export; the validated Save contract remains
unchanged. A browser `beforeunload` guard protects dirty work.

The slice also adds bounded 30-snapshot UI history with visible Undo/Redo and
Ctrl/Cmd+Z, Shift+Z, and Y shortcuts. Native text, textarea, select, and
contenteditable editing is excluded from the shortcut handler, and a new edit
clears Redo. Spatial guidance overflow now counts all additional warnings when
the active lens cannot display them, including untargeted warnings.

Changed paths are `src/ui/app.ts`, `src/ui/app.test.ts`,
`src/ui/appearance.test.ts`, `src/ui/bugfix-p1.test.ts`, `src/ui/history.ts`,
`src/ui/history.test.ts`, `src/ui/persist.ts`, `src/ui/persist.test.ts`,
`src/ui/studio.css`, `src/ui/view.ts`, and `src/ui/view.test.ts`.

Bounded verification: history/persistence/view tests passed 106/106; the
spatial geometry fallback test passed 1/1; `npx tsc --noEmit` and
`git diff --check` passed. Rendered browser verification recovered an invalid
blank Waist draft while keeping drafting/export paused, discarded that draft,
and round-tripped an accidental `9192` edit through Undo and Redo before
saving a valid `92`. The recovery modal and paused state were visually
inspected. This does not claim the final redesign gate.

Exact remaining work: after a fresh usage check, rerun the focused app file and
then the full project gate; inspect the actual diff, parsed outputs, unchanged
legacy hashes, and rendered/live responsive evidence. Finish Slices 120–121,
update the exit report, and do not push or consume a reset credit.

### Slice 119A — dirty workspace replacement safety

Slice 119A implementation is committed as `84ee51f` on `codex/ux-studio`
after `a3e7104`; its documentation checkpoint was `58ebd9c`.
It keeps the existing validated local save payload and adds an in-memory
revision boundary: successful Save marks the current draft clean; a dirty Load
opens a replacement dialog; Keep editing and Escape preserve the draft, while
Load saved workspace applies the validated snapshot and synchronizes the
visible workspace. Clean Load remains direct. The initiating control regains
focus after Cancel/Escape. No save schema, export writer, geometry, or legacy
baseline changed.

Changed paths: `src/ui/app.ts`, `src/ui/view.ts`, `src/ui/studio.css`,
`src/ui/app.test.ts`, and `src/ui/view.test.ts`.

Verification: `npx vitest run src/ui/app.test.ts src/ui/view.test.ts` passed
157/157; `npx tsc --noEmit` and `git diff --check` passed. Live browser
verification changed and saved Waist, changed it again, confirmed the modal
appeared, kept the unsaved edit, then accepted the saved workspace and observed
the saved value restored. The modal was visually inspected at the desktop
viewport. Exact remaining work for the overall redesign is Slice 120–121 and
the full project gate; the bounded recovery/history work is recorded above.

### Slice 118 — cross-garment targets and spatial guidance

Slice 118 is committed as `1fc20cc` on `codex/ux-studio` after `b970861`. The
assembled upper, skirt, and
trouser silhouettes now expose a real `data-edge="ease"` target without changing
geometry. Body/Pattern fields with no target remain undimmed and offer a direct
Assembled route. Field-backed warnings with visible targets become translucent,
collision-aware notes with connector arrows. Ignore applies only to the current
draft; the guidance panel and Check can restore it, draft changes clear the
dismissal, and cleared warnings remove their notes. Check retains dismissed
advice as a mild reconsideration cue. The spatial layer is screen-only and does
not enter any export or save contract.

Changed paths: `src/render/garment.ts`, `src/render/skirt-figure.ts`,
`src/render/trouser-figure.ts`, `src/ui/view.ts`, `src/ui/app.ts`,
`src/ui/studio.css`, `src/ui/app.test.ts`, and `src/ui/view.test.ts`.

Verification: the full app/view run passed 156/156 before the final placement
refinement; the target/dismissal app regression passed 2/2 afterward; renderer
contracts passed 55/55 across garment, skirt, and trouser figures;
`npx tsc --noEmit` and `git diff --check` passed. Live browser evidence showed
four non-overlapping note cards and four connector arrows inside the Body
inspection frame at the supported desktop viewport, with a translucent surface;
the Check stage showed the dismissed chest advisory and `Show guidance again`.
No final full project gate is claimed. The next action after the current Slice
119B checkpoint is a fresh usage check, then the focused app run and full
project gate only while the weekly meter remains above the conservative 15%
remaining threshold.

### Slice 117 — contextual color and appearance editor

Slice 117 is committed as `b970861` on `codex/ux-studio`. Style
now keeps a compact palette visible and opens an on-demand appearance editor:
a hue/saturation wheel, exact Hex/native color entry, lightness, four
screen-only texture cues, and shine. The editor keeps the existing swatch and
native state paths, and its optional appearance payload extension defaults
cleanly for v5 saves without appearance settings. `applyAppearanceToSvg`
decorates only the assembled screen preview, so drafting geometry and export
writers remain unchanged.

Changed paths: `src/ui/appearance.ts`, `src/ui/appearance.test.ts`,
`src/ui/persist.ts`, `src/ui/persist.test.ts`, `src/ui/view.ts`,
`src/ui/view.test.ts`, `src/ui/studio.css`, `src/ui/app.ts`, and
`src/ui/app.test.ts`. No export baseline or workspace choice contract changed.

Verification: `npx vitest run src/ui/app.test.ts` passed 98/98;
`npx vitest run src/ui/appearance.test.ts src/ui/persist.test.ts
src/ui/view.test.ts` passed 103/103; `npx tsc --noEmit` passed. Live browser
verification entered a custom Hex color, selected the wheel with a pointer and
keyboard, enabled Fine weave and 60% shine, and showed the editor beside the
body canvas inside the bounded inspector. The assembled preview contained the
expected texture and sheen definitions. The previous seven-garment/stage/view
matrix remains the Slice 115B evidence; screenshots were inspected inline and
are not durable artifacts.

Exact remaining work: the full per-control
live matrix, full suite, 100% coverage, build, parsed-consumer checks, and
eight-hash legacy gate remain reserved for shared-contract/final checkpoints.

### Slice 116 — garment library, fit intent, and material selection

Slice 116 was committed as `dac3980` on `codex/ux-studio`. The
garment selector is now a descriptive seven-card library grouped by upper and
lower body. Style fit intent and material/stretch choices use readable cards
backed by the existing native selects, preserving keyboard and state
contracts. Untouched garment switches choose the declared garment-family
material default; once a user makes an explicit material choice, that choice
survives garment changes and compatibility guidance remains truthful. Stage
navigation resets the bounded inspector to the new stage context.

Changed paths: `src/ui/view.ts`, `src/ui/studio.css`, `src/ui/app.ts`,
`src/ui/view.test.ts`, and `src/ui/app.test.ts`. No drafting geometry, export
writer, export baseline, or workspace-save schema changed.

Verification: `npx vitest run src/ui/app.test.ts src/ui/view.test.ts` passed
149/149; `npx tsc --noEmit` passed. Live browser checks rendered seven garment
cards, four fit cards, and five material cards. A fresh Woven shirt selection
used Cotton woven without a compatibility warning; selecting Cotton jersey
explicitly surfaced the stable-woven warning and kept the selected card
active. The prior Slice 115B live matrix remains: all seven garments reached
all five stages, all seven views round-tripped through Assembled, and
1280/900/700/560/390×844 had no page horizontal overflow. The live screenshots
were inspected inline and are not durable artifacts.

Exact remaining work: commit this bounded slice, then implement Slice 117's
contextual appearance editor. The full per-control live matrix, full suite,
100% coverage, build, parsed-consumer checks, and eight-hash legacy gate remain
reserved for the shared-contract and final checkpoints. Do not start the full
gate during routine iteration near the usage stop threshold.

### Slice 115B — readiness journey and integration checkpoint (superseded)

This is an incomplete checkpoint, not Slice 115 acceptance. On
`codex/ux-studio` at baseline `c2c3bc0`, the concurrent implementation now has
five actual stages: Garment, Measure, Style, Check, and Export. Completion is
readiness-derived; `styleReviewed` is set only on Style → Next, current Check
review is required, and the true Export gate applies to the desktop menu and
buttons.

Measurement, material, option, and target changes invalidate review and file
confirmation. Export size, nesting scope, fabric width, and color changes
invalidate file confirmation, and a delayed old desktop write cannot confirm a
new revision. Measure separates body/length groups from Style ease/options;
corrections reveal the right stage/group and focus the field. Stage navigation
restores current-stage focus. More views retains all seven views and supports
Escape, outside click, and selection focus. Skip introduction does not mark
readiness. Journey persistence is v2, accepts legacy v1, and resets historical
`exported` on load. Selected-garment header, named Style combobox, and local
rail containment are included.

Changed concurrent source/test paths are `src/ui/app.ts`, `src/ui/journey.ts`,
`src/ui/view.ts`, `src/ui/studio.css`, `src/ui/app.test.ts`,
`src/ui/journey.test.ts`, `src/ui/view.test.ts`, possibly
`src/ui/bugfix-p1.test.ts`, `src/ui/studio.test.ts`, and `vitest.config.ts`.
No export writers, geometry, export baseline, or workspace-save schema changes
were made.

Verification now passes 207/207 across `app.test.ts`, `bugfix-p1.test.ts`,
`journey.test.ts`, `studio.test.ts`, and `view.test.ts`; `npx tsc --noEmit`
is clean. The live browser checkpoint exercised all seven garments through
Garment → Measure → Style → Check → Export, and all seven views through
Assembled and back. Responsive checks at 1280/900/700/560/390×844 found no
page horizontal overflow; the narrow inspector retained the canvas and a
focused second measurement page, and More views passed Escape/outside-click
checks. Screenshots were inline only and not durable artifacts.

Exact remaining work: complete the full per-control live matrix (including
zoom/text-size, persistence/recovery, options/material/appearance and every
export path), then run the full `npm test`, 100% coverage, `npx tsc --noEmit`,
build, parsed-consumer checks, and eight-hash legacy gate. Only those results
can close the full redesign; Slices 116–121 remain. Preserve user logs/tmp;
no push or credits. Current observed usage is 2% short-window / 79% weekly;
do not start an expensive full gate after the allowance approaches the
documented stop threshold.

### Slice 115A — prior bounded-studio checkpoint (superseded)

Implemented on `codex/ux-studio` after resuming from `9fb9e7e`:

- Viewport-height studio with independently scrolling inspector; stacked canvas
  above inspector at 700px and narrower. The canvas no longer follows the long
  measurement panel down the page. Layout CSS moved to `src/ui/studio.css`.
- Measurement pages derive from measurement roles and recipe option groups.
  Group chooser and Previous/Next retain live inputs. Guidance reveals the
  corresponding group before focusing. Numeric actions are 36px, range labels
  11px, and numeric inputs now have explicit accessible names.
- Assembled and analysis share one inspection frame. Toggle preserves the prior
  view, zoom, scroll, Body projection and transient Edit snapshot. Selecting a
  different view exits the lens. Assembled does not receive Edit drag actions.
- Save/Load moved to persistent header; selected export size now precedes file
  buttons. Confirmation/recovery and final format cards remain later work.
- Missing highlight targets no longer dim an entire figure. This guard applies
  independently to analysis and assembled hosts; adding missing targets remains
  Slice 118. No invented geometry or side-projection markers were added.

Live evidence: documented viewport control now reports the requested dimensions.
At widths 1280/900/700/560/390, height 844, the Woven shirt's last `hemTurn`
control was incremented through the UI. Document width equaled viewport width,
document height was 844, canvas and focused field stayed within their respective
visible panes in all five cases. At 390, canvas y=258.4–490.6 and focused input
y=649.5–685.5. At 1280, canvas y=212.6–828 and input y=487.5–523.5.
At 1280×720, all seven view buttons were exercised: each changed to Assembled
and returned to its original view. Screenshots were visually inspected, not
only counted. This is NOT the final all-garment/height/keyboard-zoom matrix.

Tests/gates actually run:

- Initial focused run: view 51 passed; app/bugfix had four stale host assertions.
  Updated those assertions to the actual analysis/readiness hosts; subsequent
  focused reruns exposed and corrected one further Trouser host-count assertion.
- New `studio.test.ts`: 19 passed, covering seven garment group inventories,
  guidance focus, persistent actions, missing-target guard, seven lens returns,
  transient Edit and invalid-input behavior.
- Focused studio + Body-linking run: 34 passed, 76 intentionally filtered out.
- Focused prior failures: Side, Woven all-views and confirmed-export invalidation
  passed; final Trouser routing rerun passed (1, 90 filtered out).
- `npx tsc --noEmit`: passed. `git diff --check`: passed.
- NO passing full-suite/coverage/build/parsed-output/legacy gate is claimed for
  this checkpoint. These have not been rerun since implementation began.

Changed files: `src/main.ts`, `src/ui/app.ts`, `src/ui/view.ts`, new
`src/ui/studio.css`, new `src/ui/studio.test.ts`, `src/ui/app.test.ts`,
`src/ui/view.test.ts`, `src/ui/bugfix-p1.test.ts`, PROJECT-STATE.md,
ARCHITECTURE.md and this execution record. No drafting, export, persistence
schema, dependencies or legacy baselines changed. User logs and `tmp/` preserved.

Remaining Slice 115: replace the old tour-complete chips with actual stage
navigation/readiness, gate Next with correction routes, stage-relevant tools,
keyboard/focus continuity, inspect short-height and text-zoom behavior, improve
multi-SVG Fit if necessary, run the complete UI tests and meaningful integration
gate with 100% coverage. Current tour labels and expert skip still expose the old
all-tools state; do not accept BUG-UI-037 or the overall declutter criterion yet.
Slices 116–121 remain as scoped above; no final UX or physical-fit claim.

Resume: check usage, `git status --short --branch`, then continue Slice 115 from
this checkpoint. Do not repeat research or external-agent audits. Start the
local dev server with `npm run dev -- --host 127.0.0.1 --port 5180 --strictPort`
if it is not listening. Run focused UI tests after the navigation change, not a
redundant pre-change full suite. Usage before final checkpoint documentation:
80% current-window / 59% weekly used; next reset 2026-09-14 03:35:32 UTC.
Final checkpoint meter: 86% current-window / 60% weekly used. Supported
continuation was updated and confirmed ACTIVE for 23:40 America/New_York, just
after that reset, subject to a fresh allowance check. The viewport override was
reset and temporary dev server stopped. No account reset credit or push.

### Previous checkpoint — Slice 114 (historical)

Completed: goal created; actual branch/status verified; required context read;
source and live baseline inspected; dated primary/historical/community research;
one actual CLO video frame inspected; all-seven Body target inventory; pocket
height scroll/highlight defect and destructive Load reproduced; selected-size
nesting mismatch reproduced. Claude audit received and reviewed with explicit
corrections. OpenCode research received, actual report inspected, selected
primary links independently verified, and overbroad recommendations rejected.

Changed files: this execution plan, UX-REDESIGN-HANDOFFS.md,
UX-REDESIGN-RESEARCH.md, PROJECT-STATE.md, ARCHITECTURE.md, CONTEXT-INDEX.md,
docs/PROJECT-DECISIONS.md and docs/BUG-LEDGER.md. No implementation, tests,
exports or baselines changed.
Tests/gates run in Slice 114: none (documentation/audit only). Live evidence is
enumerated in research; mobile override attempt did not apply, so no mobile pass.

Usage checkpoint: final short-window check 91% consumed / 9% remaining,
weekly 45% consumed. Next short-window reset reported as 2026-09-13 22:26:09 UTC.
Finish the documentation commit only; do not start Slice 115 or a full suite
before allowance is healthy. Supported thread continuation was created and
confirmed ACTIVE for 18:30 America/New_York, just after that reset. It rechecks
allowance before resuming and stays quiet while low/unchanged. The computer and
desktop app must be running for local scheduled work. No account reset credit
was used. The temporary audit dev server was stopped. Staged documentation
passes `git diff --cached --check`; no full suite was run for this doc-only slice.

Exact resume: re-check usage, then `git switch codex/ux-studio` and
`git status --short --branch`. Read the current checkpoint here and the research
decisions (do not repeat the completed source search or full historical logs).
Begin Slice 115: stable shell, stages, grouped inspector and reversible Assembled
mode. The documented browser viewport API is `capability.set({width,height})`,
but actual dimensions remained unchanged; resolve that integration before
responsive acceptance. Current baseline dev command is `npm run dev -- --host
127.0.0.1 --port 5180 --strictPort` if no server is listening. Do not clear the
user's saved workspace. Contributor reports remain isolated review inputs and
need not be rerun.

## Usage pacing and continuation

Check allowance at startup, before each major slice, before expensive parallel
work, and before final gates. Focused tests during iteration; no redundant full
runs. At about 15% remaining or a visible warning: finish only the current atomic
operation, commit a bounded slice/checkpoint, update this section and
PROJECT-STATE with criteria done, exact remaining work/files/tests/next command,
then use the supported thread heartbeat/continuation mechanism. Stay quiet while
allowance/state is unchanged. Resume from the checkpoint after re-checking
allowance; do not redo completed audit or research. Never consume a reset credit,
purchase credits, or alter account allowance without explicit authorization.

## Exit report

PASS. Epic 5 comprises Slices 114–121 and is complete on the actual branch after
the final gate above. The push/remote verification is recorded in the final
merge checkpoint and does not change the physical-validation limitation.
