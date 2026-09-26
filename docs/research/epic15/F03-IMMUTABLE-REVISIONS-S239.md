# F03 — Immutable style revisions and frozen output manifests (Slice 239)

**Status:** Slice 239 implementation and digital verification complete. Slice 240 remains the G02 final exit gate.
**Depends on:** S238 durable semantic edits and cross-output integration.
**Required exit:** revision history is immutable and verifiable across save, restore, project switching, backup/import, browser reload and Electron restart; captured outputs remain retrievable as their exact original bytes.
**Does not claim:** physical fit, fit simulation, factory acceptance, approval, authorship, supplier readiness or production release.

## Scope and user-visible behavior

1. An explicit Save that changes the saved design creates one immutable child revision. Saving identical design content advances no design revision, including when append-only field observations were recorded separately. Recovery writes, project/style selection, rename and archive operations do not create design revisions.
2. Every new style receives an initial revision. Existing projects receive one honest baseline revision per existing style on their first S239-capable open. Earlier versions are not reconstructed or implied.
3. The Project & styles area exposes a chronological history with revision identity, parent, time, digest verification state, compare-to-current and restore actions. Restore copies the selected saved design into a new child of the current head; it never moves the head backward or overwrites a row. Current append-only field history is preserved and gains normal restore observations.
4. A user can explicitly freeze the current supported digital output set only after saving the style and passing the existing digital export gates. The capture contains the selected-size SVG, DXF, tiled PDF and A0 PDF plus the whole-run tech-pack PDF and projector SVG and the current surface-art sheet SVG. One missing/invalid output blocks the whole capture; partial packets are not stored.
5. The frozen manifest pins one style revision, exact selected size and exporter/schema/rule contract versions, explicit empty approval refs, visible out-of-scope/unresolved facts, a stable-sorted artifact list, exact byte lengths and per-file SHA-256. Its packet digest is RFC 8785 JCS over the manifest payload, excluding its own digest and capture timestamp. Exact emitted UTF-8 artifact bytes are retained with the immutable manifest and can be downloaded again.
6. Revision and manifest history is included in project backup/import. Older supported package versions import with a baseline revision and no fabricated export history. Copy imports remap style/revision/manifest identities and recompute affected revision/packet digests; artifact bytes and per-artifact byte digests remain unchanged.

## Canonical revision and integrity contract

- A revision record has strict schema version, stable `revisionId`, owning `styleId`, monotonic per-style `revisionNumber`, `parentRevisionId` (null only for the initial baseline), `createdAt`, immutable payload, canonicalization identifier, digest algorithm, and `revisionContentDigest`.
- Its payload freezes the style ID and revision/parent identity, schema and explicit rule/exporter contract versions, the exact `SavedDesign`, the exact field-observation snapshot available when that design revision was created, and a stable-ID-sorted source-artwork manifest (`assetId`, MIME type, byte length, SHA-256). Later provenance-only observations remain in the append-only current field ledger and do not create or rewrite a design revision. All referenced local artwork must exist and hash correctly before a revision can be created or verified.
- Digest: `SHA-256(UTF-8(JCS(revisionPayload)))`, using RFC 8785. The digest excludes its own field and `createdAt`; revision/parent identities and versions are included. The implementation rejects values outside the JSON/I-JSON-compatible subset, including non-finite numbers, unsupported values, sparse arrays, accessors, cycles and unpaired UTF-16 surrogates. It does not normalize Unicode. Array order is retained; unordered linked records are sorted by stable ID before hashing.
- A digest establishes only byte-level integrity/change identity. It is not a signature and proves neither source authenticity, license rights, user identity, approval authority, measurement accuracy nor fit.
- Old revision and manifest rows are insert-only. Restore creates a new child. Repository reads verify the payload digest, store key, owning style, parent chain, artifact hashes, packet digest and blob byte length; corruption produces an explicit storage error and never silently falls back to a newer state.

## Persistence, migration, and atomicity

