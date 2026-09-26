# EPIC-15/G02 — Cross-output semantic editing (Slice 238)

**Status:** Implemented and verified locally; Slice 238 evidence packet.
**Dependency:** Slice 237's accepted semantic-anchor and constraint model.
**Owner:** Codex integration lane. No safe disjoint contributor packet was found.
**Boundary:** Local, deterministic user-authored editing across the seven
existing recipes. No new recipe, fit claim, physical sample, supplier flow,
paid or hosted service, or production-readiness claim.

## Outcome

An Edit operation belongs to the active style, survives Save/Load, project
switch, crash recovery, and portable project backup, and is the same geometry
used by the pattern, spec/POM, grade, nesting, relevant views, tech pack,
projector and cutting exports. Invalid, stale, unresolved, or unsupported output
is visibly gated. Undo and redo preserve semantic operations as atomic user
actions. The existing no-edit path remains byte-identical for the protected
legacy exports.

## Decisions resolved before implementation

1. **One durable source of truth.** Add a nullable `semanticEdits` section to
   SaveFile v6 and RecoveryFile v2. `null` means no authored final edits.
   Project styles carry that SaveFile section; per-style recovery carries the
   same operation document. Do not keep a second editor-only shape override.
2. **Strict versioning and non-destructive upgrades.** Style records advance
   from schema 2 to 3, recovery records from schema 1 to 2, and IndexedDB from
   version 4 to 5. Version-1–5 SaveFiles, style-schema-1/2 records, recovery-
   schema-1 records, and project-package versions 1/2 remain importable. Old
   records migrate to `semanticEdits: null`; unknown, malformed, or partially
   migrated records abort the transaction and leave the old database intact.
   The project-package envelope stays version 2 because its manifest fields do
   not change; nested record schemas carry the edit-state version.
3. **Fresh-source conflict detection.** Every evaluation hashes the exact fresh
   unedited base `Block` plus the active recipe's displayed measurement fields
   and recipe options. The persisted document also stores that source-input
   snapshot. Any change to those inputs requires an explicit rebase before a
   saved edit is treated as current. Rebase preserves deltas only when the
   recipe-owned semantic anchors still resolve. A fingerprint never substitutes
   for a revision or physical validation.
4. **One evaluated grade run feeds outputs.** Evaluate the edit document once
   against the recipe's registered sizes. Output helpers select the validated
   size block from that result; they do not independently replay a transient
   editor `Piece`. A blocked selected size cannot produce single-size files; a
   blocked member blocks any whole-run output that includes it. The UI names
   the affected size and correction.
5. **Edit operations.** Every recipe role is selectable. Stable corner and
   curve-control anchors produce exact-centimetre delta operations. Pointer
   drag commits one atomic operation on release; keyboard coordinate changes
   commit one operation per completed field change. Existing topology-changing
   dart-transfer/truing controls remain unavailable as final edits because the
   Slice 237 operation schema cannot represent them; the UI states that
   limitation instead of implying they are saved. Existing input undo/redo is
   unchanged; Edit's own undo/redo controls the semantic-operation history.
6. **Woven hem turn.** `hemTurn` is the lower body-piece turn-under allowance,
   not a change to the sewing line or finished POM. Apply it to the woven shirt
   front and lower-back hem cutting edges only. Keep sleeve-band/top edges at
   their existing allowance. The default `1 cm` must produce byte-identical
   output. A non-default value must propagate through the cutting outline,
   pattern and cut-line views, layout/nesting, SVG, DXF, tiled/A0 PDF, projector
   where it displays a cut line, and the tech-pack allowance/callout. Sewing-line
   POM and garment grade dimensions remain unchanged and are identified as
   such in the field-impact explanation.
7. **Tank shoulder width.** Do not invent a body-shoulder-to-tank-strap formula.
   The accepted tank research defines `strapWidth` as its own user-selected
   finished span from neckline edge to armhole start; sources do not establish
   a numeric conversion from body `shoulderWidth`. Preserve that distinction.
   A shoulder-width edit updates the stored/graded body measurement and the
   body/check guidance, while the tank pattern remains governed by `strapWidth`.
   The field-impact notice must state the specific correction: review or change
   `strapWidth` to change the strap/armhole pattern; unchanged geometry is not
   evidence of fit. Because the measurement is included in the semantic source
   snapshot, existing authored edits require explicit review/rebase after it
   changes.

