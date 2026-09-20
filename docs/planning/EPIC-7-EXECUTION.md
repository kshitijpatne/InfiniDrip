# EPIC 7 — Nesting Intelligence Pack

_Status: Codex-scoped and ready for OpenCode implementation from the current
`origin/main` baseline. This is an additive enhancement to the existing nesting
estimator; it is not a nesting-engine rewrite._

## Objective and product value

Make the existing Nesting/Fabric experience answer the practical questions a
maker has before cutting: how much cloth is actually used, whether the cloth
on hand is enough, how much is short, and what directional-print and cutting
buffer assumptions apply. The feature must make the estimator more useful
without pretending that shelf packing is production-grade irregular nesting.

The existing `nestPieces` algorithm remains the source of placement truth. Epic
7 adds transparent derived metrics, user-entered planning inputs, persistence,
guidance, and UI presentation around that result. It does not change drafted
geometry, grading, piece outlines, grainline rules, placement order, export
writers, or legacy output bytes.

## Ownership, baseline, and model

- **Owner:** OpenCode CLI, controlled by Codex under `docs/OPENCODE-WORKFLOW.md`.
- **Model:** `muse-spark-1.3`, high or extra-high reasoning as requested by the
  maintainer; use short, deliberate turns and avoid speculative work.
- **Baseline:** latest `origin/main` at handoff time. The Codex packet was
  authored against `9b0b630`; re-check the remote ref before creating the branch.
- **Branch/worktree:** `opencode/epic-7-nesting-intelligence`, isolated from
  Codex's checkout.
- **Merge authority:** OpenCode must not merge or push `main`. Codex reviews the
  actual diff, runs the full gate, fixes defects, and alone merges/pushes.
- **Files:** implementation may touch only the nesting/UI/persistence tests and
  source required by this packet, plus this execution record and the affected
  durable context requested by Codex. No unrelated refactor or dependency.

## Binding product decisions

These values are decisions for this Epic, not suggestions for the contributor:

1. **Cutting buffer:** default `10%`; valid range `0–50%`; step `1%`. The
   buffer is applied only to the displayed/planned fabric requirement:
   `plannedLength = requiredLength × (1 + bufferPercent / 100)`. The raw
   `nestPieces.fabricLength` remains unchanged and remains the unbuffered
   estimator result.
2. **Fabric on hand:** add an optional available-length input in centimetres.
   Blank means “not supplied” and must not show a false fit verdict. A finite
   positive value enables `fits / short by X` against `plannedLength`.
3. **Directional/nap flag:** default `true` because the current estimator keeps
   grain upright and never rotates pieces. The UI must state that this is an
   assumption/notice; toggling it must not silently rotate, interlock, or change
   the existing shelf-pack placements.
4. **Waste readout:** expose `wastePercent = (1 - utilization) × 100`, clamped
   only for display rounding after validating the finite estimator result. Keep
   the underlying utilization unchanged.
5. **Difficulty rating:** explicitly deferred. Do not bundle roadmap item 0.5.8
   into Epic 7; it remains a separate per-garment metadata addition.
6. **Sparrow/irregular nesting:** explicitly deferred. No external nesting
   worker, polygon no-fit algorithm, or runtime geometry dependency is allowed.

## Persistence and invalid-state contract

- Add the new planning values as an optional additive `nestingIntelligence`
  section in save/recovery payloads, preserving old saves without a format bump.
- Valid saved values round-trip. Missing section loads defaults. Malformed current
  sections are rejected visibly, consistent with existing persistence rules.
- During direct editing, blank, non-finite, non-positive, or out-of-range raw
  values remain visible and receive actionable guidance; do not silently clamp
  or replace them. Explicit +/- recovery may use the declared boundaries.
- Directional flag is boolean and defaults to `true` when absent.
- Existing `fabricWidth` remains the bolt-width input and keeps its current
  validation and persistence behavior.

## Slice plan

### Slice 132 — Pure contract and metrics

**Scope:** define the additive nesting-intelligence model and pure helpers around
the existing `NestResult`: buffer validation, planned-length calculation,
waste-percent calculation, optional fabric-on-hand fit/shortage result, and the
directional-print assumption. Add focused tests for finite/invalid/empty,
borderline, too-short, and too-narrow cases.

**Acceptance:** helpers are deterministic and side-effect free; `nestPieces`
placement and raw result are unchanged; all declared bounds and units are
covered; no UI, geometry, export, or save schema change is required in this
slice. Full project tests, coverage, typecheck, build, and legacy hashes pass.

**Non-goals:** no Sparrow, no irregular nesting, no rotation/interlocking, no
difficulty rating, no production marker claim.

### Slice 133 — UI, persistence, and actionable guidance

