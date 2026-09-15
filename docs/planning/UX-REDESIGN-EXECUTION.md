# UI/UX redesign execution — Slices 114–121

Status: Slice 115B focused/live checkpoint, 2026-09-15; the bounded stage and
assembled integration checks are green, but the full redesign gate remains.
Epic 4 remains closed.
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
dependency upgrade, export baseline rewrite or production-readiness claim.
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
| 121 | End-to-end beginner, accessibility and responsive audit; fix found failures; final integration | Entire full project gate and durable exit report; no deferred acceptance hidden as pass |

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
8. Research, execution, PROJECT-STATE, ARCHITECTURE, decisions and bug records
   updated with exact commits and evidence; honest limitations and deferred fit

The previous 81-file/1,031-test pass is a baseline, not a test run for this work.

## Current checkpoint / exact next actions

### Slice 115B — readiness journey and integration checkpoint

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

PENDING. Slice 115A is a partial implementation checkpoint, not a passed Slice
115 or final redesign. No full-gate or physical-validation claim is made.
