# Slice 766 — T01 immutable style-revision payload integration

**Status:** complete. **Start:** 2026-10-12 21:33:39 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** S765 `af6191ed8bb465a59da089ec8362ca5741c28d0a`; fresh start
verification retained `origin/main`
`e9221ea5033ccfdd91bf1ebb353926f189477d75` as an ancestor. The worktree was
clean at start. **Landed subject:** `Slice 766: snapshot T01 in immutable
style revisions`; its full SHA is captured by the S767 start boundary. The
board was revision 4553 before exit replay.

## Scope and result

New immutable style-revision payloads are version 2 and include the complete
validated T01 record in the RFC 8785 / SHA-256 identity. Strict parsing and
verification retain the exact historical version-1 payload key set and
digest. V1 revisions and frozen-output digest references are not retrofitted
with T01. Copy re-identifies a verified v1 revision without adding T01; v2
copies remap the T01 style/revision identity and reset scoped approval to
DRAFT.

The workflow binds seeded baselines, regular/custom style creation, design
revisions, and package-created baselines to the exact current T01 record.
Repository load/save verifies the design and authored T01 content against a
v2 head, requires exactly one child for a design or authored T01 change, and
rejects stale/mismatched immutable heads within the atomic save transaction.
Package parsing and copying verify the same head-to-style relation.

The v2 digest includes the complete T01 child as it stood at revision
creation. In comparisons between an immutable child and the live style,
scoped review approval and its activity timestamp (`updatedAt`) remain
mutable overlays; they do not create a new authored-content revision. The
approval parser still binds review to its T01 revision. A new content or
design revision binds the new T01 revision identity and resets approval to
DRAFT. This preserves the supported review/restore flow without weakening
authored-field integrity.

## Acceptance and verification

| Gate | Result |
|---|---|
| Versioned immutable payload | Pass: new records use strict v2 with T01 included in the deterministic digest; tampering and identity mismatches fail closed. |
| Historical payload-v1 compatibility | Pass: strict exact-key parsing and fixed digest fixture remain unchanged; frozen manifest references retain their original digest. |
| Revision creation and package paths | Pass: baselines, regular/custom styles, design commits, package-generated baselines and v2 copies bind T01; copied v1 records remain v1 without retroactive T01. |
| Repository integrity/concurrency | Pass: design/T01 changes require one child, style/head mismatches and stale writers are rejected atomically. |
| Focused tests and changed-module coverage | Pass: 316 focused tests across five test files; each of the five changed production modules reports 100% statement, branch, function and line coverage. The coverage-mode package scale fixture was bounded to 4 MiB (4,216,828 archive bytes, 1,123 ms, reported peak RSS 353,628,160 bytes). |
| TypeScript | Pass: `npx tsc --noEmit`. |
| Protected export identity | Pass: `src/quality/export-identity.test.ts`, 9/9; no exporter or protected baseline changed. |
| Control Center | Pass: `npm run control-center:test`, 42/42 before exit replay. |
| Diff hygiene | Pass: `git diff --check`. |
| Browser/Electron and global repository gates | Not due: this is the data-integrity slice. The settled integrated gate remains S780. |

The initial focused run exposed two integration gaps; follow-up tests made
the v1 copy contract and live review-overlay behavior explicit. A final
changed-module coverage run passed all four 100% metrics, including T01's
mutable review activity timestamp. No baseline, exporter, package format
version, or test threshold was moved.

The revision, repository, workflow and package paths form one integrity
boundary, so no independent low-risk delegated task was safe. External-agent
wait: 0 minutes; maintainer-decision wait: 0 minutes. Elapsed time from S766
start through verification and checkpoint is approximately 55 minutes:
implementation/review 32 minutes, focused verification 6 minutes, durable
checkpoint and board replay 17 minutes; external and maintainer waits were 0.

## Durable checkpoint and next action

The validated exit replay attaches digest-verified `E-G05-S766-EXIT` evidence
to G05-T01 and EPIC-18, advancing the canonical board from revision 4553 to
4555. EPIC-18 and G05-T01 remain In Progress; G05-T02–T05, G05-EXIT and
UIQ-10 remain Backlog; UIQ-09 remains Backlog pending EPIC-19. The S762
hash-bound admission, S764 result and S765 sequence amendment remain intact.

The single next action is S767: implement the T01 editor and propagation
across all seven recipes, retain explicit unknowns, update cost/view behavior,
cover stale and frozen records, and capture rendered proof to close T01. The
S767 start packet records the full landed S766 commit SHA and board revision;
the S766 exit replay is `docs/planning/EPIC-18-S766-EXIT-T01-BOARD-COMMAND.json`
and `docs/planning/EPIC-18-S766-EXIT-EPIC-BOARD-COMMAND.json`.
