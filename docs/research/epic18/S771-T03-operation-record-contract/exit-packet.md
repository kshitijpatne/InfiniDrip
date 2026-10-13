# Slice 771 — T03 sourced operation-record contract

**Status:** Complete. **Started:** 2026-10-13 02:54:10 UTC. **Exit prepared:**
2026-10-13 03:00:07 UTC. **Branch/worktree:** `codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** `25cd67b1f9c180598b844e905595ca744a670b8c` (`Slice 770: add
source-aware T02 callout and size-run checks`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The digest-bound start packet is
`docs/research/epic18/S771-T03-operation-record-contract/start-packet.md`;
its validated start replay advanced the board 4582→4585 and put G05-T03 In
Progress while EPIC-18 remains In Progress.

## Result and scope

Added standalone schema-v1 T03 operation records in
`src/ui/tech-pack-operation-records.ts`. The strict parser supports all seven
existing recipe IDs; source-confirmed, unresolved, and conflicting names,
sequence values, component refs, seam refs, and fact values; portable source
references with locators; stable unique record/reference/fact IDs; finite
non-negative seam allowances with explicit cm/mm/in units; and bounded lists.
It rejects invalid or contradictory record shapes without clamping or choosing
a fact. Empty recipe-scoped sets contain no seeded operations. Component/seam
reference existence and mapping remain intentionally unverified until S773.

No production construction facts, T01/T02 schema, persistence, editor, output,
or product rendering changed. The slice has no user-facing output to inspect;
its contract is exercised by synthetic parser fixtures, explicitly not treated
as garment evidence. Operation editing/validation remains S772. BOM/pattern
reconciliation and all-recipe rendered/source review remain S773.

## Acceptance evidence

| Gate | Result |
|---|---|
| Focused parser tests | Pass: 13/13, including all seven recipe IDs, all three source states, references, facts, bounds, malformed values, and rejection cases. |
| Changed production coverage | Pass: 100% statements, branches, functions, and lines for `tech-pack-operation-records.ts`. |
| TypeScript | Pass: `npx tsc --noEmit --pretty false`. |
| Protected export identity | Pass: 9/9; no baseline moved. |
| Control Center | Pass: 42/42 after S771 start replay at board revision 4585. Exit replay verification remains pending. |
| Diff hygiene | Pending final evidence replay and documentation update. |
| Browser/Electron/global/Epic gate | Not applicable to this contract-only slice; the integrated gates remain reserved for S780. |

Two early test-only attempts failed and were corrected before acceptance. The
first ordinary run had a mistaken expectation that a supported `polo` set was
invalid without an expected-recipe argument, and its synthetic fixtures had
three TypeScript typing errors. After correction, 13/13 passed and TypeScript
passed. The first coverage run reached 98.76% branch coverage and identified
untested non-array source refs and malformed null facts; focused cases were
added. The final focused run is 100% across all four metrics. No production
failure or export baseline change occurred.

## Board, limits, and next action

The exit packet was prepared at board revision 4585. Validated exit and
post-replay evidence commands will link it to G05-T03 and EPIC-18. G05-T03
stays In Progress because S772 editing/validation and S773 reconciliation are
not complete. G05-T01/T02 remain Done; S772 and later work remain Backlog.
Final board revision, Control Center rerun, and diff hygiene are recorded in
`post-replay-verification.md` after replay.

No safe disjoint work was delegated; the schema, parser, and branch-complete
tests are one contract. External-agent and maintainer-decision wait: 0 minutes.
Elapsed at exit preparation was about 5m57: approximately 3m implementation
and 2m57 focused verification/diagnosis, with no waits. No operation source
truth, physical fit, supplier/factory acceptance, compliance determination, or
production readiness is established. Local/no-cost limits and all eight
protected legacy export identities remain in force.

The next admitted action is S772 T03 operation editing and validation, with
source-backed construction kept separate from estimates, defaults, and user
decisions. S773 separately performs component/BOM/pattern reconciliation and
all-recipe rendered/source review. The S780 integrated/global/build/Electron
gate, S774 UIQ-10 admission, and every physical/supplier/production hold remain
unchanged.
