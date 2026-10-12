# Slice 765 — T01 package-copy provenance-reference correction

**Status:** complete. **Start:** 2026-10-12 21:18:07 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** `238c29f1f71bf3e74ee3d74ba5d97766e07d9f2a` (`Slice 764: persist T01
records with backward-safe migration`). The fresh `origin/main`
`e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor. **Landed
subject:** `Slice 765: remap nested T01 provenance on copy`; its full SHA is
captured by the S766 start boundary. The board was revision 4549 before exit
replay.

## Scope and result

Project-package copy now remaps each T01 field-envelope
`inheritedFrom.revisionId` when the referenced revision is included in the
package history. The traversal covers cover fields, material fields, BOM-row
fields, colorway fields and colorway-assignment fields. A reference outside the
package map remains unchanged as external provenance. Copy still remaps style
identity and the record's direct revision binding, fails closed for an
unmappable direct binding, and resets approval to DRAFT. Restore behavior,
other field data, package manifests and the validated source archive remain
unchanged.

The regression fixture contains mapped references in cover, material, BOM and
colorway-assignment envelopes and an external cover reference. It compares the
complete copied T01 record, confirms the external reference is unchanged, and
proves the source archive's T01 record was not modified. The existing checks
continue to cover exact non-copy restore, direct revision mapping, review reset
and rejection of a direct revision link outside copied history.

Only `src/ui/project-package.ts`, its focused test, S765 evidence and current
project/board checkpoint records changed. No T01 schema, style-revision
payload/hash, storage migration, package manifest version, UI, output,
exporter, export baseline, source fact or physical/production claim changed.
`PROJECT_PACKAGE_VERSION` remains 3; capture/custom-style/grade-plan package
version gates remain unchanged.

## Acceptance and verification

| Gate | Result |
|---|---|
| In-package inherited provenance | Pass: cover, material, BOM and colorway assignment references map to the copied revision. |
| External provenance and source immutability | Pass: an external reference retains its exact ID; the validated source package record is unchanged. |
| Existing restore/copy behavior | Pass: non-copy restore preserves the full record; direct style/revision remap, DRAFT approval reset and fail-closed invalid direct binding remain covered. |
| Focused package suite | Pass: 56/56 `src/ui/project-package.test.ts` tests, including scale/near-cap package fixtures. |
| Changed production module coverage | Pass: `src/ui/project-package.ts` reports 100% statements, branches, functions and lines under focused V8 coverage. |
| TypeScript and Control Center | Pass: `npx tsc --noEmit`; `npm run control-center:test` 42/42 after the S765 start/sequence board updates. |
| Protected export identity | Pass: `src/quality/export-identity.test.ts` 9/9; no export baseline or exporter file changed. |
| Diff hygiene | Pass: `git diff --check`. |
| Browser/Electron/global output gates | Not due: this slice changes only project-copy serialization. The settled G05 candidate retains its S780 integrated gates. |

An initial typecheck caught TypeScript's restriction on indexed writes through
a generic object. The mapper now writes through a detached plain record and
returns it as the unchanged generic shape; the final typecheck, focused
regression and focused coverage run all pass. No production behavior or
baseline was altered to address that compile-only issue.

The original S764 package-scale run remains its own evidence. In this slice,
the ordinary S765 package run completed the existing 64 MiB and 256 MiB
fixtures (peak RSS approximately 478 MB and 867 MB); the coverage run used its
bounded 4 MiB fixture (approximately 349 MB peak RSS). Existing fixtures,
limits and runner defaults were not changed.

No independent low-risk delegated work was safe because field-envelope copy
normalization is one shared transformation. External-agent wait: 0 minutes;
maintainer-decision wait: 0 minutes. Elapsed time through implementation,
focused verification and durable closeout is about 15 minutes: approximately
5 minutes implementation/review, 3 minutes focused verification including
typecheck diagnosis and retry, and 7 minutes checkpoint/evidence/board work.

## Durable checkpoint and next action

The validated exit replay attaches digest-verified `E-G05-S765-EXIT` evidence
to G05-T01 and EPIC-18, advancing the canonical board from revision 4549 to
4551. EPIC-18 and G05-T01 remain In Progress; G05-T02–T05, G05-EXIT and
UIQ-10 remain Backlog; UIQ-09 remains Backlog pending EPIC-19. The original
S762 admission and S764 exit report remain unchanged. The active execution
order remains in `docs/planning/EPIC-18-S765-RESEQUENCING.md`.

The sole next action is S766: integrate T01 with immutable G02 style-revision
payloads/digests and concurrency-safe saves, while preserving historical
payload-v1 verification. Start S766 from this landed commit and board revision
4551; its packet must recheck `origin/main` ancestry and reserve the next
unused slice before implementation. The validated S765 exit replay is
`docs/planning/EPIC-18-S765-EXIT-BOARD-COMMANDS.json`.
