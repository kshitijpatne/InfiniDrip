# EPIC-15 / G02 admission and execution contract

**Status:** Admitted by the maintainer on 2026-09-24 after EPIC-14/G01 closed and merged.
**Epic:** EPIC-15 — G02 Versioned style foundation.
**Admission slice:** Slice 229.
**Current implementation boundary:** Local, deterministic product behavior only. This admission does not authorize a new garment recipe, physical sampling, supplier contact, paid service, hosted feature, or production-readiness claim.
**Conditional target exit:** 2026-12-11, reforecast at each packet exit. This is a planning target, not a release promise or quality waiver.

## Decision and intended result

G02 is admitted as the next product-development goal. It builds the local project and style record that later measurement-first work, technical flats, tech packs, starter designs, and supplier-ready workflows can depend on. G02 must keep the user in control: the app offers explicit creation, switching, editing, restore, and export actions; it does not use a user-facing design agent or silently change a design.

At exit, a user must be able to keep multiple distinct styles in a local project, reopen or recover the intended style, inspect where its values came from, know which derived outputs are stale after a change, make a supported final edit, and preserve or share a versioned project package. Each saved revision must remain distinguishable from later edits. Existing single-style SaveFile data and all existing garment exports must remain readable and behaviorally compatible.

The product remains offline-capable and local-first. G02 adds no login, user profile, cloud sync, hosted database, analytics, remote asset fetch, paid provider, supplier contact, purchase, or physical-validation workflow.

## Verified starting point

The post-G01 merge is on origin/main at merge commit 225d48878ffd85f907f180e17e3b56fb6e829741. G01 is closed at Slice 228. EPIC-15 was Backlog before this admission.

Repository inspection and accepted G01 evidence establish these current facts:

- The app has seven existing recipes. The active in-memory design is one garment and one recipe preset at a time.
- src/ui/persist.ts defines SaveFile version 5. Its JSON holds measurements, fabric, appearance, recipe options, workspace choices, artwork placements, and nesting settings. The longstanding browser key is patternworks_save_v1. Its name is not the SaveFile schema version.
- Deserialization accepts historical SaveFile versions 1–5, applies the existing migration rules, and rejects malformed current-version data. Saving and loading operate on one active workspace.
- Crash recovery is a separate local record with raw inputs and unfinished values. It is not a project history or a multi-style recovery graph.
- Artwork placements are in the style's SurfaceBook; image bytes live separately in IndexedDB for the browser and in the Electron app's local artwork store. A placement refers to artwork by a stable local asset ID.
- Workspace.targetStyle is the selected recipe preset. It is not a user-named product style. G02 must keep those meanings distinct.
- Edit is currently an exploratory, in-memory Piece override. It uses edge-index-derived handle IDs, is discarded when relevant upstream choices change, and is not used by exportPieces. Existing app undo/redo tracks draft input snapshots; it is not a durable pattern-edit history.
- There is no project/style entity graph, project backup/import format, field-level provenance record, dependency invalidation graph, or immutable design revision in the current app.

The detailed seven-recipe field semantics and provenance vocabulary are in the accepted C03 contract. The accepted C04 contract defines the downstream technical record and revision concepts. G02 implements the local foundation only; it does not claim that C03 fields are fit-qualified or that C04 outputs are production-ready.

## Product and data decisions fixed by this admission

1. A project is a local container for user-named design styles. Each style has a stable ID and retains a separate recipe ID and recipe-preset ID. A user-facing style name must never be confused with Workspace.targetStyle.
2. The app's canonical current data is a validated project/style record. Old SaveFile versions remain supported as import/migration inputs. Migration must be repeatable and non-destructive until the new record is safely committed.
3. Each style owns its design values, recipe selection, field observations, local artwork-placement references, recovery state, edit history, and revision lineage. Shared project metadata cannot accidentally overwrite style-specific values.
4. Field meaning and field source are separate. G02 adopts C03's semantic-kind, provenance, evidence-status, and confidence boundaries; it does not invent a confidence score. Preset defaults are not represented as user measurements.
5. A derived artifact may be shown as current only for the exact input and edit revision from which it was built. A change invalidates declared dependents; unrelated artifacts remain current. Missing or conflicting inputs stay visible and block only affected operations.
6. Final edits are deterministic and recipe-owned. Existing freeform editing may be promoted only with stable anchors, declared constraints, explicit invalid-state guidance, and defined behavior for every downstream artifact and size. No edit may be silently clamped or treated as accepted when it violates a recipe constraint.
7. Project import is validated before it changes active local state. A malformed package, missing required asset, ID collision, quota failure, or interrupted write must not leave a half-imported project. Existing artwork IDs and bytes must either be preserved or reported as unresolved; they may not be silently dropped.
8. Revision hashes establish byte/content identity for the declared canonicalization and are not signatures, proof of authorship, or evidence of physical fit.

