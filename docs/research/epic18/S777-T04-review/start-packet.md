# Slice 777 start — T04 import review and acceptance

**Status:** Started 2026-10-13 09:01:22 UTC. **Owner:** Codex.
**Branch/worktree:** codex/epic-18-g05 at
C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp.

## Verified checkpoint and authority

- Start from clean S776 commit
  7102cfe61f58c6a79d2887b495dfed43f4d8233f (Slice 776: complete UIQ-10
  production-pack presentation). Fresh origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75
  is an ancestor.
- Highest assigned number is 761 on origin/main and 776 on this active
  branch. S777 is reserved as the next unique slice.
- Canonical board revision 4633: EPIC-18, G05-T04, and UIQ-10 are In Progress;
  S776 exit evidence links to all three. Its packet digest was verified against
  the board evidence. No worktree changes were present at start.
- Authority is the admitted EPIC-18/G05 contract and active S765 sequence,
  especially S777's T04 diff/scoped-approval/rendered/numeric review boundary;
  UIQ-10 has a separate S774 admission. Acceptance is also defined in the
  canonical G05-T04/UIQ-10 board cards and the S774 T04 decision record.
  S776's exit and post-replay evidence are under
  docs/research/epic18/S776-UIQ-10-presentation/.
- Usage at start: primary window 81% used, weekly window 13% used;
  ordinary usage is allowed. Overall EPIC-18 goal stays active.

## Intended outcome and exact boundary

Complete the admitted S777 T04/UIQ-10 boundary by making the existing strict
S775 .techpack.zip preview/diff API usable from the local app, with explicit
review before an eligible authored-record change is applied through the
existing ProjectWorkflow.saveActiveTechPack path. Then verify the T04 and
UIQ-10 acceptance packets against Tee and Woven Shirt synthetic examples.

- Show every changed field path with exact before/after values; retain number
  precision and units/source fields. Show base revision and current style-head
  identity and digest. Keep no-op and stale previews distinct.
- Reject malformed, oversized, wrong-style, invalid-schema, or corrupt packages
  with an actionable message. Recheck the current local style head before
  preview and before Apply; stale or changed heads cannot be applied.
- Never apply automatically. Apply is available only for a changed, eligible
  preview after the user explicitly chooses it. Use the existing save path so
  the result is a new immutable revision; imported approval is never trusted
  and the applied record must be DRAFT with an empty review scope. Do not
  import/replace attachment bytes or create external/network access.
- Keep the S776 generated snapshot presentation and exact-revision approval
  visibility intact. Do not add approval authoring, freeze, T05 manifests,
  numeric/POM calculations, schema changes, writer/package parser changes, or
  legacy export changes. Numeric acceptance checks compare retained editable
  record values to generated/rendered output and keep measured actuals distinct
  from predictions; they do not invent construction facts or silently normalize
  numbers.
- Use two clearly synthetic representative styles (Tee and Woven Shirt) for
  parsed/import-diff, numeric, scoped-review and actual rendered acceptance.
  Preserve no-physical-fit, supplier, factory, or production-readiness claims.

## Planned file ownership

Codex owns integration and final review. Planned production files are a new
pure read-only import-review renderer and focused tests, plus the existing
mounted app adapter/tests and its scoped presentation styles/markup. Existing
S775 writer/importer, record/revision schemas, ProjectWorkflow, T01/T02/T03
editors and validators, package/archive formats, protected fixtures, recipes,
project backup and legacy exports remain outside planned ownership. If the
existing save path or S775 API cannot meet this boundary safely, stop and
record the exact blocker; do not route around it.

Planned files:

- Add src/ui/tech-pack-import-review.ts and
  src/ui/tech-pack-import-review.test.ts.
- Update src/ui/app.ts, src/ui/app.test.ts, src/ui/view.ts, and the
  existing scoped src/ui/enhancements/tech-pack/tech-pack-presentation.css.
- Add actual Tee/Woven generated-file, numeric/diff, scoped-review, and
  browser-viewport evidence under this directory; update
  ARCHITECTURE.md, CONTEXT-INDEX.md, PROJECT-STATE.md,
  docs/planning/EPIC-18-GOAL.md, and
  docs/planning/EPIC-18-S765-RESEQUENCING.md at the slice boundary.
- Validated start/exit command JSONs live under docs/planning/; the canonical
  board is updated only through ops/control-center/cli.mjs.

## Acceptance and required gates

1. Focused renderer and mounted-app tests cover empty, malformed, unchanged,
   changed, stale, invalid, explicit apply, race/freshness, numeric field,
   attachment non-import, and imported-approval reset cases. Every changed
   production range meets 100% statement, branch, function, and line coverage.
2. Run TypeScript checks, the protected export regression (all eight hashes),
   focused Control Center tests after board replay, and final git diff --check.
   Do not move a baseline.
3. Produce and retain actual Tee and Woven Shirt packages with source-labeled
   synthetic T01/T02/T03 content including numeric values. Parse the ZIP record,
   PDF and manifest; reconcile displayed/rendered numeric values with the
   editable JSON; verify deterministic output and round-trip diff behavior.
4. Review the mounted/import-review output in Chromium at 390×844 and
   1280×800 for both styles. Verify selected sections, revision/digest, exact
   scoped-review visibility, all field differences, separate numeric actuals
   and predictions, keyboard/focus operation, and absence of page overflow.
5. Only after the T04 and UIQ-10 acceptance evidence passes may the board close
   G05-T04 and UIQ-10. EPIC-18 remains In Progress; S778 T05 is the next
   boundary. If any acceptance fails, retain the failure and reserve a separate
   next-number remediation slice.
6. Do not run full repository/global coverage, integrated build/readiness,
   browser/Electron or settled Epic gates early; S780 owns those. No merge or
   deployment is part of S777.

## Risks, decisions, and delegation

- Main risks: applying a package to the wrong style/head, racing another save,
  hiding a nested/numeric diff, trusting an imported review scope, or implying
  local digital review is supplier or production acceptance. Fail closed on
  identity/head/parse mismatch; display DRAFT reset and exact scope explicitly.
- No blocking product decision is open. S777 adds no approval-state policy or
  freeze behavior; imported approval is discarded by the existing S775 API.
- A bounded independent, read-only audit of the S775 import-preview API is
  assigned to Claude Code in a detached worktree at the S776 base. Its file
  ownership is none; it must return a JSON evidence summary and explicit
  WORK FINISHED. Codex retains all app, workflow, test, browser and integrated
  acceptance work. No shared checkout edits are authorized for that reviewer.

## Time accounting

Start: 2026-10-13 09:01:22 UTC. Record implementation, focused verification,
rendered/output review, external-review wait and maintainer-decision time
separately at exit. External-review wait and maintainer-decision wait start at
zero.
