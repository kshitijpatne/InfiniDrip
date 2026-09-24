# EPIC-15/G02 — F01 transactional project repository (Slice 232)

_Implementation and runtime evidence recorded 2026-09-24. This is a verified
repository API and storage proof; the current application Save/Load controls are
not yet wired to it._

## Implemented contract

`src/ui/project-repository.ts` opens the `infinidrip-projects` IndexedDB at
schema version 1. On first creation it creates the exact `meta`, `projects`,
`styles`, `recoveries`, and `migrations` stores with the accepted key paths.
Every open of an existing database rechecks its version, complete store set,
and key paths. A future/unknown version or incompatible store layout is
rejected with an explicit repository error; it is never destructively reset.

The repository provides:

- `initializeFirstRun` for one initial project/style using the current
  deterministic default design.
- `saveProjectBundle` for validated project/style/recovery writes, active
  selection, compare-and-swap project revisions, stable style ownership, and
  explicit recovery replacement or clearing.
- `loadProject` and `readActiveProject` for validated, transaction-consistent
  snapshots.
- `selectActiveStyle` for revision-checked style switching.
- `migrateLegacy` for non-destructive SaveFile v1–v5 plus Recovery v1
  conversion, including recovery-only data, source fingerprinting, and
  idempotency.

All reads validate the record schema and project/style graph before returning
it. Saves reject malformed bundles, stale project revisions, stale style
revisions, style deletion, cross-project style-ID reuse, duplicate or
mislinked recovery, and conflicting “save and clear” recovery instructions.
The recovery payload stays style-scoped and retains raw unfinished inputs.
Write transactions request `durability: "strict"`; only a `TypeError` from a
runtime that rejects the options dictionary triggers a retry with the default
transaction mode. Other storage failures are returned as errors.

The transaction completion event is the success boundary. Revision checks,
style ownership checks, project/style/recovery writes, active selection, and
migration markers share a short IndexedDB transaction. Failed operations abort
that transaction and preserve its prior committed snapshot. The API does not
perform hashing or unrelated asynchronous work inside a transaction.

## Migration and recovery behavior

The caller supplies the exact old save and recovery strings. The repository
validates and converts those strings, computes SHA-256 over a JSON-framed pair
of the two named legacy keys, and then writes the converted project, style,
optional recovery, active-selection metadata, and idempotency marker together.
It never reads, clears, or rewrites `localStorage` itself. A recovery-only
source creates a default design and attaches the recovered raw state to its
style. A second import of the same source pair reports `already-migrated`.

Unit pressure tests force a failure at the final migration-marker write after
earlier store writes were queued. The transaction rolls back: no active
selection or project becomes visible, the source JSON is unchanged, and a
retry with the same source succeeds. Separate tests cover corrupt source,
corrupt marker, destination collision, an already-initialized repository,
missing SHA-256, schema mismatch, version change, blocked/late open events,
and write rollback.

## Runtime and test evidence

The repository is tested with the exact development-only dependency
`fake-indexeddb@6.2.5` for deterministic IndexedDB transaction behavior. That
library is an in-memory test implementation, so it does not establish on-disk
durability; its own documentation describes its Web Platform Test coverage as
lower than Chromium's. The repository tests therefore complement, rather than
replace, the real Electron run below. See the
[fake-indexeddb project documentation](https://github.com/dumbmatter/fakeIndexedDB)
and [package metadata/license](https://github.com/dumbmatter/fakeIndexedDB/blob/master/package.json).

`npm run electron:verify-project-repository` builds a temporary browser bundle
from the repository API and exercises both a persistent Chromium browser
profile and the actual Electron renderer (`contextIsolation: true`,
`nodeIntegration: false`). For each runtime, under one isolated profile it:

1. Writes a valid legacy SaveFile and raw Recovery v1 to localStorage from
   `install-a/index.html`.
2. Migrates through `ProjectRepository`, checks project/style/recovery, then
   closes the Electron process.
3. Starts a second process from `install-b/index.html`, reads the same records,
   repeats migration, and verifies `already-migrated`.
4. Confirms both localStorage strings remain unchanged and the project,
   measurement values, and raw recovery input survive the restart and path
   change; it also records the repository's strict read/write durability
   option reaching Chromium without a default-mode fallback.

Both runs passed: Electron 44.1.0 / Chromium 152.0.7977.65 and Playwright
HeadlessChrome 151.0.7922.34. The web proof used two different localhost routes
under the same origin, one persistent Chromium profile, and two browser
processes. Strict durability was requested and accepted in both runtimes, so
neither used the default-mode fallback. This is evidence for those tested
runtime/profile configurations only. It is not a browser-quota or eviction
guarantee, a cross-browser matrix, crash/power-loss proof, backup proof, or
user-facing migration rollout.

Focused tests: 21/21 pass; `project-repository.ts` has 100% statement, branch,
function, and line coverage. The full `npm run coverage` gate passes with 100%
statements, branches, functions, and lines, including the protected export
identity checks. `npm run build` passes. The canonical Control Center links
this report as hash-verified evidence to F01 at revision 272; its focused test
suite passes 33/33. F01 remains In Progress until Slice 233, Slice 234, and
the F01 packet exit.

## Explicit boundary for Slice 233

The new API is not yet connected to application boot, the current Save/Load
buttons, style/project management UI, or the app's existing recovery prompt.
Until Slice 233, the shipped app still uses its current legacy single-style
localStorage path. Artwork bytes remain in their current browser/Electron
stores and have not been moved into the project database. Project ZIP
export/import and size-cap pressure testing remain Slice 234. No garment,
pattern, or export output changed here.
