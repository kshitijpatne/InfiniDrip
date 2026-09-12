# InfiniDrip UI Bug-Fix Phase

Status: planned gate before Epic 3
Baseline: Slice 93 live UI audit, 2026-09-12
Tracking ledger: `docs/BUG-LEDGER.md`

## Purpose

The Slice 93 live audit found UI, UX, state, rendering, validation, persistence,
export, accessibility, and copy defects across the existing garments and views.
This phase closes those defects before Phase 5 / Epic 3 begins. It is a bug-fix
phase, not a new garment feature phase.

No physical sewing, fit, or production validation is implied. Physical
validation remains on hold under `docs/PROJECT-DECISIONS.md`.

## Phase structure

The work is sequential and has three separately tagged epics:

### `EPIC-BUGFIX-P1` — correctness and trust

Close all P1 records in `docs/BUG-LEDGER.md` before starting P2. Scope includes
invalid-input behavior, derived state, readiness gating, persistence round trips,
export truthfulness, responsive access to the primary workflow, and the Woven
Shirt assembled-preview contract.

Suggested slices, to be refined after the first implementation audit:

- `BF-P1-01`: establish one input/state validation contract and remove silent
  clamp/display divergence.
- `BF-P1-02`: make derived totals, guidance, readiness, and journey status use
  the same current state.
- `BF-P1-03`: make Save/Load a complete, validated, visibly synchronized
  workspace round trip.
- `BF-P1-04`: make export cancellation/failure/success and dirty-state tracking
  truthful.
- `BF-P1-05`: bring the Woven Shirt assembled preview into parity with the
  drafted component contract.
- `BF-P1-06`: repair the primary responsive shell enough that the P1 workflow is
  usable at narrow widths.

### `EPIC-BUGFIX-P2` — usable inspection and interaction

Close all P2 records after P1 passes its exit gate. Scope includes canvas sizing,
zoom/inspection, labels, croquis readability, view composition, controls,
cross-highlighting, material semantics, export scope, onboarding flow,
field-level guidance, and accessibility semantics.

Suggested slices:

- `BF-P2-01`: normalize canvas sizing and add the inspection affordances needed
  for pattern, body, marker, nesting, side, and edit views.
- `BF-P2-02`: improve view composition, headings, preview ownership, and woven
  option grouping.
- `BF-P2-03`: repair option-to-body highlighting and clarify fabric/material
  behavior and units.
- `BF-P2-04`: clarify export scope and make the journey and guidance surfaces
  operable and accessible.

### `EPIC-BUGFIX-P3` — polish and discoverability

Close all P3 records after P2 passes its exit gate. Scope includes stale helper
copy, product hierarchy, visible naming, and lower-risk discoverability issues.

Suggested slices:

- `BF-P3-01`: correct stale journey, style, and control copy.
- `BF-P3-02`: improve product identity, section hierarchy, and swatch
  discoverability.

## Priority and severity

Priority controls sequence; severity describes impact. They must be recorded
separately on every ledger entry.

- `P1`: must be closed before Epic 3 because it can lose work, misrepresent
  design state/output, block core use, or invalidate trust in the result.
- `P2`: major usability or accessibility problem that should be closed before
  Epic 3 unless the maintainer explicitly reorders it.
- `P3`: lower-risk polish or discoverability issue; still tracked to closure.
- `S1 Critical`: incorrect or lost user data, incorrect exported/garment result,
  or a false production decision.
- `S2 Major`: a primary flow is unusable or materially misleading.
- `S3 Moderate`: substantial friction, legibility, or accessibility loss with a
  viable workaround.
- `S4 Minor`: copy, naming, or low-impact polish defect.

## Goal-setting protocol

Use one master goal for the whole phase:

> Complete the InfiniDrip Bug-Fix Phase before Epic 3 by closing every open
> `BUG-UI-*` record in priority order P1 → P2 → P3, with the required tests,
> rendered review, parsed export checks, unchanged legacy export hashes, and
> durable ledger/state updates.

The three epics are sequential milestones inside that one goal. Do not create
three simultaneous unfinished goals in one task. At the end of each epic, update
the ledger and produce an exit report before continuing. Pause only for a real
product, architecture, material, or scope decision, or for a verification gate
that cannot be resolved safely from the existing contract.

## Model and ownership recommendation

Recommended default: GPT-6 Astra at `high` reasoning for the phase, with `max`
reserved for a difficult P1 root-cause or final integration review. Astra is
officially described as the strongest model for multistep software-engineering
work, which matches the cross-cutting state/render/export changes here.

Luna at `max` can execute the full phase if usage constraints require it, but it
should work in the explicit slices above with Codex-owned review after every
slice. It is a good fit for bounded P2/P3 UI polish, documentation, and focused
test work after the shared contracts are established. It is not the preferred
sole owner for the P1 state, persistence, geometry/rendering, and export
integration work.

Codex remains the control point for architecture, shared state, drafting/render
contracts, grading, exports, integration, final review, and the full verification
gate. OpenCode or Claude may be used only under `docs/OPENCODE-WORKFLOW.md` and
only for bounded contributor work; their results do not bypass Codex review.

## Definition of done

For each fix and each epic:

1. The ledger entry has a stable ID, severity, priority, root cause, fix slice,
   commit/PR, verification evidence, and final status.
2. The fix is covered by meaningful tests where behavior is testable.
3. The live UI and actual rendered/drafted/output artifacts are inspected.
4. The full required gate passes: 100% coverage, TypeScript, production build,
   parsed SVG/DXF/PDF/projector/tech-pack consumers, and unchanged legacy export
   hashes unless a documented maintainer-approved behavior change requires a
   baseline move.
5. `PROJECT-STATE.md`, affected durable context, and the ledger are updated in
   the same commit as the behavior they describe.
6. Physical validation remains explicitly deferred.

## Traceability rules

Bug IDs are never reused or silently deleted. A fix commit must mention every
closed ID, for example:

`Slice BF-P1-03: repair workspace round trip [BUG-UI-006, BUG-UI-007, BUG-UI-008]`

When a finding is split, keep the original evidence in the ledger and create
new IDs with a note linking the parent. When a finding is rejected as not a bug,
record the decision, evidence, and maintainer decision rather than removing it.
