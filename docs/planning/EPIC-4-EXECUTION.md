# InfiniDrip — Epic 4 Execution

_Started 2026-09-13 from `main` at `9890beb`. This is the live execution
record for Component Architecture and Garment Grammar; the older
`COMPONENT-ARCHITECTURE.md` remains the design rationale and historical phase
plan._

## Status

**In progress — Slice 105 (baseline and contract confirmation).**

Epic 3 is closed. No later Epic has started in the repository. The separate
Desktop Release workstream is running in isolated contributor worktrees and is
not part of Epic 4's acceptance gate.

## Objective

Turn the existing partial component work into a complete, shared garment
grammar that can express the seven current garments as compositions of
parameterised components, while keeping the engine/recipe boundary, output
truth, and existing export identity intact.

The Epic must leave the product with one real, narrowly scoped user-facing
composition proof. It must not become a general-purpose configurator or a new
garment-library expansion.

## Confirmed scope — 2026-09-13

The maintainer confirmed the following defaults:

1. Include the full Priority 1 package: the composition architecture,
   structural primitives, and the shared croquis/Side-view library.
2. Build the internal architecture plus one narrowly scoped user-facing proof;
   do not build a full configurator.
3. Components own their geometry and named interfaces; composition owns
   dependency-ordered assembly and seam matching; options are scoped to their
   owning component; downstream consumers read the composed result.
4. Migrate all seven current recipes — Tee, Fitted tee, Tank, Polo, Woven
   shirt, Skirt, and Trouser — with unchanged legacy export hashes and
   semantic/rendered parity for the other existing outputs.
5. Add no new garment family. An existing garment or variant is the proof
   vehicle when a real composition consumer is needed.

Already-set boundaries remain in force:

- Edit remains exploratory/preview-only through Phase 5; no durable final-edit
  override is part of this Epic.
- Surface design is a later independent Epic.
- Physical sewing, fit validation, and production-readiness claims remain out
  of scope.
- 3D drape, cloth simulation, photo-to-pattern reconstruction, vendor
  marketplace work, code-signing procurement, and unrelated dependency or
  platform changes remain out of scope.

## Current-code baseline

The actual checkout already contains these partial foundations:

- `Edge`, `Piece`, `Block`, `EdgeRef`, `Interface`, `Stitch`,
  `stitchChecks()`, `matchedNotch()`, `Component`, and ordered
  `assembleComponents()`.
- Tee, fitted tee, tank, skirt, and trouser drafting already exercise parts of
  the component/stitch vocabulary. Polo and woven shirt still contain
  composition logic that must be brought behind the same boundary.
- `render/croquis.ts` and `render/croquis-view.ts` already provide part of the
  shared upper/lower and front/side/back presentation contract; this Epic must
  finish the ownership boundary without allowing croquis data into drafting.
- The current recipe registry has seven garments and remains the public engine
  seam. Existing output writers, grading, persistence, and guidance consumers
  must continue to receive a normal assembled `Block`.

## Target contract

The implementation may refine names after the first contract slice, but the
following invariants are fixed:

- A component is a pure, typed function from measurements plus owned params to
  pieces, internal stitches, and named exposed interfaces.
- A composition is an ordered graph/pipeline, not an unordered bag: later
  components may consume a measured interface from earlier components.
- A component cannot claim a role already claimed by another component;
  missing interfaces, bad edge/mark references, and incompatible connections
  fail loudly.
- `Piece` remains the name for the closed pattern panel. `Component`,
  `Interface`, and `Stitch` are additive vocabulary, not a renaming exercise.
- Options remain component-scoped and are not added to body `Measurements`.
- Stitches remain the source for matched seam checks and matched notches where
  applicable. Single-panel properties such as hem squareness remain explicit
  geometry checks rather than being forced into the stitch graph.
- The composed `Block` remains the sole geometry handed to check, guidance,
  grading, POM, nesting, Edit, render, persistence, and export consumers.
- The one user-facing proof will expose one controlled composition choice and
  its resulting component-backed preview/validation path. It will not expose a
  free-form component marketplace or arbitrary incompatible swaps.

## Slice plan

Every slice has its own focused tests, `git diff --check`, and durable-context
update. Refactor slices must not change behaviour; behaviour slices must state
their deliberate change and retain the legacy gate.

### Slice 105 — baseline, contract, and migration map

Status: **in progress**.

Record the confirmed scope, actual-code inventory, target invariants, exact
legacy/semantic parity rules, delegation boundary, and exit gates in this file
and the durable project documents.

Non-goals: source refactoring, new UI, new garments, surface design, physical
validation, or Desktop Release implementation.

