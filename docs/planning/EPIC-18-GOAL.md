# EPIC-18 / G05 — Goal ledger

**Status:** Complete at Slice 784. **Start:** 2026-10-12 19:40:12 UTC. **Owner:** Codex.
**Start commit:** `origin/main` `e9221ea5033ccfdd91bf1ebb353926f189477d75`.
**Admission start:** Slice 762; canonical board revision 4521 at start.

## Intended outcome

Complete EPIC-18/G05 Living production tech pack for all seven supported
recipes through T01→T02→T03→T04→T05, final review, safe merge, and verified
main deployment. Scope, acceptance evidence, non-goals/holds, risks and gates
are in [`EPIC-18-ADMISSION.md`](EPIC-18-ADMISSION.md); the current ordered
execution sequence is in
[`EPIC-18-S765-RESEQUENCING.md`](EPIC-18-S765-RESEQUENCING.md) and this ledger.

## Slice ledger

| Slice | Status | Result |
| ---: | --- | --- |
| 762 | Done | Admit G05; reconcile current state/board/context and reserve exact boundaries. Exit: `docs/research/epic18/S762-admission/exit-packet.md`. |
| 763 | Done | T01: freeze the schema-v1 typed record, strict parser and provenance envelope with 100% focused coverage; no persistence or UI. Exit: `docs/research/epic18/S763-T01-record-contract/exit-packet.md`. |
| 764 | Done | T01: backward-safe style persistence, transactional migration and legacy package compatibility plus save/reload/copy proof. Exit: `docs/research/epic18/S764-T01-persistence-migration/exit-packet.md`; validated exit replay: `docs/planning/EPIC-18-S764-EXIT-BOARD-COMMANDS.json`. |
| 765 | Done | S764 follow-up: remap packaged `inheritedFrom.revisionId` references during project copy, preserve external provenance and source data. Exit: `docs/research/epic18/S765-T01-package-copy-reference-remap/exit-packet.md`; validated T01/Epic replays: `docs/planning/EPIC-18-S765-EXIT-T01-BOARD-COMMAND.json` and `docs/planning/EPIC-18-S765-EXIT-EPIC-BOARD-COMMAND.json`. |
| 766 | Done | T01: immutable payload-v2 snapshots/digests, strict historical-v1 verification, exact workflow/package/repository head binding and stale-write rejection. Exit: `docs/research/epic18/S766-T01-revision-payload/exit-packet.md`; validated start/exit evidence is recorded by the S766 board commands. |
| 767 | Done | T01: all-recipe editor, explicit unknowns, cost-input view, revision-bound save, stale/frozen behavior and seven-recipe browser-rendered proof. Exit: `docs/research/epic18/S767-T01-editor/exit-packet.md`; validated start/exit evidence and sequence corrections are recorded by the S767 board commands. |
| 768 | Done | T02: add a strict source-aware POM-definition contract for methods, landmarks, units, asymmetric tolerance, and size/grade-rule sources. No recipe defaults or revision binding. Exit: `docs/research/epic18/S768-T02-pom-definition-contract/exit-packet.md`; validated board replay at revisions 4569–4571. |
| 769 | Done | T02: schema-v2 source-aware POM definitions and revision-bound sample/QA rounds; actuals separate from predicted POMs; repository/package validation and copy remap. Exit: `docs/research/epic18/S769-T02-sample-qa-revision-binding/exit-packet.md`. |
| 770 | Done | T02: source-aware callout/size-run checks and all-seven-recipe rendered evidence; close T02. Exit and replay verification: `docs/research/epic18/S770-T02-callout-size-run-validation/`; validated board evidence/status replays leave G05-T02 Done at board revision 4582. |
| 771 | Done | T03: standalone sourced operation-record schema for seven recipe IDs, explicit unknown/conflict states and component/seam references; no operation facts are seeded and no cross-record reconciliation is performed. Start/exit/replay evidence: `docs/research/epic18/S771-T03-operation-record-contract/`; canonical board revision 4589. |
| 772 | Done | T03 operation editing/validation and additive schema-v3 immutable persistence; distinguish source-confirmed facts from recipe defaults, estimates, user decisions, unresolved and conflicting values. Commit: `652605fde0cf48eb3a105636c7a8cd0373e4e0cd`. Exit/replay: `docs/research/epic18/S772-T03-operation-editor-validation/`; final board revision 4597. |
| 773 | Done | T03 read-only BOM/pattern/component and seam-reference reconciliation plus all-seven rendered review. Focused 39/39; changed-module coverage 100% across all four metrics; TypeScript and protected export identity 17/17 pass. Start/clarification/rendered/exit/replay evidence: `docs/research/epic18/S773-T03-reference-reconciliation/`; final board revision 4611. |
| 774 | Done | T04 selected the `infinidrip-techpack` `.techpack.zip` plus standalone PDF contract, strict preview-first/stale-safe import, sections/presets, determinism and Tee/Woven Shirt fixtures; admitted UIQ-10 separately for S776 while it remains Backlog. Decision/exit and UIQ admission: `docs/research/epic18/S774-T04-format-and-UIQ10-admission/` and `docs/planning/UIQ-10-ADMISSION.md`; final board revision 4621. Control Center 42/42 after replay. |
| 775 | Done | Additive revision-bound PDF/ZIP output and bounded read-only import preview/diff. Focused 22/22; new-module coverage 100% across all four metrics; build, protected export identity 17/17 and actual rendered/file review pass. Start/exit/replay: `docs/research/epic18/S775-T04-output-package/`; board revision 4625. |
| 776 | Done | Admitted UIQ-10 revision-bound presentation, section presets/toggles, visible unknowns, responsive/keyboard table review and exact-revision approval display. Renderer 8/8 with 100% four-metric coverage; focused app tests, TypeScript, export byte identity, actual PDF/ZIP and two-viewport browser review pass. Start/exit/rendered/replay evidence: `docs/research/epic18/S776-UIQ-10-presentation/`; board revision 4633. |
| 777 | Done | T04/UIQ-10 exact package diff, stale-safe explicit apply, revision-bound sample validation, DRAFT approval reset, and Tee/Woven numeric/output/browser acceptance. 100% focused coverage for the renderer and changed app ranges; TypeScript and protected export identity 8/8 pass. Exit/rendered/replay: `docs/research/epic18/S777-T04-review/`; board revision 4645. |
| 778 | Done | T05 freeze creation: explicit exact-revision scoped approval; schema-v3 manifest/digest binding; original ZIP/PDF bytes, integrity check and local downloads. Focused suites 183/183 plus app range 100% four-metric coverage; TypeScript/build, protected export identity 17/17, Tee/Woven synthetic outputs and two-viewport Chromium pass. Exit/replay: `docs/research/epic18/S778-T05-freeze/`; board revision 4657. |
| 779 | Done | T05 change control: edit-driven check/approval invalidation; explicit current/historical state; old ZIP/PDF byte retention; schema-v1/v2 compatibility; all eight protected export hashes unchanged. The enumerated focused suites pass 180 tests; `project-manager.ts` has 100% four-metric coverage; TypeScript, final-source Chromium and Control Center pass. Exit/replay: `docs/research/epic18/S779-T05-change-control/`; G05-T05 Done, board revision recorded in post-replay report. |
| 780 | Done | Settled integrated Epic gate and pre-merge review. The first full suite passed 179/179 files and 3,161/3,161 tests at 100% statements/branches/functions/lines; build, readiness, browser/Electron, actual output and protected export checks passed. The optional second run stopped after one 15-second timeout during high memory use; the case passed in isolation, though the cause is not proven. Exit/rendered evidence: `docs/research/epic18/S780-integrated-gate/`; final board replay recorded there. |
| 781 | Blocked at review gate | Initial PR #43 review found a high-severity legacy payload-v1 T01 first-save defect. No merge or closure; reconciliation: `docs/research/epic18/S781-merge-closeout/review-reconciliation.md`. |
| 782 | Done | Guarded migrated payload-v1 T01 first-save repair and actual v8 regression pass; focused 126/126 and global 179/179 / 3,161 tests have 100% four-metric coverage. Both reviewers approved exact S782 head 19c101df and Codex accepted the code/evidence. Their reports and the low-severity PDF checkout finding are retained under `docs/research/epic18/S782-T01-legacy-v1-save/`; S783 handles that one-file metadata fix. |
| 783 | Done | Preserve the exact S782 PDF bytes in Windows checkouts using one path-specific binary attribute. A fresh `core.autocrlf=true` checkout reproduced and then corrected the 11,887→11,686-byte conversion; PDF, ZIP and manifest blobs remain unchanged. Control Center passes 42/42 after the board summary update. Exit/hash proof: `docs/research/epic18/S783-pdf-evidence-line-endings/`; exit replay reached revision 4733 and the S782 hash-reconciliation supplement advanced the board to 4735. |
| 784 | Done | Exact updated PR #43 head f7543010e3932096572549fca36d4e275eceb9c5 approved by Claude Code and OpenCode and accepted by Codex; PR rebase-merged as 6e4009e8ffee358e9de244b2229c03dbaf4d4665. Main workflow 38490072411 passed the full suite/build/web proof/Cloudflare Pages deploy; immutable and stable preview URLs returned HTTP 200. Validated closeout replay closed EPIC-18 at board revision 4745. Exit evidence: `docs/research/epic18/S784-closeout/exit-packet.md`. |

