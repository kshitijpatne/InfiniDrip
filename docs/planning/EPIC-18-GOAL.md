# EPIC-18 / G05 — Goal ledger

**Status:** In Progress. **Start:** 2026-10-12 19:40:12 UTC. **Owner:** Codex.
**Start commit:** `origin/main` `e9221ea5033ccfdd91bf1ebb353926f189477d75`.
**Admission/current board:** Slice 762; board revision 4521 at start.

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
| 769–770 | Backlog | T02: revision-bound sample/QA records separate from predicted POMs; callout/size-run checks and all-recipe rendered evidence. |
| 771–773 | Backlog | T03: sourced operation records, explicit unknowns, component/BOM integrity and all-recipe review. |
| 774–777 | Backlog | T04: resolve output format, admit/implement/review linked UIQ-10 after T01–T03, generate PDF/structured output, approvals, diff and two-style review. |
| 778–779 | Backlog | T05: immutable local-share manifests, invalidation, import compatibility and legacy identities. |
| 780 | Backlog | Settled integrated Epic gate, review and pre-merge PR candidate. |
| 781 | Backlog | Merge, main CI/deploy, board and durable closeout. |

Remediation or follow-up uses the next unique slice number; no repeated or
same-slice fixup commit. Each boundary updates this ledger, `PROJECT-STATE.md`,
the admission/exit evidence, and the canonical board through the validated
command layer.

## Current execution boundary — Slice 768 complete; Slice 769 next

S768 started at 2026-10-13 00:40:58 UTC from clean S767 commit
`a46ceaf3cb701b38b5c3418bada556e4a2ef0076` on `codex/epic-18-g05`. A fresh
fetch retained `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` as an
ancestor; S768 was the unique next slice. Board revision 4566 had EPIC-18 In
Progress, G05-T01 Done, and G05-T02 Backlog. Its digest-linked start packet is
`docs/research/epic18/S768-T02-pom-definition-contract/start-packet.md`; the
validated start replay moved T02 to In Progress at board revision 4569.

S768 added a standalone schema-v1 POM definition set and strict parser for the
seven supported recipe IDs. It captures typed method kinds/instructions,
source-backed landmarks, explicit cm/mm/in units, signed asymmetric tolerance
deltas, and independent size-range and grade-rule sources. Sourced, unresolved
and conflicting facts have separate strict envelopes. Missing facts remain
actionable and unselected. No recipe defaults or tolerance values are seeded;
legacy pattern POMs and their symmetric numeric tolerances are unchanged and
are not accepted as manufacturing sources. T02 definitions are not yet
persisted or revision-bound; S769 owns that integration with sample/QA records.

Focused verification passes 93/93 with 100% statement, branch, function and
line coverage for `src/ui/tech-pack-pom-records.ts`; TypeScript and protected
export identity 9/9 pass. No UI or rendered output changed in S768; all-recipe
rendered evidence remains S770. Validated exit commands advance the canonical
board from revision 4569 to 4571, attach the digest-verified T02 exit to G05-T02
and EPIC-18, and leave both In Progress. Control Center passes 42/42 after the
replay; `git diff --check` passes. The full integrated gate remains S780.

No safe disjoint contribution was identified for this shared data contract;
external-agent wait and maintainer-decision wait were zero. Elapsed time is
recorded separately for implementation, focused verification, external-agent
wait, and maintainer-decision time in the S768 exit packet.

The single next action is S769: add revision-bound editable sample/QA rounds
while keeping actual readings separate from predicted POMs. S770 adds
source-aware callout/size-run checks and all-seven-recipe rendered proof to
close T02. UIQ-10's separate S774 admission, the local/no-cost boundary,
protected export identities, and supplier/physical/production holds remain
unchanged. UIQ-09 remains Backlog pending EPIC-19.

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