- Bump local project database schema v5→v6. Add `styleRevisions` and `exportManifests` stores, with indexes for stable style-scoped chronological reads. Advance style record schema 3→4 by adding nullable `revisionHeadId`; null is permitted only during the explicit legacy-seeding transition.
- Versionchange migration is schema-only and non-destructive. It creates both stores and validates/upgrades all existing style rows atomically. It does not call WebCrypto or perform async work in an IndexedDB versionchange transaction.
- After opening storage and before exposing the editor, compute artwork digests and baseline revisions outside a transaction. Then atomically compare-and-set every still-unseeded style, insert initial revision rows and set style heads. Concurrent tabs must converge on one baseline. Missing/corrupt referenced artwork or revision data blocks startup visibly without deleting prior records.
- Before any write transaction, compute canonical payloads, SHA-256 values and artifact byte hashes. Within a single IndexedDB readwrite transaction, compare the project/style revisions and expected head, insert new immutable rows, update the style head and design record, append field history, and clear the style's recovery record. No `SubtleCrypto` await occurs inside an active IndexedDB transaction.
- Rename, archive, restore-style, recovery, project switch and package import paths must preserve or explicitly initialize revision heads. Imported/duplicated rows are validated before any records or artwork become visible. A failed write leaves previous style, head, revisions, manifest and recovery unchanged.
- Exact export bytes live with their manifest row. A manifest permits at most 16 artifacts, 32 MiB per artifact and 128 MiB total. Exceeding a bound or browser quota fails visibly and stores no partial manifest. Project backup continues to enforce its existing 256 MiB total limits.
- The existing package v1/v2 digest and import contracts remain byte-compatible. Package v3 carries revision and manifest metadata plus exact frozen artifact bytes; older v1/v2 imports seed a baseline without claiming historical captures.

## Restore, compare, and export details

- Revision comparison reports changed saved-design and provenance JSON paths, not inferred fit changes. It binds both sides by revision ID/digest and verifies each before display.
- Restore verifies the complete selected revision and every referenced local asset before writing. It restores the design payload only, preserves the append-only current field-observation ledger, records the normal new observations, and stores a new revision whose parent is the current head. A missing/changed asset blocks restore with the asset ID and recovery guidance.
- Capture rechecks that the editor is saved and the active style head still equals the output source revision after generation. A concurrent save or stale source discards the capture. Capture remains explicitly a digital output record; `approvalRefs` is empty and the unresolved list states that physical sample/fit, formal colorway approval, supplier-specific requirements and factory acceptance are not present in G02.
- Manifest artifact IDs and archive paths are stable and safe; display filenames never become ZIP paths. Unordered artifact rows sort by artifact ID. Ordered semantic content remains ordered.
- Re-downloading a captured artifact reads and verifies the stored bytes; it never regenerates an old artifact using current exporters.

## Explicit non-goals and open gates

- No user-facing AI helper, new garment recipe, grade-rule approval, body-fit/3D simulation, measurement prediction, technical-pack redesign, CAD profile, user approval workflow, supplier contact, payment, hosted service, physical sample or production-release state.
- S239 snapshots the actual current `SavedDesign` and field-observation model. It does not invent C04 component/seam/BOM/cost/colorway records that G02 has not implemented; the manifest states those scope limits rather than claiming C04's full future packet model.
- Cross-device signatures/authentication, tamper resistance against a user who edits the local database, external backups, browser-quota guarantees and OS-crash/power-loss guarantees remain out of scope. Local project backup is the user's portable copy.

## Slice verification and evidence

1. RFC 8785 test vectors for recursive key sorting (including non-ASCII UTF-16 order), string escaping, number boundaries, and UTF-8 bytes; negative cases for unsupported values, non-finite numbers, lone surrogates, cycles and sparse arrays. Verify SHA-256 using WebCrypto vectors.
2. Focused 100% statement/branch/function/line coverage for each new or changed production module. Test no-op Save, one edit/one child, style isolation, concurrent stale-head conflict, parent-chain integrity, corruption, restore to old content as a new child, missing artwork and append-only field history.
3. IndexedDB v5→v6 migration with empty/populated/multiple-project stores, invalid legacy data, quota/transaction abort, simultaneous first-open, and reopen idempotence. Prove old records remain byte-identical on failure.
4. Export capture tests for all seven artifact kinds, correct size scope, stable ordering, exact byte/hash/length identity, blocked/partial generation, stale-source races, storage quota, immutable retrieval, manifest digest verification and repeat captures.
5. Project package v1/v2 compatibility plus v3 export/import, local asset closure over all revisions, manifest/artifact round trip, corruption rejection, ID remapping for copy imports, and rollback with zero partial visibility.
6. Actual production-built Chromium and Electron runs on a Tee and a difficult Woven shirt or Polo: save edits, compare revisions, restore an older revision, freeze all outputs, alter and save a successor, prove the old revision/manifest/artifact bytes and digests are unchanged, download an old captured artifact, close/restart, and re-check the same values.
7. Retain browser/Electron logs, SHA-256 manifests, rendered history/capture screenshots, migration/package reports and a human-readable exit report. Run focused tests during the slice. Slice 240 owns the complete repo coverage/build/protected-export/review gate.

