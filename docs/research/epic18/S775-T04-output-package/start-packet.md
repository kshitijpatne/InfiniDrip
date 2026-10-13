# Slice 775 — additive production-pack outputs and import preview

**Status:** started 2026-10-13 05:22:28 UTC. **Branch:**
`codex/epic-18-g05`. **Worktree:**
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.

## Verified starting checkpoint

- Starting commit: S774 `56a50ab39eb0f11051138ff9909afe9035fb9da2`
  (`Slice 774: decide T04 format and admit UIQ-10`).
- Fresh `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an
  ancestor of the branch. The worktree was clean at start.
- Highest assigned slice before this start: 774. S775 is the unique next
  number on both the branch and `origin/main`.
- Canonical board revision 4621: G05-T01/T02/T03 Done; G05-T04 and EPIC-18
  In Progress; G05-T05 and G05-EXIT Backlog; UIQ-10 Backlog with its separate
  S774 admission; UIQ-09 Backlog behind EPIC-19.
- EPIC-18/G05 is explicitly admitted. The active S765 resequencing makes
  S775 additive PDF/structured output plus actual-file and round-trip proof;
  S776 is the separately admitted UIQ-10 presentation. No admission is
  inferred from a roadmap row.

## Exact scope

Add the deterministic standalone production-pack PDF and `.techpack.zip`
exchange format selected in the S774 decision record. Consume only a verified
committed style revision and its strict `TechPackRecord` v1/v2/v3 snapshot.
Return the generated PDF and ZIP bytes plus a presentation-ready output model;
this slice does not add UI controls.

Implement a bounded, read-only `.techpack.zip` import preview. Resolve the
manifest's base identity against verified local revision history, strictly
parse the editable record, verify the PDF and attachment hashes, and report a
deterministic field-level diff. An unchanged round-trip has no diff and no
candidate to save. An edited, valid, non-stale record yields an explicit
DRAFT candidate only after caller-supplied existing semantic validation. A
stale head or missing validation context remains read-only. The module never
creates a revision, writes local storage, stages artwork, or trusts imported
approval; an eligible candidate can be sent explicitly through the existing
`saveActiveTechPack` revision path by a later caller.

The writer must use the exact S774 entry names and order, UTF-8 full-record
JSON, fixed ZIP timestamps, canonical manifest JSON, safe attachment names,
and its section matrix/presets. Export is bound to the exact current head and
verified revision digest. The PDF lists omitted sections and always retains
identity, source/open-item and approval/disclaimer content. The JSON always
contains the whole record.

## File ownership

- Add `src/ui/tech-pack-output.ts` as the sole production module for section
  selection, revision-bound PDF/ZIP creation, bounded ZIP parsing, semantic
  import preview and field diffs. It may use `fflate`, the existing PDF
  assembler, strict tech-pack parsers and existing revision verification.
- Add `src/ui/tech-pack-output.test.ts` with focused tests for every production
  branch and 100% statement, branch, function and line coverage of the new
  production module. Tests must parse actual generated PDF/ZIP bytes, including
  deterministic repeat output, all presets, round-trip/no-op, edited and stale
  preview, attachments, bad hashes, unsafe/duplicate/unexpected ZIP paths,
  size/count limits and invalid schema/identity.
- Add the S775 start, exit and post-replay records under this directory and
  validated Control Center command files under `docs/planning/`.
- At the S775 boundary, update `PROJECT-STATE.md`, `ARCHITECTURE.md`,
  `CONTEXT-INDEX.md`, `docs/planning/EPIC-18-GOAL.md`,
  `docs/planning/EPIC-18-S765-RESEQUENCING.md`, and the canonical board through
  validated commands.

No production edit is admitted to `src/export/techpack.ts`, the project-backup
`src/ui/project-package.ts`, `src/ui/style-revisions.ts`, T01/T02/T03 record or
editor modules, `src/ui/app.ts`, `src/ui/project-manager.ts`, freeze manifests,
recipe/pattern/grading code, protected baselines, package dependencies, or
UIQ-10 presentation. Do not add a new import/apply control; UIQ-10 owns its
separately reviewed presentation adapter, while this slice provides APIs and
actual-file proof.

## Acceptance and gates

1. Reject export unless the supplied immutable revision parses and verifies,
   its full tech-pack record matches the revision payload, and its revision ID
   equals the supplied current head. Missing, stale, mismatched and malformed
   inputs give actionable errors without saving a revision.
2. Generate actual `.pdf` and `.techpack.zip` bytes for synthetic, clearly
   labeled Tee and Woven Shirt records. Parse the PDFs and inspect each named
   ZIP entry; prove exact byte repeatability for identical immutable inputs.
3. Exercise Complete pack, Materials + construction and Measurements + QA;
   always include identity, sources/open items, approval/disclaimer, and keep
   every JSON field regardless of PDF selection. Preserve unresolved,
   conflict, source and approval-scope labels; do not infer garment facts.
4. Verify only explicitly referenced local artwork attachments are included,
   with safe paths and exact revision-bound byte digests. Import never mutates
   the local artwork store.
5. Enforce 256 MiB compressed and expanded archive limits, 128 attachments,
   131 entries, and 32 MiB each for manifest and editable record JSON. Reject
   unsafe, duplicate, unexpected, unsupported-compression and truncated ZIP
   members before returning an import candidate.
6. Import must resolve the base against verified local history and verify
   immutable PDF/attachment bytes, strict record schema, and exact style,
   recipe, version, revision ID/number and base digest. Editable JSON is not
   byte-hash-gated. Return field-level changed paths; stale head and missing or
   invalid semantic validation block apply. An authored change resets review
   to DRAFT with no approved scope; no-op produces no candidate/revision.
7. Run focused tests with 100% four-metric coverage for the new module,
   TypeScript build, protected export identity regression (all eight hashes),
   Control Center suite and `git diff --check`. Inspect PDF/ZIP actual output.
   Do not run the integrated global/browser/Electron gate early; S780 owns it.
8. Do not change the EPIC-18 admission or S774 decision. Preserve all seven
   supported recipes, local/no-cost constraints, and the physical, supplier,
   sewing, fit and production-claim holds.

## Risks and unresolved facts

- Existing PDF assembly uses a constrained text encoding; the structured JSON
  remains the exact UTF-8 record. The PDF must label all values faithfully and
  keep omitted sections/open items visible; no source values may be altered in
  the record.
- S775 does not itself have a UI import route. Its preview API must fail closed
  when the caller cannot provide the current local head or existing semantic
  validation; S776 consumes only the admitted output model/section callback.
- Package hashes detect accidental edits but do not authenticate a publisher.
  No signature or supplier-acceptance claim is in scope.
- ZIP sizes can consume substantial memory. Check archive bytes and bounded
  expanded totals while streaming; do not use an unbounded unzip-all path.

## Parallel work and exit

No safe disjoint implementation remains: PDF, ZIP, revision identity,
import-preview behavior and section content share one output contract. Codex
owns implementation, focused verification and final diff review. External
agent and maintainer-decision waits start at zero.

Exit only when every acceptance item above passes, the actual files and
round-trips are retained, focused coverage is 100% on all four metrics for
the new production module, board/document state names one verified next action
(S776 only after output proof), and one `Slice 775:` commit is created. If a
gate fails, preserve the output and use the next unique slice for remediation.
