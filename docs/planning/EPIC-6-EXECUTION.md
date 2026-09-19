# Epic 6 — Surface Design Execution

_Started from `main` at `816b9ff` (Epic 4 exit). Slice 122 is the foundation._

## Numbering note

Epic 4 closed at Slice 113 on `origin/main`. Slices 114–121 are reserved for the
Codex UI/UX redesign workstream, which lives on a separate local branch and has not
landed on `origin/main` at the time of writing. This Epic therefore assumes that
workstream is **EPIC-5**, making surface design **EPIC-6**, running **Slices 122–129**.
If the maintainer names the redesign differently, this file gets renumbered before
Slice 123; no code depends on the number.

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

## Collision rule (binding until the EPIC-5 rebase)

Codex owns Slices 114–121, expected to touch UI surfaces and durable state. To keep
this Epic cleanly rebaseable, EPIC-6 Slice 122 modifies **zero** tracked files: it
adds only the two new documents in this commit. Later EPIC-6 slices stay additive
(new `src/surface/*`, new test files) until EPIC-5 lands on `origin/main`, at which
point EPIC-6 rebases and only then touches shared wiring (`app.ts`, views, tech-pack
composition) plus the deferred `PROJECT-STATE.md`/`ARCHITECTURE.md` updates.

This deliberately defers the standing "update durable state in the same commit"
rule for Slice 122, with the product owner's direct authorization, to avoid a
guaranteed merge conflict with the in-flight EPIC-5 state updates. The deferred
state update lands with the rebase checkpoint, not silently dropped.

## Slice plan (8 slices, 8 PRs — one branch and one PR per slice)

### Slice 122 — research + contract + execution plan (THIS SLICE, docs-only)

Scope: add `docs/research/SURFACE-DESIGN-RESEARCH.md` and this file. No source,
test, config, or lockfile changes.
Acceptance: two new files only (`git status` shows nothing else); `git diff --check`
passes; full test/build gate explicitly deferred with reason (no code changed —
Slice 94 precedent for research-only slices).
Non-goals: dependencies, code, UI, exports, state-doc edits.
PR: `opencode/slice-122-surface-research` → `main`.

### Slice 123 — placement data model + persistence (after EPIC-5 lands or additive-only)

Scope: new `src/surface/model.ts` (placement types, per-style sharing decision),
new versioned save section with migration, new unit tests. Prove-or-stop Fabric.js
SVG round-trip for our piece paths.
Acceptance: focused tests pass; full gate (`npm test`, coverage 100%,
`npx tsc --noEmit`, `npm run build`) passes; empty placement round-trips old saves.
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

Model + math + headless preview proven without touching shared UI. Decision point:
rebase onto EPIC-5 merge before any wiring slice. If EPIC-5 has not landed, EPIC-6
pauses rather than writing over in-flight UI files.

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