## Slice 239 execution record

The implementation adds database schema v6 revision and export-manifest stores,
style schema v4 revision heads, package v3 revision/capture portability, and
the project manager's revision history, comparison, restore-as-new-child,
freeze and verified-download actions. The app only offers capture after the
current style is saved and the existing Style, Check and export gates pass.
The capture stores one selected size plus all seven declared digital artifacts;
its copy states that the capture does not establish physical fit or factory
acceptance. Existing SaveFile/package readers and protected legacy output
baselines remain in place.

The focused S239 command ran seven UI suites: **166/166 tests passed**. The
six revision/package/workflow modules (`project-manager.ts`,
`project-package.ts`, `project-records.ts`, `project-repository.ts`,
`project-workflow.ts`, and `style-revisions.ts`) each measured 100% statements,
branches, functions and lines. The selected seven-suite coverage run itself
returned the repository-wide threshold error because it intentionally omitted
other `app.ts` suites; it reported 52.5% for the whole `app.ts` file. The prior
Slice 238 full-repository report covered the unchanged app paths at 100%, and
the S239 focused report hit every S239-added app statement and branch. Slice
240 still owns the fresh, full-repository 100% threshold gate.

`npm run build` passed (`tsc` and Vite production build). The built app then
passed `electron/verify-style-revisions.cjs` in persistent Chromium 152 and
Electron 44.1.0 profiles. Both environments replayed a Tee and Woven-shirt
style: edit and save, compare revisions, restore older content as a new child,
freeze all seven outputs, save a successor, verify the captured head is its
parent, and confirm all prior revision payloads, packet metadata, artifact
lengths and artifact SHA-256 values remain unchanged. The Tee ended at r4 and
the Woven shirt at r5. The verifier reopens the same profile and downloads the
historical selected-size SVG, matching its captured byte length and SHA-256.
The test explicitly waits for the expected successor count and checks its
parent/value; this guards against an earlier false-positive risk where a stale
count could have let the check return before the new child was saved.

The current machine-readable evidence is
[`evidence/S239-rendered-verification.json`](evidence/S239-rendered-verification.json).
It records the four scenario traces, seven-file manifests and hashes, captured
packet digests, downloaded-byte comparisons, restart IDs, runtime versions,
and the retained rendered screenshots:

- `evidence/S239-chromium-tee.png` and
  `evidence/S239-chromium-tee-frozen.png`
- `evidence/S239-chromium-woven-shirt.png` and
  `evidence/S239-chromium-woven-shirt-frozen.png`
- `evidence/S239-electron-tee.png` and
  `evidence/S239-electron-tee-frozen.png`
- `evidence/S239-electron-woven-shirt.png` and
  `evidence/S239-electron-woven-shirt-frozen.png`

This proof covers normal reload/relaunch in isolated profiles, not browser
eviction, OS crash, power loss, tampering by a local user, signatures,
authorship, approvals, physical fit or factory acceptance. The complete
repository suite, all eight protected-export comparisons, broader accessibility
and responsive review, and independent final audit remain Slice 240 work.

## Delegation assessment

No safe disjoint external implementation packet is available. Revision schema, migrations, optimistic writes, artwork references, package copy-remapping, immutable artifact retention, and UI actions share the same record and transaction invariants. Codex owns implementation and integration for this slice; a later independent read-only review may be requested only if it does not touch shared files or duplicate the active S204/S205 integration task.
