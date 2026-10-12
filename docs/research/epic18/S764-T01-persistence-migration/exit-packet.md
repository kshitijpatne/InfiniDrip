# Slice 764 — T01 persistence and migration

**Status:** complete. **Start:** 2026-10-12 20:42:34 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** `1443affb51847f179bcc352bac47fad2d9b28ef8` (`Slice 763: define T01
tech-pack record contract`). A fresh fetch at closeout confirmed
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The canonical board was revision 4544 before exit replay. **Landed commit
subject:** `Slice 764: persist T01 records with backward-safe migration`; its
full SHA is captured at the S765 start boundary.

## Scope and result

Slice 764 integrates the schema-v1 T01 child with current regular/custom style
records and local persistence. Current regular style records use schema 6 and
custom style records schema 7; strict normalization retains support for
regular v1–v4 and custom v5 records. Legacy SaveFile v1–v6 and project package
manifest versions/top-level shapes remain unchanged. A style migrated from
these older representations gains an explicit unresolved, style/recipe-scoped
T01 record without inferring product facts.

IndexedDB schema 9 performs an atomic v8 style-row migration without adding
stores, key paths, or indexes. Malformed rows abort the version upgrade. Tests
prove project/style identity, active selection, design, archive/custom-size
metadata, revision head/history, and the other v8 stores are retained. New
regular/custom styles receive an empty record. Design saves on the same recipe
preserve the exact record. Copy import remaps style and optional G02 revision
identity, preserves pack content, and resets review state to DRAFT; package
links are validated against the matching style revision.

The S764 recipe-transition clarification is part of this persistence boundary:
same-recipe saves preserve the record; a normal-style recipe change resets
only the exact empty legacy placeholder to a new unresolved record for the
same style and new recipe; changes are rejected before persistence if the
record contains any non-placeholder data or review state. The existing custom
one-size recipe lock remains. The decision is recorded in
`recipe-transition-decision.md` and attached to G05-T01 by validated board
evidence.

No revision digest/payload integration, T01 editor, generated output, SaveFile
schema bump, package manifest bump, export behavior, supplier fact, or
physical/production claim was added. `F:\designApp` remains untouched.

## Acceptance and verification

| Gate | Result |
|---|---|
| Current regular/custom style persistence and same-recipe design saves | Pass: every current style has a strictly parsed child bound to its own style/recipe identity; same-recipe saves preserve the child. |
| Historical style and SaveFile migration | Pass: regular v1–v4, custom v5 and SaveFile v1–v6 retain normalized design/style values and identity while receiving only an explicit unresolved T01 child where migrated into a style. |
| IndexedDB v8 to v9 migration | Pass: valid databases migrate transactionally with revision history and project records retained; malformed style rows abort without partial upgrade. |
| Package compatibility/reload/copy | Pass: package manifest versions 1–6 and top-level shapes remain unchanged; style pack content round-trips, revision links validate, and copy import remaps identities and resets approval. |
| Recipe transition integrity | Pass: tests prove same-recipe preservation, empty-placeholder reset, populated-pack rejection, and no partial write; custom one-size recipe changes remain rejected. |
| Focused tests and changed-code coverage | Pass: 309 focused tests across five suites; 100% statement, branch, function and line coverage for all five changed production modules. |
| TypeScript and Control Center | Pass: `npx tsc --noEmit --pretty false`; `npm run control-center:test` 42/42; `git diff --check`. |
| Package scale evidence | Pass: package suite 56/56. 64 MiB fixture completed in 6.641 s at 523,489,280-byte peak RSS; 256 MiB near-cap fixture completed in 35.378 s at 903,282,688-byte peak RSS. The full package suite took 52.78 s. |
| Protected export identities | Preserved by scope/diff inspection; no exporter or export baseline changed. The full eight-identity replay remains at the admitted S779 integrated gate. |
| Integrated global coverage/build/browser/Electron gate | Pending S779, per admission; this persistence-only slice is not the settled integrated Epic candidate. |

The final focused coverage command passed all five production modules at all
four 100% metrics (5 test files, 309 tests). The package suite was also run
without coverage instrumentation at its real scale limits. `npx tsc --noEmit
--pretty false` passed after the final source/test edits. No source or test
changes followed these passes. Full global coverage, export identity replay,
build, browser and Electron gates remain reserved for the integrated S779
boundary; no application/export output changed here.

No independent low-risk disjoint work was identified because migration,
normalization, package copy and reload depend on the same child identity
contract. External-agent wait: 0. Maintainer-decision wait: 0.

## Durable checkpoint and next action

The validated exit replay advances the board from revision 4544 to 4546 and
attaches digest-verified `E-G05-S764-EXIT` evidence to G05-T01 and EPIC-18.
EPIC-18 and G05-T01 remain In Progress; T02–T05, G05-EXIT and UIQ-10 remain
Backlog; UIQ-09 remains Backlog behind EPIC-19. T01 remains In Progress because
revision payload integration, editing, and propagation remain open.

No blocking S764 decision remains. Slice 765 is the sole next action: integrate
the frozen T01 payload with immutable G02 style revisions/digests while
preserving historical revision identities and the legacy export bytes. The
validated board commands are in
`docs/planning/EPIC-18-S764-EXIT-BOARD-COMMANDS.json`; the next start packet
must record this landed commit SHA, verified main ancestry, and board revision
4546 before implementation.

Elapsed time (2026-10-12 20:42:34 UTC to the closeout boundary): approximately
19 minutes for implementation/review, 9 minutes for focused tests, coverage,
typecheck and package-scale verification, and 4 minutes for exit evidence,
board replay and context reconciliation; external-agent wait 0 minutes and
maintainer-decision wait 0 minutes. The landed commit subject is recorded
above so the slice does not need to contain its own commit hash.
