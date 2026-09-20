# Epic 6 — Surface Design Execution

_Started from the Epic 4 exit at `816b9ff`; rebased onto the Epic 5 exit at `13d7195` for the Slice 122–125 integration review._

## Numbering note

Epic 4 closed at Slice 113 on `origin/main`. Slices 114–121 are the separately
completed Codex UI/UX redesign workstream, confirmed as **EPIC-5** and landed at
`13d7195`. Surface design is therefore **EPIC-6**, running Slices 122–129. No
code depends on the number.

## Objective

Ship an artwork-placement layer (prints, patches, colour blocking, fabric preview)
that sits on top of the existing pieces without touching geometry, grading, checks,
nesting math, or cutting-file behavior. Empty placement leaves every existing output
byte-identical.

## Scope

- Placement data model, transforms, clipping, and z-order (new files only).
- Headless placement math with unit tests.
- Preview overlay renderer (new file; app wiring comes after the EPIC-5 rebase).
- UI wiring, tech-pack placement spec page, and print-ready output.
- Guidance warnings for out-of-bounds, low-resolution, and ink-coverage cases.
- Cross-garment exit gate across all seven recipes.

## Non-goals

- No drafting, grammar, grading, POM, check, nesting, or export-writer behavior
  changes. No new garment family. No configurator.
- No embroidery machine formats (DST/PES). No photo-to-pattern work.
- No physical-fit or production-readiness claims. No signing/packaging work.

## Collision rule (binding through the additive foundation)

Codex owns Slices 114–121, which now land on `origin/main`. To keep this Epic
cleanly reviewable, Slice 122 adds only its two research/planning documents and
Slices 123–125 remain additive (new surface modules and tests). Shared wiring
(`app.ts`, views, tech-pack composition) and the deferred `PROJECT-STATE.md` /
`ARCHITECTURE.md` updates wait for the post-125 rebase checkpoint and Slice 126.

The original Slice 122 packet deliberately deferred the standing "update durable
state in the same commit" rule while Epic 5 was in flight. That state update is
recorded at the Codex integration checkpoint below; it is not silently dropped.

## Slice plan (8 slices, 8 PRs — one branch and one PR per slice)

### Slice 122 — research + contract + execution plan (THIS SLICE, docs-only)

Scope: add `docs/research/SURFACE-DESIGN-RESEARCH.md` and this file. No source,
test, config, or lockfile changes.
Acceptance: two new files only (`git status` shows nothing else); `git diff --check`
passes; full test/build gate explicitly deferred with reason (no code changed —
Slice 94 precedent for research-only slices).
Non-goals: dependencies, code, UI, exports, state-doc edits.
PR: `opencode/slice-122-surface-research` → `main`.

### Slice 123 — placement data model + validation (additive foundation)

Scope: new `src/surface/placement.ts` (placement types and actionable validation)
and unit tests. Persistence wiring and the prove-or-stop Fabric.js SVG round-trip
are explicitly deferred to Slice 126, when the shared UI/save seam is wired.
Acceptance for this additive foundation: focused tests pass; full gate (`npm test`,
coverage 100%, `npx tsc --noEmit`, `npm run build`) passes; no existing save,
drafting, or export behavior changes.
PR: `opencode/slice-123-surface-model` → `main`.

### Slice 124 — placement math

Scope: new transform/bounds/clip helpers plus tests (rotate/scale/translate,
piece-boundary clip, out-of-bounds detection as pure data).
Acceptance: focused math tests pass; full gate passes; no export bytes change.
PR: `opencode/slice-124-surface-math` → `main`.

### Slice 125 — preview overlay renderer (no app wiring)

Scope: new `src/render/surface-overlay.ts` rendering placement onto piece SVG
coordinates, verified by DOMParser parse tests. No `app.ts` or view changes.
Acceptance: parse-measured placement matches transform math; full gate passes.
PR: `opencode/slice-125-surface-preview` → `main`.

### Checkpoint A — integration (after Slice 125)

Model + math + headless preview are proven without touching shared UI. The current
decision point is the Codex review on top of the landed EPIC-5 merge; no wiring is
accepted until the full additive gate and durable-context update pass.

### Current coordination status — 2026-09-19

The maintainer confirms EPIC-5 is complete and merged to origin/main. OpenCode is
continuing EPIC-6 through Slice 129. Slices 122–125 are the committed foundation
reviewed at Checkpoint A, and Slice 126 has now passed Codex review and the full
gate in the local integration merge. Slices 127–128 and the 129 exit gate remain
external work to review; Codex owns the eventual diff review, full verification
gate, durable-context reconciliation, and merge decision. Do not start
overlapping UI/save/export implementation in parallel.

### Slice 126 — UI wiring (post-rebase only)

