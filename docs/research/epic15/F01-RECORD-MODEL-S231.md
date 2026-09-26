# EPIC-15/G02 — F01 record model and pure migration (Slice 231)

_Accepted implementation record: 2026-09-24. The types and validators exist;
the IndexedDB repository and app migration have not yet been wired._

## Implemented record contract

`src/ui/project-records.ts` defines four independent version namespaces:

| Record | v1 fields and invariants |
| --- | --- |
| `ProjectRecord` | Schema version, UUID, name, canonical UTC timestamps, positive safe revision, ordered non-empty unique style-ID list, and an active style ID that is in that list. |
| `StyleRecord` | Schema version, UUID, owning project UUID, user-facing name, recipe ID, recipe-preset ID, timestamps, positive safe revision, and canonical saved design. Recipe and preset remain distinct identities. |
| `RecoveryRecord` | Schema version, style UUID, and a validated recovery payload. Raw measurement and option text is retained verbatim. |
| `MigrationRecord` | Schema version, exact legacy SaveFile/recovery keys, source SaveFile version or null, SHA-256 source fingerprint, migration timestamp, and destination project/style UUIDs. Slice 232 computes the fingerprint and commits the marker transactionally. |

UUIDs use the hyphenated RFC 4122 form with a supported version nibble and
variant bits (hex casing is accepted);
names are trimmed-nonempty strings of at most 80 characters; timestamps must
round-trip exactly through `Date.toISOString()`; and the initial project/style
revision is 1. A style's recipe identity must equal its saved workspace's
garment and selected preset. A bundle is rejected unless all style records
match the project's complete style list, belong to that project, and have
distinct IDs.

Each record rejects unknown or missing envelope fields. `StyleRecord.design`
also requires the exact seven canonical SaveFile sections, complete current
measurement keys, and exact workspace/appearance/nesting keys; the existing
SaveFile v5 parser performs the established semantic range, recipe, artwork,
and nesting validation. Record `schemaVersion` is independent from SaveFile's
legacy `v`; do not reinterpret or rewrite old `v` values. A future change to
this canonical record shape needs an explicit record-schema migration.

## Pure SaveFile conversion

`migrateLegacySaveFile` accepts source JSON, caller-supplied stable UUIDs and a
canonical migration timestamp. It delegates all historic meaning to the
existing `deserialize` implementation for SaveFile v1–v5, then creates one
project named `My designs` and one user style named `Untitled <recipeId>`.
Project/style names and IDs remain separate from recipe and preset IDs. The
returned result includes the source version for the transactional migration
marker. It performs no storage writes, does not delete either source key, and
returns a visible error for malformed, unsupported, invalid, or noncanonical
destination records.

The migration tests exercise every accepted v1–v5 version, defaults for fields
that older payloads did not contain, and the v1 strap-point conversion (15 cm
legacy point to the established 8 cm finished span). The migrated design must
equal the existing legacy parser's normalized result; migration cannot invent
new garment measurements. `migrateLegacyRecovery` converts the supported v1
recovery payload into a style-keyed record without turning raw unfinished
input into validated design values.

The module has direct 100% statement, branch, function, and line coverage in
its focused test run. The full application coverage gate and unchanged export
identities are checked before the slice lands. No UI, browser/Electron storage,
Save/Load behavior, artwork bytes, recipe, renderer, or export has changed in
this slice.

## Verification

- Focused tests: `npx vitest run src/ui/project-records.test.ts` — 6/6.
- Focused coverage: `npx vitest run src/ui/project-records.test.ts --coverage --coverage.include=src/ui/project-records.ts` — 100% statements, branches, functions, and lines.
- Production TypeScript/Vite build: `npm run build` — passed.

F01 remains active. Slice 232 owns the IndexedDB schema, transactional
repository, interruption and migration-write behavior, and runtime evidence.