## Implementation contract

### Model and input boundary

- Advance the semantic-edit document/operation schema for source-input snapshots
  without changing the operation's exact delta semantics. Strict parsing checks
  exact keys, finite values, recipe/role/anchor identity, source-token format,
  unique operation IDs, history bounds, and operation-to-document fingerprint
  consistency. Invalid geometry remains a correctable candidate; malformed
  operation data is rejected.
- Recompute SHA-256 from the current recipe ID, exact base draft, and only that
  recipe's visible measurement and option values. Do not read the previous token
  as proof that the current source is unchanged.
- Expose source-input differences to the Edit view. A stale document offers
  explicit rebase, reports changed fields, and keeps dependent outputs blocked
  until rebase and all-size validation finish. A missing/changed anchor remains
  a conflict with an actionable reset/re-author path.
- A semantic operation may affect all registered sizes. Validate every size
  with the existing fold, closure, crossing, stitch, recipe-check, and POM
  guards before marking that size current.

### Persistence and migration

- Serialize `semanticEdits` on current SaveFile and recovery payloads; all old
  versions normalize to `null`. Keep malformed-current-version handling strict.
- Style schema 3 and recovery schema 2 validate the nested current payload.
  Parse supported older nested schemas by explicit migration, never by dropping
  unknown edit data. A malformed old record fails with a visible storage error.
- IndexedDB v4→v5 migrates styles and recoveries in the upgrade transaction.
  Validate each old record before update; any cursor error or invalid record
  aborts the whole upgrade. Add tests for empty stores, populated stores,
  already-current records, invalid records, rollback, and reopen/idempotence.
- Portable package v1/v2 import normalizes old nested records to the current
  schema after validating the digest over the original manifest bytes. Current
  package export/import round-trips operation order, history, source snapshot,
  and asset references without changing artwork bytes or IDs.
- Legacy single-style storage and the old Save/Load controls serialize the
  current operation state. Project Save, style duplication/switch, recovery,
  and package export all consume the same validated `SavedDesign` value.

### Editor and output pipeline

- Replace `editedFront` as the authoritative state with the active style's
  semantic document plus a temporary in-progress pointer gesture. Map a handle
  to its anchor by the role and adjacent recipe edge names, not by persisting an
  edge index. Resolve each gesture from the displayed candidate and append one
  atomic delta when it commits.
- Provide a role selector, stable-anchor coordinate labels, Reset-to-parametric
  (clear operations), Undo, Redo, explicit Rebase, pending-validation state,
  source-conflict state, and per-size issue details. Keep invalid operations
  visible and undoable while gating every affected output.
- Use one `evaluatedGradeRun()` / `evaluatedDraftAtSize(step)` path for pattern,
  size run, POM/spec, nesting, tech pack, projector and single-size exports.
  Recompute derived output from the exact evaluated size block. Surface-art
  sheet stays independent. Preserve all export writers and default-input
  identities.
- Add piece-specific allowance resolution so woven body hems can use the
  selected `hemTurn` without changing the same-named sleeve edge. Keep all
  legacy allowance specs with no piece-specific map behaviorally identical.
- Update the dependency matrix and copy: woven `hemTurn` becomes represented in
  cutting outputs while finished sewing-line POM/grade remains independent;
  tank `shoulderWidth` is an explicit measured-input/design-parameter boundary,
  not an undocumented pattern dependency.

## Required verification

1. Strict unit coverage for semantic state parse/serialize, stale-source
   detection, exact input snapshots, rebase conflicts, role-specific anchors,
   drag/keyboard atomicity, undo/redo, all-size validity and invalid-source
   gating.
2. Migration and package pressure tests for SaveFile v1–v6, style schema 1–3,
   recovery schema 1–2, IndexedDB v1–v5, and package v1/v2. Confirm corrupt
   records abort without losing original data and existing artwork bytes/IDs.
3. Cross-output edit replay on a simple Tee and complex Polo or Woven shirt:
   compare piece geometry, POM/spec, every grade, nesting, views, tech pack,
   projector and all cutting exporters before/after edit. Reopen and confirm
   bytes/content and undo/redo state survive.
