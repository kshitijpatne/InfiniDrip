# EPIC-17 / G04 V03 — CLO LWPOLYLINE ASTM import — Slice 636 start

## Verified start and dependency

- Started `2026-10-09 20:02:47 UTC` after S635 commit
  `3f3c6b9b4034ac615e03a7c448f127cbc4c9d260` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; S635 is highest and S636 is reserved. Worktree was clean. Board
  revision 3684 preserves V01/V02 Done and V03/EPIC-17 In Progress.
- The exact tested source is S635's disposable nine-CUT-LWPOLYLINE derivative,
  SHA-256
  `606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360`.
  Copy it byte-for-byte to this slice's C:-only Input folder; do not alter its
  points or any other DXF entity.
- CLO 2026.1.310 is already open in the existing session. The maintainer
  authorized local CLO product-development exchange testing. All S636 files,
  query scripts, project files, screenshots, rendered evidence and any
  conditional DXF export stay under
  `C:\G04-CLO-DXF-Exchange\S636-lwpolyline-astm-import\`.

## Bounded question and controlled variable

The native Standard-DXF import in S635 still omitted five hash-pinned source
CUT vertices; S632 found the same five with classic POLYLINE through CLO's
DXF-ASTM menu. S636 tests the only remaining cell in that two-factor matrix:
the unchanged LWPOLYLINE derivative through CLO's documented DXF-AAMA/ASTM
import mode. The import mode is the only changed variable. CLO's official
import reference documents this DXF-AAMA/ASTM route and its import settings:
https://support.clo3d.com/hc/en-us/articles/115012380628-Import-DXF . This is a
receiver behavior test, not a normative ASTM edition or conformance claim.

## Workflow and fail-closed rule

1. Preserve S635's already-saved Standard-import scene; open a clean project
   in the existing CLO session. Do not close or relaunch CLO.
2. Import the S636 input once using **DXF-ASTM** and the exact S632/S617
   settings: centimeters, 100%, Do Not Rotate, original grain angle, draw
   curve points retained, notches to both at position ratio, no annotation,
   auto-trace, swap, auto-distribute, curve-point optimization or removal of
   non-grading points, and the same seam-allowance handling. Record the
   live-dialog values, notices and any error.
3. Save the native CLO project in this C: evidence folder. Query all nine
   identities and native point lists read-only with
   `GetPatternCount`, `GetPatternPieceName`, and
   `GetPatternInputInformation`; hash-pin the project/query pair. Compare the
   complete ordered source CUT arrays and all four S635 controls at the
   unchanged `0.001 cm` gate. Visually inspect the live scene and every
   affected contour crop.
4. If any expected identity is missing/duplicated, any source CUT vertex is
   absent or outside tolerance, any control regresses, or the dialog/settings
   differ, stop before export. Record the concrete result; make no settings
   permutations or geometry repairs.
5. Only if all nine native CUT contours and identities pass may this slice
   export once using the recorded S617 ASTM Graded-Nest export settings and
   reimport that output once under the same S636 ASTM import settings. Save
   and compare the resulting CUT contours at `0.001 cm`. This conditional
   round trip clears only its measured contour behavior; it does not waive
   the remaining marks, rights, industrial profile, options/grades,
   malformed-input, repeatability or readability gates.

## Scope and focused gates

- Research/receiver evidence only. No product pattern, stitch graph, DXF
  writer, production source, legacy behavior, protected byte identity,
  tolerance, V02/V03 acceptance, status or hold change. No physical, factory
  or production-readiness claim.
- `copy-input.mjs` verifies the S635 C: source hash and makes the byte-identical
  S636 input copy. `analyze-native-import.mjs` is source/project hash-pinned
  and derives exact-piece pass/fail plus rendered source/native comparisons.
  `preflight-start.mjs`, `preflight-derivative.mjs`, `preflight-exit.mjs`,
  and validated board replay constrain the boundary. Run focused script
  syntax/assertions, `npm run control-center:test`, board validation and
  `git diff --check`. No production code changes are permitted, so
  changed-code coverage is not applicable. The full repo test/100% coverage,
  build and integrated output gate remain at the settled Epic/PR candidate.
- No safe independent delegation exists: this is one live stateful CLO import
  and source-bound native contour query. Codex owns the UI action and reviews
  all measurements and rendered evidence.

## Single next action

Use the currently open CLO session for one controlled DXF-ASTM import of the
hash-pinned S636 copy, then query and compare native geometry before deciding
whether the packet permits its conditional single round trip.
