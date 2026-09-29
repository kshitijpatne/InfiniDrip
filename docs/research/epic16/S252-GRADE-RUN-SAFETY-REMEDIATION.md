# EPIC-16/G03 Slice 252 — graded-run safety remediation

**Status:** Implemented and verified; awaiting final EPIC-16 review.
**Scope owner:** Codex
**Parent:** Slice 251 / M03

## Findings accepted for remediation

Claude Code's read-only Opus 5.5 high audit identified two release-safety
gaps in `16c6fb2`:

1. Each grade-plan size ran range checks, `recipe.checks`, and POM comparison,
   but did not rerun recipe guidance, shared plausibility/coherence guidance,
   stitch checks, or the universal notch declaration check against that size's
   actual drafted block. The saved base could pass while a declared size with
   an invalid station or construction relationship still appeared ready.
2. Whole-run and selected-size plan exports required a current plan in the
   repository but did not require the local design to be saved. A user could
   edit a non-geometric style target, review the new UI state, and export using
   approval bound to an older saved base. Freeze already enforced the saved
   design condition.

OpenCode's read-only Muse Spark 1.3 xhigh audit found no implementation defect;
it identified incorrect wording that called whole-run Tech Pack, Projector,
and Marker output per-size files. Both audits identified that the S251 evidence
overstated the all-recipe nonzero-delta test: the checked-in test is a negative
POM-blocking test, while the positive all-recipe output-parity case uses
zero-delta sizes.

Claude also noted that standalone Tech Pack and Projector files do not embed
the grade-plan source/decision or its approval digest. The approved record and
digest are retained in the local frozen-output manifest. EPIC-16 requires an
explicit source/decision in the plan and plan-bound frozen captures, but does
not require every independently exported file to be a portable approval
record; standalone provenance remains a documented limitation for final
review rather than expanding this remediation's output-format scope.

## Acceptance criteria

- Every declared grade-plan size is validated against its resulting block,
  including semantic replay output: recipe guidance, shared measurement
  plausibility/coherence, stitch integrity, recipe sewability, and notch
  declarations all participate in readiness. A warning or failed check blocks
  that size and therefore the whole-run output gate.
- Selected-size files and whole-run files require a currently approved plan
  bound to the saved active base design. Unsaved design edits block plan-driven
  output after the user revisits Style and Check; direct repository freshness
  checks remain in place. The custom one-size path without a grade plan remains
  available under its existing gates.
- The explicit exact-POM rule remains raw numeric equality with no tolerance;
  N/A exceptions retain visible reasons and remain distinct from matches.
- The eight protected legacy export identities remain unchanged. No export
  baseline moves.
- S251's output-scope wording and machine-readable test evidence match the
  actual files/tests. The report must state that the positive seven-recipe
  export test uses zero deltas and that the nonzero test blocks changed sizes.
- `PROJECT-STATE.md`, `ARCHITECTURE.md`, `CONTEXT-INDEX.md`, the admission
  sequence, and this slice record describe the remediation and leave Slice 253
  as final review/merge/closure.

## Non-goals

- No new garment, fit or production claim, population chart, measurement
  procedure, roadmap initiative, or broader manual UI finding is admitted.
- No change to legacy grading/export behavior, export content/baselines, or the
  user's exact-match POM decision.
- This slice does not close EPIC-16 or merge the pull request. Slice 253 owns
  final output/browser review, full gates, PR merge, ancestry checks, and board
  closure.

## Verification record

- `npx vitest run src/ui/grade-plan-run.test.ts` — 10/10 passed, including
  invalid per-size measurement guidance, malformed seam construction, and
  undeclared notch failures on actual drafted blocks.
- `npx vitest run src/ui/app.test.ts -t "gates whole-run outputs on exact plan readiness and invalidates approval after edits"`
  — 1/1 passed. The integration case proves unsaved/stale bases disable
  selected-size and whole-run plan outputs after the saved style target changes,
  while the standalone one-size SVG remains available and Tech Pack, Projector,
  and Marker stay withheld without an approved plan.
- `npm run coverage` — passed: 133/133 files, 2,024/2,024 tests; statements
  24,052/24,052, functions 1,452/1,452, branches 11,054/11,054, and lines 100%.
  The complete legacy export-regression suite ran in this gate; all eight
  protected identities remain unchanged. No baseline was moved.
- `npm run build` — passed; Vite transformed 129 modules. The existing large
  chunk advisory remains non-blocking.
- `npm run electron:build-main` — passed.
- `npm run control-center:test` — passed 33/33.
- `git diff --check` — passed.
- Read-only rendered app review at `http://127.0.0.1:4177/` confirmed the
  Grade plan panel explains exact, unrounded POM reconciliation and shows no
  plan until one is explicitly created. No browser-persisted data was changed.
- Slice 251's committed rendered Tech Pack evidence was reviewed in its
  verification packet; the per-size change here affects readiness gates, while
  the output builders and the eight legacy byte baselines are unchanged.
- Board revision 354 records S252 and the final review as In Progress. After
  this report is committed, add verified board evidence and move S252 through
  Review to Done using the validated Control Center command layer.

The seven-recipe output parity evidence still uses zero-delta sizes, and the
positive successful-output test does not independently validate distinct-size
geometry. The nonzero delta regression deliberately proves changed sizes are
blocked by exact POM reconciliation. This limitation remains for S253 to assess;
no physical-fit, population-validation, manufacturing-tolerance, or production
claim is made.