## Decisions deliberately left for Slice 230

These are implementation choices, not permission blockers. Slice 230 must resolve them from repository behavior, current primary platform documentation, focused prototypes, and adversarial tests before a persistence migration is coded.

| Question | Required resolution |
| --- | --- |
| Canonical local storage | Compare browser IndexedDB, current localStorage, and the existing Electron artwork-store boundary. Select a transactional repository that works in the browser and packaged/local Electron app; document failure and recovery semantics. Do not assume quota or persistence is guaranteed. |
| Record layout and migrations | Define project, style, recovery, field-observation, edit, artifact, and revision records; schema versions; deterministic migration from every accepted SaveFile v1–v5; unknown-field and malformed-record behavior. |
| Legacy compatibility | Decide how the existing Save and Load controls coexist with the project switcher, how an old single-style file is imported, and how an older app version encounters data after upgrade. Preserve a tested path back to the legacy representation without silently losing project-only fields. |
| Artwork packaging | Define how a backup carries referenced bytes, asset IDs, hashes, attribution, missing-asset warnings, size limits, and duplicate IDs. A placement without its bytes must be disclosed and must not masquerade as a self-contained backup. |
| Recovery and storage pressure | Define per-style crash recovery, interrupted migrations, quota failures, backup reminders or warnings, and how a valid last-saved state survives a failed update. Do not claim browser storage is permanent. |
| Field and dependency graph | Convert C03's seven-recipe dictionaries into stable field IDs, observations, and explicit dependencies for pattern pieces, POM/spec, grade, nesting, views, and exports. Add a complete field-to-artifact matrix and prove it with tests. |
| Final edit semantics | Identify stable semantic edit anchors per current recipe; define allowed operations, constraints, units, base-size/graded-size behavior, POM consequences, downstream propagation, conflict/rebase behavior, and undo/redo. A feature with no valid, user-visible behavior for a dependent output is not accepted. |
| Revision identity | Specify deterministic canonical serialization, hash algorithm and algorithm version, parent links, edit/save/import behavior, snapshot immutability, restore behavior, and how stale derived artifacts are represented. A hash is integrity metadata, not approval. |

If a prototype disproves a proposed behavior, stop that behavior within the slice, document the counterexample, and create a numbered remediation or revised contract. Do not weaken export identity, coverage, visible-invalid guidance, or the admitted boundaries to preserve the estimate.

## Ordered slice plan

The baseline is ten implementation slices, plus the admission slice and final review: twelve planned landed slices total. This is the upper edge of the former 7–10-slice estimate once the actual starting code was inspected: the project has no project store, multi-style migration, backup package, field provenance graph, or durable cross-output pattern edit. A separate slice is retained for migration, transactional storage, user workflow, portable backup, each shared field/derivative contract, the edit engine, and immutable revisions because these have different failure and rollback boundaries.

The order below is mandatory. F02 waits for F01's stable record IDs and migration. F03 waits for both the field model and dependency invalidation contract. Final review waits for all three packets. New corrective work receives the next unused slice number and may extend the target; no unresolved gate is waived to hold the estimate.

