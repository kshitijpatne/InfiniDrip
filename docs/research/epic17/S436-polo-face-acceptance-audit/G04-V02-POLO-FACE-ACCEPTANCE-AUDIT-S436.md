# G04 V02 — Polo per-face acceptance audit — Slice 436

## Start boundary and authority

- Started 2026-10-07 19:45:35 UTC on `codex/epic-17-g04` from clean S435
  commit `72f36aced5335eca34e7839b4c05a373c834163d`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned
  slice is 435; reserve 436.
- Board at entry is revision 2596: EPIC-17/G04-V02 In Progress, V01 Done,
  V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces.
  All 34 Polo and 56 Woven faces remain held.
- Latest S435 corrected full-label audit finds no keyed POM text overlap across
  exact S434 output. The separate Polo residual exception applies only to the
  exact approved S351 representation; 0.25 cm remains the general threshold.

## Scope

Perform a read-only per-face acceptance audit for the current 17 supported Polo
option rows / 34 front-and-back faces. Reconcile current source revision,
option values, topology/projection diagnostics, overlays/colorway closure, POM
and schedule identity, construction joins/crossings, residuals and actual
rendered evidence. Attribute every remaining held face to a specific failing
gate and durable source/matrix/output evidence. Distinguish a passing gate from
an overall face pass. Determine whether any current Polo face meets every
applicable V02 criterion; do not change board statuses or accept/release views
in this audit.

## Acceptance and non-goals

- Use exact current matrices and their recorded source revisions; do not combine
  diagnostics from different revisions as if they were one run.
- Verify front and back independently, including approved same-revision colorway
  output and the complete source-bound POM schedule/readability check.
- Preserve the approved S351 exception only for its exact Polo `Sleeve-cap ease`
  mapping; retain the 0.25 cm limit everywhere else.
- Keep all 34 Polo faces held unless current end-to-end evidence demonstrates
  every applicable V02 check for a given face and acceptance is authorized by
  the established board workflow. This read-only packet does not grant that
  authority.
- No source/pattern/stitch/POM/render change, no gate relaxation, no change to
  all-seven-recipe coverage, V02-before-V03, legacy DXF, protected export
  identities, or CAD rights/round-trip requirements.
- No physical fit, factory acceptance, or production-readiness claim.

## Execution plan and ownership

1. Inventory the current S432–S435 Polo matrices, acceptance status fields and
   exact option/revision joins.
2. Cross-check source and output evidence for each applicable front/back gate;
   run only focused read-only audit assertions needed to fill evidence gaps.
3. Inspect actual current rendered output for representative/default and
   option-extreme cases where the stored evidence does not already show the
   relevant gate.
4. Record per-face gate table, exact unresolved blockers, scope impact, and one
   next action. Keep holds unchanged.

No safe disjoint implementation exists: the same-revision cross-matrix audit
and acceptance classification are one Codex-owned unit. No external agent is
delegated. There are no blocking design decisions at slice start; if the source
and extant approvals leave a concrete design choice, stop before implementing
it and request that exact choice after independent findings are complete.

## Required checks

- Focused assertions that input artifacts cover all 17 unique options and both
  faces per option, and that each status is traceable to current evidence.
- Actual rendered/output inspection only where current retained evidence is
  insufficient.
- Validated Control Center start/exit evidence; `npm run control-center:test`
  and `git diff --check` after board/doc updates.
- No full repository coverage/build/export gate for a read-only evidence slice;
  preserve those for the settled integrated Epic candidate.

## Result — current Polo checks pass; all-seven V02 still blocked by Woven

