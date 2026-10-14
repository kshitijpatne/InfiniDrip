# EPIC-18/G05 — S765 execution-sequence amendment

**Status:** complete at Slice 784. **Recorded:** 2026-10-12; closed 2026-10-14.
**Admitted slice sequence:** S762–S784, including the S781 review boundary,
its S782 remediation, and S783/S784 closeout. This records the completed
sequence; it does not admit follow-on work.
**Original admission:** `EPIC-18-ADMISSION.md`, retained unchanged as the
digest-bound S762 authority and original plan. The completed ledger is
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
and the goal ledger define the admitted execution order after S764.

## Admitted ordered boundaries (historical plan)

| Slice | Admitted boundary |
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
| 781 | Review the S780 PR candidate and reconcile effective mergeability. Initial independent review found a blocking legacy payload-v1 T01 first-save defect; do not merge. |
| 782 | Allow a guarded first T01 save on an unlinked payload-v1 head to create one payload-v2 child; add real migrated-v8 regression, focused/full gates and rendered proof. |
| 783 | Correct the independently reproduced S782 PDF Windows-checkout byte conversion with a path-specific `.gitattributes` binary rule; verify a clean Windows checkout against the committed PDF hash. No product code or tests. |
| 784 | After S783, both independent internal agents review the exact updated head and Codex accepts it; normal rebase-merge PR #43, pass main CI/build/web-proof/Cloudflare Pages deployment, verify actual live preview, and close the canonical board and durable state. |

The original S762–S780 baseline remains visible in the admission as historical
context. S773's planned UIQ-10 admission moved to S774, after T01–T03 as
before. The eight protected export identities, full coverage requirements,
local/no-cost scope, seven-recipe breadth, supplier/physical/production holds,
PR review and deployment gates remained unchanged through the completed plan.
Dates were conditional and are retained as historical estimates.

## S765 packet — completed

The exact package-copy correction, file ownership, acceptance tests and exit
gates are in
`docs/research/epic18/S765-T01-package-copy-reference-remap/start-packet.md`.
Its validated board start record is
`docs/planning/EPIC-18-S765-START-BOARD-COMMANDS.json`.

## Final checkpoint — S784 closeout complete

