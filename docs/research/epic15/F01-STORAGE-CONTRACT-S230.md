# EPIC-15/G02 — F01 storage and migration contract (Slice 230)

_Accepted technical contract: 2026-09-24. This is the storage decision for
Slices 231–234, not a statement that the new storage behavior is already in the
app._

## Decision

Use IndexedDB as the single asynchronous repository for project, style,
per-style recovery, and migration records in both the web app and Electron
renderer. Keep the existing Electron artwork-file bridge and browser artwork
database as separate byte stores for this packet. Treat artwork references and
project records as a two-store operation: stage and verify bytes first, then
make references visible in one project-database transaction. Failed commits
must leave the prior project/style records intact; failed cleanup may leave an
unreferenced asset, which can be reconciled later, but may never leave a live
design pointing at bytes that were never saved.

The core database is `infinidrip-projects`, initially schema version 1. Its
object stores are:

| Store | Key | Purpose |
| --- | --- | --- |
| `meta` | fixed keys | Active project/style IDs and repository schema metadata. |
| `projects` | stable project ID | User-named local project record and project revision. |
| `styles` | stable style ID | User-named style, distinct from recipe ID and recipe-preset ID, plus the current saved design record. |
| `recoveries` | style ID | Latest raw-preserving recovery state for that style. |
| `migrations` | source fingerprint | Idempotency marker and report for importing the legacy local SaveFile/recovery records. |

Project and style IDs use UUIDs. Recipe identity, recipe-preset identity, and
the user's display name are separate fields. Later schema additions use
explicit record schema versions and IndexedDB version upgrades; they do not
change the meaning of the legacy SaveFile `v` field.

IndexedDB's transaction is the atomic boundary for project records. Validate,
canonicalize and hash the proposed data before opening a transaction. Keep the
transaction short: read the current record revision, compare the caller's
expected revision, then write the style, recovery (when part of that operation),
project revision, and active-selection metadata together. Resolve success only
from `transaction.complete`; request success alone does not mean the group
committed. Do not await hashing, file I/O, IPC or unrelated promises inside a
live IndexedDB transaction. Use a `strict` durability hint for explicit saves
and project commits when the runtime accepts it, and otherwise use its default
mode. Neither choice is described as a guarantee against power loss or browser
profile deletion.

An overlapping write is serialized by IndexedDB. A stale expected revision
returns a conflict and must not overwrite the newer record. On `versionchange`,
close the connection and tell the user an older tab must be reloaded. On an
upgrade blocked by another open tab, keep the old database intact and offer a
clear “close other InfiniDrip tabs and retry” message. There is no silent
fallback write to localStorage, because that would create two competing
canonical copies.

## Why this choice fits the repository

| Candidate | Strengths | Failure or integration cost | Decision |
| --- | --- | --- | --- |
| `localStorage` | Already reads and writes the single current SaveFile and recovery record. Simple compatibility path. | Synchronous string-only API; MDN documents a 5 MiB localStorage limit per origin. It has no multi-record transaction, and is unsuitable for the project/style/recovery graph. | Retain the existing key as a legacy single-style compatibility projection, not as the canonical repository. |
| IndexedDB | Async structured records, Blob support, read/write transactions across named stores, scoped same-origin access, and browser/Electron renderer API parity. Existing browser artwork storage already uses it. | Browser quota is dynamic; browser data is best-effort and origin-scoped by default. A file-origin Electron proof is required instead of assuming normal HTTP-origin behavior. | **Chosen** for project/style/recovery records in both renderers. |
| Electron main-process JSON/files | Direct placement in an app-owned data directory; the existing artwork bridge already validates files and writes through a temporary file, `sync`, and rename. | Requires a second persistence implementation, narrow IPC APIs and sender validation, plus conflict/transaction logic that must mirror the browser repository. | Keep for the existing desktop artwork bytes only. Do not create a separate desktop project database. |

The decision is based on an actual Electron prototype, not only API similarity.
`npm run electron:verify-idb-file-origin` launches Electron 44.1.0 / Chromium
152.0.7977.65 twice under one isolated user-data profile. The first run writes a
record to IndexedDB and localStorage from `file://`; the second run reads the
same record from a different temporary app-file path. Both stores survived the
process restart and the path change. This proves behavior for the tested
Electron/Chromium versions and profile configuration only; it does not prove
browser eviction resistance, every Electron release, or crash/power-loss
durability.

## Legacy data and the Save/Load controls

