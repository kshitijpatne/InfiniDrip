# S677 exit — recipe construction marks in additive DXF

## Result

S677 closes one verified product-code gap: the legacy `exportDxf` receives pieces and seam allowances but not the recipe-owned notch/grainline rules, while the SVG exporter resolves those same rules against the live piece. The optional third argument on `exportDxfCentimeters` now serializes the authored notch tick as a `LINE` on `MARK_NOTCH` and the SVG-equivalent shaft plus four end chevrons on `MARK_GRAINLINE`. Coordinates use the same piece layout, translation, centimeter values, three-decimal rounding and Y inversion as the DXF outline.

The no-rules overload remains exactly the S676 centimeter header plus the byte-identical legacy DXF stream. `exportDxf`, default UI routes, source cut geometry, stitch graph, acceptance and protected export hashes are unchanged. Duplicate or missing piece tables fail closed. No receiver, profile, or compatibility claim is made.

## Verification

- Focused exporter and legacy/protected checks: `npm run test -- src/export/dxf-centimeters.test.ts src/export/regression.test.ts src/export/export.test.ts src/export/polo-final.test.ts src/export/woven-shirt-final.test.ts src/export/trouser-final.test.ts` — **37/37 passed** across six files.
- Changed production module: `npx vitest run src/export/dxf-centimeters.test.ts --coverage --coverage.include=src/export/dxf-centimeters.ts --coverage.reporter=text` — **100% statements, branches, functions and lines**.
- `npm run build` passed; Vite reported only its existing large-chunk advisory.
- `npm run control-center:test` passed **42/42**; validated S677 start/exit replay and `git diff --check` passed.
- Initial focused run exposed a missing local number formatter and a mistaken test import; both were corrected before rerunning. Initial coverage also exposed an untested unmapped-piece branch; the specific partial-table case was added. Final focused tests and coverage are green; thresholds were not lowered.

## Generated and rendered output review

`render-candidate.ts` generates M-size candidate DXFs for all seven registered recipes and a diagnostic SVG/PNG by reading those emitted DXF entities. Files are kept outside the repository at `C:\G04-CAD-Interchange\S677-construction-marks\`, as required for exchange fixtures. `S677-generated-evidence.json` there records DXF, rendered-SVG and PNG SHA-256 digests plus entity counts; its SHA-256 is `3f94680e12045d7d11297a0398253a5073d58cd2102bde26e565c801994b7246`.

All seven actual generated-file renders were inspected. CUT/SEW outlines remain separate; authored notch ticks appear in `MARK_NOTCH`; grainline shafts and end chevrons appear in `MARK_GRAINLINE`; no mark was detached from its source piece/layout by the transform. These are diagnostic renders of the generated DXF records, not screenshots or acceptance from a receiving CAD application. Piece/revision labels, grades/seam sidecar identity, receiver import/export, malformed-file handling, repeatability, the supported-option matrix, and final readable receiver output remain open.

## Gate disposition and next action

V01/V02 remain Done; G04-V03 and EPIC-17 remain In Progress. This source/output change proves only that the product candidate now emits recipe-defined notch and grainline geometry for the seven default M configurations. It does not pass the V03 receiver/profile or all-seven/options/grades round-trip gate. Preserve all V03 thresholds, protected identities and existing acceptance.

Next: S678 will implement a bounded version-matched exchange manifest for source piece/recipe identity, size/grade step and stitch relationships, bound to the exact candidate DXF digest, then test mismatch/reproducibility and the existing grade fixtures. This is permitted by C04's sidecar boundary and must remain a sidecar; it cannot replace DXF geometry or visible marks. Determine from actual importer/receiver evidence whether that package can be carried through the already-selected route. Do not claim a round trip until receiver evidence supports it.

## Slice ledger

Started 2026-10-10 17:37:56 UTC from clean S676 `4e84263395a357978a97b46a1ca208921e65a5de`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. S676 was highest; S677 was unique. Board start replay advanced 4021→4023. Exit replay is recorded in the adjacent command files.

Elapsed through 17:49:35 UTC: implementation/source review about 5m; focused tests, changed-code coverage, protected regression checks, build and Control Center about 25s of measured process time; generated seven DXFs and diagnostic renders plus manual review about 2m; docs/board/review closeout about 4m; external-agent waits 0; maintainer-decision time 0. No full-repository gate was run; reserve it for the settled integrated Epic candidate. No fit, factory, standards-conformance or production-readiness claim.
