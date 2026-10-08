# G04 integrated build gate repair — Slice 452

## Start boundary

- Started 2026-10-08 00:19:48 UTC from clean S451 commit `65d101815a068b5bc084b11223c5b0f8738b29b7` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 451; S452 is unique.
- Canonical board revision 2719; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 options / 146 faces. The goal is active and matches the admitted objective through safe merge.
- Usage at start: 4% primary / 23% weekly; ordinary work allowed.

## Objective and authority

Reproduce and, if appropriate, repair the known final-candidate build failure documented at S441 against current HEAD. This is an independent required-merge-gate cleanup and does not depend on the unresolved Woven front/back view approvals. No Woven view metadata, pattern geometry, source stitch, acceptance, hold, export baseline, or V02/V03 sequencing may change.

The prior diagnostic recorded TypeScript problems in `technical-flat-live.test.ts`, `technical-flat-svg.test.ts`, and `technical-flat-svg.ts`, reproduced at the exact S440 baseline. First run the current build and inspect current diagnostics before editing; the old line numbers may be stale. If source changes are necessary, add/update focused tests and require 100% changed-production statement, branch, function and line coverage; run affected tests first, then the build. Do not run full repository coverage in this slice unless the change is independently mergeable; retain it for the settled Epic candidate. Preserve all 24 protected export identities and legacy DXF behavior.

## Scope and non-goals

- Allowed: narrow TypeScript/test-fixture corrections required for the build to compile, with behavior-preserving changes and focused coverage.
- Prohibited: suppressing strict types, removing assertions, lowering coverage, test-config/default worker changes, broad cleanup, renderer semantic changes, option/source changes, export baseline changes.
- No delegation is safe for cross-referenced TypeScript narrowing/test fixture fixes; Codex owns the source/test pair and review.
- No change to unresolved Woven decision proposals in S451. All 56 Woven/34 Polo holds remain. All-seven V02 and V02-before-V03 remain.

## Gates and exit evidence

- Reproduce current `npm run build` and preserve complete diagnostics.
- For every changed production module, focused tests and 100% statement/branch/function/line coverage; verify actual app build. Run changed tests before a single relevant build after the fix.
- Re-run `npm run control-center:test` and `git diff --check` for the board/state closeout.
- Record changed files, whether errors were stale/fixed, output evidence, remaining build/export/coverage gates, elapsed implementation/focused-verification/agent-wait/maintainer-decision time, and next action.

## Start verification and board replay

Start command JSON and its validated preflight/replay scripts are adjacent. No status transition is authorized for V01/V02/V03.

## Result and exit evidence

- `npm run build` passes on the exact S452 HEAD. `tsc` exits successfully and Vite transforms 144 modules and emits the production build. The sole output is the existing chunk-size advisory for bundles larger than 500 kB; there are no compile/build errors.
- The S441 errors were resolved in Slice 444 (`9014995`), not by an unrecorded local change: explicit `FlatCirclePrimitive`/`FlatPointMarkPrimitive` guards narrow renderer primitives; the live fixture narrows path primitives and asserts optional presentation before field access; the SVG test fixture supplies the `keyed-marker-schedule` discriminant.
- Preserved log: `current-build.log`. No code or tests changed; no implementation or coverage gate was needed in S452.
- Validated start replay advanced board 2719→2721; exit replay advances 2721→2725 and links S452 evidence to G04-V02/EPIC-17. Statuses and 56 accepted / 90 held tally remain unchanged.
- `npm run control-center:test` passes 42/42; board command preflight/replay/read, S452 JavaScript syntax, JSON parse and `git diff --check` pass. Goal inspection at the boundary reports active and exact admitted objective wording.
- Elapsed 00:19:48–00:21:29 UTC (1m41s): build reproduction/history diagnosis ~45s; packet/state/board work ~35s; focused verification ~21s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** current build gate is cleared. Await S451's two precise Woven view-trial decisions; do not change those semantics before approval. Full repository coverage/export identity/browser/Electron gates remain for the settled integrated Epic/PR candidate.