The 17-case option fixture is the canonical current boundary matrix (base case
plus each declared Polo control's min/max). S436 joined S432/S433/S434/S435 by
case ID and exact option values, while retaining each slice's distinct revision
ID rather than treating them as a single render revision. The S434 pair uses
one identical per-case `live-draft:polo:S434:<caseId>` revision for its front
and back.

The joined matrix covers 34 faces. Across all 34 current S434 compiler/SVG
rows, source topology and live view compile cleanly, and colorway output is
present on both faces at the exact row revision. All 17 back sleeve contours
have a closed colorway fill. The S432 run records zero assembly issues and zero
S351 endpoint residuals under the approved exact-relation exception; all other
assembly/residual diagnostics remain in force. The S434 current compiler emits
zero issues on all 34 faces, confirming the same supported option values still
pass. Fronts retain all 16 source POM rows (15 only at `sideVentDepth=min`,
where the source itself lacks the vent method), including 13 keyed full-text
rows. Backs retain all 9 source POM rows (8 only at the same source-defined
vent exception); front-only measurement anchors remain table-only and are not
mirrored. S435 confirms zero source-label/key/schedule box overlaps on all 17
fronts. The current front/back SVGs retain their same-row colorway revision;
all 34 are held and none is counted accepted by this audit.

The older S432 failures are resolved with stronger, newer output evidence: its
17 front POM placement failures are superseded by S434's complete current
J/FG-keyed schedules; its 17 back sleeve-fill closure failures are superseded
by S433's all-option source-bound repair and confirmed in the exact S434
same-revision output. S435 clears the apparent J raw-contact blocker as a
measurement-classification error. No new Polo-specific compiler, colorway,
POM identity, residual, or measured text-overlap failure remains in the
current 17-case evidence.

Three actual S434 back SVGs (default, maximum stand height, minimum back-hem
drop) were rasterized in Chromium and inspected. Each has five same-revision
colorway fills, 20 source-bound pattern paths and 17 explicit notices; page and
console errors are zero. The repeated collar/neck drafting paths and marks are
dense at fit-to-page scale, but the zoomed default front crop shows separate
keyed markers and source lines. S435's label-box result applies to text only;
it is not a general topology-overlap theorem. This packet does not claim
physical fit or factory acceptance.

**Face/release conclusion:** no face status changed. The current Polo cases
have no identified local compiler/render/overlay/POM/readability blocker in
these artifacts, but V02 as a whole remains In Progress and all-seven recipe
coverage is not complete: Woven still has 28 front collar/neckline contacts
and 28 back sleeve-hem crossings. Keep all 34 Polo and 56 Woven faces held
until the integrated all-seven acceptance review. No additional Polo design
decision is needed from this audit. Do not start V03: its all-seven V02
dependency remains unmet, and rights-cleared industrial receiver/profile plus
representative round-trip evidence remain open downstream prerequisites.

## Exit verification and timing

- `audit-options.mjs` passes 17/17 option joins / 34 faces: option values match
  the recorded fixture in all artifacts, S434 revisions match front/back,
  compiler issue counts are zero, POM schedules match expected source omission
  at `sideVentDepth=min`, S435 collision counts are zero, and no view status is
  changed.
- `render-back-review.mjs` rasterizes the selected exact S434 production SVGs
  in Chromium. Three rendered images and same-revision/fill/path assertions
  are retained in `rendered/`; zero browser errors.
- Start-board replay: revision 2596→2599. The first exit replay correctly
  applied `E-G04-S436-EXIT` (2599→2600), then failed closed because the
  Control Center schema does not support the initial `test-report` evidence
  kind for the matrix. The failure and partial applied state are preserved in
  `S436-exit-partial-replay.json`; no status or tally changed. The matrix
  evidence was corrected to `document`, and the remaining validated commands
  replayed 2600→2604. `npm run control-center:test` passes 42/42 on the final
  board. `git diff --check` passes.
- No production code or tests changed; no full coverage/build/export gate is
  due for this evidence-only slice. Keep the repository-wide gate for the
  settled integrated Epic candidate.
- Elapsed 2026-10-07 19:45:35–19:56:21 UTC (~10m46s): implementation 0m;
  cross-matrix diagnosis ~4m; focused option assertions/rendered review ~3m;
  durable board/docs/closeout ~3m46s; external-agent waits 0m; maintainer
  decision time 0m.
- Landed as `Slice 436: audit current Polo face acceptance`. Refreshed
  `origin/main` ancestry is verified and the worktree was clean at the boundary.

**Next action:** resume the unresolved Woven front and back intersection
review from its exact current recipe revision and approved layer-order
decisions. Preserve the continuous neckline and do not introduce a false
hem-gap. Do not ask for a general source/geometry reference already reviewed;
request a maintainer choice only if exact pattern topology and qualified
research cannot determine a truthful remaining display decision.