## Final goal boundary — EPIC-18/G05 closed

S784 completed exact-head internal review, Codex acceptance, merge, main
verification and deployment, live preview verification, and durable board and
document closeout. The board is at revision 4745; EPIC-18 and G05-EXIT are
closed/Done, T01–T05 and UIQ-10 are Done, and UIQ-09 remains Backlog behind
EPIC-19. The final checkpoint and validation records are in
`docs/research/epic18/S784-closeout/`. No next numbered Epic is admitted.

Any separately admitted remediation or follow-up uses its next unique slice
number; no repeated or same-slice fixup commit. At each boundary, update this
ledger, `PROJECT-STATE.md`, the admission/exit evidence, and the canonical board
through the validated command layer. No follow-up is admitted by this completed
goal.

## Current execution boundary — S783 verified; S784 exact-head review and release next

S782's narrow v8-migration T01 repair passed its focused 126/126 changed-area coverage, the settled 179/179-file and 3,161/3,161-test full gate with 100% four-metric coverage, build/Electron, web release, readiness, Control Center, and actual Chromium/PDF/ZIP output. Both independent internal agents approved exact S782 PR #43 head 19c101dfeff43a8761e431a488ab61d092dae73f; Codex accepted the production fix and its evidence. Claude reported a low-severity issue: a fresh Windows checkout converted S782's generated PDF from 11,686 bytes/SHA d27d2300…57c4 to 11,887 bytes/SHA 03a1c84a…a297. Codex reproduced it in the clean Claude review worktree; OpenCode reported no findings. Reports are stored in docs/research/epic18/S782-T01-legacy-v1-save/.

