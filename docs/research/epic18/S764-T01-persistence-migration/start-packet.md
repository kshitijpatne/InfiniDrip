# Slice 764 — T01 persistence and migration

**Status:** In Progress. **Start:** 2026-10-12 20:42:34 UTC. **Reserved
slice:** 764, confirmed unused after S763; current branch history ends at
`Slice 763: define T01 tech-pack record contract`. **Starting commit:**
`1443affb51847f179bcc352bac47fad2d9b28ef8`. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. A fresh fetch
confirmed `origin/main` remains `e9221ea5033ccfdd91bf1ebb353926f189477d75`
and an ancestor. **Canonical board:** revision 4542; EPIC-18 and G05-T01 are
In Progress; T02, UIQ-10 remain Backlog; UIQ-09 remains Backlog pending
EPIC-19.

## Authority and scope

This is the next authorized boundary in
`docs/planning/EPIC-18-ADMISSION.md`: style/project persistence and
non-destructive migration for existing style-record and SaveFile versions,
with project-package and reload proof. Slice 763 froze the input contract in
`docs/research/epic18/S763-T01-record-contract/exit-packet.md`. No new Epic,
UIQ package, recipe default, supplier fact, or physical/production claim is
admitted here.

Add the T01 record as a required style-scoped child of the current style
record. Bump the current regular/custom style record schemas while retaining
strict parsers for regular schemas v1–v4 and custom schema v5; normalize every
accepted historical style to a current record with an explicit unresolved
T01 record. Keep `ProjectRecord` and the standalone `SaveFile` schema v1–v6
unchanged: a SaveFile has no style identity, so conversion adds T01 only when
that design is migrated into a style. Migration preserves every normalized
`SavedDesign` field and value; only the containing style gains the T01 child.

Persist migrated style records in a transactional IndexedDB version upgrade.
The upgrade adds no object store or key-path change, rejects/rolls back
malformed records, and preserves project IDs, style IDs, active selection,
revision history, existing style designs, recoveries, captures, and grade
plans. New regular/custom styles and legacy SaveFile migration create their
T01 record at the same style ID and recipe identity.

Keep project-package manifest versions 1–6 and their top-level shapes
unchanged; the new style child is carried by the style schema. Import old
packages through the existing style migrator, and round-trip current package
versions. When importing a package as a copy, remap the T01 style identity and
any existing G02 revision link with the package's style/revision maps. Reset
pack approval to DRAFT on copy so a review made against the source style is
never carried onto a different style. Preserve field/material/BOM/colorway
content and legacy export behavior.

## Explicit migration defaults and limits

- A style migrated without T01 data receives a schema-v1 record with all six
  cover values explicitly unresolved, empty material/BOM/colorway lists, and
  DRAFT approval. Each unresolved cover field includes a reason and next
  action. No style name, size, unit, supplier, cost, or construction fact is
  inferred into a confirmed value.
- The required `recipeVersion` string is `unversioned` for this empty legacy
  record. Current recipe definitions have no version field or independent
  recipe-version registry in code. This literal is an explicit absence marker,
  not a sourced recipe version; a future authoritative version may replace it.
- A new empty T01 record remains unbound (`revisionId: null`,
  `revisionNumber: 0`) with DRAFT approval. Connecting it to G02 immutable
  style revision identity is Slice 765; do not partially hash or bind pack
  fields here.
- Nested child content is style-scoped inside the record. Copy import remaps
  style/revision identity and invalidates approval, while preserving the
  pack's child content. No T01 editor or rendered output is included.

## Files and focused ownership

Expected implementation/test files are limited to:

- `src/ui/tech-pack-records.ts` and its focused test: explicit empty-record
  factory.
- `src/ui/project-records.ts` and tests: strict style v1–7 parsing,
  normalization, and legacy SaveFile-to-style migration.
- `src/ui/project-repository.ts` and tests: the additive local DB version
  migration and persisted style reload.
- `src/ui/project-workflow.ts` and tests: pack creation for regular and
  custom styles and preservation during design saves.
- `src/ui/project-package.ts` and tests: legacy/current package compatibility,
  pack round-trip, and safe copy remapping.
- This start packet, exit packet, validated board-command record, goal ledger,
  `PROJECT-STATE.md`, `ARCHITECTURE.md`, `AGENTS.md`, and `CONTEXT-INDEX.md`.

No independent work has disjoint ownership that is safe: parsing, IndexedDB
upgrade, project-package copying, and reload assertions depend on this single
record contract. Codex owns implementation and review. External-agent wait: 0.
Maintainer-decision wait: 0.

## Acceptance and gates

1. Current regular/custom styles persist a strictly parsed T01 child bound to
   their own style and recipe IDs. Updates to `SavedDesign` preserve the same
   T01 child until its separately admitted edit/revision behavior.
2. Existing regular style schemas v1–v4 and custom schema v5 normalize without
   losing design, archive, custom-size, revision-head, or project identity.
   New-schema records reject missing, malformed, wrong-style, and wrong-recipe
   T01 children.
3. Every supported legacy SaveFile version v1–v6 converts without changing
   the prior normalized design fields or values and gains only an unresolved,
   style-scoped T01 record.
4. Existing IndexedDB v8 data migrates atomically to the new schema; valid
   current style rows receive the additive record, while malformed style rows
   abort the upgrade and preserve the source DB/version/data.
5. Project packages v1–v6 remain readable; new exports retain the existing
   manifest version/top-level shape and round-trip regular/custom styles,
   T01 content, project reload, and copy-import identity/approval rules.
6. Focused tests cover parser, factory, migration, workflow, repository and
   package behavior. Every changed production module has 100% statement,
   branch, function, and line coverage. Typecheck and diff checks pass.
7. Protected legacy export byte identities are not moved. Because this slice
   changes no exporter, legacy rendering or byte contract, run focused
   persistence/package gates here and retain the full eight-identity replay,
   settled global 100% suite, build and browser/Electron boundary gates for
   S779.

## Non-goals, risks, and next action

No revision digest/history payload change (S765), T01 editing UI or all-recipe
propagation (S766), recipe-version invention, SaveFile schema bump, package
manifest-version bump, export output, UIQ-10 implementation, external service,
new garment, supplier/physical evidence, or production claim.

Material risk: adding a required nested style field must stay compatible with
older styles and package manifests, and IndexedDB must not partially upgrade
or strand existing styles. The mitigations are a strict versioned style
migrator, schema-v9 transactional cursor upgrade, rollback tests, preserved
legacy SaveFile versions, old package fixtures, and actual save/reload/copy
proof. The current format has no authoritative recipe-version source; the
explicit `unversioned` marker avoids treating a guessed version as fact.

At this slice boundary, record landed commit and actual elapsed implementation,
focused verification, external-agent wait, and maintainer-decision time;
record passed/failed/pending criteria, exact logs, package and reload evidence,
remaining dependencies, board revision, and one next action. Only then begin
S765's revision-payload integration.