1. On startup, open and validate the project database before mounting a design
   that can write. If no migration marker or project exists, inspect the raw
   `patternworks_save_v1` value and `patternworks_recovery_v1` value using the
   existing v1–v5 parsers. The `patternworks_save_v1` key name is not a schema
   version.
2. If the saved workspace is valid, convert it to one local project and one
   style, preserving measurements, fabric, recipe options, appearance,
   workspace controls, surface placements, nesting settings, and the selected
   recipe preset. Name the user style separately (for the first conversion,
   `Untitled <garment>`); never copy the preset name into the user-name field.
3. If a valid recovery record exists, attach it to the migrated style without
   replacing its last explicitly saved design. The user still receives an
   explicit restore/discard choice. If only a valid recovery record exists,
   create a default project/style and attach recovery there.
4. Write the project, style, recovery (if present), active IDs and migration
   marker in one `readwrite` transaction. Do not clear or rewrite either
   legacy localStorage key during migration. A failed/aborted transaction
   therefore leaves the original raw data available for another attempt and
   diagnosis.
5. If a legacy record is corrupt, unsupported, or inaccessible, do not silently
   replace it with defaults or mark migration complete. Show a recoverable
   startup error and preserve the source bytes. If there is no legacy save and
   no recovery, create the initial project/style as a normal first-run action.
6. The existing **Save** action commits the active style to IndexedDB, then
   refreshes `patternworks_save_v1` as a v5 single-style compatibility copy.
   If the project transaction succeeds but the compatibility copy fails, the
   project remains saved and the UI reports that the older-app copy is stale.
   The old app can read only the copied active style; the copy does not encode
   the multi-style project.
7. The existing **Load** action restores the last committed version of the
   active style from IndexedDB. The legacy key remains an import/migration and
   downgrade-compatibility source, not a second current-app database. A future
   explicit legacy-file import creates a new style or asks before replacing;
   it never overwrites project state silently.

Journey/tutorial preferences are not garment design records and remain in the
existing journey store. F01 does not migrate them into each style.

## Artwork and project-package contract

Artwork placement metadata continues to live in a style's `SurfaceBook`; bytes
remain in the current asset adapter: browser IndexedDB or the Electron
`userData/artwork-assets` bridge. A reference without a readable byte record is
reported as missing and is not described as a self-contained backup.

For a new placement or import, inspect and hash all assets before changing the
style's placements. Persist new asset bytes first; only after all required
bytes have been read back and verified may one IndexedDB transaction publish
the updated style. On failure, preserve the previous placement/style. Remove
only asset IDs created by the failed operation; if removal itself fails, leave
an orphan for reconciliation rather than risking deletion of an asset another
style uses.

Use a versioned ZIP project package, with a strict manifest and binary asset
entries (not base64 inside JSON). ZIP preserves existing media bytes, is
inspectable with standard archive tools, and avoids adding one-third encoding
overhead. The manifest contains package/schema versions, project/style IDs and
records, `importedFrom` lineage when imported as a copy, and one entry per
asset with stable ID, safe generated path, media type, byte length and SHA-256.
Every file in the archive must be named by the manifest; reject duplicate,
unknown, path-like, missing, truncated, over-limit or hash-mismatched entries.
Do not extract paths to disk. Import into memory/storage records only.

Initial resource policy for package v1: maximum 256 MiB archive size,
maximum 256 MiB total uncompressed content, no ZIP64, and no more than 128
asset entries. These are defensive caps, not claims that every profile can
store that much. Each asset remains subject to the existing 10 MiB artwork
limit (2 MiB SVG limit). Package creation and reading must stream media entries
and report progress/cancellation; a prototype at small, 64 MiB and near-cap
fixtures must pass before F01 can close. If a target browser/Electron runtime
cannot handle the stated envelope, add a numbered contract/remediation slice
with measured evidence instead of silently lowering or bypassing the cap.

Use the small MIT `fflate` ZIP implementation for the package writer/reader,
subject to a fresh dependency/security review at Slice 234. The July 2026
GHSA-px8p-9vwx-vf98 advisory identifies an infinite-loop denial of service in
its ZIP64 unzip path through 0.8.2; the project changelog reports the ZIP64
extra-field fix in 0.8.3. The implementation must use 0.8.3 or later, enforce
its own archive/member/count limits, reject ZIP64 for package v1, and test
malformed central-directory and truncation cases. No dependency is added in
this contract slice.

Import conflict rules:

- Same project ID and identical canonical package digest: report “already
  imported” and make no write.
- Same project ID with different content: do not replace; offer explicit
  **Import as copy**, which assigns new project/style IDs and records the
  source IDs in `importedFrom`.