S783 added one path-specific `.gitattributes` binary rule and verified Git checkout restores the committed PDF's exact bytes in a Windows worktree with `core.autocrlf=true`. No production source, test, PDF/ZIP content, rendering or export identity changed. The fresh checkout first reproduced CRLF conversion; the rule restored exact bytes, and the PDF, ZIP and artifact manifest still match their S782 blobs. The Control Center suite passed 42/42 after the board summaries were updated. Exit/hash proof is under `docs/research/epic18/S783-pdf-evidence-line-endings/`; validated exit replay advances board revision 4731→4733 and retains EPIC-18/G05-EXIT In Progress. T01–T05/UIQ-10 remain Done; UIQ-09 remains Backlog behind EPIC-19.

The next action is to commit and push S783 to PR #43, then begin S784 with fresh independent Claude Code and OpenCode approvals of the exact updated head and Codex acceptance. S784 then owns normal rebase merge, main CI/build/web-proof/Cloudflare Pages deployment, actual live-preview verification and validated canonical closeout. GitHub has no formal approval requirement on main; the owner requires the internal reviews and no outside GitHub users are to be contacted. Physical, supplier/factory, signing/compliance and production-claim holds remain unchanged.
## Previous execution boundary — Slice 779 complete; S780 next

S779 completed from landed S778 commit
`e5c62ada9cec87b9e5daafff093824e91bd9ace0` on `codex/epic-18-g05`; its
start, exit, rendered-output and post-replay evidence is in
`docs/research/epic18/S779-T05-change-control/`. The validated exit replay
closed G05-T05 with both T05 boundary reports linked. S779 completed
edit-driven review/approval invalidation, visible current/historical share
state, prior ZIP/PDF byte retention, schema-v1/v2 compatibility and all eight
protected export identities without baseline movement. S780's integrated
gate then remained the next boundary, followed by S781 merge/deployment and
closeout. All local/no-cost, supplier, physical and production-claim holds
remained unchanged.

