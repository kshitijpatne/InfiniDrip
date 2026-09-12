# Epic 3 — Phase 5 trouser block execution

_Planning baseline: 2026-09-12._

## Master objective

Complete InfiniDrip EPIC 3 / Phase 5 trouser block across Slices 94–103.
Research and define the reusable trouser measurement/ease, rise, seat,
waistband, grading, closure, pocket, guidance, rendering, persistence, and
export contracts; implement and verify the relaxed casual straight-leg
trouser; define its later shorts/jogger relationship; preserve all existing
garment behavior and legacy export hashes; keep surface design independent from
unfinished garment geometry; and finish with passing tests, rendered/output
evidence, durable documentation, and the full project gate. Physical validation
remains deferred.

The authoritative research boundary is
`docs/research/garments/TROUSER-RESEARCH.md`. The project decisions in
`docs/PROJECT-DECISIONS.md` and the standing no-silent-reuse/no-silent-clamp
rules in `ARCHITECTURE.md` govern every implementation slice.

## Entry verification and constraints

BUGFIX P1/P2/P3 and the FC-01 consistency extension are complete on the actual
`main` checkout. Before Slice 94, the tracked worktree was clean, `main`
matched `origin/main`, the implementation had no trouser recipe, and the
baseline had 100% coverage, passing TypeScript/build, parsed output consumers,
and all eight unchanged legacy export hashes. Preserved untracked logs and
`tmp/` evidence are user artifacts and remain untouched.

The first trouser is a reusable relaxed casual straight-leg woven block with a
separate waistband, simple front closure, and minimal paired pocket bags. It
must be a first-class recipe through Body, Pattern, Size run, Spec, Nesting,
Check, Edit, Guidance, persistence, and every export path. Surface design,
Polo V2, shorts/joggers implementation, physical sewing, and production
readiness are out of scope.

Every slice below has an explicit owner boundary:

- Codex owns geometry, drafting, architecture, shared pipeline/data-model,
  grading, export integration, final review, and all acceptance decisions.
- OpenCode/Claude may be used only for bounded research, documentation, UI
  polish, test expansion, and export QA under `docs/OPENCODE-WORKFLOW.md`.
  Contributors cannot decide geometry, contracts, baselines, or physical
  validation. Any result is reviewed against the actual diff and evidence.

## Slice plan and acceptance criteria

### Slice 94 — research and contract foundation

Status: **complete**.

Scope: create the trouser research record; separate source facts, product
decisions, provisional digital estimates, and physical limitations; define the
lower-body measurement/option, pieces/interfaces, guidance, grading, POM,
output, persistence, and later shorts/jogger contracts; update durable state
and architecture.

Acceptance criteria:

- `TROUSER-RESEARCH.md` follows the garment research template and cites the
  reviewed local and open references.
- No trouser geometry, shared contract, export writer, or legacy baseline
  changes in this slice.
- Slices 95–103 have scope, non-goals, dependencies, ownership, and focused
  verification expectations recorded here.
- Existing behavior remains covered by the entry baseline.

Non-goals: implementation, physical validation, surface design, or choosing a
production/fabric standard from an unsupported example.

Focused evidence: inspect the actual docs diff; retain the already-passed
baseline gate as the no-code proof.

### Slice 95 — shared lower-body data model and controls

Status: **complete** (`5710268`, with durable-state amendment).

Scope: add the explicitly named lower-body measurements and trouser recipe
options, standards, fields/facets, plausibility ranges, persistence migration,
and UI correction plumbing.

Acceptance criteria:

- New fields are visible only where the trouser recipe declares them and are
  labelled body versus finished without changing existing garment labels.
- New options are recipe-owned, numeric, persisted by recipe, and use their
  declared ranges/units/help; live invalid values remain visible and do not
  silently clamp.
- Old saves migrate to deterministic documented defaults; new values round-trip
  with workspace state; malformed saves remain safely rejected/defaulted.
- Focused tests cover all new branches and existing tests/legacy hashes remain
  unchanged.

Non-goals: pattern geometry, renderer-specific approximations, or export-writer
changes beyond compile-safe plumbing.

Dependencies: Slice 94 contract; existing `Measurements`, `FIELDS`, options,
facets, guidance, and persistence contracts.

Owner/model: Codex; high reasoning only for shared contract review, otherwise
medium. This changes the shared data model and persistence.

Verification: focused measurement/options/facet/persistence/guidance tests,
then typecheck and the legacy export suite.

Evidence: the actual checkpoint passes 74 test files / 969 tests, 100%
statements/branches/functions/lines, `npx tsc --noEmit`, `npm run build`, all
13 export suites / 140 tests, and all eight unchanged legacy hashes. No recipe
or trouser geometry was registered.

### Slice 96 — reusable straight-leg leg block

Status: **complete** (geometry checkpoint; focused tests 7/7).

Scope: implement the lower-body draft with explicit front/back rise and
crotch/seat shaping, four leg roles, landmarks, grain/crease marks, and named
leg interfaces. Resolve and record the transparent curve approximation before
editing code.