Scope: controls + canvas integration on the rebased tree, placement persisted via
the Slice 123 section, invalid values visible with corrections.
Acceptance: live seven-view spot check per recipe family; full gate passes.
PR: `opencode/slice-126-surface-ui` → `main`.

### Slice 127 — tech-pack spec + print-ready output

Scope: placement spec page content in the tech pack plus opt-in print-ready output.
Cutting files unchanged when placement is empty (legacy hashes pinned).
Acceptance: parsed tech-pack/print outputs measured; empty-placement exports
byte-identical; full gate passes.
PR: `opencode/slice-127-surface-output` → `main`.

### Slice 128 — guidance warnings

Scope: out-of-bounds, low effective resolution, ink-coverage warnings with
field-linked corrections. Warn-only, no clamping.
Acceptance: focused guidance tests pass; full gate passes.
PR: `opencode/slice-128-surface-guidance` → `main`.

### Slice 129 — EPIC-6 exit gate

Scope: cross-garment audit (all seven recipes), responsive check, rendered/output
evidence, durable state + architecture updates, exit report recorded here.
Acceptance: `npm test`, 100% coverage, typecheck, build, parsed suites, 8/8 legacy
hashes, live browser audit with empty diagnostics.
PR: `opencode/slice-129-surface-exit` → `main`.

## Checkpoints and PR count

- Per-slice PR gate: focused tests + `git diff --check` + full gate (except docs-only
  Slice 122, justified above) + no unrelated files.
- Checkpoint A (after 125): headless integration proven, rebase decision.
- Checkpoint B (before 126): EPIC-5 merged, EPIC-6 rebased, deferred state docs updated.
- Exit (129): full project gate + rendered evidence + exit report.
- Total: **8 slices (122–129), 8 PRs**, each merged only after product-owner approval
  (and Codex review once EPIC-5 has landed). No direct pushes to `main`. No merges by
  the contributor.

## Codex integration checkpoint — Slices 122–125

PRs #1–#4 map to the four OpenCode branches and are additive-only. Their original
base was the Epic 4 exit, so Codex reviewed and integrated them on top of the
Epic 5 exit. Slice 123 intentionally delivers the pure placement model and
validation boundary; persistence and Fabric.js fidelity remain explicit Slice 126
stop conditions. Effective-resolution math rejects non-positive source dimensions,
and the overlay test consumes the transform module's actual polygon output.

## Slice 126 — UI wiring (accepted and pushed)

Branch `opencode/slice-126-surface-ui` from `origin/main` at `f7f2dba`.

Delivered: one canonical transform type (`PlacementTransform`; the
`TransformInput` mirror is deleted and `overlayItem` adapts placements to
polygons through a type-only link); `src/surface/store.ts` with the
per-garment/style book, raw-preserving parser, index-addressed set/remove,
next stacking order, placeability guard, and lazy problem lists; artwork as an
optional save/recovery section with no version bump (absent means empty,
malformed current files rejected, raw invalid values preserved); a Style-panel
section with add/edit/remove, shared numeric controls/rails/steppers, per-row
warn-only errors with aria-invalid sync, and a true-scale artwork-space
preview that lists unplaceable entries instead of drawing them; save/load,
recovery, style-switch isolation, seven-garment rendering, assembled-preview
integrity, and jsdom width rendering at 1280/900/700/560/390. Codex corrected
two integration defects found in live review: `surfacePlaceable` now delegates
to the full `placementError` contract, and native surface text/number inputs are
not rebuilt while typing (inputs commit on focusout, selects on change, and
steppers through a private step event).

Explicitly recorded deviations and deferrals: no save-format version bump
(optional additive section, same leniency pattern as appearance); export
gating unchanged (surface validity does not gate cutting files — print gating
is Slice 127 scope); Fabric.js proven but not added (no consumer needs it
yet); piece-space anchoring left open for Slice 127 (preview is artwork-space
by design, captioned as such); live-browser review covered direct entry/blur
commit, invalid-value recovery, save/load, style isolation, seven-garment
rendering, assembled preview, responsive widths 1280/900/700/560/390×844, and
a clean console; cross-garment exit evidence remains required in Slice 129;
review history snapshots exclude surface state (pattern undo semantics
untouched).

Stop conditions not triggered: fidelity proven, empty placement changes no
legacy byte (no export writer touched), 89 files / 1,196 tests passed, coverage
held at 100% across all four metrics, typecheck and production build passed,
the explicit parsed consumer suite passed 18/18 including all eight legacy
hashes, and no geometry/grading/export-truth change was required. No
physical-fit, manufacturing, or production-readiness claim is made.

