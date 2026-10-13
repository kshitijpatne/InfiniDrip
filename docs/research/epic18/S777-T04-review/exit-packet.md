# Slice 777 exit — T04 import review and acceptance

**Status:** Complete. **Branch/worktree:** `codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Slice commit
subject:** `Slice 777: complete T04 import review and numeric acceptance`.

## Starting checkpoint and authority

S777 started from clean S776 commit
`7102cfe61f58c6a79d2887b495dfed43f4d8233f`; fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` was an ancestor. The
canonical board was revision 4633 before start replay and 4637 after the
validated start commands linked S777 to UIQ-10, G05-T04, and EPIC-18. Slice
777 was the next unique number after S776; active branch history and
`origin/main` contain no prior Slice 777 commit.

The admitted T04/UIQ-10 acceptance contract is in the S774 decision and
UIQ-10 packet; the exact scope, non-goals, ownership, risks, and gates are in
[`start-packet.md`](start-packet.md). No product decision was blocking. T05,
full repository/global coverage, integrated build/readiness, Electron, merge,
and deployment remain in their later admitted boundaries.

## Result

Connected the strict S775 `.techpack.zip` preview/diff API to the local app.
The user selects a package, reviews exact changed field paths and values,
current style revision/digest and saved approval scope, then explicitly
chooses Apply. The adapter rechecks the style head and scoped approval around
preview and immediately before save, validates sample rounds against immutable
style history, and fails closed on stale or racing work. Apply uses
`ProjectWorkflow.saveActiveTechPack`; it creates a new immutable revision in
`DRAFT` with an empty approval scope. Imported approval is not trusted,
attachments remain read-only descriptors, and no package bytes are written to
attachments. No automatic apply, schema, writer, T02/POM calculation, freeze,
legacy export, or garment-source behavior was added.

Production/context files changed:

- Added `src/ui/tech-pack-import-review.ts` and its focused tests.
- Added the mounted import adapter and focused cases in `src/ui/app.ts` and
  `src/ui/app.test.ts`.
- Added the import-review host and its scoped presentation styles in
  `src/ui/view.ts` and `src/ui/enhancements/tech-pack/tech-pack-presentation.css`.
- Added the retained Tee/Woven Shirt package, PDF, browser, and visual evidence
  under this directory.
- Updated `ARCHITECTURE.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
  `docs/planning/EPIC-18-GOAL.md`, and
  `docs/planning/EPIC-18-S765-RESEQUENCING.md` to record the same checkpoint.

## Acceptance and verification

| Gate | Result |
| --- | --- |
| Import renderer | Pass: 6/6 focused tests; 100% statement, branch, function, and line coverage. |
| Mounted app integration | Pass: 9 focused tests; the added `app.ts` ranges (lines 665–670, 708–716, 782–931, and 1053–1078) cover 191/191 statements, 93/93 branch outcomes, 5/5 functions, and 191/191 executable lines. The whole-file app report is not used as the slice gate because it includes unrelated existing application code. |
| TypeScript | Pass: `npx tsc --noEmit`. |
| Protected export identity | Pass: `npx vitest run src/export/regression.test.ts`, 8/8. No baseline moved. |
| Actual output | Pass: Tee and Woven Shirt ZIP manifests and editable records match the extracted archive members; embedded PDFs match standalone PDFs byte-for-byte. The five-page A4 PDFs render sample actuals of 52.25 cm and 73.5 cm with synthetic/no-physical labels and the local digital-review disclaimer. Edited candidates preserve 52.375 and 73.625 exactly. Hashes and rendered pages are in [`rendered-review.md`](rendered-review.md) and [`evidence/`](evidence/). |
| Numeric separation | Pass: sample records retain `actualValue` without a `predictedValue`; the S769 schema and S770 T02 rendered evidence keep pattern predictions in their separate calculated path. S777 does not invent or import predictions. |
| Browser review | Pass: both styles at 390×844 and 1280×800; 20 anchored screenshots, current scoped approval, exact nested diffs, explicit DRAFT result, keyboard focus/arrow scroll, no page errors, and no document-level horizontal overflow. Full measurements and screenshot hashes are in [`evidence/viewport-review.json`](evidence/viewport-review.json). |
| Control Center and diff hygiene | The validated exit replay attaches the report and closes only UIQ-10/G05-T04; `post-replay-verification.md` records the read-back, Control Center suite, and final diff check. |
| Integrated/global/build/Electron gates | Not due; remain assigned to S780. No merge or deployment is part of S777. |

The UIQ-10 presentation screen is vertically scrollable inside the studio
inspector. The anchored captures show each required review region, and there
is no document-level horizontal overflow. The T04 PDF uses the existing
field-path rendering for sample metadata; S777 verified numeric content,
record identity, and byte equivalence without changing the output template.

The bounded independent read-only review used OpenCode with the required
`Muse Spark 1.3` normal mode and `xhigh` reasoning, on a detached checkout with
no shared-file ownership. The reviewer returned explicit **WORK FINISHED**.
Codex reviewed the report and actual integration: current revision/history
must match; only changed, eligible candidates with no `INVALID` finding may
apply; callers must fail closed on races, never auto-rebase, and keep package
attachments read-only. Those checks are covered in the final diff and focused
tests. Claude Code CLI was unavailable because its OAuth session had expired;
no configuration substitution was made for OpenCode.

## Risks, decisions, and holds

No new construction or numeric method is established. The two sample actuals
are synthetic QA values, not sewn-garment measurements. T02 pattern predictions
are calculated and rendered through their separate path; the S777 package
records do not contain predicted values, and the import UI does not synthesize
them. Supplier acceptance, physical fit, sewing validation, factory approval,
production release, and launch readiness remain unverified and are not
claimed. Launch-backed work remains deferred.

## Time accounting

Start: 2026-10-13 09:01:22 UTC. Evidence review was complete at
2026-10-13 16:10:33 UTC, an elapsed wall interval of 7h09m. Approximate active
time: implementation/integration 70 minutes; focused verification 65 minutes;
rendered/output review 55 minutes. The external audit ran in parallel, so
blocking external-agent wait was 0 minutes; its independent run duration was
not separately timed. Maintainer decision wait was 0 minutes. Wall time also
includes non-active intervals and context handoffs. The validated replay and
post-replay checks are recorded separately in
[`post-replay-verification.md`](post-replay-verification.md).

## Next action

After the exit evidence is attached and the board confirms UIQ-10 and G05-T04
Done, S778 is the single next action: start the admitted T05 immutable local-
share freeze and deterministic manifest/digest boundary. EPIC-18 remains In
Progress; S780 owns the settled integrated/global/build/readiness/browser/
Electron/output gate, and S781 owns merge, main CI/deployment, and final Epic
closeout.