## Previous execution boundary — Slice 778 complete

S778 started from clean S777 commit
`4178b4fcde0836451ddf8693427749d7ce0c4360` on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
Its start, exit, synthetic artifact, rendered-review and post-replay evidence
are in `docs/research/epic18/S778-T05-freeze/`. Validated start replay
advanced the board 4645→4648; exit/reconciliation evidence at revision 4657
links to G05-T05 and EPIC-18. T01–T04 and UIQ-10 are Done; EPIC-18 and T05
remain In Progress; G05-EXIT remains Backlog.

S778 completed explicit scoped approval and immutable local freeze for one
exact saved revision, deterministic manifest/digest binding, original ZIP/PDF
byte retention and local downloads. Focused suites pass 183/183 plus two app
integration cases; all changed production modules and the exact changed app
range reach 100% four-metric coverage. TypeScript, build, protected export
regression/identity 17/17, synthetic Tee/Woven saved output and render review,
390×844/1280×800 browser review, and Control Center 42/42 pass. A whole-app
coverage attempt stopped at about 2.6 GB without a report; the changed range
passed and the global gate remains at S780. No baseline moved.

The single next action is S779's admitted T05 dependency invalidation,
visible stale/current state, prior-byte preservation, historical import
compatibility, and eight protected export-identity gate. S780 remains the
settled integrated/global gate; S781 remains merge, main CI/deploy, and Epic
closeout. Original admission and local/no-cost, supplier, physical and
production-claim holds remain unchanged.

## Previous execution boundary — Slice 777 complete

S777 started from clean S776 commit
`7102cfe61f58c6a79d2887b495dfed43f4d8233f` on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
Its start, exit, rendered-review, and post-replay evidence are in
`docs/research/epic18/S777-T04-review/`; validated start/exit evidence links it
to UIQ-10, G05-T04 and EPIC-18. G05-T01 through T04 and UIQ-10 are Done;
EPIC-18 remains In Progress. The exit replay leaves G05-T05 and G05-EXIT in
Backlog; canonical board revision 4645 is the S777 checkpoint.

S775 completed additive deterministic PDF/ZIP outputs and a bounded,
preview-only import/diff API. Actual Tee and Woven Shirt files are retained;
archives are extracted and checked, embedded PDFs are byte-identical to the
standalone PDFs, and repeat runs are byte-identical. Focused tests pass 22/22
with 100% statement, branch, function and line coverage for the new module;
TypeScript/Vite build, protected export identity 17/17, rendered PDF review and
post-replay Control Center verification pass. Exact output hashes, the
acceptance record and replay evidence are in
`docs/research/epic18/S775-T04-output-package/`. The validated exit replay at
board revision 4625 leaves G05-T04 and EPIC-18 In Progress and UIQ-10 Backlog.
S775 writes no revision, local storage or artwork and changes no legacy
export identity. No schema, project-backup, freeze, UI or garment-source
change was admitted. S780 remains the settled global coverage,
build/readiness, browser/Electron and integrated-output gate.

S777 completed the admitted local import review/apply flow. The renderer passed
6/6 focused tests at 100% four-metric coverage; nine focused mounted-app tests
cover all added `app.ts` ranges at 100% across statements, branches, functions,
and lines. TypeScript, protected export identity 8/8, exact Tee/Woven package
and PDF checks, and two-viewport Chromium review pass. Actuals remain synthetic
and distinct from T02 predictions; imported approval is discarded and an
explicit Apply saves a new DRAFT revision. The next single action is S778's
admitted immutable local-share freeze and deterministic manifest/digest work;
S780 remains the settled integrated gate. The original hash-bound S762
admission remains unchanged; the S765 addendum controls execution order.

