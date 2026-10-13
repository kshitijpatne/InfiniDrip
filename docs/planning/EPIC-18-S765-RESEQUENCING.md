# EPIC-18/G05 — S765 execution-sequence amendment

**Status:** active. **Recorded:** 2026-10-12. **Applies after:** Slice 764.
**Current conditional baseline:** 20 numbered commits, S762–S781 inclusive.
**Original admission:** `EPIC-18-ADMISSION.md`, retained unchanged as the
digest-bound S762 authority and original plan. The active ledger is
`EPIC-18-GOAL.md`.

## Reason and authority

Final review after S764 found that project-package copy remapped the T01
record's direct style/revision identity and reset approval, but did not remap
field-envelope `inheritedFrom.revisionId` values that refer to G02 revisions
included in the package's copied history. The S764 copy tests covered the
direct record revision and approval reset but not these nested provenance
references. The admitted S764 rule covers G02 revision links in the package
maps; the S765 follow-up closes this gap without relaxing acceptance.

`AGENTS.md` requires a separately numbered slice for a correction or failed
gate and forbids same-slice fixups. Therefore S765 is reserved for this narrow
package-copy correction, while the previously planned T01 revision-payload
integration moves from S765 to S766. Later boundaries move by one. This is a
schedule correction within admitted EPIC-18/G05 scope; it does not authorize a
new feature, reduce a gate, or change the maintainer's product decisions.

The original S762 admission file is intentionally retained byte-for-byte
because the canonical board carries its digest-bound evidence. This addendum
and the current goal ledger define the active execution order after S764.

## Active ordered boundaries

| Slice | Active boundary |
| ---: | --- |
| 765 | Remap package-contained T01 field-level inherited revision links through the copy map; preserve explicit external provenance links; add focused package-copy proof. No revision-payload integration. |
| 766 | T01 immutable style-revision payload integration and concurrency-safe save; include T01 in new revision digest identity while preserving strict read/verification of historical payload v1. |
| 767 | T01 editing and propagation across all seven recipes, explicit unknowns, cost/view updates, stale/frozen behavior and rendered proof; close T01. |
| 768 | T02 typed POM definitions, method/landmark/unit, sourced tolerance and explicit size/grade-rule source. |
| 769 | T02 revision-bound editable sample/QA records and user flow; readings remain separate from predicted POMs. |
| 770 | T02 callout/size-run checks and rendered evidence across all recipes; close T02. |
| 771 | T03 sourced operation record and source contract, with explicit unknowns and component/seam links. |
| 772 | T03 operation editing and validation; separate sourced construction from defaults, estimates and user decisions. |
| 773 | T03 BOM-to-pattern/component reconciliation and all-recipe rendered/source review; close T03. |
| 774 | Resolve T04 structured editable format/import semantics and style fixtures; after T01–T03 acceptance, create the separate bounded UIQ-10 admission while leaving its board card Backlog. |
| 775 | Implement additive PDF and structured editable outputs; validate actual files and round-trip. |
| 776 | Implement only the admitted UIQ-10 production-pack presentation scope with 100% focused coverage and actual rendered evidence. |
| 777 | T04 diff, scoped approval, rendered/numeric review; close UIQ-10 and T04. |
| 778 | T05 immutable local-share freeze and deterministic manifests/digests. |
| 779 | T05 dependency invalidation, prior-artifact preservation, import compatibility and all eight protected export identities; close T05. |
| 780 | Settled integrated G05 gate, global 100% coverage, build, Control Center, release/readiness, browser/Electron, actual output replay and reviewed PR candidate. |
| 781 | Merge, main CI/deploy, board closeout and durable status reconciliation. |

The original S762–S780 baseline remains visible in the admission as historical
context. S773's planned UIQ-10 admission moves to S774, after T01–T03 as
before. The eight protected export identities, full coverage requirements,
local/no-cost scope, seven-recipe breadth, supplier/physical/production holds,
PR review and deployment gates remain unchanged. Reforecast only if a later
verified boundary changes the plan; dates remain conditional.

## S765 packet — completed

The exact package-copy correction, file ownership, acceptance tests and exit
gates are in
`docs/research/epic18/S765-T01-package-copy-reference-remap/start-packet.md`.
Its validated board start record is
`docs/planning/EPIC-18-S765-START-BOARD-COMMANDS.json`.

## Current checkpoint — S774 complete; S775 next

S774 completed from S773 commit
`e673e282855c14d39db41d198b9a0272f632a84b` on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
S773's start, clarification, rendered review, exit and replay are in
`docs/research/epic18/S773-T03-reference-reconciliation/`. S774's start,
format/import decision, separate UIQ-10 admission, exit and post-replay checks
are in `docs/research/epic18/S774-T04-format-and-UIQ10-admission/`; the linked
admission is `docs/planning/UIQ-10-ADMISSION.md`. Validated S774 replay leaves
board revision 4621: T01/T02/T03 Done, T04 and EPIC-18 In Progress, UIQ-10
Backlog. G05-T04 remains In Progress because its output, UIQ presentation and
review boundaries continue through S775–S777.