| Slice | Packet | Scope and exit evidence | Dependency / status at admission | Conditional target |
| ---: | --- | --- | --- | --- |
| 229 | G02 admission | This admission, exact scope, risks, slice sequence, board children, and G02 transition to In Progress. No product-code change. | G01 closed; admitted now. | 2026-09-24 |
| 230 | F01 contract | Choose and prove the local storage, legacy migration, project/style, recovery, backup, artwork, and compatibility contracts. Record baseline behavior, primary sources, failure cases, and prototype results. | Slice 229; F01 In Progress. | 2026-10-02 |
| 231 | F01 record model | Add strict versioned project/style/recovery record types, stable IDs, canonical validation, and pure SaveFile v1–v5 migration tests. Do not remove legacy readers. | Slice 230. | 2026-10-09 |
| 232 | F01 transactional repository | Implement atomic local project/style reads, writes, switching, recovery, interrupted-migration handling, and browser/Electron storage behavior. Keep old saved data until successful migration is verified. | Slice 231. | 2026-10-16 |
| 233 | F01 project/style workflow | Add accessible user-led create, name, duplicate, switch, and archive/restore behavior; persist per-style state and recovery; show unsaved/stale/save-failure states. Preserve recipe preset semantics and artwork references. | Slice 232. | 2026-10-23 |
| 234 | F01 portable package | Export/import a versioned project backup including referenced local artwork bytes, IDs, attribution, and hashes. Validate all entries before atomic import; cover malformed data, collisions, missing assets, cancellation, and quota failures. | Slice 233. F01 exit requires migration, reload, recovery, and backup proof. | 2026-10-30 |
| 235 | F02 field provenance | Implement C03-aligned field definitions and observations for all seven current recipes, separating body, finished, derived, option, and evidence values; source, status, units, and value history remain inspectable and raw invalid input remains visible. | F01 Done. | 2026-11-06 |
| 236 | F02 dependency invalidation | Implement a declarative, tested field/edit-to-artifact graph. Show exactly which pattern, POM/spec, grade, nest, view, and export outputs are stale after each change; unrelated outputs remain current. | Slice 235. F02 exit requires the complete seven-recipe matrix and change/reload tests. | 2026-11-13 |
| 237 | F03 constrained edit model | Define stable semantic edit anchors and typed operations for every current recipe; enforce recipe-owned geometry, join, fold, and size constraints; define undo/redo and explicit conflict/rebase handling. Invalid edits stay visible and are never silently clamped. | F02 Done. | 2026-11-20 |
| 238 | F03 cross-output editing | Promote supported Edit operations into each style record. Re-draft all dependent pieces and update pattern, POM/spec, grade behavior, nesting, views, and exports or visibly block only unsupported dependent outputs. Prove durable undo/redo and SaveFile/project migration behavior. | Slice 237. | 2026-11-27 |
| 239 | F03 immutable revisions | Add immutable parent-linked snapshots with versioned canonical hashes, restore/compare, frozen export manifests, and checks that old revisions and their evidence never move when a new edit is made. | Slice 238. F03 exit requires the end-to-end replay on simple and complex styles. | 2026-12-04 |
| 240 | G02 final review | Reconcile every acceptance criterion; remediate findings with new numbered slices; run full coverage, build, export identities, browser and Electron persistence/restart checks, accessibility/responsive checks, and actual output replay; publish an evidence-linked exit and close EPIC-15 only after every child is Done. | F01 → F02 → F03 complete. | 2026-12-11 |

The dates assume one Codex integration lane and roughly 2–4 focused engineering days per implementation slice, with additional time for migration and browser/Electron verification. They are forecasts only. F01, F02, and F03 must each be re-estimated at their accepted exit; G03 and later goal dates remain unchanged until G02 is actually closed, when their dependencies are reforecast.

## Acceptance gates

### F01 — local project/style foundation

- A user-created project contains at least two differently named styles with stable, distinct IDs and independently persisted garment, recipe-preset, measurement, option, appearance, surface, and nesting state.
- The same style and correct active selection survive app reload and a restart of the actual local/Electron app. Recovery for one style cannot overwrite another.
- Every accepted SaveFile version 1–5 imports through tested migrations. Valid old user data survives; corrupt data remains available for diagnosis/recovery and is never silently replaced with defaults.
- Exported project packages can be imported into a clean local profile with referenced artwork bytes, IDs, and provenance intact. Invalid packages cause zero partial writes.
- Browser storage and Electron local storage failure, quota, interruption, backup, restore, and artwork-missing cases have explicit user-facing outcomes. No promise of permanent browser storage is made.
- The old SVG, DXF, tiled PDF, A0, projector, surface-sheet, and draft tech-pack paths remain unchanged for unchanged legacy inputs.

### F02 — source-aware fields and dependency invalidation

