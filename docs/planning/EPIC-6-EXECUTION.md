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
reviewed at Checkpoint A; the remaining 126–128 implementation and the 129 exit
gate are not yet repository evidence in this checkout. Codex owns the eventual
diff review, full verification gate, durable-context reconciliation, and merge
decision. Do not start overlapping UI/save/export implementation in parallel.

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