S772 completed in commit `652605fde0cf48eb3a105636c7a8cd0373e4e0cd` with
192/192 focused tests, 100% coverage for all five changed production modules,
TypeScript, protected export identity 9/9, isolated rendered/save/reload
review, final Control Center 42/42 at board revision 4597, and clean diff
hygiene. Its T03 editor, explicit value origins, and additive schema-v3
operation persistence preserve T01/T02 and style-revision payload-v1/v2
history. The exit/replay packets are in
`docs/research/epic18/S772-T03-operation-editor-validation/`. The T02 exit and
replay evidence remains in
`docs/research/epic18/S770-T02-callout-size-run-validation/`; that slice passed
45/45 focused tests and all its recorded gates at board revision 4582. At the
S772 checkpoint, UIQ-10 remained Backlog for its separate bounded S774
admission.

## Previous execution boundary — Slice 769 complete

S768 landed as `e39ebe9f6cdb0cd1af5abe7c0e0ecc70cbd8fdf6`. S769 started at
2026-10-13 00:59:04 UTC from that clean commit on `codex/epic-18-g05`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remained an ancestor.
The validated S769 start and exit replays advance the board from revision
4571 through 4575. The start/exit packets are in
`docs/research/epic18/S769-T02-sample-qa-revision-binding/`; validated exit
commands are `docs/planning/EPIC-18-S769-EXIT-T02-BOARD-COMMAND.json` and
`docs/planning/EPIC-18-S769-EXIT-EPIC-BOARD-COMMAND.json`.

S769 preserves T01 schema-v1 records and historical revision digests while
persisting schema-v2 T02 POM definitions and sample/QA rounds. Actual sample
readings do not overwrite pattern predictions; current and historical sample
references validate against same-style revision history, and copies remap
internal references. All 405 focused application tests pass; the seven
changed production modules have 100% four-metric coverage. TypeScript,
protected export identity 9/9, actual T02 browser rendering, Control Center
42/42, and `git diff --check` pass. No export baseline moved.

The S769 next action, S770, is complete and has closed G05-T02. The next
admitted action is S771 T03; start it only after fresh branch/board verification
and the validated start replay. UIQ-10's separate S774 admission, the
local/no-cost boundary, protected export identities and supplier/physical/
production holds remain unchanged. UIQ-09 remains Backlog pending EPIC-19.
## Previous verified boundary — Slice 767 complete

S767 started at 2026-10-12 22:36:08 UTC from clean S766 commit
`66379ae19dee15c72e5816c601f51c5b2d5463aa` on `codex/epic-18-g05`. The fresh
start check retained `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75`
as an ancestor; S767 was the unique next slice. Its start packet is
`docs/research/epic18/S767-T01-editor/start-packet.md`; validated start
commands advance the canonical board 4556→4558 with digest-verified evidence.

S767 landed as `Slice 767: add local all-recipe T01 editor`. The editor supports
all seven recipes, preserves field provenance and actionable unknowns, exposes
material/BOM cost inputs without totals, saves one immutable v2 child through
the existing CAS workflow, blocks stale edits, and preserves historical frozen
outputs and separate unsaved design state. The exit packet and actual rendered
proof are in `docs/research/epic18/S767-T01-editor/exit-packet.md` and its
`rendered/` directory.

The focused renderer, manager, workflow and mounted-app suites pass 127/127;
the three behavior modules report 100% statement, branch, function and line
coverage. TypeScript, protected export identity 9/9, seven-recipe browser
rendering and `git diff --check` pass. The validated S767 replay advances the
board from revision 4563 to 4566: G05-T01 is Done, EPIC-18 remains In Progress,
and T02–T05, G05-EXIT and UIQ-10 remain Backlog. Control Center passes 42/42
after the replay.

The S767 start packet assigned the disjoint renderer to Claude Code. Claude CLI
authentication failed; OpenCode completed that isolated renderer assignment
using the prescribed Muse Spark 1.3 xhigh normal mode and returned explicit
`WORK FINISHED`. Codex reviewed the actual diff and rendered output before
integration. The agent run overlapped Codex work, with zero blocked wait;
maintainer-decision wait was zero.

The single next action is S768: implement typed POM definitions with methods,
landmarks, units, sourced tolerances, and explicit size/grade-rule sources.
S769 then adds revision-bound sample/QA records separate from predicted POMs;
S770 adds callout/size-run checks and all-recipe rendered evidence. The S780
integrated gate, separate S774 UIQ-10 admission, local/no-cost boundaries,
protected export identities, and physical/supplier/production holds remain
unchanged. UIQ-09 remains Backlog pending EPIC-19.