### Slice 106 — grammar and composition contract

Define the minimal typed composition vocabulary needed beyond the existing
`ComponentResult`: component identity/ownership, dependency-ordered assembly,
owned params, exposed interfaces, composed metadata, and loud invalid-graph
failures. Add pure tests before migrating recipes. Preserve the existing
`GarmentRecipe` seam and output bytes.

### Slice 107 — shared structural primitives

Consolidate the real repeated structural vocabulary behind the grammar:
bodice/panel, sleeve, neckline, collar/stand, placket, cuff/band, waistband,
pocket, dart, vent, and hem treatments where the repository has real consumers.
Do not invent generic abstractions for one-off geometry. Keep the two-consumer
rule unless an existing physical component has a clearly bounded owner.

### Slice 108 — knit compositions

Migrate Tee, Fitted tee, Tank, and Polo through the common grammar. The proof
must measure downstream interfaces from the actual preceding component, retain
the current option and guidance semantics, and preserve legacy output identity.

### Slice 109 — woven and lower-body compositions

Migrate Woven shirt, Skirt, and Trouser through the same grammar. Preserve
their distinct construction semantics, lower/upper region routing, marks,
allowances, POMs, grading, tech packs, and recipe-owned guidance.

### Slice 110 — downstream consumer convergence

Remove remaining consumer-specific assumptions that bypass composition. Verify
checks/guidance, matched notches, allowances, grading, POM, nesting, Edit,
rendering, persistence, and every export writer consume the assembled result
without a second geometry source.

### Slice 111 — shared croquis and Side-view ownership

Finish the render-only croquis library for upper/lower × front/side/back,
including component-contributed measurement annotations where applicable. Keep
croquis out of drafting and preserve the explicit schematic-not-simulation
label for Side.

### Slice 112 — one user-facing composition proof

Expose one bounded, reversible composition-backed choice using an existing
garment/variant. The proof must visibly change the actual draft and downstream
digital checks/preview while remaining within the existing recipe and option
contracts. No full configurator or arbitrary component swapping.

### Slice 113 — Epic 4 integration and exit gate

Run the full project gate, inspect the actual diff and branch, parse all output
consumers, verify all eight legacy hashes, run rendered/live cross-garment and
responsive checks, and complete the Epic 4 exit report. Do not begin a later
Epic until this report is passing.

## Acceptance criteria

- All seven current recipes are composed through the shared grammar and retain
  their current valid/invalid, option, guidance, persistence, grading, POM,
  nesting, Edit, render, and export behaviour.
- Existing legacy export hashes remain byte-identical; no baseline moves
  without a separately documented maintainer decision.
- Existing non-legacy garments have semantic and rendered parity proven by
  focused golden evidence, not only by type compatibility.
- The component contract is typed, dependency-ordered, option-scoped, and
  fails loudly on role/interface collisions or unresolved references.
- Structural primitives are reused where the code has real consumers and do
  not become a speculative general-purpose CAD system.
- All downstream consumers use the composed `Block`; no duplicate per-garment
  geometry is introduced to make a view or writer pass.
- The shared croquis library remains presentation-only and covers the existing
  upper/lower front/side/back contract.
- One user-facing composition proof is live, persisted only through an
  existing appropriate option contract, and covered by focused plus rendered
  tests. A full configurator is absent.
- `npm test`, `npm run coverage`, `npx tsc --noEmit`, `npm run build`, parsed
  output checks, legacy hashes, rendered/live browser evidence, and responsive
  checks pass at the Epic exit. Coverage remains 100% for statements,
  branches, functions, and lines.
- No physical-fit or production-readiness claim is made.

## Delegation boundary

Desktop Release is a separate parallel workstream. OpenCode is assigned
release research/architecture documentation; Claude Code is assigned a bounded
Electron shell audit/hardening task. They use separate worktrees and may not
touch Epic 4 files. Codex reviews their actual diffs, tests, and evidence and
alone decides whether either result is integrated or promoted to a later Epic.
No contributor may push `main`.

## Usage pacing

Usage is checked at startup, before each major Epic 4 slice, before launching
expensive parallel work, and before the final gate. Focused checks are used
during iteration; the full gate is reserved for integration checkpoints. If
remaining allowance approaches the maintainer's 15% stop threshold, finish
only the current atomic operation, commit it, update this file and
`PROJECT-STATE.md` with exact resume state, and stop before another expensive
slice. No reset credit may be consumed without explicit authorization.

## Epic 4 exit report

Pending. It may be marked passing only after all acceptance criteria above are
proven on the actual branch and the durable documents are current.
