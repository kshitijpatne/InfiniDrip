# EPIC-17 / G04 V03 — Standard-DXF connected-LINE import check — Slice 622 start

## Verified start

- Started 2026-10-09 13:49:32 UTC from clean commit `53531db882c817be002421e8fb2795425c4ecee2` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 621; reserve unique S622. Canonical board revision 3622 has EPIC-17/G04-V03 In Progress and G04-V02 Done. The active goal remains aligned and active. CLO trial product-development use and local file processing are confirmed in writing.
- CLO 2026.1.310 has not yet been targeted this slice. The current desktop app inventory shows only the CLO Standalone OnlineAuth window; no CLO pattern workspace is listed. Do not launch/restart/close CLO. Re-observe the current app/process once after durable start registration; if the main pattern window remains unavailable, stop before file import and record the access limitation rather than treating it as a format failure.

## Bounded question

Does CLO's Standard-DXF import profile expose the source CUT contours in its native pattern geometry for the exact S574 connected-LINE Polo M fixture, when compared with S620/S621's DXF-AAMA imports? This isolates the import-format selector on the same geometry-bearing input; it is not an export or round-trip trial unless the pre-export geometry gate passes.

## Method and fail-closed gates

1. Use only the S574 derivative `polo-source-m-cut-lines.dxf`, copy it into `C:\G04-CLO-DXF-Exchange\S622-standard-dxf-connected-line-import\Input\`, and verify SHA-256 `A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675`.
2. In the already-running CLO window, import as **Standard DXF**, centimeters, 100%, no rotation, Maintain Original grain angle; annotations off, auto-trace off, swap cut/sew off, notches Both at Ratio, auto-distribute off, Optimize All Curve Points off, Import Draw Curve Points on, and Remove Non-Grading Points off. Record every visible setting and notice; do not save over prior slice files.
3. Save the disposable imported project and a CLO-native 2D snapshot only under the named S622 C: folder. Query `GetPatternCount`, `GetPatternPieceName`, and `GetPatternInputInformation` before any DXF export. Compare ordinal association through source SEW geometry, then measure all source CUT/SEW contours at the unchanged `0.001 cm` gate and compare the native geometry with S620/S621 only where same-input provenance permits.
4. Pass the pre-export gate only if all nine corresponding source CUT and SEW contours match within `0.001 cm`, with nine closed/visibly rendered pieces and no ambiguity in same-piece association. If any CUT misses, do not export; record the measured failures and stop Standard-DXF trials on this fixture as required by S621. If all pass, reserve a later unique slice for the bounded output/reimport round-trip.

## Scope, holds, and non-goals

- Diagnostic only for this fixture/build/profile. No industrial-standard edition, formal conformance, receiver-rights clearance, broad compatibility, or production-readiness claim.
- Preserve all-seven recipe coverage, V02-before-V03, `0.001 cm`, receiver/profile rights, units/scale, piece/revision identity, layer semantics, marks, grades/options, invalid-input rejection, repeated round-trip, and readable-output gates. Keep G04-V02 Done and G04-V03/EPIC-17 In Progress. Preserve legacy DXF behavior and protected export byte identities.
- No product-source, pattern, recipe geometry, stitch graph, generic/legacy DXF writer, baseline, acceptance, threshold, or unrelated UI changes. No hosted upload, paid access, install, account change, vendor contact, physical sample, fit/factory claim, or production-readiness claim.
- All test inputs, CLO projects, exports if separately authorized by a passing pre-export gate, and rendered/output evidence stay under `C:\G04-CLO-DXF-Exchange\S622-standard-dxf-connected-line-import\`. Keep the existing CLO session open while G04 remains active.
- No safe delegation exists: this is one controlled test in one shared running desktop application and Codex owns its source-bound geometry and rendered evidence review.

## Verification and next gate

Run input-hash/profile/geometry/render preflight, `node --check` on slice helpers, `npm run control-center:test`, validated board replay, and `git diff --check`. Research/evidence only; no changed-production-code coverage applies. Full repository coverage/build gate remains for the settled integrated Epic/PR.

## Single next action

Observe the existing CLO app/process without launching it. If the unique 2D pattern workspace is available, stage and hash the input, perform the one Standard-DXF import, render and query native geometry before any export. If it is not available, stop and document that access blocker without reopening CLO.