Integration record: PR #5 was merged by Codex from contributor head
`7c1348c06e9cedf73750518e955c44e2825d41b5` with review corrections in merge
commit `139dbd1e86b045ca54cb1a6a07f6d3d315fa67ba`, and `origin/main` now points
to that commit. Slices 127–129 remain unmerged external work.

## Slice 129 — EPIC-6 exit gate (review-ready, not merged)

Branch `opencode/slice-129-surface-exit`, stacked on the Slice 128 branch.
Slice 127 → Slice 128 → Slice 129 merge bottom-up; no branch in the chain
touches `main` directly.

## Slice 127 — tech-pack spec plus opt-in print output (review-ready, not merged)

Branch `opencode/slice-127-surface-output` from clean `origin/main` at
`6f21ccb` (Slice 126 already merged, so no stacking was needed).

Delivered: a fifth tech-pack page naming every artwork entry with true-scale
geometry and INVALID flags, appended only for non-empty sets (empty sets stay
byte-identical); a new true-scale print-sheet SVG writer with the locked 10 cm
calibration square, artwork polygons, and a header that names unplaceable
entries instead of dropping them; a Current-style-artwork export scope with an
opt-in Print sheet button that stays disabled with an artwork reason while the
style is empty; whole-style download semantics shared with tech pack and
projector (per-size picker ignored, stated in the UI copy).

Anchor decision recorded: artwork-space centimetres are the print
specification and piece association is by role name. No on-piece anchor point
is invented; positioning artwork on pieces stays explicitly out of scope.

Stop conditions not triggered: all eight legacy hashes green with artwork
present in state (cutting writers untouched and placement never included in
them), coverage held at 100% across all four metrics, no geometry/grading/
export-truth change was required. No physical-fit, manufacturing, or
production-readiness claim is made.

## Slice 128 — guidance warnings (review-ready, not merged)

Branch `opencode/slice-128-surface-guidance`, stacked on the Slice 127
branch (shared doc regions resolved here; code regions were disjoint).

Delivered: `src/guidance/surface-notes.ts` emits one warn-only note per
invalid placement with the placementError text as its actionable correction
and a field key resolving to the failing control (row fallback when the
error names no aspect); notes ride the shared guidance panel with Review,
Set-aside, and Show-again affordances, stay visible on the Check view, and
never gate exports. Panel rows gained the same Set-aside affordance canvas
spatial cues already offer, so warnings without a canvas target can be
dismissed; dismissal persists across surface edits and clears on pattern
change, matching existing ignored-guidance behavior. Correction routing
sends surface fields to the fit step.

Explicitly NOT implemented (blocked, not substituted): out-of-bounds,
resolution-floor, and ink-coverage warnings. They need three things that do
not exist — piece-space anchor semantics (decided against invention in Slice
127), source artwork dimensions (no model field; adding one is an
undocumented schema migration), and researched production thresholds. No
threshold was invented and no silent clamping or deletion was added. Unblock
questions for the maintainer are recorded in SURFACE-DESIGN-RESEARCH.md.

Stop conditions not triggered for the shipped subset: coverage held at 100%
across all four metrics, no geometry/grading/export-truth change was
required, no baseline moved. No physical-fit, manufacturing, or
production-readiness claim is made.

## Epic 6 exit report — review-ready, not merged

Delivered across Slices 122–129: a headless placement contract (model,
validation, math, overlay renderer), Style-panel artwork sets per
garment/style with add/edit/remove and warn-only validation, optional
save/recovery persistence with no version bump, a true-scale artwork-space
preview, a fifth tech-pack page plus an opt-in calibrated print sheet for
non-empty sets, invalid-placement guidance with Review/Set-aside/Show-again
and Check-view visibility, and a cross-garment exit audit proving one style's
artwork end to end on all seven garments.

Explicitly out of the Epic as shipped: out-of-bounds, resolution-floor, and
ink-coverage warnings (blocked on anchor semantics, source dimensions, and
researched thresholds — unblock questions recorded, no threshold invented);
on-piece artwork positioning and clipping (no anchor invented); embroidery
machine formats, photo workflows, 3D, vendor, signing, and packaging work;
any physical-fit, drape, sewability, manufacturing, or production-readiness
claim.

Evidence on the stacked chain: full suite green with 100% statements,
branches, functions, and lines; typecheck and production build green;
parsed SVG/DXF/tiled-PDF/A0/projector/tech-pack consumers green including
all eight legacy hashes with artwork present in state; cross-garment
panel/preview/sheet/tech-pack/save/load audit green; jsdom width rendering
at 1280/900/700/560/390 without errors. Live-browser responsive and console
proof remains Codex-side before any merge.

`docs/PROJECT-DECISIONS.md` is intentionally untouched by this Epic: no new
maintainer decision was made here, and the three blocked-warning questions
await the maintainer rather than answering themselves.