S774 selected a dedicated `infinidrip-techpack` `.techpack.zip` plus standalone
additive PDF, with strict revision-bound preview-first import, section presets,
Tee/Woven Shirt structural fixtures and deterministic output as a tested S775
requirement. The shared project ZIP and legacy PDF remain separate. UIQ-10 has
presentation-only S776 ownership; it cannot start until S775 validates actual
output and round trips. The focused Control Center suite passes 42/42 after
final replay. A stale board regression assertion was updated to require T04 In
Progress with S774 evidence while preserving T05, G05-EXIT and UIQ-10 Backlog.
The original hash-bound S762 admission remains unchanged; this active addendum
supersedes its historical S773 timing for the T04 decision.

The next single action is S775: implement both additive outputs and prove
actual PDF/ZIP bytes, size/path validation and unchanged/stale/edited
round-trips. S780 remains the integrated/global/build/Electron/output gate.
S772's start, exit, and replay packet is
`docs/research/epic18/S772-T03-operation-editor-validation/`; its final board
revision is 4597, with 192/192 focused tests, 100% four-metric changed-module
coverage, TypeScript, protected export identity 9/9, rendered save/reload,
Control Center 42/42, and diff hygiene passing. S771's start, exit, and replay
evidence is in
`docs/research/epic18/S771-T03-operation-record-contract/`; the S770 T02 exit
and replay proof is in
`docs/research/epic18/S770-T02-callout-size-run-validation/` and records 45/45
focused tests, 100% changed-module coverage, export identity 9/9, seven-recipe
rendering, Control Center 42/42 and board revision 4582. Its sourced-data,
physical-fit, supplier and production-claim holds remain active.

## Previous checkpoint — S769 complete

S768 landed as `e39ebe9f6cdb0cd1af5abe7c0e0ecc70cbd8fdf6`. S769 started
2026-10-13 00:59:04 UTC from that clean commit on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remained an ancestor.
The digest-linked start and exit packets are in
`docs/research/epic18/S769-T02-sample-qa-revision-binding/`; validated commands
advance canonical board revision 4571→4575 and preserve G05-T02/EPIC-18 In
Progress.

S769 preserves T01 schema-v1 records and historical digests while persisting
S768's source-aware POM definitions with editable, revision-bound sample/QA
rounds. Actual readings stay separate from predicted pattern values; unknowns
remain explicit and actionable. Repository and package validation cover
current and historical targets, and copied packages remap internal references.
All 405 focused application tests pass with 100% four-metric coverage for all
seven changed production modules. TypeScript, export identity 9/9, the actual
Chrome-rendered T02 form, Control Center 42/42 and diff hygiene pass. No
export baseline or T01 historical digest moved.

The single next action recorded at S769 close was S770, now complete. The
current next action is S771 T03 after fresh branch/board verification and its
validated start replay. The S780 integrated gate, S774 separate UIQ-10
admission, no-cost/local limits, protected exports, and supplier/physical/
production holds remain.
## Previous checkpoint — S767 complete

S766 completed payload-v2 immutable T01 snapshots/digests, strict payload-v1
compatibility, workflow/package/repository head binding, and fail-closed stale
saves. Its start/exit packets are in
`docs/research/epic18/S766-T01-revision-payload/`; the landed commit is
`66379ae19dee15c72e5816c601f51c5b2d5463aa`.

S767 started from that clean checkpoint with digest-verified start evidence;
its packet is `docs/research/epic18/S767-T01-editor/start-packet.md`. It landed
as `Slice 767: add local all-recipe T01 editor` and closes the T01 editing,
provenance/unknown, cost-input, immutable-save/CAS, stale/frozen and
seven-recipe rendered-proof boundary. The full exit evidence is
`docs/research/epic18/S767-T01-editor/exit-packet.md`; 127 focused tests pass,
the editor/manager/workflow modules have 100% four-metric focused coverage,
TypeScript and export identity 9/9 pass, and real-browser output is captured
for all seven recipes. Control Center passes 42/42 after the validated board
replay.

The S767 start replay advanced board revision 4556→4558. Five future-card
descriptions were corrected to match this active sequence, advancing 4558→4563;
the validated T01 exit replay advances 4563→4566. G05-T01 is Done, EPIC-18
remains In Progress, and G05-T02–T05, G05-EXIT and UIQ-10 remain Backlog. The
eight S767 command files are under `docs/planning/EPIC-18-S767-*`; they preserve
the original S762 admission, the active ordered boundaries and all acceptance
gates.

The single next action is S768: define typed T02 POMs with methods, landmarks,
units, sourced tolerances and size/grade-rule sources. S769 adds revision-bound
sample/QA records separate from predicted POMs; S770 completes sourced
callout/size-run checks and all-recipe rendered evidence. UIQ-10 remains a
separate S774 admission after T01–T03, and supplier/physical/production claims
remain held.
