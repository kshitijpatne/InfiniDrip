# EPIC-18 / G05 — Admission and execution contract

**Status:** admitted by the maintainer on 2026-10-12. **Admission slice:** 762.
**Current packet:** T01 starts after this documentation/board boundary. **Owner:**
Codex. **Conditional baseline:** 19 landed slices, 762–780 inclusive; add a
separately numbered follow-up for any failed gate or needed correction.

## Authority and verified checkpoint

The maintainer asked to identify the next completed-work boundary and begin the
next goal, explicitly naming EPIC-18 as the likely choice and authorizing the
fact-based decision. This packet records that admission. The confirmed next
numbered capability Epic is **EPIC-18 / G05 — Living production tech pack**:
EPIC-17/G04 is closed, EPIC-18 was Backlog, and the G05 roadmap requires a
separate admission after G04. The next UI-sequence item, UIQ-09, is a different
lane and remains blocked on EPIC-19/G06; it is not the next implementation.

Admission starts from refreshed `origin/main` commit
`e9221ea5033ccfdd91bf1ebb353926f189477d75`, with canonical Control Center
revision 4521. Slice 761's PR #42 is merged and its full main workflow
`38297266637` succeeded. The last completed capability Epic is EPIC-17/G04,
closed through Slice 732 and verified deployment. UIQ-08 is also fully done:
Slices 759–760, final closeout PR #41 at `2064a325`, successful workflow
`38294678690`, and stable/immutable live output verification. Slice 761 closed
UIQ-01 as a review checkpoint only; it did not add an application feature.
Board revision 4521 records UIQ-01 Done and UIQ-09 Backlog with its EPIC-19
dependency.

EPIC-18's existing board card depends on EPIC-15/G02, which is Done. EPIC-16/G03
and EPIC-17/G04 are also Done and provide the measurement, size/grade, pattern,
flat, and output contracts consumed by later G05 packets. The accepted G01 C04
contract (`docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`)
defines the linked record graph, provenance, stage-aware completeness,
immutable revisions, approvals, dependency invalidation, and frozen manifest.
The seven supported recipes remain Tee, Darted Tee, Tank, Polo, Woven Shirt,
Skirt, and Trouser.

