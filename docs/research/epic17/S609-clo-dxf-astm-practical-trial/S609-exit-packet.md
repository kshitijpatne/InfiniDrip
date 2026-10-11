# EPIC-17 / G04 V03 — CLO DXF-ASTM practical trial — Slice 609 exit

## Verified result

- Closed 2026-10-09 11:30:35 UTC at the current verified slice boundary on
  `codex/epic-17-g04`. Started 11:16:15 UTC from S608 commit
  `954a4a4056f7c3039b37de795423f7ca98865741`; at start,
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor,
  the tree was clean, and board revision was 3566. S609 start replay moved
  3566→3568. Exit replay moves 3568→3570. G04-V02 remains Done; G04-V03 and
  EPIC-17 remain In Progress.
- The maintainer's written confirmation settles permission for this CLO
  product-development evaluation and local-only processing. All imported,
  exported, rendered, and analysis files for this trial are under
  `C:\G04-CLO-DXF-Exchange\S609-clo-dxf-astm-practical-trial\`. CLO
  2026.1.310 remains open. No saved garment project or product source changed.
- In the existing CLO session, the hash-pinned original Polo M DXF imported
  using DXF-AAMA, centimeters, 100%, no rotation, and preserved grain. CLO
  displayed an informational message that source seam allowances were
  imported in Custom mode to preserve their shapes; there was no format error.
  Nine pieces rendered. The output was exported once using CLO's
  DXF-ASTM / Graded Nest / centimeters / 100% / Do Not Rotate settings with
  grading and seam allowance included, then the exact emitted file was
  reimported using DXF-ASTM at centimeters / 100% / no rotation. The same
  seam-allowance Custom-mode notice appeared; there was no format error and
  nine pieces rendered again.
- The source was `polo-standard-m.dxf`, 24,261 bytes, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
  The CLO output `polo-m-clo-dxf-astm.dxf` was 221,640 bytes, SHA-256
  `be0f11fc3fca57887bdacce366034e4cf4479c2867be4529181dec34fffcb9e0`, and
  advertises AC1009. It contains nine inserted piece blocks. Output layer
  names are numeric (`1`, `84`, `14`, `87`, `8`, `85`); this trial does not
  establish their CUT/SEW manufacturing meaning.
- Source-bound geometric comparison at the unchanged `0.001 cm` threshold
  binds all nine pieces through their source SEW geometry. SEW paths pass
  9/9, with maximum cyclic coordinate delta `0.00003513 cm`. CUT outlines
  pass 4/9 (front, sleeve, button placket, buttonhole placket) and fail 5/9
  (back, outer stand, inner stand, upper collar, under collar). The failing
  conservative upper bounds are respectively `0.0129907`, `0.0132274`,
  `0.0142242`, `0.0132402`, and `0.0132489 cm`. Each failing output has one
  fewer polygon vertex than the source outline. The analysis parser reads
  R12 POLYLINE child VERTEX records and compares sampled bulge/segment
  geometry with a conservative `0.00025 cm` sampling allowance. It retains
  output layer inventory but does not infer layer roles.
- CLO's PDF snapshot is one landscape sheet with all nine reimported pieces
  labeled; the rendered view confirms gross piece presence, not useful-zoom
  notch/mark or construction-detail fidelity. No displayed error was needed
  to determine the gate failure: the source-bound outline measurement fails.

## Evidence and hashes

All newly created trial evidence is in the named C: folder above.

- `analyze-astm-roundtrip.mjs` SHA-256
  `ebd142a4f71788866b8a244041ccbb84ccfeff34ca0880a9d60eda91f98a96d9`.
- `source-preflight.json` SHA-256
  `c8c575dddab35a2a0c4e4a56b668647891359e1fc539ec92850f2ba9c25ea5ba`.
- `Evidence\Analysis\S609-dxf-astm-roundtrip-analysis.json` SHA-256
  `5b8f4a41ad100d119c25a2421f601d72c060ec40926a7cbaF7344c0c8c1009ac`.
- `Evidence\polo-m-astm-reimport-render.pdf` SHA-256
  `9aedf5f54fcf2608b6b1a71b315a19857260cde4f74789e7a03144d81266893a`;
  rendered and visually inspected from the C: PDF for all-nine piece presence.
- CLO export hash and source hash are recorded above and reverified at exit.

## Gate disposition and next action

S609 proves that this particular CLO build/settings can import the input,
write a DXF-ASTM-labeled AC1009 file, and reimport/render it without a format
error. It does **not** pass the unchanged CUT geometry gate: five of nine cut
contours exceed `0.001 cm`. The 9/9 SEW and 4/9 CUT results are for one Polo M
fixture only. ASTM in a menu or AC1009 header is not evidence of a named
normative ASTM edition or industrial profile conformance. No profile or
receiver is qualified, and no V03 acceptance gate clears.

The unchanged V03 holds include all-seven-recipe and supported-configuration
round trips, all CUT/SEW geometry, stable piece/revision/size identity,
documented layer/role semantics, marks/notches/labels/seam allowance,
units/scale, grades/options, malformed-input rejection, repeated-generation
stability, and useful rendered detail. Keep V02-before-V03, the all-seven
criterion, the `0.001 cm` gate, legacy DXF behavior, protected export byte
identities and every hold intact. No physical fit, factory acceptance or
production-readiness claim is made.

Next, consolidate this measured ASTM result with earlier AAMA/ASTM work in the
current V03 gate matrix and inspect only new, source-backed interoperability
evidence capable of addressing the five vertex-loss failures and remaining
semantic gates. Do not repeat the same Polo M ASTM settings or retry a
previously rejected AAMA spline variation. Keep CLO open while G04 work is
active.

## Focused verification and time accounting

- `analyze-astm-roundtrip.mjs` passes `node --check`; its report reattests both
  source/output hashes, nine distinct SEW-bound piece identities, 9/9 SEW
  passes and the 4/9 CUT pass count. The initial generic pairwise geometry
  comparison was stopped after it was seen to be unnecessarily expensive; the
  revised analyzer binds by exact SEW path first and compares each CUT only to
  its own piece's closed outlines. The optimized comparison completed and its
  report was preserved. No unexplained background analyzer remains.
- The PDF was rendered with Poppler to a PNG inside the C: trial folder and
  visually inspected. It shows all nine labeled pieces, with fine marks too
  light at sheet scale to certify.
- Focused Control Center suite passed 42/42. Exit evidence preflight passed
  against the pinned output/report/PDF hashes and geometry counts; validated
  command-layer replay moved the board 3568→3570 while retaining all work-item
  states. Analyzer, preflight and replay scripts pass `node --check`, and
  `git diff --check` reports no whitespace errors. Two initial preflight runs
  exposed brittle assertions (exact packet phrase casing and expecting the
  pre-replay revision after replay); the assertions were corrected to verify
  meaning and both valid boundary revisions, then the final preflight passed.
  No production source/test code changed; changed-code coverage is not
  applicable. Full repository build/coverage/browser/output gates remain for
  the settled integrated Epic/PR candidate.
- Elapsed time (11:16:15–11:30:35 UTC): implementation and CLO/UI exchange
  work approximately 8 minutes; focused analysis, render review and closeout
  approximately 6 minutes; external-agent waits 0; maintainer-decision time 0.