S782 committed and pushed as `19c101dfeff43a8761e431a488ab61d092dae73f` on `codex/epic-18-g05`; verified `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor. The S782 full and rendered gates passed, and Claude Code and OpenCode both approved the exact head. Claude identified that a fresh Windows checkout CRLF-converts the retained 11,686-byte S782 PDF, producing 11,887 different bytes because the specific path is not marked binary. Codex independently reproduced the discrepancy in the clean reviewer checkout. The reports are stored in `docs/research/epic18/S782-T01-legacy-v1-save/`.

S783 added one path-specific `.gitattributes` binary rule and verified that Git restores the exact 11,686-byte S782 PDF in a Windows checkout with `core.autocrlf=true`, after reproducing the 11,887-byte CRLF conversion. The PDF, ZIP and artifact manifest remain unchanged. The Control Center suite passed 42/42 after the summary update. Exit/hash proof is under `docs/research/epic18/S783-pdf-evidence-line-endings/`; validated exit commands advanced the board from revision 4731 to 4733, and a separate S782 exit-evidence hash reconciliation advanced it to 4735.

S784 completed the exact-head review, merge and release gates. Claude Code and OpenCode approved PR #43 head `f7543010e3932096572549fca36d4e275eceb9c5`; Codex accepted the S783 delta. The PR rebase-merged at `6e4009e8ffee358e9de244b2229c03dbaf4d4665`. Main workflow `38490072411` passed its full test/build/web-proof/deployment run, and both live preview URLs returned HTTP 200. Validated closeout commands advanced the canonical board from revision 4735 to 4745, marking G05-EXIT and the EPIC-18 summary card Done and the Epic Closed. Full details and evidence are in `docs/research/epic18/S784-closeout/`. No outside GitHub reviewer was contacted; the GitHub rules do not require formal approvals. The local/no-cost, physical, supplier/factory, signing, compliance and production-claim holds remain. No new Epic is admitted.
## Previous checkpoint — S781 review found blocker; S782 remediation active

S781's first review replay ended at board revision 4702; its mergeability and
S782 admission/reconciliation replays advanced the canonical board to 4713.
PR #43 remained unmerged on the S780 candidate. OpenCode approved that initial
head; Claude Code requested changes after identifying a first-save failure on
a migrated payload-v1 style, which Codex reproduced against the actual v8
migration fixture. S782 was admitted as the bounded remediation and S783 was
reserved for merge/deployment only after the corrected head passed both fresh
reviews. The review reconciliation is in
`docs/research/epic18/S781-merge-closeout/review-reconciliation.md`.

S779 completed from landed S778 commit
`e5c62ada9cec87b9e5daafff093824e91bd9ace0` on `codex/epic-18-g05`. Its start,
exit, rendered-output and replay verification are in
`docs/research/epic18/S779-T05-change-control/`. The validated replay closed
G05-T05 after linking both T05 acceptance reports. S779 completed edit-driven
check/approval invalidation, visible stale/current state, byte-identical prior
frozen files, schema-v1/v2 compatibility and all eight protected legacy
export identities. S780 was the next integrated/global gate; S781 remains the
merge/deployment and Epic-closeout boundary. No new product decision was
open, and the S762 admission and all holds were unchanged.

## Previous checkpoint — S779 complete; S780 next

## Previous checkpoint — S778 complete; S779 next

S778 started 2026-10-13 16:27:34 UTC from clean S777 commit
`4178b4fcde0836451ddf8693427749d7ce0c4360` on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
Its start, exit, rendered-output and post-replay evidence is in
`docs/research/epic18/S778-T05-freeze/`. The validated start replay advanced
the board 4645→4648; exit and current-sequence replay ends at revision 4657.
G05-T01–T04 and UIQ-10 are Done; EPIC-18 and G05-T05 remain In Progress;
G05-EXIT remains Backlog.

S778 implemented exact-revision scoped approval and local immutable freeze,
including deterministic manifest/digest binding and verified retention and
download of the original ZIP/PDF bytes. Focused suites pass 183/183 plus two
targeted app cases; changed modules and app range have 100% four-metric
coverage; TypeScript/build, protected export identity 17/17, synthetic
Tee/Woven output/render review, two-viewport Chromium, Control Center 42/42,
and diff hygiene pass. The whole app test-file coverage attempt stopped at
about 2.6 GB with no report; the exact changed range passed, and S780 retains
the settled global gate. The exit packet records actor-label and synthetic-
data limits; no physical or production claim is made.

S779 is the single next action: implement edit-driven dependency invalidation
and visible stale/current state, preserve previously frozen bytes through
edits, verify historical import compatibility and all eight protected legacy
export identities, then close T05 when the complete acceptance gate passes.
S780 and S781 retain their admitted integrated/global and merge/deployment/
closeout boundaries. The hash-bound S762 admission is unchanged.

## Previous checkpoint — S777 complete; S778 next

S777 started from clean S776 commit
`7102cfe61f58c6a79d2887b495dfed43f4d8233f` on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
S777's start, exit, rendered-review, and post-replay evidence are in
`docs/research/epic18/S777-T04-review/`. Its validated start/exit replay links
the slice to UIQ-10, G05-T04, and EPIC-18 at board revision 4645. G05-T01
through T04 and UIQ-10 are Done; EPIC-18 remains In Progress; G05-T05 and
G05-EXIT remain Backlog.

S775 completed the separate `infinidrip-techpack` `.techpack.zip`, additive
standalone PDF and strict bounded preview/import diff. Deterministic Tee and
Woven Shirt files were parsed, hash-checked and rendered; unchanged, edited and
stale round-trips and archive bounds pass. The new module has 100% focused
statement, branch, function and line coverage; build, protected export
identity and post-replay Control Center checks pass. The whole-project ZIP and
protected legacy PDF stay separate; no storage writes, UI integration, freeze,
or construction/fit/supplier/production claim is part of S775.

S777 completed the admitted local import-review/apply flow. The renderer passed
6/6 focused tests at 100% four-metric coverage, and every added `app.ts` range
passed the focused four-metric gate. TypeScript, protected export identity
8/8, actual Tee/Woven ZIP/PDF and numeric reconciliation, and 390×844/1280×800
Chromium review pass. The saved approval remains bound to the displayed exact
revision; stale heads and sample-history mismatches fail closed; explicit
Apply creates a new immutable DRAFT revision with empty approval scope.
Rendered-output and no-physical-claim limits are recorded in the S777 exit
packet. The single next action is S778's admitted T05 immutable local-share
freeze and deterministic manifest/digest implementation. S780 stays the
integrated/global/build/readiness/browser/Electron/output gate. The original
hash-bound S762 admission remains unchanged; this active addendum controls the
current sequence.
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