Acceptance criteria:

- The draft consumes the live body fields/options; waist, seat, hip depth,
  crotch depth, rise deltas, thigh, knee, inseam, and leg opening genuinely move
  the relevant geometry.
- Front/back crotch curves are separate, named, finite, and not borrowed from a
  top or skirt. Left/right panels are mirrored by construction where intended.
- Waist, hip, knee, hem, center, grain, and crease landmarks are explicit;
  no render-only geometry is the source of truth.
- Focused geometry tests include length/mirror/mutation checks and the actual
  standard draft; no physical-fit claim.

Non-goals: waistband, fly shield, pockets, UI recipe registration, or physical
sample.

Dependencies: Slice 95 fields/options; existing Piece/curve/block primitives.

Owner/model: Codex; high reasoning for crotch/seat geometry and seam
relationships.

Verification: focused draft/component geometry tests and direct rendered
pattern inspection before integrating further.

Evidence: `draftTrouserLegs()` is exported as a standalone drafting contract;
its 7 focused geometry/render tests and `npx tsc --noEmit` pass. The test
renders the actual four-piece blueprint string and verifies labels/closed
curves. No recipe, application route, export writer, or legacy baseline changed;
the full integration gate is intentionally pending until the remaining
components are assembled.

### Slice 97 — separate waistband and simple closure

Status: **complete** (focused tests 12/12).

Scope: implement the trouser waistband as a distinct component and add the
simple front fly/zip closure and fastening marks/piece required by the contract.

Acceptance criteria:

- The waistband is a separate role with live depth and a closed-band seam; it
  is not the skirt's folded strip under a different name.
- Front/back rise POMs include the declared waistband reference and closure
  marks stay inside the relevant front/waistband pieces.
- Fly/waistband stitches and interfaces are explicit, finite, and checked.
- Option changes genuinely alter geometry/marks and are reported in the
  assembled preview/tech pack where applicable.

Non-goals: multiple closure types, belt loops, tailoring, or hardware sourcing.

Dependencies: Slice 96 leg waist/center-front edges; Slice 95 option state.

Owner/model: Codex; high reasoning for component boundary, medium for marks.

Verification: component/stitch/mutation tests; parsed SVG/DXF/PDF/projector
checks for marks and roles; inspect the actual SVG.

Evidence: the actual `draftTrouserWithClosure()` block contains the four leg
roles plus `trouser waistband` and `trouser fly shield`; all eight declared
stitches pass and live depth/length changes move their real pieces/marks. The
focused leg/component suite passes 12/12 and TypeScript passes. Application
registration and parsed output checks wait for the complete garment.

### Slice 98 — minimal pocket component and sewability contract

Scope: add paired pocket-opening marks/bags and the complete lower-body stitch,
notch, allowance, and component checks.

Acceptance criteria:

- Pocket opening, bag depth, and drop are live, named, bounded by guidance,
  and mirrored across both sides.
- Pocket bags join the actual front opening interfaces; they do not exist only
  in a render overlay or BOM.
- All declared leg, fly, waistband, and pocket seams have matching lengths or
  deliberate ease allowances; notches and grain data cover every piece.
- The checker can explain a failure and the valid standard block passes.

Non-goals: back/cargo/coin pockets, decorative topstitching, or stretch pocket
behavior.

Dependencies: Slices 96–97 pieces and named marks.

Owner/model: Codex; high reasoning for pocket/edge interfaces.

Verification: real `garmentReport` across the size run, focused mutation tests,
and actual assembled/pattern SVG inspection.

### Slice 99 — guidance, POMs, grading, allowances, and tech pack

Scope: finish trouser-specific guidance/corrections, grade rule, size run,
POM/notch/allowance tables, BOM, and ordered construction notes.

Acceptance criteria:

- All invalid combinations in the research contract are caught without
  clamping, with field/option-linked actionable corrections.
- Graded sizes grow coherently through `draftAtSize`/`gradeRun`; rise/seat/leg
  relationships remain explicit and finite.
- POMs distinguish body versus finished dimensions and include rise, seat,
  waistband, leg, closure, and pocket references.
- Tech-pack BOM/construction data agrees with the roles, options, and marks;
  no “fit” or “production-ready” claim appears.

Non-goals: physical tolerance approval, automated fit correction, or new
export-writer algorithms.

Dependencies: complete block/components from Slices 96–98.

Owner/model: Codex; medium/high reasoning for cross-contract review.

Verification: focused guidance/grade/POM/tech-pack/check tests; full legacy
export regression remains mandatory.

### Slice 100 — recipe and application integration

Scope: register the trouser recipe and route it through all existing app
surfaces, including garment switching, Style, Body, assembled preview, Pattern,
Size run, Spec, Nesting, Check, Edit, Guidance, and save/load.

Acceptance criteria:

- The registry is the single source for trouser fields, styles, draft, grade,
  checks, guidance, POMs, notches, allowances, tech pack, and options.
