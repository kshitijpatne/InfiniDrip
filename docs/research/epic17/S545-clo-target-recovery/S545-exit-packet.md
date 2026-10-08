# EPIC-17 / G04 V03 — CLO target recovery and AAMA trial — Slice 545 exit

## Result

The fresh computer-use state was targetable: CLO's visible file picker and
import settings matched the accessible controls. Without closing or reopening
CLO, the existing S544 Tee, Polo and Woven M/default DXFs were imported and
exported twice with the pinned DXF-AAMA profile. All exchange files and
screenshots remain under
`C:\\G04-CLO-DXF-Exchange\\S544-aama-three-recipe-roundtrip`.

CLO showed its informational Custom-mode seam-allowance notice. It completed
all imports/exports without a format error or crash. The visible source,
re-import and second-export layouts retained their major pattern pieces; this
visual screen review detects gross loss only and does not certify construction
semantics or grading.

## Geometry comparison

The C:-only diagnostic
`Evidence/three-recipe-roundtrip-analysis.json` compares closed source
polylines to closed block polylines in both generations using symmetric
vertex-to-segment distances in centimeters and the unchanged 0.001 cm gate.
It allows differing vertex counts; the original S545 draft required equal
counts and falsely reported 9 cm misses for several Polo contours. The
corrected comparator's exact summary is:

| Recipe, M/default | Source contours | Generation 1 | Generation 2 | Maximum distance |
| --- | ---: | ---: | ---: | ---: |
| Tee | 6 | 6/6 within gate | 6/6 within gate | 0.00003081 cm |
| Polo | 18 | 13/18 within gate | 13/18 within gate | 0.01398790 cm |
| Woven | 24 | 24/24 within gate | 24/24 within gate | 0.00006308 cm |

Five Polo cut contours (source ordinals 2, 10, 12, 14 and 16) exceed 0.001 cm
in both generations: 0.01274–0.01398 cm (0.127–0.140 mm). Each has one fewer
output vertex than its source. Gen1/gen2 results are effectively stable, so
the discrepancy appears on the first CLO exchange cycle; this test does not
isolate whether import or export introduces it. Do not waive the gate or call
Polo geometry passed. Three, five and ten source contours respectively have
multiple geometrically equivalent output candidates (duplicate output
layers); therefore these geometric matches do not prove semantic layer
mapping.

The comparator checks sampled vertices against the opposing polyline
segments; it is an evidence diagnostic, not a certified industrial CAD
conformance parser. It does not evaluate grade rules, all options/sizes,
labels, marks, sewing metadata, malformed-input behavior, or semantics.

## Outputs and evidence

- Tee: `tee-aama-gen1.dxf` SHA-256
  `6520428BE981F76B12CE745314521BE2B8887095FFC150AAF0FF4B1F0852C26C`;
  gen2 `A8BBFFB19BF29B4237796A2CF52B411105A865019B53259A83936D14E6AE6264`.
- Polo: `polo-aama-gen1.dxf` SHA-256
  `CAC8D2D90A7B72BFEBCF9BEDBEF7C1C91E3558C3386423F833E080C283BB0470`;
  gen2 `AE3731633A396CC94911DFE7EE53CD0DC85E847A04420A0C6E985B8CF57C1241`.
- Woven: `woven-aama-gen1.dxf` SHA-256
  `CE5AF6D491B236811EBB0F3161A9579A7E14C85BA0B646EF1DB90F59F6EA2982`;
  gen2 `E21DDF33E16C93AE770108B3A529085D924969975F07B93ABCD06812BE155CD7`.
- Full comparison JSON SHA-256
  `B3A3A54E719C2E42A47C5AD10F7314D4B4405F8F4D8BA9BB0DCA8E703D72D7FC`.
- The earlier C:-only `Evidence/tee-roundtrip-analysis.json` is a superseded
  Tee-only cyclic-vertex report; use the combined symmetric point-to-path
  report above for the three-recipe results.
- CLO source/import, export-settings, re-import notices/renders and gen2
  settings/renders are in the C:-only `Evidence` folder. The Woven gen2
  rendered capture SHA-256 is
  `95BB3CDE9EB6E8D336706253923A164E8A26E22D979216E755BA3B92E55B8E1B`.

## Gate disposition and next action

- **Passed for this limited fixture run:** targetable CLO UI; DXF-AAMA
  centimeter import/export and two generations for three M/default fixtures;
  no displayed import/export error; Tee 6/6 and Woven 24/24 closed-contour
  geometry within the current 0.001 cm threshold; rendered gross-piece review.
- **Failed/held:** Polo 5/18 contours exceed the 0.001 cm threshold in both
  generations. Keep V03 open. Do not claim full round-trip acceptance.
- **Not tested:** remaining four recipes, sizes/options/grades, semantic layer
  mapping, labels/marks/sewing rules, malformed-input behavior, and exact
  standard/profile conformance. The outputs are not proof of industrial
  compatibility. Rights and local handling are confirmed in writing; no
  further permission decision is pending.
- **Unchanged:** 100% project coverage, legacy DXF behavior, protected export
  byte identities, V02 acceptance, and every V03 profile/rights/grade/semantic
  gate. No product source, pattern geometry or acceptance gate changed.

Next: reserve the next unique slice from refreshed history and isolate the
five Polo contour deltas against the source fixture and actual imported
geometry. Identify whether the first-cycle delta is introduced by CLO import
or export before testing a narrow profile/setting change. Preserve the 0.001
cm gate. Then cover the remaining recipes and malformed, semantic, and grade
checks. CLO stays open for the admitted follow-up work.

## Verification, board and timing

The diagnostic uses no production files outside the C: trial folder. `node
--check` passes for the analyzer, exit preflight and replay helper; the
three-recipe analysis completes and writes only to C:. Exit preflight passes
without writing at revision 3295. `npm run control-center:test` passes 42/42;
`git diff --check` passes. The first replay-helper attempt failed because
`npm` was not resolvable from Node's child-process PATH; its output and the
diagnosis are preserved in `board-replay-first-attempt.txt`. The helper was
corrected to call `process.execPath` with the repository CLI; validated
commands added exit evidence/comment at board revisions 3294–3295, without
changing G04-V03 status. No production code or tests changed, so production
changed-code coverage, build and export identity gates are not due; the one
global gate remains at the settled Epic candidate. No safe delegation was
available because the UI session and fixture files are stateful/shared.

Started `2026-10-08 22:14:40 UTC` from S544 `016b13cb78495ef017403553072a0ff5a48dff07`;
refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
ancestor. Reserved S545 as the unique next slice. Closed at
`2026-10-08 22:36:08 UTC`, 21m28s elapsed. Approximate elapsed categories:
diagnostic-tool implementation 3m; CLO exchange and render review 10m;
geometry reconciliation and output diagnosis 4m; focused verification,
records and board 4m28s; agent waits 0m; maintainer-decision time 0m.
Board start/exit replay is `3291→3293→3295`.
The thread goal record was inspected at this verified boundary: status is
`active`, and its objective matches the current G04/V03 records through safe
merge. It remains needed; no manual UI resume or goal edit is required.
