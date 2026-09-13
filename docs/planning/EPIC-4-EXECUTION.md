# InfiniDrip — Epic 4 Execution

_Started 2026-09-13 from `main` at `9890beb`. This is the live execution
record for Component Architecture and Garment Grammar; the older
`COMPONENT-ARCHITECTURE.md` remains the design rationale and historical phase
plan._

## Status

**In progress — Slice 113 (final Epic 4 gate).**

Epic 3 is closed. Slices 105–109 have been implemented on this branch. The
remaining work is the final Epic 4 gate. The
separate Desktop Release workstream was reviewed and promoted in its own
commits; it is not part of Epic 4's acceptance gate.

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

The actual checkout contains these foundations and the completed migration
checkpoint:

- `Edge`, `Piece`, `Block`, `EdgeRef`, `Interface`, `Stitch`,
  `stitchChecks()`, `matchedNotch()`, `Component`, and ordered
  `assembleComponents()`.
- All seven registered recipes now declare a named `GarmentGrammar` and their
  public `draft()` functions compose through it. The migration retains the
  existing staged helper APIs where they are still public/tested, but the
  registry and application path use the composed result.
- `render/croquis.ts` and `render/croquis-view.ts` provide the shared
  upper/lower and front/side/back presentation contract; the Epic audit must
  keep that ownership boundary intact without allowing croquis data into
  drafting.
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

Status: **complete**.

Record the confirmed scope, actual-code inventory, target invariants, exact
legacy/semantic parity rules, delegation boundary, and exit gates in this file
and the durable project documents. The record is the Slice 105 checkpoint
commit `46ae2f9`.

Non-goals: source refactoring, new UI, new garments, surface design, physical
validation, or Desktop Release implementation.

### Slice 106 — grammar and composition contract

Status: **complete**.

Define the minimal typed composition vocabulary needed beyond the existing
`ComponentResult`: component identity/ownership, dependency-ordered assembly,
owned params, exposed interfaces, composed metadata, and loud invalid-graph
failures. Add pure tests before migrating recipes. Preserve the existing
`GarmentRecipe` seam and output bytes. `src/drafting/grammar.ts` now validates
duplicate/recursive dependency graphs, role collisions, missing interfaces,
and final connector piece/edge/mark references; `grammar.test.ts` covers the
contract with ten focused tests. The contract checkpoint is `81002dd` plus the
final-connector validation in the migration checkpoint.

### Slice 107 — shared structural primitives

Status: **complete as an adoption checkpoint**.

Consolidate the real repeated structural vocabulary behind the grammar:
bodice/panel, sleeve, neckline, collar/stand, placket, cuff/band, waistband,
pocket, dart, vent, and hem treatments where the repository has real consumers.
Do not invent generic abstractions for one-off geometry. Keep the two-consumer
rule unless an existing physical component has a clearly bounded owner.

### Slice 108 — knit compositions

Status: **complete**.

Migrate Tee, Fitted tee, Tank, and Polo through the common grammar. The proof
must measure downstream interfaces from the actual preceding component, retain
the current option and guidance semantics, and preserve legacy output identity.

### Slice 109 — woven and lower-body compositions

Status: **complete**.

Migrate Woven shirt, Skirt, and Trouser through the same grammar. Preserve
their distinct construction semantics, lower/upper region routing, marks,
allowances, POMs, grading, tech packs, and recipe-owned guidance.

### Slice 110 — downstream consumer convergence

Status: **complete**.

Remove remaining consumer-specific assumptions that bypass composition. Verify
checks/guidance, matched notches, allowances, grading, POM, nesting, Edit,
rendering, persistence, and every export writer consume the assembled result
without a second geometry source.

### Slice 111 — shared croquis and Side-view ownership

Status: **complete**.

Finish the render-only croquis library for upper/lower × front/side/back,
including component-contributed measurement annotations where applicable. Keep
croquis out of drafting and preserve the explicit schematic-not-simulation
label for Side.

### Slice 112 — one user-facing composition proof

Status: **complete**.

