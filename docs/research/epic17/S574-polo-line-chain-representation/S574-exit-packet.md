# EPIC-17 / G04 V03 — Polo line-chain representation probe — Slice 574 exit

## Result

S574 completed one practical CLO 2026.1.310 / DXF-AAMA import, export, and
re-import of the hash-pinned Polo M fixture after converting only the source
CUT closed R12 POLYLINE records into endpoint-identical connected LINE
segments. CLO accepted the file, rendered nine pieces, exported generation one,
and re-imported that export with nine pieces rendered and no error dialog.

The geometry gate **fails**. A source-to-output symmetric vertex-to-segment
comparison at the unchanged 0.001 cm threshold finds all nine source SEW
contours within the gate, but none of the nine source CUT contours within the
gate when matched to the corresponding output piece block. CUT residuals range
as follows: 0_M 2.236068, 1_M 2.236064, 2_M 2.131476, 3_M 1.414220, 4_M 1.414231, 5_M 9.310858, 6_M 9.310805, 7_M 9.310857, and 8_M 9.310857 cm.
The export contains 27 closed polyline contours in nine piece blocks, so this
is not a missing-file or visibly open-piece result. The rendered output alone
cannot settle which CLO numeric layers encode each manufacturing role; the
report deliberately does not infer that numeric layer semantics are CUT/SEW.
Source contours alternate CUT/SEW by piece ordinal; block n_M was associated with pair n. Exact SEW path matches in all nine blocks support this geometry association, but no explicit source piece ID is claimed. Eight SEW matches have more than one geometrically exact closed contour in the
same block, so layer and meaning are still ambiguous even where coordinates
match.

The S574 hypothesis was not confirmed: explicit connected LINE input is
accepted and renders, but that fact does not preserve CUT geometry through the
measured round trip. Generation two was **not run** because generation one
missed its required geometry gate. This leaves a concrete technical blocker;
rights and local processing are settled by S573 and the maintainer's written
confirmation. No compatibility or formal AAMA-conformance claim follows.

## Evidence and setup

- Source Polo M DXF:
  C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Input\polo-source-m.dxf;
  24,261 bytes; SHA-256
  796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA.
- Derived input:
  ...\Input\polo-source-m-cut-lines.dxf; 29,435 bytes; SHA-256
  A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675.
  The durable derivative report confirms 9 CUT contours / 301 source vertices
  became 301 closed-chain LINE records with original coordinate strings;
  all nine non-CUT polylines and other entity records were copied unchanged.
- CLO import profile: DXF-AAMA, centimeters, 100%, no rotation, maintain
  original grain angle; annotations off; auto-trace off; swap cut/sew off;
  notches enabled (both, ratio); auto-distribute off; optimize curve points
  off; import draw curve points on; remove non-grading points off.
- CLO stated that no seam allowances were present and the DXF was imported in
  Custom mode to preserve original shape. This is informational. The nine
  pieces rendered; no import failure was shown.
- Export profile: DXF-AAMA, Graded Nest, centimeters, 100%, no rotation;
  selected patterns off; remaining displayed defaults unchanged. No export
  error was shown. Gen1 file SHA-256:
  346F38A02748F96247716D9E5A992912CC018CB2EEB4506C092C4F43EEDAF1E3.
- Gen1 re-import used the same documented importer settings. CLO repeated the
  informational Custom-mode/no-seam-allowances notice and rendered nine
  pieces. The CLO project was saved locally, and CLO's own 2D snapshot was
  saved to the named evidence folder and rendered for visual review.
- Evidence hashes: pre-test project
  317C2D3CD94792B212738F125CDC754F8E605A482F7A357E0279B28E70C95819;
  post-input-import project
  43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25;
  post-gen1-reimport project
  0DCCD455D1FB2F45DB66129F8355E015F80BFDDBC174B3AA2C454DED78F9FD04;
  rendered snapshot PDF
  31C87CD277120DD41095ABDEC116642C162BB932462FCD8FD248921BB0C4F70A; rendered PNG review
  9893867185B65243C96ABAFC8ACCCAD312EE486C2582C4146587FAB51B8AC18A.
- Machine-readable comparison:
  C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Evidence\line-chain-gen1-analysis.json.
  Rendered output:
  C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Evidence\clo-gen1-output-render.pdf.
  Every application input/output/project and rendered evidence file was kept
  under C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation.

## Acceptance, holds, and next action

- **Pass:** CLO locally accepted and rendered the line-chain input; generation
  one exported and re-imported; nine pieces rendered after re-import; no DXF
  import/export error was displayed.
- **Fail:** 9/9 source CUT contours miss the 0.001 cm gate against the
  corresponding block's closed output contours. **Partial only:** 9/9 SEW
  contours have at least one within-gate path match, but eight have duplicate
  exact candidates and numeric layers are not semantically mapped.
- **Still pending:** CUT/SEW role mapping, marks/notches, grade and supported
  option exchange, malformed-input rejection, fine-detail output validation,
  all-seven recipe round trips, and sufficient representative evidence for
  any compatibility claim. Preserve the full admitted V03 acceptance and all
  holds, plus G04's all-seven V02 acceptance, export byte identities, and
  legacy DXF behavior.
- **Next:** diagnose the concrete CLO layer/entity mapping in this generation-one
  file against the source piece identities and CUT/SEW contours. Establish
  whether the source CUT paths were retained under another DXF entity or role
  before any further representation trial. Use that evidence to choose one
  technically justified next experiment or stop this candidate. Do not alter
  production geometry, the generic/legacy writer, the 0.001 cm threshold, or
  acceptance scope. Keep the CLO session open for the next bounded test.

## Changes and verification

No product source, production test, legacy DXF writer, export baseline,
protected byte identity, scope, or acceptance criterion changed. The change is
limited to a repeatable derivative generator, comparison helper, durable
slice records, and board evidence. The shared CLO session stayed open; no
external service or cloud transfer was used.

The analyzer compares each source contour only to closed output contours in
its corresponding piece block, avoiding cross-piece matches. All 18 contours
were measured. The one-page CLO PDF snapshot was rendered to a 12661 × 5202 PNG
and visually inspected; nine pieces are present. Focused verification passed:
helper/preflight/replay JavaScript syntax checks, exit-command preflight,
npm run control-center:test (42/42), and git diff --check. No production
source/tests changed, so the full repository coverage/build gate is not due.

- Started 2026-10-09 04:11:27 UTC from S573 52b0adec7d4ce984099c59aef2d0667d141032c1.
- Refreshed origin/main a5af5e13c2e967946b3f6035fcea66ff03a5e0e0 remains an ancestor; S574 is unique after S573.
- Board start/exit replay: 3409→3411→3413; G04-V03 remains In Progress.
- Elapsed 23m35s (04:11:27–04:35:02 UTC): diagnostic-helper implementation 3m30s; focused CLO, geometry and rendered-output verification 14m06s; external-agent waits 0m; maintainer-decision time 0m; durable packet/state/board updates and focused checks 5m59s.