- Every supported recipe's fields have stable IDs and C03-aligned semantic kind, provenance, evidence status, unit/reference semantics, and declared dependencies. Defaults are presets, not measurements. Confidence remains not assessed unless a validation basis exists.
- User edits and imports create value history. A saved old revision's observations do not change when the current value changes.
- For each field and each supported edit, a matrix shows affected and unaffected outputs. Every affected derived result is recomputed or visibly stale; unrelated results do not become stale.
- Missing, conflicting, invalid, inherited, and unresolved values are distinct and actionable. No code invents a user measurement or silently clamps a value.

### F03 — durable final edits and revisions

- The final edit operation uses stable semantic IDs, not edge-array positions that can silently point at a different geometry after redraft.
- Each operation declares units, supported recipe/size scope, preconditions, postconditions, downstream dependencies, and a deterministic correction or undo path.
- Valid edits survive project save/reload, backup/import, undo/redo, and restoration of an earlier immutable revision. Invalid edits remain visible and do not emit misleading current outputs.
- A fixed edit/revision trace is replayed against at least a simple Tee and a complex Polo or Woven shirt. It compares pattern geometry, POM/spec, grade, nesting, relevant views, tech pack and cutting exports, saves/reloads, and frozen hashes.
- Current export baselines remain byte-identical for unchanged legacy fixtures. Changed edit-enabled outputs receive new behavior-specific tests, not rewritten legacy baselines.

### EPIC-15/G02 final exit

- F01, F02, and F03 work items are Done with hash-verified, non-incomplete evidence and ordered status history.
- The 100% statement, function, branch, and line coverage thresholds remain intact; the full suite and strict production build pass.
- All eight protected legacy export identities remain unchanged.
- Project switching, migration, restore, and output behavior are exercised in a live browser. Electron-specific local persistence is checked in an isolated profile; tests alone do not stand in for rendered/restart evidence.
- Full residual limits, actual completion date, conditional downstream dates, and the distinction between digital integrity and physical fit are recorded in the exit report.
- EPIC-15 remains open until the validated Control Center records all children Done with evidence, its summary Epic is updated, and the reviewed branch is merged to origin/main.

## Boundaries and residual risks

| Risk | Known evidence | Required treatment |
| --- | --- | --- |
| Local data durability | Current browser data is origin-scoped; Electron uses Chromium storage plus a separate disk-backed artwork bridge. Quotas and eviction can differ by browser/profile. | Slice 230 selects a cross-runtime repository and records non-destructive failure/recovery. Backup export is required; storage success is never described as cloud backup. |
| Artwork separation | Placements and file bytes are stored separately today. | Every save, migration, duplicate, backup, import, and restore path checks references against actual bytes. Missing bytes are visible. |
| Preset name collision | Current targetStyle selects a recipe preset. | User style ID/name and recipe preset ID remain different typed fields in storage and UI. |
| Measurement meaning | C03 documents that current shared Measurements mixes body measures, finished values, style parameters, and derived values. | Reuse the accepted C03 dictionary; do not recast old numeric data as measured wearer facts. |
| Geometry edit propagation | Current Edit is a single transient piece preview and does not reach exports. POMs are recipe-authored measurements over drafted blocks. | F03 must prove semantically constrained integration and exact downstream handling. If a POM, grade or export cannot be recomputed truthfully, mark it stale/block it and scope a correction; never export an inconsistent style as current. |
| Hash semantics | JSON object insertion order and incidental metadata can create different byte streams for the same logical record. | Define and test versioned canonicalization before hashing. Hashes do not authenticate a person or validate fit. |
| Estimate pressure | F03 crosses shared drafting, POM, grade, nesting, rendering, and export code. | The 12-slice plan is a baseline. Test failures, unexpected topology, or incomplete all-recipe behavior receive new numbered work; dates move before scope or gates are weakened. |

## Model, ownership, and parallel boundaries

Codex owns the project/style schema, migration, persistence, provenance contract, dependency graph, edit semantics, shared output integration, Control Center, and final acceptance. Routine implementation should use the repository's default Codex model/reasoning guidance; a short Sol or Terra high/extra-high review may be used at a specific persistence, migration, invalidation, or immutable-revision gate when available. No Astra or max-reasoning routine pass is needed.

No safe independent implementation packet is admitted in Slice 229: persistence, stable IDs, migration, and board ordering share a single architecture decision. Later slices must re-evaluate disjoint test-fixture, accessibility, or export-inspection work under docs/OPENCODE-WORKFLOW.md. Any contributor work uses a separate worktree and Codex review; no shared-file parallel edits are allowed.

