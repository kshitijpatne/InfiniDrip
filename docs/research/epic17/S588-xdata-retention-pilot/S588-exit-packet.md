# EPIC-17 / G04 V03 — CLO XDATA retention pilot — Slice 588 exit

## Result

The one local CLO 2026.1.310 DXF-AAMA export completed without a format error.
The exported DXF contains no `INFINIDRIP_G04` APPID/XDATA and retains none of
the 56 unique source entity IDs: 0 preserved, 56 missing, 0 duplicated, and 0
unexpected/reassigned. This directly answers the bounded question for this
tested build, mode, and import configuration: registered-app XDATA IDs did not
survive the observed import/export operation.

This disqualifies the tested XDATA route for stable InfiniDrip piece/entity
identity. It does not prove that every CLO format/version/settings combination
drops XDATA, does not establish AAMA conformance, and does not pass V03. It
does not change the separate S536/S547 Polo geometry failure, CUT/SEW semantic
ambiguity, marks, grading/options, malformed-input, or all-seven round-trip
gates.

## Exact operation and evidence

- Receiver: CLO 2026.1.310 (r58944), already-running session; user has
  confirmed in writing that product-development evaluation and local DXF
  processing are permitted.
- Input: S536's hash-pinned Polo M AC1015/R2000 `LWPOLYLINE` fixture with only
  one registered application table and custom XDATA added. The source
  coordinates, 9 CUT contours, 9 SEW contours, 38 mark entities, layers, and
  entity order are unchanged. Input SHA-256:
  `C4D0D2D29CECF261EFE40D5E56D87F537D42D2931B139D0AD7E534AC1D124293`.
- CLO import: DXF-AAMA, centimeters, 100%, no rotation, maintain original
  grain, import notches to both at ratio; annotation/autotrace/swap/auto-
  distribute/curve optimization/non-grading-point removal off. **Deviation:**
  `Import Draw Curve Points` was unchecked, while S536's recorded setting is
  checked. This limits geometric comparison; it does not alter the input
  XDATA or the file-level finding that output has no registered app ID or
  source entity IDs.
- Rendered output: CLO's 2D Snapshot was saved as a one-page PDF and rendered
  to PNG in the dedicated S588 Evidence folder on C:. The inspected page shows
  all nine imported Polo M pieces (front, back, sleeve, both plackets, both
  stands, and both collar leaves). The light line weight remains visible; this
  is a visual piece-presence check, not contour precision evidence.
- CLO export: DXF-AAMA, graded nest, centimeters, 100%, no rotation; duplicate
  notch on seam allowance on; other listed grade/baseline/seam-allowance,
  curve conversion/optimization and bounding-box options off. Output SHA-256:
  `25F702CEF3BCA89A4C24450C0051414BC2CC381965530736FCD565AA888F5204`.
- XDATA report:
  `C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot\Evidence\xdata-retention-report.json`.
  Output registered-app occurrences: 0; retained IDs: 0/56. Output is
  AC1009/R12 and uses numeric layers `1`, `14`, `15`, `2`, `3`, `7`, `8`.
- Geometry comparison was deliberately not attributed to this XDATA trial.
  The active CLO scene contributed two pre-existing inserts, so the export
  contains 11 inserts and 48 block polylines; together with the import-option
  deviation, this prevents a defensible isolated piece-by-piece geometry
  result. The known S536 result remains authoritative: five of nine Polo CUT
  contours miss the unchanged `0.001 cm` gate. See
  `C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot\Evidence\geometry-comparison.json`.

All DXF exchange files, CLO output, snapshot PDF, rendered PNG and reports are
inside `C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot`. No project was
saved; the CLO session remains open for admitted G04 work.

## Gate disposition

- **Completed:** input preflight proves exact geometry/order preservation and
  56 unique IDs; one CLO import/export operation completed without a format
  error; output IDs were parsed and classified; the actual rendered 2D output
  was saved and inspected.
- **Negative result:** tested DXF-AAMA path removed the registered APPID and
  all 56 custom source IDs. Do not continue the XDATA route or infer any IDs
  from output order, block handles, or geometry.
- **Still held:** V03's supported-profile and round-trip criteria for all
  seven recipes, exact geometry, CUT/SEW semantics, complete marks, grades and
  options, malformed-input handling, and rendered detail. The 0.001 cm gate,
  all-seven criterion, export byte identities, and legacy DXF behavior are
  unchanged. EPIC-17/G04-V03 remains In Progress.
- **No claim:** this pilot does not establish industrial AAMA conformance,
  broad CLO incompatibility, physical fit, factory acceptance, or production
  readiness.

## Verification and time ledger

- `node prepare-xdata-variant.mjs`: passed source hash, geometry/order
  identity, registered APPID, and unique ID assertions.
- `node --check analyze-xdata-output.mjs`,
  `node --check analyze-geometry-output.mjs`,
  `node analyze-xdata-output.mjs`, and
  `node analyze-geometry-output.mjs`: passed. Results: 0/56 XDATA IDs retained;
  output geometry explicitly marked not attributable to this test.
- Saved CLO Snapshot PDF: one page, CLO 3D 2026.1.310 creator, visually
  inspected after rendering to PNG. Nine expected pieces are present.
- Focused Control Center suite: 42/42. Validated board preflight/replay and
  `git diff --check`: recorded at the exit boundary below. No production
  source/tests changed, so changed-code coverage and the full repository gate
  are not due in this evidence-only slice.
- Start: `2026-10-09 06:28:10 UTC`, from S587
  `712c482956df608941f789b7ff958dbf39f8e041`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S588 is
  unique; canonical board started at revision 3467. Exit replay advanced it to
  3469 and the exit preflight passed with G04-V02 Done and G04-V03/EPIC-17 In
  Progress. Goal remains active.
- Exit: `2026-10-09 06:45:55 UTC` (17m45s elapsed). Time ledger: fixture
  preparation and controlled input checks 2m; CLO import/export interaction
  and rendered review 9m; output analysis and focused verification 3m;
  durable packet/state/board closeout 3m45s; external-agent waits 0; maintainer
  decision time 0 (the written authorization was already recorded).
- `npm run control-center:test`: 42/42 passed. S588 analysis/preflight/replay
  scripts pass `node --check`; validated board replay 3467→3469 and exit
  preflight pass. `git diff --check` passes. No full repository test/coverage
  gate is due for this evidence-only slice.

## Next action

S589: reconcile the already retained seven-recipe, two-generation CLO AAMA
evidence against the exact G04 V03 acceptance matrix, separating criteria
already evidenced from failed and still-unmeasured rows. Do not repeat the
XDATA test, alter a gate, or launch another CLO trial without a new specific
mechanism. Use this reconciliation to identify the shortest evidence-backed
remaining route or a concrete no-go decision for CLO's tested path; keep the
Epic and V03 open until all admitted acceptance criteria or an explicitly
approved scope revision are resolved.