4. Woven-shirt allowance tests prove a non-default hem turn changes only the
   front/back body lower cut edges and all corresponding cutting outputs; sleeve
   edge remains fixed; default `1 cm` output equals every protected baseline.
5. Tank shoulder-width tests prove changed values are visible in graded body
   measurements and check/body guidance, do not silently alter strap geometry,
   and tell the user to review/change `strapWidth`; with an edit document, the
   source change requires the explicit rebase/review path.
6. Actual rendered Chromium and Electron-profile proof: create and move a
   semantic anchor, inspect its current and invalid states, Save, reload/restart,
   verify style scope and recovery, compare output hashes, rebase after an input
   change, and confirm rejected output cannot download. No test-only claim.
7. Focused changed-module coverage stays at 100%; do not move the eight
   protected export baselines. Full repository coverage/build and the final
   independent-style end-to-end gate remain Slice 240.

## Implementation and verification evidence

The Slice 238 implementation is complete. Semantic edit operations now live
with the active style, survive Save/Load, project/style switching, recovery,
and portable package export/import, and are re-evaluated against a fresh source
snapshot before output. SaveFile v6 and RecoveryFile v2 carry the document;
style schema 3 and recovery schema 2 validate it; IndexedDB v5 migrates older
records atomically. The existing package envelope remains v2 because its
manifest did not change. Historical SaveFiles, style/recovery records and
packages migrate explicitly; malformed current or legacy records remain
fail-closed.

The selected piece, its semantic anchors and coordinate controls share one
style-owned operation document. An in-progress pointer drag is transient and
commits as one delta; keyboard changes commit on field completion. Undo/redo,
clear, explicit rebase and source-conflict states operate on semantic history.
Every registered size is checked before outputs are considered current. A
source-input change requires explicit rebase; invalid or stale operations pause
affected outputs and the export writer independently rejects a bypassed UI
gate. Recipe roles without a usable piece and unrecognized measurement-to-size
matches fail safely rather than inventing a fallback geometry or size.

Pattern, grade, POM/spec, nesting, relevant views, tech pack, projector and
cutting exports now consume the evaluated size block. Woven-shirt `hemTurn`
changes only the front and lower-back body cutting allowances, keeps sleeve
allowance and sewing-line POM independent, and reports those dependencies.
Tank body `shoulderWidth` remains separate from pattern `strapWidth`; guidance
names the strap-width control to edit and warns that unchanged geometry is not
fit evidence. The no-edit/export baselines were not moved.

The complete suite passed **123 test files / 1,781 tests**. The repository
coverage gate passed at **100% statements, branches, functions and lines**.
TypeScript, production build and Electron main-process type checks passed as
part of `npm run electron:verify-semantic-edit`.

That verifier exercised the production-built app in headless Chromium
151.0.7922.34 and Electron 44.1.0 / Chromium 152.0.7977.65. It created a style,
made and saved a semantic coordinate edit, exported six real files, created a
blank second style to verify edit isolation, reloaded the saved edit, wrote a
second operation to recovery, exited and restarted with recovery pending,
restored both operations, changed a source measurement, verified stale outputs
could not download even when the disabled control was activated in script, and
explicitly rebased. The Electron native SVG output SHA-256 was identical before
and after restart. The controlled Electron process exit verifies pending
recovery on restart; it is not a power-loss, operating-system crash, or torn
IndexedDB transaction test.

A second Chromium trace selected the Woven shirt through the garment control,
selected Cotton woven in the material control, and used the actual paged
construction controls to change `hemTurn` from 1 cm to 2 cm. The six exported
files each changed. A subsequent 0.1 cm edit to the front neckline curve
control was saved and all six files changed again. The retained screen shows
the real Edit view and the Woven shirt outline with the selected semantic
anchor; it is not a fit or drape image. The corresponding SHA-256 is
`907d65c2abbc5f1254b9011c17d3ea28f16cb322ec4df299361e1697218f5ef5` at
[`evidence/S238-woven-semantic-edit.png`](evidence/S238-woven-semantic-edit.png).