## Previous verified boundary — Slice 765 complete

Slice 765 started at 2026-10-12 21:18:07 UTC from S764 commit
`238c29f1f71bf3e74ee3d74ba5d97766e07d9f2a`; fresh verification retained the
`origin/main` ancestor `e9221ea5033ccfdd91bf1ebb353926f189477d75`. It completed
the bounded project-package copy correction: packaged inherited-source links
now map through copied style history in cover, material, BOM and colorway
assignment fields, while external provenance stays unchanged. The validated
source archive, non-copy restore behavior, direct record identity and DRAFT
copy approval semantics are covered. Focused package tests pass 56/56, the
changed module has 100% statement/branch/function/line coverage, TypeScript
passes, protected export identity passes 9/9, and Control Center passes 42/42.
Digest-verified S765 exit evidence is attached to G05-T01 and EPIC-18 at board
revisions 4550–4551. The landed commit subject is `Slice 765: remap nested T01
provenance on copy`; its full SHA is recorded at the next start boundary.

EPIC-18 and G05-T01 remain In Progress; T02–T05, G05-EXIT and UIQ-10 remain
Backlog; UIQ-09 remains Backlog pending EPIC-19. The sole next action is S766:
integrate T01 with immutable G02 revision payloads/digests and concurrency-safe
saves while preserving historical payload-v1 verification. Start packet must
reconfirm branch/upstream ancestry, unique slice number and canonical board
revision before implementation.

## Verified boundary history

Slice 762 admission is complete from isolated worktree
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`, branch
`codex/epic-18-g05`. The shared `F:\designApp` checkout remains untouched.

Slice 763 began at 2026-10-12 20:09:15 UTC from commit
`2264e20a37b13929ad9be996c173417bb1ef6ac4` and closed after the schema-v1 T01
record/parser passed all focused gates. The validated exit replay advanced the
board from revision 4540 to 4542. EPIC-18 remains In Progress; G05-T01 remains
In Progress because its persistence, revision and editing boundaries are
still open. The exit packet is
`docs/research/epic18/S763-T01-record-contract/exit-packet.md`; start and exit
board commands are
`docs/planning/EPIC-18-S763-START-BOARD-COMMANDS.json` and
`docs/planning/EPIC-18-S763-EXIT-BOARD-COMMANDS.json`. Slice 764 is the next
authorized boundary. UIQ-10 remains Backlog until its bounded S773 admission
after T01–T03 contracts; UIQ-09 remains Backlog behind EPIC-19. Persistence,
revision digest, UI, outputs, supplier contact and physical claims were out of
scope for Slice 763. Slice 762's reconciled checkpoint remains in
`docs/research/epic18/S762-admission/exit-packet.md`.

Slice 764 began at 2026-10-12 20:42:34 UTC from verified Slice 763 commit
`1443affb51847f179bcc352bac47fad2d9b28ef8`; a fresh fetch confirmed
`origin/main` `e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The validated start/clarification/exit replays advance board revision
4542→4546. S764 completed backward-safe regular/custom style persistence,
regular/custom legacy style and SaveFile migration, IndexedDB v8→v9 migration,
and package v1–v6 round-trip/reload/copy handling. The exit packet records 309
focused tests at 100% on all five changed production modules, package tests
56/56 at the two real scale fixtures, TypeScript, Control Center and diff
checks. EPIC-18/G05-T01 remain In Progress; G05-T02–T05, G05-EXIT and UIQ-10
remain Backlog; UIQ-09 remains Backlog pending EPIC-19. Start and exit details
are in `docs/research/epic18/S764-T01-persistence-migration/`; the validated
exit replay is `docs/planning/EPIC-18-S764-EXIT-BOARD-COMMANDS.json`.

At the S764 boundary, the next action was S765 revision-payload integration.
Final copy-path review found that nested field-level inherited-source
references were not remapped, so the admission packet adds the required S765
correction and shifts revision-payload integration to S766. The S764 exit
report remains its historical digest-bound result. The active S765 start packet
and validated board replay record the correction; UIQ-10's separate post-T01–T03
admission moves from S773 to S774 without changing its acceptance gate. The
S762 admission remains unchanged; the current sequence is defined in
`docs/planning/EPIC-18-S765-RESEQUENCING.md` and this ledger.