- Same asset ID and same SHA-256: reuse the stored bytes.
- Same asset ID and different SHA-256: cancel or import as copy with a new
  asset ID and rewritten placement references; never overwrite the old asset.
- Stage and verify all new assets first. Only publish project/style records
  and active selection in one transaction after every required asset passes.
  If it fails, no imported project becomes visible; cleanup staged assets by
  their generated IDs and preserve pre-existing assets.

## Failure and recovery behavior

| Failure | Required behavior |
| --- | --- |
| IndexedDB unavailable, blocked, or upgrade is waiting on another tab | Preserve localStorage sources; show why startup/save is blocked and a retry/close-other-tabs action. Never switch silently to another writable store. |
| Quota exceeded / disk full / transaction abort | The readwrite transaction leaves the previous project/style/recovery state intact. Keep the editor's unsaved state, show the exact save failure, offer export/space recovery, and never mark the revision saved. |
| Browser reports usage/quota estimate | Treat as an estimate only; it is advisory and cannot reserve space. Do not report a guaranteed remaining capacity. |
| Browser eviction or user-cleared site data | Explain that browser-local data is best-effort unless the browser grants persistence, and that a project package is the portable backup. Do not automatically call `navigator.storage.persist()` or produce a permission prompt. |
| Power loss, renderer termination, or close while a transaction is pending | Never depend on unload handlers to commit. Track in-flight writes, keep the dirty/recovery state visible, and warn before closing while a pending save exists. A completed transaction is still not an external backup. |
| Stale tab / compare-and-swap conflict | Keep both the newer stored version and the current in-memory draft distinct. Ask the user to reload, save a copy, or compare; do not use last-write-wins. |
| Malformed current record or unsupported record version | Preserve bytes and report the record ID/version. Do not coerce it to default measurements or overwrite it. |
| Missing artwork bytes | Preserve the placement reference and visibly mark it unresolved. A complete backup is blocked until repaired; any explicitly allowed partial package is labeled incomplete and carries the unresolved reference list. |
| Corrupt ZIP, duplicate/path-like entries, decompression over limits, or bad hash | Reject before changing active data. The current project and assets remain untouched. |
| Electron user-data directory read-only/full or IPC/storage bridge failure | Keep the old project state and raw design in memory, show that it was not saved, and leave the user an export/retry path. The bridge accepts only project-package bytes, not arbitrary paths or filesystem commands. |

Browser-local data remains origin-specific. Switching host, scheme or browser
profile does not carry IndexedDB records across origins; users move projects
with the versioned package. Browser storage may be evicted as a whole origin.
Electron data is local to its Chromium profile and app identity. Neither path
is cloud synchronization or a guaranteed backup.

## Failure tests carried into implementation

Slices 231–234 must test: every SaveFile v1–v5 migration; empty/corrupt/unknown
legacy state; recovery-only startup; repeated migration; migration transaction
abort; v1→v2 database upgrade with a second open tab; stale concurrent writes;
quota failure; missing, duplicate, corrupt and unreferenced artwork; artwork
write success followed by style-transaction failure; no partial project on
import; exact ID/content collisions; malformed/truncated ZIP and ZIP64
rejection; per-asset and package caps; cancellation; Browser download and
Electron save-dialog round trips; and app reload/restart with two styles and
per-style recovery. Verify the actual files and rendered selected style, not
only fake-IDB unit tests.

## Primary technical sources

- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — browser-specific quota, best-effort/persistent storage, estimates, `QuotaExceededError`, and whole-origin eviction.
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) — object stores, same-origin behavior, transaction model, blocked/upgrades, and shutdown limitations.
- [MDN: IDBDatabase.transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction), and [transaction complete event](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event) — durability hints, transaction scope/lifecycle, aborts, and commit completion.
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage) — Web Storage's string-only and per-origin size constraints.
- [Electron: app paths](https://www.electronjs.org/docs/latest/api/app#appgetpathname), [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation), [IPC](https://www.electronjs.org/docs/latest/tutorial/ipc), and [security](https://www.electronjs.org/docs/latest/tutorial/security) — user-data/session-data placement and narrow, sender-validated bridges.
- [fflate package](https://www.npmjs.com/package/fflate), [fflate 0.8.3 changelog](https://github.com/101arrowz/fflate/blob/master/CHANGELOG.md), and [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98) — package size/license/streaming claims and ZIP64 parser denial-of-service/fix floor.

This contract changes no recipe, pattern/export baseline, physical-fit claim,
supplier workflow, paid service, hosted feature, or user-facing AI behavior.