Expose one bounded, reversible composition-backed choice using an existing
garment/variant. The proof must visibly change the actual draft and downstream
digital checks/preview while remaining within the existing recipe and option
contracts. No full configurator or arbitrary component swapping.

### Slice 113 — Epic 4 integration and exit gate

Status: **in progress**.

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

## Slice 107–109 migration checkpoint

The seven registry entries now carry named grammar graphs: `tee`, `fitted`,
`tank`, `polo`, `woven-shirt`, `skirt`, and `trouser`. Knit sleeve targets,
neckline/collar and placket lengths, woven yoke/sleeve dependencies, skirt
waistband circumference, and trouser waistband/fly/pocket joins are resolved
from the actual preceding component interfaces. Existing downstream callers
still receive an ordinary assembled `Block`; no export writer or baseline was
changed.

The existing garment selector is the bounded user-facing proof vehicle: Tee ↔
Fitted switches the actual composed front component, and the already-covered
Pattern, Spec, Check, and Edit routes observe that same draft. No new garment
family or arbitrary component UI was added.

The post-migration checkpoint passes `npm test` (81 files / 1,031 tests) and
`npm run coverage` (100% statements, branches, functions, and lines). The
standalone typecheck, production build, parsed-output gate, legacy hash gate,
and rendered/live responsive audit remain the Slice 110–113 closeout work.

## Slice 110–112 verification checkpoint

The downstream audit found every application/export/check path entering through
the recipe's composed `Block`; no writer or view introduced a second geometry
source. The existing croquis contract remains render-only and drafting has no
croquis import. Live app evidence covered all seven garments through Pattern,
Body, Size run, Spec, Nesting, Check, and Edit; every surface rendered SVG with
no `NaN` or browser error. The existing Tee ↔ Darted tee selector changed the
actual pattern SVG (`FOLDFRONTFOLDBACKSLEEVE` →
`FOLDFITTED FRONTFOLDBACKSLEEVE`) and the fitted Spec/Check surfaces retained
the dart evidence.

The live responsive matrix covered all seven garments at 1280, 900, 700, 560,
and 390 px. Every case had no horizontal overflow, a visible pattern SVG, and
matching left/right +/- and Boundary Rail counts: Tee 8, Darted tee 8, Tank 9,
Polo 12, Woven shirt 25, Skirt 6, and Trouser 20. A real Trouser control round
trip changed waist 86 → 87 → 86 and the rail label followed the current value;
browser error/warning diagnostics were empty. A rendered Trouser Pattern
screenshot was visually inspected at the default 1280 px viewport.

The parsed output checkpoint passed 21/21 focused tests across the Woven shirt,
Polo, Trouser, and legacy regression suites. These tests parse actual SVG with
DOMParser, DXF structure, tiled PDF/A0/Tech Pack pages with pdf-lib, and
Projector SVG layer/mark counts. The eight legacy SHA-256 values remain:

- Tee: SVG `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d`,
  DXF `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`,
  PDF `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523`,
  Tech Pack `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1`.
- Darted tee: SVG `cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c`,
  DXF `e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6`,
  PDF `184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff`,
  Tech Pack `8e89320bfa235c44ebb481b01012a43c7c1614ce27608ccbb49df31369bca8d2`.

## Desktop Release delegation review

This remains a separate workstream and does not widen Epic 4. OpenCode's
research-only packet was reviewed and promoted as `7d84e7a` (contributor
commit `57948a3`). Claude Code's Electron hardening and verifier correction was
reviewed and promoted as `7ecc9c2` (contributor commit `34fc327`). On the real
Windows development run, `npm run electron:verify` passed native save, and
`npm run electron:verify-menu` passed app identity/title, native File → Export
→ SVG, and window-state persistence with the observed 125%-DPI single-relaunch
drift explicitly bounded by the verifier. The underlying multi-relaunch size
creep remains a documented Electron/Windows limitation; no claim of pixel-
exact long-term restoration is made. No packaged installer, signing,
notarization, or auto-update gate was claimed or shipped.

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
