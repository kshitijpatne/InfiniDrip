# EPIC-17 / G04 V03 — AAMA pre-export contour check — Slice 620 start

## Verified start

- Started 2026-10-09 13:25:39 UTC from clean S619 `bcfe318074c5f3baf7a05747fc0e5f48507d0f45` on `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice was 619; reserve S620. Board revision 3614 records EPIC-17 In Progress, G04-V02 Done and G04-V03 In Progress. CLO 2026.1.310 remains running.
- Reuse S574's saved **after-AAMA-import, before-export** project (`clo-after-line-chain-import.zprj`, SHA-256 `43ab4cd6de6a823cf671bf7fe748abc4052744a396e3dbcb0fe9539055d39e25`), its connected-LINE Polo input (`polo-source-m-cut-lines.dxf`, SHA-256 `a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675`), and its gen1 AAMA output (`polo-line-chain-gen1.dxf`, SHA-256 `346f38a02748f96247716d9e5a992912cc018cb2eeb4506c092c4f43eedaf1e3`). No exchange is repeated.

## Bounded question

Use the already-running CLO UI to load the existing S574 imported project, run only the reviewed read-only `GetPatternInputInformation` query, and save its JSON under `C:\G04-CLO-DXF-Exchange\S620-aama-preexport-contour-check\Evidence\`. Compare pre-export native point lists with the existing AAMA gen1 CUT contours, and bind piece candidates only where the coordinates support the match. Determine whether S574's measured CUT failures already match reduced pre-export native contours, or whether source-near corners survive pre-export and the AAMA exporter changes them. Also compare against the original S609 source CUT paths where possible; S574 replaced closed CUT polylines with connected LINE entities while preserving their endpoint coordinates, so do not let that representation change be mistaken for geometry change.

If the imported project's identity or its native geometry cannot be corroborated from the hashed saved file and source-matched getter output, report that limitation and stop. CLO's getter labels are undocumented for DXF layer/stage; never infer CUT identity from “Base Line” alone. No API setter, CAD importer/exporter call, simulation, project save/overwrite, or new CLO round trip is in scope.

## Gates and non-goals

- **Pass evidence:** preserve input/project/output hashes; successful exact-build getter response for nine source-matched pieces; compare each of the five short-edge neighborhoods and output CUT candidates with measured result or explicit non-recoverable status; retain machine-readable output and review it. Any stage statement is bounded to this S574 CLO/AAMA fixture.
- Read-only diagnostics only: no product code, recipe or cut geometry, DXF writer, exporter, baseline, layer semantics, tolerance, options, profile, receiver selection, all-seven coverage, V02/V03 state, rights determination, or acceptance criterion changes. Keep legacy DXF behavior and protected byte identities intact; do not claim format compatibility, physical fit, factory acceptance, or production readiness.
- All import/export files and new derived evidence stay under `C:\G04-CLO-DXF-Exchange\S620-aama-preexport-contour-check\`; the existing read-only input files remain in their existing named S574 C: folder. Do not save DXF/project files elsewhere or overwrite the S574 project.
- Focused verification: review script/API symbol allowlist, syntax/schema and hash preflight, `npm run control-center:test`, validated board exit replay and `git diff --check`. No production-code coverage or full repository gate is due for this evidence-only slice; keep the full gate for the settled integrated Epic/PR candidate.
- No safe independent delegation: this is a single exact-build CLO scene inspection with controlled read-only app ownership.

## Board start and next action

Validated start commands replay 3614→3616. Next open the existing S574 after-import project in the current CLO session, execute the getter-only script, review C:-saved output, and compare against already-produced S574 CAD data.