Implementation is isolated in worktree
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`, branch
`codex/epic-18-g05`, based exactly on the commit above. The shared
`F:\designApp` checkout was not used: it started on the older
`codex/uiq-parallel-candidates` branch with 9 tracked changes and 2,708
untracked files. Those existing files remain untouched. No EPIC-18 branch or
open PR existed at admission.

## Intended result and ordered packets

Deliver the roadmap's editable, provenance-aware G05 pack for all seven
supported recipes. Editable source records are authoritative; PDFs and
structured exports are generated views of an exact style revision. Calculated
POMs, user choices, supplier facts, and actual sample observations stay
separate. Unknown or conflicting values remain visible with a reason and a
next action; invalid combinations fail visibly instead of being clamped.

- **T01 — Style and material record:** cover, style/revision identity, base
  size, scoped approval state, editable BOM, fabric/trim supplier/article/lot/
spec fields, colorway, and field-level source/provenance. Material or trim edits
  must update dependent pack/cost inputs and views and invalidate affected
  frozen status; missing facts stay explicit.
- **T02 — POM and sample/QA records:** POM method/landmarks, unit, tolerance
  status and source, size-run/grade-rule references and complete callout checks.
  Editable sample and QA rounds bind to one revision and remain distinct from
  predicted POM values.
- **T03 — Construction operations:** component/seam-linked operations,
  sourced stitch/seam/allowance facts, finish, pressing, labels, packaging, tests
  and compliance fields. Unsupported machine settings or construction facts
  remain unresolved; component inventory must reconcile to pattern and BOM.
- **T04 — Route-specific output:** configurable pack sections/templates,
  costing inputs, PDF and a structured editable export with image/vector
  attachments, field-level differences and scoped approvals. Two representative
  styles must pass readable rendered output, numeric reconciliation, and
  import/round-trip checks where supported.
- **T05 — Freeze and change control:** pin one approved revision for local
  digital sharing; generate deterministic manifests and hashes; invalidate
  dependent checks, approvals and output state when inputs change; preserve old
  frozen bytes and compatibility with the existing draft Tech Pack.

## Exact slice boundaries

| Slice | Boundary and exit evidence |
| ---: | --- |
| 762 | This admission, current-checkpoint reconciliation, board T01–T05 tracking, and links across current project documents. Documentation/board only. |
| 763 | T01 typed record contract, strict parser/validator, field-envelope/provenance rules, and 100% focused coverage for changed production code. No guessed supplier facts. |
| 764 | T01 style/project persistence and non-destructive migration for existing style-record and SaveFile versions; project package and reload proof. Preserve legacy design inputs and outputs. |
| 765 | T01 style-revision payload integration and concurrency-safe save: G05 records participate in revision identity/digest while historical revision payloads remain readable and verifiable. |
| 766 | T01 functional editing and propagation across all seven recipes: editable cover/BOM/material/colorway fields, explicit unknowns, cost-input/view updates, stale/frozen-state behavior, and rendered proof. Close T01. |
| 767 | T02 typed POM definitions, methods/landmarks, units, sourced asymmetric tolerance representation, and explicit size/grade-rule source. Do not invent a grade rule or tolerance. |
| 768 | T02 revision-bound editable sample/QA records and user flow; actual readings cannot overwrite calculated predictions. |
| 769 | T02 complete callout/size-run checks and rendered evidence across all recipes; missing method/tolerance remains an actionable unresolved state. Close T02. |
| 770 | T03 operation record and source contract, including explicit unresolved values and component/seam links. |
| 771 | T03 functional operation editing and validation; distinguish sourced construction from recipe defaults, estimates, and user decisions. |
| 772 | T03 BOM-to-pattern/component reconciliation and rendered/source review across all seven recipes. Close T03. |
| 773 | T04 resolves the structured editable file format, import/round-trip semantics, configurable page/section matrix, and two simple/difficult example styles before writer work. After accepted T01–T03 contracts, create UIQ-10's separate bounded admission and file/ownership gates; keep its board item Backlog until that packet is recorded. |
| 774 | T04 implements additive PDF and structured editable outputs with attachments and source/revision binding. Validate actual files and import/round-trip behavior. |
| 775 | UIQ-10 implements only its admitted readable production-pack forms/tables, revision/approval visibility, and selected-section presentation; focused 100% coverage and actual rendered evidence are required. Keep schemas, numeric/POM reconciliation, freeze, and export logic under Codex ownership. |
| 776 | T04 field-level diff, scoped approval, readable rendered output and numeric reconciliation for the two selected styles; review and close UIQ-10 with its own evidence; close T04. |
| 777 | T05 immutable local-share freeze, scoped approval references, and deterministic manifests/digests for the new pack artifacts. |
| 778 | T05 dependency invalidation, immutable prior artifacts, import compatibility, and all eight protected legacy export byte identities. Close T05. |
| 779 | Integrated G05 review: all roadmap criteria and seven recipes; focused changed-code coverage, one settled full suite at 100% global statement/branch/function/line coverage, build, Control Center, release/readiness, browser/Electron and actual output replay; resolve audit findings with new slice numbers. Prepare the reviewed PR only after these gates pass. |
| 780 | Merge/closeout: verify ancestry, required main CI and deployment, stable/immutable output as applicable, board closure, current docs, residual limits and downstream reforecast. |

The baseline is a conditional 19-slice plan including admission and merge
closeout. This is one slice above the roadmap's earlier 12–18 estimate because
the existing board links UIQ-10 as an EPIC-18 child; the validated Epic-closure
rule requires every linked child to be Done, while the approved UI sequence
requires UIQ-10 to receive its own bounded admission after the G05 contracts.
Slice 773 therefore admits it after T01–T03, and S775–S776 provide its bounded
implementation and review. Preserve that membership and gate rather than
closing EPIC-18 with unfinished linked work. The 19-slice plan is conditional,
not a completion promise; reforecast after T01. A failed gate, new evidence, or
correction adds a separately numbered slice; acceptance thresholds and the
eight protected export identities do not move.

## Boundaries and non-goals

- No new garment/recipe, physical sample, fit/drape finding, standards
  conformance, factory acceptance, production release, or production-readiness
  claim. No garment is physically sewn and validated yet.
- No live supplier contact, quotes, purchase, paid standard/tool/license,
  account, hosted service, login, cloud sync, external data collection, or
  provider-backed feature. Supplier/lot/cost fields support local records only;
  supplier-dependent unknowns stay visible.
- No change to legacy DXF behavior, legacy Tech Pack bytes, the eight protected
  export SHA fixtures, grading math, pattern geometry, or existing saved design
  semantics unless a later G05 slice explicitly scopes and verifies an
  additive change. Do not move a baseline without a separate documented
  maintainer approval.
- Functional controls required to edit a pack are in G05. UIQ-10 is a linked
  EPIC-18 child but remains Backlog until its separate bounded packet at S773,
  after T01–T03 contracts are accepted; its own S775–S776 scope and acceptance
  remain distinct. UIQ-09 and EPIC-19 remain untouched.
- A local `FROZEN_FOR_SHARE` artifact means only that exact records/files were
  captured for local digital review/export. It is not a supplier handoff, order,
  production approval, physical validation, or rights clearance.

## Blocking decisions, risks, and default handling

No unresolved decision blocks T01. C04 and G02/G03/G04 provide the source
contracts needed to start. The following gates are deliberately staged:

1. **T01 persistence/versioning risk:** current `SAVE_VERSION` is 6; style
   records are schema 4/5; immutable style-revision payloads are version 1;
   frozen output manifests are schema 1/2 and currently include the legacy
   whole-run Tech Pack PDF. T01 must add strict versioned data and integrate it
   into revision identity without rejecting historical records or changing
   their digest/bytes. Slice 763 must freeze the concrete representation before
   persistence work.
2. **T04 output-format decision:** C04 requires a structured editable export
   but does not select a file format or import contract. Resolve this from the
   current local package/export APIs in Slice 773; it blocks T04 writer code,
   not T01–T03.
3. **T03 source coverage:** recipe defaults and public source material do not
   establish every operation, tolerance, compliance field, or machine setting.
   Use only source-backed values or clearly labeled decisions/estimates; mark
   the rest unresolved. No paid standards text or unsourced SPI/thread/needle
   values enter the product.
4. **Supplier and review limits:** C04 does not define a supplier-specific
   requiredness matrix or authorize outbound quote flow. G05 does not claim a
   qualified independent technical acceptance or production release. Those
   remain future owner-approved gates.
5. **Fixture selection:** T04 will use a simple and a difficult style after a
   focused mapping review; Tee and Woven Shirt are the initial candidates based
   on C04/C01 evidence. Confirm their fitness as fixtures at Slice 773; do not
   treat selection as technical qualification.

## Verification, ownership, and schedule assumptions

Every slice runs focused verification for its changed area and requires 100%
statement, branch, function, and line coverage for changed production code.
Evidence must include the actual generated/rendered pack where behavior changes.
Run the full repository test suite and 100% global coverage once on the settled
integrated Epic/PR candidate, before merge, unless a slice is independently
releaseable. Run build, browser/Electron, export identity, release/readiness,
and package checks at the integrated Epic boundary. Preserve and diagnose any
failed gate; source/test changes after a passing full gate require a new full
gate. No test assertion or coverage threshold is removed to save time.

Codex owns admission, data model, persistence, revision/digest logic,
validation, output generation, integration, final review, fixes, and merge.
No independent piece is safe for Slice 762 or the initial T01 model/migration
slices because board admission and revision/persistence contracts are coupled.
After the T01 contract freezes, a narrow UI form candidate or rendered-document
QA can be delegated in a separate worktree with disjoint files and a precise
handoff; T03 may also use a bounded public-source research packet. UIQ-10's
candidate may be considered after T01–T03 settle its interfaces. Each such
handoff must follow `docs/OPENCODE-WORKFLOW.md` and require an explicit
`WORK FINISHED` before review. Use OpenCode only with the exact mandated Muse
Spark 1.3 xhigh normal-mode setup; otherwise do not substitute. If no safe
contributor is available, Codex keeps the work.

The roadmap's prior 2027-04-05 code-start and 2027-10-15 provisional exit dates
were conditional forecasts, not gates. The maintainer has now directly admitted
G05 and authorized work from 2026-10-12. Reforecast dates after T01 once actual
scope, integration cost, UIQ-10 ownership, and verification duration are
measured. No firm end date is set now.

## Single next action

Complete Slice 762's admission/status replay and exit evidence. Then begin only
Slice 763: T01's strict typed record and provenance contract, with 100% focused
coverage, before making persistence or UI changes.
