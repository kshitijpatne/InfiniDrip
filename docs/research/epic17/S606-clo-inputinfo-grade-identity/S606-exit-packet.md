# EPIC-17 / G04 V03 — CLO input-info path identity — Slice 606 exit

## Verified boundary and result

- Closed 2026-10-09 10:47 UTC. Started 10:40 UTC from S605 commit
  `b057e11f19aef6e1eee234ae27991318421f6f8d` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S605 was the prior highest slice; S606 is unique. Board start
  revision 3554; validated start replay reached 3556.
- CLO 2026.1.310 (r58944) stayed open on the existing S565 corrected-sizegroup1
  project. User-confirmed product-development authorization and local-only file
  processing apply. All query files and the screenshot are on C: in
  `C:\G04-CLO-DXF-Exchange\S606-clo-inputinfo-grade-identity\`.
- The helper called the observed `GetPatternCount` and documented
  `GetPatternInputInformation` for each of three indexes; raw results contain
  no API errors. No selection, setter, grade edit, geometry edit, project save,
  import, export or product-source edit occurred.
- The exact S565 XS CUT/SEW contours were compared with returned coordinates
  after the S567 DXF-ASTM centimeter-to-millimeter factor of 10. Matching used
  cyclic start and reversal only; there was no translation, rotation, scaling
  fit or point projection. At the unchanged `0.001 cm` gate, both CUT source
  contours matched the root and child-shape indexes 0 and 1; each SEW contour
  matched child-shape index 2. Maximum residual was `0.0000682394 mm` for the
  two five-point pieces and `0.0000610352 mm` for the four-point waistband.
- This is exact-project geometric correspondence, not a documented CLO
  semantic guarantee. API documentation does not specify coordinate units or
  establish that “Base Line” means CUT or SEW. It distinguishes the waistband's
  SEW-shaped child geometry numerically, but does not prove a GUI grading point
  selection, grade setters, export semantics or successful graded exchange.
  The prior S603 ambiguity therefore remains held.

## Evidence and hashes

- Helper `s606-read-input-info.py` — SHA-256
  `6A6B68E61EA7D31AFFC5B8E16F1949BDA30E97504B0A913F7E3D0A5E8E01FF10`.
- Raw `pattern-input-information.json` — SHA-256
  `400D4E5E46272187F0B10C2C7B402B0329258688E6A6B9F5A1AECCE5D20EAAC8`.
- Comparison `source-geometry-comparison.json` — SHA-256
  `28721CB4CDA374DC8C0C21A88136D52AB5F6F95559CA97277BA5AA8333183DA3`.
- CLO Python Editor screenshot
  `Evidence\s606-input-info-query-editor.jpg` — SHA-256
  `11FBC72B1B1C88239EFEB3D93E6522ADF5BCBEEB406C7818DE14D7993AB203D4`.
- Comparison input is the S565 source report, SHA-256
  `FA6330473157DE458B36B4060D245097E128F63CA8F58377B50AB6A299A84C81`.

## Gate disposition and next action

S606 clears no V03 acceptance gate and makes no compatibility claim. Keep all
seven-recipe coverage, rights/profile review, marks, labels, grade data,
supported options, malformed-input behavior, exact CUT/SEW semantics and
repeated round-trip evidence pending as applicable. Keep V02 Done, V03 and
EPIC-17 In Progress, legacy DXF behavior and protected export identities
unchanged. Do not claim physical fit, factory acceptance or production
readiness.

Next: on a fresh unique slice, use this specific path map to inspect the CLO
grading UI for the pattern index 2 / child-shape index 2 internal sewn contour.
Only enter the five-size source-derived SEW deltas if the visible target is
unambiguously that path. Then export/reimport the disposable waistband fixture
once using the observed DXF-ASTM Graded Nest, cm, 100%, Do Not Rotate profile;
compare all five CUT/SEW contours at `0.001 cm` and inspect the actual rendered
output. If target identity or UI selection is ambiguous, do not enter values;
retain the hold and pursue a different pending V03 gate. This does not waive
all-seven recipe acceptance.

## Focused verification and timing

The raw JSON parsed with three patterns, four total API calls and zero errors;
the comparison report was regenerated and inspected. Start and exit board
commands use the validated Control Center command layer. Focused Control Center
tests: 42/42; `git diff --check`: pass. No product code or production tests
changed, so no changed-code coverage or full repository gate is due. Full
coverage remains reserved for the settled Epic/PR candidate.

- Implementation/query and source comparison: 4 minutes.
- Focused verification and durable closeout: 3 minutes.
- External-agent waits: 0 minutes.
- Maintainer-decision time: 0 minutes.
