# EPIC-17 / G04 V03 — CLO Standard export round-trip diagnostic — Slice 508 start

## Goal and bounded scope

Determine whether changing only the export/reimport mode from DXF-ASTM to
Standard DXF avoids S507's concrete loss of six of 100 polyline records in the
Polo M ASTM reimport/export round trip. Use the same hash-pinned Polo M source,
CLO 2026.1.310, 1000% Standard import, centimeter interpretation, no rotation,
grain/notch settings, and curve optimization off. Export Standard DXF, reimport
at 100%, then export Standard DXF a second time. Save the native projects,
input copy, outputs, screenshots, and analyzer reports only under
`C:\G04-CLO-DXF-Exchange\S508-polo-standard-export-roundtrip`.

## Start state and slice reservation

- Started `2026-10-08 16:59:03 UTC` from S507 commit
  `d4a113ac3c340afc412c6458973d460b22014d9c` on `codex/epic-17-g04`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the branch.
- Canonical Control Center board starts at revision `3143`; G04-V01/V02 are
  Done, G04-V03 and EPIC-17 are In Progress. S507 is highest; 508 is reserved.
- Input source is the same Polo M revision as S503/S505/S507, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- User authorized practical CLO 2026.1.310 import/export evaluation and
  requires exchange files on C: in a purpose-named folder. Current live app
  inventory exposes one CLO workspace window.

## Acceptance and comparison

- Copy the pinned source to the named S508 C: folder and verify its hash before
  import.
- Hold every import setting constant with S507: Standard DXF, cm, 1000%, Do Not
  Rotate, Maintain Original grain, notches Both / Ratio, Optimize All Curve
  Points off.
- Change only export format to Standard DXF for both generations; use cm/100%,
  Do Not Rotate, same seam-allowance notch and optimization settings. Reimport
  generation one as Standard DXF, cm/100%, with S507's unchanged import
  settings except scale 100%.
- Capture settings and rendered output for both imports and both exports.
  Compare source CUT/SEW geometry and piece bounds without normalizing source,
  plus exact entity/polyline retention and record multiplicity through both
  generations. Preserve the `0.001 cm` geometry threshold.
- A visually rendered file or preserved polyline count alone does not pass V03.
  Standard DXF's industrial apparel semantics, rights/local handling, native
  grading, negative-control behavior, layers/marks, all-seven fixtures, and
  complete round-trip gates remain separate.

## Non-goals, risks, and dependencies

- No production-code, pattern/stitch/source-geometry, test, output baseline,
  protected export identity, or acceptance change.
- No inference from DXF extension, header, or CLO mode label to ASTM/AAMA
  conformance or a compatible apparel-CAD profile.
- No CLO-SET/CONNECT/cloud use, supplier contact, installation, terms
  acceptance, account change, upload, physical sampling, or factory claim.
- Rights/profile and local-only handling remain unestablished by this trial.
  CLO's official rights material previously identified those independent
  gates; this slice is limited to an explicitly authorized local file test.
- The test is stateful GUI work and has no safe disjoint ownership for external
  delegation. Codex controls the app, analyzes C:-confined outputs, and reviews
  all rendered evidence.

## Verification and next gate

- Preflight and replay this start record through the validated Control Center
  command layer; preserve V03 status and acceptance criteria.
- Inspect live settings, actual imports/exports, all pieces rendered, source
  bounds, contour witnesses, and records retained across both generations.
- Preserve the full repository coverage/build/browser/output gate for the
  settled integrated Epic candidate. No production code changes are planned;
  run only focused evidence/board checks in this slice.
- At exit, report pass/fail/unknown per scoped measure, elapsed implementation,
  focused verification, external-agent waits and maintainer-decision time, and
  reserve the next unique slice from refreshed Git/board state.

**Single next action:** execute the controlled Standard DXF two-generation
trial and let measured output determine whether this export mode resolves the
S507 record-loss finding.
