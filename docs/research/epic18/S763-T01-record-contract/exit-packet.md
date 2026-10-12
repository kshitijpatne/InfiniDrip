# Slice 763 — T01 typed record and provenance contract

**Status:** complete. **Start:** 2026-10-12 20:09:15 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Start commit:**
`2264e20a37b13929ad9be996c173417bb1ef6ac4` (`Slice 762: admit EPIC-18 G05
and reconcile current state`). **Starting board:** revision 4540, G05-T01 In
Progress. **Landed commit subject:** `Slice 763: define T01 tech-pack record
contract`; the full commit SHA is captured at the S764 start boundary.

## Scope and result

Slice 763 froze the additive schema-v1 style/material/BOM/colorway record and
strict pure parser in `src/ui/tech-pack-records.ts`, with exhaustive focused
tests in `src/ui/tech-pack-records.test.ts`. The record binds style and recipe
identity to either no G02 revision (`revisionId: null`, `revisionNumber: 0`) or
one exact revision. It carries cover fields, stable fabric/trim records, BOM
rows, colorways and scoped review/approval/freeze metadata.

Every decision-bearing value uses the C03 semantic-kind/provenance vocabulary
and a typed field envelope. The parser checks provenance-specific attribution,
unit/value consistency, actionable unresolved and invalid states, canonical
timestamps, finite numbers, stable unique IDs, bounded total nested records,
non-dangling BOM/colorway links, one material assignment per BOM row within a
colorway, scoped approvals and exact revision pairing. It returns detached
validated records, including copied evidence/reference arrays. It rejects
invalid inputs without clamping, inventing defaults, or changing the caller's
object.

Only the standalone schema/parser and its focused test were added. The module is
not integrated into SaveFile/style persistence or style-revision hashing. No
UI, migration, export, generated output, recipe default, supplier fact or
physical/production claim changed. `F:\designApp` remains untouched.

## Acceptance and verification

| Gate | Result |
|---|---|
| T01 typed schema and strict parser | Pass: C03/C04-aligned identity, field envelope, provenance, material/BOM/colorway and scoped approval rules are represented and validated. |
| Defensive parse result | Pass: the parser returns new record/child/field objects and clones reference arrays and inherited-source data; a mutation test confirms parsed values do not follow caller mutations. |
| Focused tests | Pass: 137/137 `src/ui/tech-pack-records.test.ts` tests. |
| Changed production module coverage | Pass: 100% statement, branch, function and line coverage for `src/ui/tech-pack-records.ts`. |
| TypeScript typecheck | Pass: `npx tsc --noEmit --pretty false`. |
| Control Center suite | Pass: 42/42 `npm run control-center:test` tests; final run includes the S763 exit evidence assertion. |
| Whitespace/diff check | Pass: `git diff --check`. |
| Protected export identities and application output | Not rerun: the additive parser is not imported by the app or export path. No export or rendering file changed; preserve the full byte-identity gate for S779. |
| Full suite/global coverage, app build, browser/Electron | Not due at this isolated contract boundary; reserved for the settled integrated Epic candidate at S779. |
| Delegation | None: schema, parser invariants and full branch coverage are coupled; no safe disjoint work was identified. External-agent wait: 0. Maintainer-decision wait: 0. |

Early focused runs exposed and resolved a parser refactor error: material and
BOM checks initially unwrapped the already-parsed field scalar a second time.
The first coverage run then identified one untested non-string timestamp path;
the missing case was added. The final focused run above is green at all four
100% metrics, and the final typecheck passes.

Dependencies were installed from the unchanged lockfile with
`npm ci --ignore-scripts` because the managed worktree had no `node_modules`.
The install changed no package or lockfile. npm reported 22 advisories in the
existing dependency tree (11 moderate, 8 high, 3 critical); dependency changes
and audit remediation were outside this slice.

## Durable checkpoint and next action

The validated exit replay advances canonical board revision 4540→4542 and
attaches the digest-verified `E-G05-S763-EXIT` report to G05-T01 and EPIC-18.
Both remain In Progress; T02–T05, G05-EXIT and UIQ-10 remain Backlog. UIQ-09
remains blocked on EPIC-19. T01 stays In Progress while its persistence,
revision and editing boundaries remain.

No blocking contract decision remains. The next action is Slice 764: implement
backward-safe local style/project persistence and non-destructive migration
for current style-record and SaveFile versions, then prove project package
save/reload. The accepted schema above is the contract input; do not add
revision digest integration until Slice 765.

Elapsed time (2026-10-12 20:09:15–20:36:00 UTC; about 26m45s): approximately
16m for contract design, implementation and review; 7m for focused test/type
diagnosis and final verification; 3m45s for exit documentation, board replay
and reconciliation; external-agent wait 0m; maintainer-decision wait 0m. The
full S763 commit SHA is recorded in the S764 start packet so the slice commit
does not need to contain its own hash.