**Scope:** add the available-length, buffer, and directional controls to the
existing Nesting/Fabric surface using the shared numeric-control/Boundary Rail
contract; show required length, planned buffered length, waste percentage,
available length, fits/short-by-X state, and the honest directional assumption.
Persist valid values through save/recovery using the additive section above;
keep invalid raw values visible and route guidance to the exact control.

**Acceptance:** all seven recipes render the metrics; switching selected-size
versus marker remains truthful; style/garment changes do not leak values;
save/load and unfinished recovery round-trip valid and invalid states; narrow
responsive widths remain usable; existing export controls and bytes are
unchanged. Focused UI/persistence tests pass at 100% coverage.

**Non-goals:** no changes to drafted pieces, `nestPieces` shelf order, cutting
files, print-sheet/artwork output, or export gating beyond existing checks.

### Slice 134 — Cross-garment exit and Epic 7 report

**Scope:** run the complete seven-garment audit for empty, valid, invalid,
too-short, and too-narrow planning states; verify deterministic metrics,
save/recovery, responsive rendering, parsed outputs, and unchanged legacy
hashes. Record `docs/release/EPIC-7-EXIT-REPORT.md` with exact commands,
fixtures, output evidence, limitations, and any reproducible defects.

**Acceptance:** `npm test`, coverage at 100% across all four metrics, typecheck,
production build, parsed SVG/DXF/tiled PDF/A0/projector/tech-pack suite, all
eight legacy hashes, and the real mounted-app matrix pass. Any host-contention
timeout must be rerun in bounded serial mode and recorded, not hidden.

**Non-goals:** no physical fabric cutting, no fit/sewability/manufacturing
claim, no cross-OS claim, no signing/packaging work, no geometry rewrite.

## Required verification and evidence

Run from the isolated worktree, using serial Vitest when host contention makes
parallel execution unreliable:

```powershell
git rev-parse HEAD
git status --short --branch
npm test -- --maxWorkers=1 --minWorkers=1
npm run coverage -- --maxWorkers=1 --minWorkers=1
npx tsc --noEmit
npm run build
git diff --check
```

Also run the existing parsed consumer/legacy-hash suites and the mounted-app
responsive matrix at 1280, 900, 700, 560, and 390 px. Pressure-test blank,
NaN, non-finite, zero, negative, under-range, over-range, exactly-boundary,
too-short, too-narrow, empty-piece, selected-size, marker, garment-switch,
style-switch, save/load, and recovery cases. Record exact artifact paths and
hashes; tests alone are not visual evidence.

## Safe boundary and return packet

OpenCode must not modify Epic 9/10 execution documents, release reports,
Electron files, unrelated garment geometry, export baselines, coverage
thresholds, or governance rules. If a requirement needs an architectural or
product decision outside this packet, stop at that boundary and report it.

Return valid JSON (or a clearly delimited JSON block):

```json
{
  "status": "complete|blocked|needs_follow_up",
  "summary": "...",
  "branch": "opencode/epic-7-nesting-intelligence",
  "changed_files": [],
  "tests_run": [],
  "coverage": "...",
  "build_and_typecheck": "...",
  "rendered_or_export_evidence": [],
  "known_limitations": [],
  "follow_up_needed": []
}
```

The return packet is not acceptance. Codex must inspect the actual branch diff,
run the gate, review all evidence, fix any confirmed issue, and be the only
actor to merge and push `origin/main`.

## Exact OpenCode continuation prompt

> Fetch the latest `origin/main` before starting; the earlier `241732e` view is
> stale. Read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
> `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/OPENCODE-WORKFLOW.md`,
> `docs/planning/ROADMAP.md`, and this `docs/planning/EPIC-7-EXECUTION.md`.
> Work on branch `opencode/epic-7-nesting-intelligence` in a separate
> worktree. Execute Slices 132, 133, and 134 exactly as written. Use
> muse-spark-1.3 with high/extra-high reasoning. Do not invent difficulty
> rating, Sparrow, irregular nesting, rotation, physical validation, or
> production claims. Do not push or merge `main`; return the required JSON and
> all evidence so Codex can review and integrate each slice.

## Slice records (contributor-appended; plan above is Codex-owned)

### Slice 132 — pure contract and metrics (review-ready, not merged)

Branch `opencode/epic-7-nesting-intelligence` from `origin/main` at `a9cab78`.
Adds `src/export/nesting-intelligence.ts` plus focused tests: buffer
validation and planned-length math, waste share, optional fabric-on-hand
fits/short-by verdicts, and the no-rotation nap notice. Unratable input
yields null. No UI, geometry, export, or save-schema change. Stop conditions
not triggered; no baseline moved.
