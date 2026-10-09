# EPIC-17 / G04 V03 — Standard-DXF input-mode diagnostic — Slice 614 exit

## Verified result

- Closed 2026-10-09 12:15:08 UTC at the verified S614 boundary on
  `codex/epic-17-g04`.
  The slice's formal closeout began at S613 `1f633603c035c6f53331857c59a03838e2d5ed08`,
  with `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` an ancestor and
  the worktree clean. S613 was the highest prior slice; S614 is unique.
  Start board replay moved revision 3586→3588; exit replay moved 3588→3591.
- The authorized CLO 2026.1.310 experiment changed only the import selector
  from S609's DXF-AAMA to Standard DXF; the same Polo M source, unit/scale,
  rotation, grain, notches, curve-point and ASTM Graded Nest export settings
  were retained. CLO imported nine pieces, exported and reimported the ASTM-
  labeled DXF without a format error. CLO displayed its informational seam-
  allowance Custom-mode notice.
- The practical round trip is **not geometrically acceptable**. For the
  source front, 28.5 × 73.274 coordinate units became 2.850001 × 7.3274 in
  output block `0_M`, i.e. width and height ratios 0.10000004 and 0.1. The
  sleeve and both placket outlines likewise have exact cyclic/reverse vertex
  matches only after multiplying source coordinates by 0.1. This is a 10×
  size discrepancy against the unchanged source, not a passing unit conversion.
  The scale diagnostic reports 8/18 exact CUT/SEW source-path vertex matches
  at the 0.1 factor. The other paths do not match exactly; several output
  contours have fewer vertices. Numeric output layer names and block order are
  retained as observations only; this result does not assign layer semantics
  or claim persistent piece identity.
- In the reviewed CLO-native PDF, all nine pieces are present, but the sheet
  displays oversized/rotated labels and insufficiently legible construction
  detail. It proves gross presence only. PNG render SHA-256 is
  `38f04fc3a61d68ad0d7b975160dcf93360d492e9e67caf6144c6332bbabee3fa`;
  source PDF SHA-256 is
  `47b0e783118441a252a632ce875f3304627ab729ed362c99579c619a09c867534`.
- Scale diagnostic SHA-256 is
  `db7979d75f83bdc70a4be4537ee02cbc2c6d01e988459ed956f7f910a4bf3f2c`;
  output inventory SHA-256 is
  `af130d35b4024bdb2db8b7ce415ad0d289766287958dce6c327334e35935d651`.
  All experiment files remain under
  `C:\G04-CLO-DXF-Exchange\S614-standard-dxf-import-mode\`.

## Gate disposition

The controlled result identifies a practical scale failure for CLO's Standard
DXF input path under the documented cm/100% settings. The earlier AAMA path did
not show this 10× scale effect, but still failed five Polo CUT contours at the
0.001 cm gate. Neither path clears V03. The scale diagnostic intentionally
tests factors 0.1/1/10 to identify a mismatch; its scaled exact matches are
diagnostic evidence, not acceptance passes. CLO's successful menus and
reimport do not prove ASTM edition conformance, industrial profile identity,
rights for other receivers, or full manufacturing semantics.

Keep every V03 gate and all-seven criterion open: exact CUT/SEW geometry,
stable identity, layer and mark semantics, dimensions, grades/options,
negative inputs, repeated exchange, useful rendered detail, rights-reviewed
profile evidence and seven-recipe coverage. Preserve V02-before-V03, legacy
DXF behavior and all protected export byte identities. No source pattern or
production code changed. No physical fit, factory acceptance or
production-readiness claim is made. CLO remains open because G04 is active.

## Verification and time accounting

- `node --check analyze-standard-roundtrip.mjs` passed. The hash-pinned scale
  diagnostic completed in approximately two seconds, reports the 10×
  discrepancy, and does not infer layer or piece semantics. The prior
  brute-force sampled-distance fallback was stopped after it exceeded one
  minute; its output is not used. No analyzer remains running.
- The PDF was rendered with Poppler to the C:-only PNG above and visually
  inspected. `npm run control-center:test`, exit preflight, validated board
  replay and `git diff --check` are recorded with the slice closeout. No
  production source/test code changed, so changed-code coverage is not
  applicable. The full repository gate remains for the settled Epic/PR.
- The CLO/UI experiment preceded formal packet creation; its actions and
  chronology are disclosed in the S614 start packet, but its exact pre-packet
  duration is not recoverable. From the formal closeout start at 12:03:51 UTC
  to 12:15:08 UTC: analysis, analyzer adaptation, packet/state/board updates
  about 6 minutes; focused verification/render review about 5 minutes;
  external-agent waits 0; maintainer-decision time 0.

## Single next action

Do not repeat Standard-DXF input. Refresh V03 evidence and select one
source-backed, non-repeated receiver/profile path that can establish unit
handling and identity while preserving the unchanged 0.001 cm geometry gate.
All V03 criteria remain open.
