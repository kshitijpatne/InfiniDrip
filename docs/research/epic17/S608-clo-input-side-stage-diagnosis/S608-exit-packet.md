# EPIC-17 / G04 V03 — S595 input-side stage diagnosis — Slice 608 exit

## Verified result

- Closed 2026-10-09 11:12:34 UTC. Started at 11:00:11 UTC from S607
  `ed07289cb614ced8f6215b52d16abf79bad4d26c` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S607 was highest; S608 was unique. Start board revision 3562;
  start replay 3562→3564. Exit replay links this packet at revisions 3565–3566.
- The existing CLO 2026.1.310 (r58944) session stayed running. S601's saved
  S595 project identity was confirmed as the imported input-side scene. The
  read-only `GetPatternCount` / `GetPatternInputInformation` query returned
  nine patterns, 36 point-path candidates, and no API errors. No grade,
  geometry, project save, import, export, or product source changed.
- All nine patterns could be bound to a unique source piece using their exact
  source-SEW geometry within the unchanged `0.001 cm` threshold. Comparing the
  other returned paths for each bound pattern with that piece's source CUT
  gave an in-gate geometric candidate for the four already passing S595 CUTs
  (front, sleeve, button placket, buttonhole placket). None of the five S595
  failed CUT pieces (back, both stands, both collars) had a returned point
  path within the threshold. Their best candidate upper bounds were 2.2363 cm,
  4.7205 cm, 4.7196 cm, 4.54394 cm, and 4.54393 cm respectively. These are
  candidate-path measurements, not assertions that the API calls those paths
  “CUT.”
- The pinned S595 output still measures 4/9 CUT pass, 5/9 CUT fail, and 9/9
  SEW pass. The S595 periodic source proof remains exact. The input-side
  getter result therefore does **not** separate receiver import conversion
  from incomplete/API-specific geometry exposure. CLO's public getter docs
  do not define its path roles, closure, units, or whether every imported
  contour is represented. No CLO stage cause is inferred.

## Evidence and hashes

All S608 files are confined to
`C:\G04-CLO-DXF-Exchange\S608-clo-input-side-stage-diagnosis\`.

- `read-input-info.py` SHA-256
  `55643AFABC4768F535DCFE6C2A26E14D98EAB00F8E1C521930EEED044D35762C`.
- Raw `Evidence\pattern-input-information.json` SHA-256
  `E95B2DF7259211DBE68FF41A77867612931B6DBCA06BF919C5D288FC5D5C386A`.
- Reproducible comparison `Evidence\S608-stage-comparison.json` SHA-256
  `D798E4DA14706B2DE5C133BC5A76FEEFBE54306F935D38661F0B175FDD66C8CE`.
- Loaded-scene screenshot `Evidence\s608-s595-input-project-loaded.jpg` SHA-256
  `094F2B9BA93FA4D3D98A44A91FDE3B444DD39A55650A468AB4EDD7D346CE98DE`.
- Query screenshot `Evidence\s608-inputinfo-query.jpg` SHA-256
  `30FE4FFF1B61F7C4C4EE5FED5B740FD96065580E0468BC5193F14AE5BB4638E1`.
- Hash-pinned S595 source, periodic input, preflight, output and prior measured
  report are attested in the comparison JSON. The stage-comparison script
  `analyze-input-side.mjs` SHA-256 is
  `45E03BF7AB469A472E557AE26164C5A06A73BC65046B2E06E4D74402AD2440B9`.

## Gate disposition and next action

S608 clears no V03 acceptance gate and qualifies no receiver/profile. Preserve
the S595 five-CUT failure, all-seven scope, rights/profile review, piece and
revision identity, CUT/SEW semantics, marks, grades/options, malformed-input,
repeated-round-trip and rendered-detail requirements. Keep V02 Done and V03 / 
EPIC-17 In Progress. Preserve the exact `0.001 cm` threshold, legacy DXF
behavior and protected export identities. No physical-fit, factory-acceptance,
or production-readiness claim is made.

Next: refresh and consolidate the V03 evidence matrix, then audit prior CLO
profile/fixture trials for one genuinely untested, directly measurable route
before any additional receiver operation. Do not repeat the S595 AAMA SPLINE
test, S606/S608 InputInformation queries, S607 grading selection, or the
already tested waistband, malformed-input, synthetic-AAMA, and round-trip
render cases. Keep CLO running while G04 testing remains active.

## Focused verification and time accounting

- The S608 analysis script passes `node --check` and reproduced the pinned
  input/output hashes, nine source-SEW piece bindings, and per-piece geometry
  comparisons. One inefficient first implementation repeated unnecessary
  pairwise sampling; it was stopped and narrowed to exact-SEW piece binding
  followed by four-path-to-own-piece comparison. The final bounded analysis
  completed and its raw output was preserved in the S608 report.
- Validated start preflight/replay passed; Control Center focused suite passed
  42/42 at start. Run the final board preflight/replay, suite, and `git diff
  --check` at closeout. No production source/tests changed, so changed-code
  coverage is not applicable. Full repository build/coverage remains for the
  settled integrated Epic/PR candidate.
- Elapsed approximately 12 minutes (11:00:11–11:12:34 UTC): CLO scene load,
  query and screenshot 3 minutes; source-bound analysis and diagnosis 4
  minutes; focused verification and closeout 3 minutes; external-agent waits
  0; maintainer-decision time 0.
