# UIQ-10 admission — production-pack presentation

**Status:** separately admitted for Slice 776; implementation has not started.
**Prepared:** 2026-10-13 under S774. **Board:** UIQ-10 remains Backlog at the
S774 admission boundary and will move only at its validated S776 start.
**Parent:** EPIC-18/G05 T04, with exact format/data decisions in
`docs/research/epic18/S774-T04-format-and-UIQ10-admission/decision-record.md`.

## Authority and dependencies

The maintainer admitted EPIC-18/G05 at Slice 762 and requires UIQ-10 to receive
its own bounded packet after accepted T01–T03 contracts. Board revision 4611
records G05-T01, T02, and T03 Done. S774 freezes this presentation boundary,
but the work must wait until Slice 775 has generated and verified the additive
production PDF and `.techpack.zip` contract. UIQ-10 stays a linked EPIC-18
child and must be Done before Epic closure. UIQ-09/EPIC-19 is separate and
unchanged.

## Goal and boundary

In Slice 776, present the revision-bound production pack as readable
forms/tables, expose the exact revision and scoped review state, and let the
user choose the admitted section presets for preview. The view is
presentation-only: the Slice 775 writer owns output generation, and the
existing T01/T02/T03 editors own record changes. No new record fields,
calculations, approval behavior, import/export format, revision logic, freeze,
schema migration, supplier flow, or legacy-PDF change is admitted here.

## Exact inputs

- The existing strict `TechPackRecord` versions 1–3 from
  `src/ui/tech-pack-records.ts`, including T01 values and optional T02 POM/
  sample-QA and T03 operation records.
- The committed style/revision identity from the existing revision record and
  the verified S775 output model: style ID, recipe ID/version, revision ID/
  number, `revisionContentDigest`, selected section IDs, and source/open-item
  findings. Do not synthesize an identity from the currently selected recipe.
- The S775-generated PDF and local attachment manifest/bytes for exactly that
  revision. If the S775 API changes, stop and route a separately reviewed
  packet amendment; do not duplicate writer or package parsing logic in UIQ-10.
- The existing approval state and `scopeFieldIds`, shown only when its
  `revisionId` matches the displayed committed revision.

## Exact file ownership for S776

Codex owns the complete integration. The only planned production files are:

- Add `src/ui/tech-pack-presentation.ts` and its colocated
  `src/ui/tech-pack-presentation.test.ts` for a pure read-only semantic view
  model/renderer that consumes the S775 output model.
- Add `src/ui/enhancements/tech-pack/tech-pack-presentation.css`, scoped under
  one presentation root class; import it in `src/ui/view.ts`.
- Make a minimal, named mount/section-selection adapter in `src/ui/app.ts` at
  the existing whole-run Tech Pack/output surface and add its integration
  coverage in the existing `src/ui/app.test.ts`. The presentation module does
  not read IndexedDB, alter `ProjectManager`, or create revisions.
- Save actual generated-file/viewport review in
  `docs/research/epic18/S776-UIQ-10-presentation/rendered-review.md`; record
  source-test/coverage evidence with that packet.

Files explicitly outside UIQ-10 ownership include
`src/ui/tech-pack-records.ts`, all POM/T03 schema/validation/editors,
`src/ui/style-revisions.ts`, `src/ui/project-package.ts`,
`src/export/techpack.ts`, the S775 writer/importer, T05 freeze/manifest logic,
recipe/pattern/grading calculations, protected export fixtures, and
`package.json`. If the presentation cannot be built within these boundaries,
keep UIQ-10 Backlog and request a separately numbered scope decision.

## Required presentation and fallback behavior

- Show style/recipe and revision identity; only show approval state/scope for
  the exact revision. Label the PDF as a generated snapshot and preserve
  source/provenance labels, unresolved reasons, conflicts and next actions.
- Render all supplied form-like groups and tables in the selected sections;
  do not recalculate, normalize, clamp, hide empty/unknown values, relabel a
  user choice as sourced, or imply a supplier/production acceptance.
- Support **Complete pack**, **Materials + construction**, and **Measurements
  + QA** presets plus per-section toggles through the S775 writer callback.
  Always keep identity/revision, source/open-items and approval/disclaimer
  sections visible. The UIQ-10 layer chooses sections and renders returned
  output; it does not implement PDF/ZIP serialization.
- Test actual S775 outputs for Tee and Woven Shirt at 390×844 and 1280×800.
  Review the PDF and structured file content, confirm section selection,
  overflow/readability, focus order/keyboard operation, and exact revision
  linkage in a real browser. Store the selected screenshot/inspection evidence
  with the rendered-review record.
- If no committed revision/output exists, or it does not match the current
  style head, show an explicit unavailable/stale message and next action. Keep
  existing editors and exports usable; never show an earlier pack as though it
  belongs to the current revision. A malformed package leaves existing state
  unchanged.

## Acceptance and verification

- Focused tests exercise every conditional/rendering branch and achieve 100%
  statement, branch, function and line coverage for each changed production
  module. TypeScript passes. Exercise safe empty, all sections, custom section,
  unresolved/conflict, approval mismatch, stale revision and output-error
  cases.
- Actual rendered review uses the S775-produced Tee and Woven Shirt outputs,
  not markup snapshots alone; verify 390×844 and 1280×800, no horizontal
  overflow, readable tables, selected sections, preserved unknowns, and
  revision/approval wording.
- Protected export byte identities remain unchanged. Do not run the global
  gate here; S780 runs the settled integrated full test suite at 100% global
  coverage plus build, Control Center, readiness, browser/Electron and actual
  output replay.
- The S777 review checks field-level diff, numeric reconciliation, scoped
  approval and both styles before it closes UIQ-10 and G05-T04. Merge remains
  gated through S780/S781 evidence.

## Risks, non-goals, and delegation

The greatest risk is a stale or partial style snapshot being displayed as a
current production specification. Bind every view to S775's immutable revision
identity and reject mismatches. Missing local artwork must remain visible;
never fetch remotely. Synthetic display records must be labeled as synthetic
and must not be presented as sourced garment construction.

No supplier contact, purchase, paid dependency, cloud feature, new recipe,
physical sewing/fit, factory acceptance, compliance claim, or production
readiness is in scope. No safe independent file ownership remains after the
view, selection callback, revision badge, and review evidence are considered
together; Codex retains integration and final review.

## Slice and exit plan

- **S774:** select T04 format/import contract and admit UIQ-10. Complete; this
  packet is the UIQ-10 admission evidence. UIQ-10 stays Backlog.
- **S775:** implement and inspect standalone PDF plus revision-bound editable
  ZIP output and round-trip. UIQ-10 cannot start before its actual output and
  API evidence passes.
- **S776:** implement only this presentation boundary and pass focused,
  rendered and protected-export gates.
- **S777:** compare two styles, review numeric/field diffs and scoped approval;
  close UIQ-10 and G05-T04 only after both acceptance packets pass.