| Woven-shirt size-M output | Default 1 cm hem turn | 2 cm hem turn | 2 cm hem turn plus saved semantic edit |
| --- | --- | --- | --- |
| SVG | `03a41cee01fcb57934cc2f4342a89dc62bda827a69fb275dc569f37b561ae2de` | `5b36c2d365b4ed9bfd13522dd9eb4f452096a4d26ee2cbbb4cafb6c53c5846d3` | `b9e18f30a7e1df93cd79d35740ac73952823d4bc38ea9b6f96b4dbe8a051d8b9` |
| DXF | `9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5` | `9e7790a8384f27d7dae40b5a9e98c0b3e253c4d6c7e56a1e2913176f51bdb1a4` | `4e8b809730e20161c4c19c5181b9fe17c258963067d4f9894f8cf3e42f9caf19` |
| Tiled PDF | `4e65445633ec512c24b407655db84635b1861f8bbcde5349085eb166dec2681d` | `644dbeef15f1d0c692aff017fed12fb6cb5c5280f91f6cc47fb8bb6681b3901c` | `450ae92cbbbd7da222c914405df3849d31d8aafeab09ca846d7274e95e2a26f7` |
| A0 PDF | `38808fdc0e88df5bc14d4bc36bf345a01937c274a4b970c65db8c7440560ef52` | `8ec692f77590711b990a474e5e7bdae69862f92502a099520af35e35d77eccc9` | `064cfbce40c09c8b250873129250717cc3dff7291f05f807b30ce707a8c022d4` |
| Tech-pack PDF | `eac01148412047817074180ae1d7e44ec1bb05167de53923e93c15c38038dfad` | `fe3ff532945078a27c8a0355c0fa1cf14607b7e6c78f11fa74a0070ba54c9a6b` | `0823f44fcfe0880245d0fa02b823878de8a4e8e1e38b004c6ff0bc968689f7a8` |
| Projector SVG | `8d187e40d9d724408dfeeec3334064f6f934113789b61622bd914d017a450f96` | `3875203ea9cca99a230372658d9f4f840acb563f87b4af4a86594d63d4141377` | `f8b2d5ba022ee50b2832f5d9cca7d081a892da7fec6bc63099e42acb4de42df8` |

| Output | Untouched Chromium baseline SHA-256 | After semantic edit SHA-256 |
| --- | --- | --- |
| Tee base-size SVG | `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d` | `884d59e13d731567bc37f5d7741693541b50746c1c9cd4d27850a986eca22453` |
| Tee base-size DXF | `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9` | `a787e6dd743686dbbf3e44cdd1c9a7e94e830de763257641cff0a9b0d05fbee4` |
| Tee base-size tiled PDF | `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523` | `009bf4be8e28a6d774f7397a09d0ff8ea6fe4bae40a56b22e84b6fa16385b72b` |
| Tee A0 PDF | `2b4561a1de275ccaf3d07f900aba827880a33ae5ec7cece3f678c1a2e1e05177` | `fe41a2ee7d546c6c60d54dd3e3254a8b5e4ca570e9382d079a923b575d98d2bb` |
| Tee tech pack | `73e1f80e0cf31b61d72360254490eb69aaa7e43825824fe384acfa59135051b8` | `0b3b96fce029ae803dc0b77815700b6c0389f55253c195fb4f4a4aabec990a8a` |
| Tee projector SVG | `6e74f535d8fe7c011cc33a4949040cba1bd3e0e4c9bf84f46c0b5538448b3d83` | `9e58632f7d50c0355e9631fa0407f909eed9f24c2bfba6243ce4cdc063da5542` |

The Electron SVG digest before and after restart was
`884d59e13d731567bc37f5d7741693541b50746c1c9cd4d27850a986eca22453`.
Generated output files and disposable browser/Electron profiles were removed
after the run; the tables preserve their digests. This is digital evidence for
the tested Tee and Woven-shirt routes, not independent proof that every
recipe/fabric physically fits, that every industrial CAD package round-trips
these files, or that a factory will accept them. Slice 239 still owns immutable
revision snapshots and hashes, and Slice 240 owns the complete independent-
style exit review.

## Delegation and stop conditions

No safe independent implementation or review packet exists: the document
schema, database/package migration, editor operation state, grade evaluation,
allowances, export gates, and recovery all cross the same style/output contract.
Codex owns the whole slice and must review the actual diff, migration rollback,
rendered UI, and generated outputs. If exact persisted state cannot be migrated
or an exporter bypasses the evaluated grade run, stop that pathway and keep its
outputs visibly blocked; do not weaken strict parsing, coverage, protected
bytes, or S239/S240 gates to complete the slice.