- Every relevant control/view reflects the live trouser block; no hardcoded
  six-garment list or top-only assumption remains.
- Body/assembled render data comes from the same drafted geometry/parameters;
  Edit stays preview-only and does not create durable overrides.
- Garment switch, size selection, option changes, invalid-state recovery, and
  persistence are tested at the DOM level without changing existing behavior.

Non-goals: final design editing, surface decoration, 3D, or physical fit.

Dependencies: Slices 95 and 99 plus existing FC-01 UI contracts.

Owner/model: Codex; medium reasoning, high only for shared render/pipeline
drift. This is a shared pipeline integration slice.

Verification: focused app/render tests and live browser checks at supported
widths; retain 8/8 legacy hashes.

### Slice 101 — export/output integration and evidence

Scope: make the live trouser consumable by SVG, DXF, tiled PDF, A0 PDF,
projector SVG, nesting, and tech-pack outputs; add parsed consumer checks and
render evidence.

Acceptance criteria:

- Every writer emits the declared trouser roles, marks, grain/notch data,
  allowances, and POM/tech-pack content; parsed consumers agree.
- Invalid input/options prevent output and report the same guidance verdict.
- Existing garment export bytes remain unchanged; no baseline is moved.
- Actual output files and screenshots are reviewed, not inferred from JSON or
  unit tests alone.

Non-goals: production marker quality, fabric-specific shrinkage, or new output
formats.

Dependencies: registered recipe and complete tables from Slices 98–100.

Owner/model: Codex; medium/high reasoning for output-contract review. Export
QA may be delegated only as a bounded review with an actual diff/artifact.

Verification: parsed six-consumer suite, eight legacy hash suite, real file
inspection, and browser Output/Nesting/Spec checks.

### Slice 102 — cross-surface audit and responsive verification

Scope: perform the integrated trouser audit across controls, views, guidance,
size changes, persistence, exports, and responsive widths; fix only real Epic 3
failures found by evidence.

Acceptance criteria:

- Pattern, Body, assembled preview, Size run, Spec, Nesting, Check, Edit,
  Guidance, and Output agree on the same valid/invalid trouser state.
- Every user-visible option/measurement has a real effect or an explicit
  documented reason; invalid combinations name a correction target.
- Live browser checks cover 1280/900/700/560/390 widths with no horizontal
  overflow at fit zoom; existing garments are spot-checked alongside trouser.
- Any fix updates tests and durable context in the same slice.

Non-goals: redesign, unrelated bug cleanup, physical sampling, or changing
existing baselines to make an assertion pass.

Dependencies: Slices 100–101.

Owner/model: Codex; high reasoning for root-cause/evidence reconciliation.

Verification: focused/live browser matrix; no redundant full gate until the
exit slice unless shared contracts or outputs changed materially.

### Slice 103 — Epic 3 exit gate and durable report

Scope: complete the project gate, inspect the actual final diff/branch, record
exact commits/evidence, and close Epic 3 without starting a later Epic.

Acceptance criteria:

- Slices 94–103 are complete or explicitly re-scoped by the maintainer; no
  unrecorded contract ambiguity remains.
- Straight-leg trouser is a first-class integrated recipe; shorts/joggers are
  documented derivatives only; surface design remains independent.
- `npm test`, `npm run coverage`, `npx tsc --noEmit`, and `npm run build` pass;
  coverage is 100% for statements, branches, functions, and lines.
- Parsed SVG/DXF/tiled PDF/A0 PDF/projector SVG/tech-pack checks pass, including
  all eight unchanged legacy hashes.
- Rendered/live browser evidence covers existing garments and the trouser,
  supported responsive widths, every relevant control/view/measurement/option,
  guidance corrections, size/persistence/export paths.
- `PROJECT-STATE.md`, `ARCHITECTURE.md`, research, planning records, and this
  exit report are current. The report explicitly defers physical validation and
  makes no production-readiness claim.

Non-goals: later surface design, Polo V2, physical validation, code signing, or
push/shared-history changes.

Dependencies: all prior slices and a final usage check with enough allowance
for the gate.

Owner/model: Codex; highest reasoning for final integration review only.

Verification: the full project gate listed above, with command output,
coverage summary, parsed-output evidence, legacy hash manifest, and rendered
evidence paths recorded in the exit report.

## Usage-limit pacing and checkpoints

Check the usage dashboard at startup, before each major slice, before any
expensive parallel work, and before Slice 103's full gate. Focused tests are the
default during implementation. If the visible remaining allowance approaches
15%, finish only the current atomic operation, commit it, update this file and
`PROJECT-STATE.md` with exact remaining work and resume commands, and stop
before another expensive slice or full gate. Do not consume a reset credit or
alter account usage.

## Epic 3 exit report

Status: **not started beyond Slice 97 waistband/closure components**.

Slices 98–103 remain implementation and verification work. No physical garment
has been sewn or validated, and no production-readiness claim is authorized.
