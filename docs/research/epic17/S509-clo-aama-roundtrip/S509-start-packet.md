# EPIC-17 / G04 V03 — CLO AAMA DXF round-trip trial — Slice 509 start

## Goal and bounded scope

Test whether CLO's explicitly named `DXF-AAMA` import/export mode avoids the
source-contour and second-generation stacking problems observed in S503/S507
and the corrected S508 Standard DXF round trip. Use only the hash-pinned Polo M
fixture and CLO `2026.1.310`; perform AAMA import, first AAMA export, AAMA
reimport, second AAMA export, and a final AAMA reimport/render. This is a
practical candidate diagnosis, not a compatibility claim or V03 acceptance.

## Verified start and reservation

- Started `2026-10-08 17:31:11 UTC` from S508 commit
  `2ec3867859c169166a31e875c9ca5519a8b4a2ef` on `codex/epic-17-g04`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S508 is highest;
  S509 is reserved. Board revision 3147 has V01/V02 Done and V03/EPIC-17 In
  Progress.
- Start evidence/comments advance the canonical board to 3149 through the
  validated command layer; acceptance and statuses remain unchanged.
- Fixture SHA-256 is
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- The S503 AAMA × curve-optimization matrix already tested AAMA **import** at
  100% and then exported as ASTM. It did not test AAMA export/reimport; this
  slice addresses that specific gap using optimization off.

## Controlled settings and acceptance

- Copy the pinned Polo M DXF into
  `C:\G04-CLO-DXF-Exchange\S509-polo-aama-roundtrip\Input` and verify its hash.
- Initial import: DXF-AAMA; centimeter/100%; Do Not Rotate; Maintain Original
  grain; Import Notches Both / Ratio; Optimize All Curve Points off. These
  match S503's AAMA import cell, preserving a directly comparable baseline.
- Both exports: DXF-AAMA; Graded Nest; centimeter/100%; Do Not Rotate; Duplicate
  Notch on Seam Allowance on; Optimize All Curve Points off; other optional
  export toggles off.
- Both reimports: DXF-AAMA; centimeter/100%; Do Not Rotate; Maintain Original
  grain; notches Both / Ratio; optimization off.
- Capture exact settings, all notices/errors, settings/render screenshots, and
  save each native project before its export. Keep every source/exchange file,
  project, screenshot, and analyzer output beneath the named C: S509 folder.
- Compare original source contours, generation-one output, generation-two
  output, size/piece/mark records, and final rendered reimport. Use the
  unchanged `0.001 cm` geometry threshold and source-specific witnesses; do not
  infer industrial layer meanings from numeric layer codes.
- AAMA output must retain measurable source geometry, piece/grade association,
  marks, units and orientation through both generations, and the final imported
  output must remain separated/readable. Renderability or an absent dialog error
  alone is not a pass.

## Holds, risks, and non-goals

- V03 rights and local handling remain unresolved; the S506 research did not
  establish a qualifying receiver. The UI mode label does not prove AAMA
  conformance, an industrial profile, or permission. No receiver will be
  selected from this trial alone.
- Native grading, negative-control behavior, all-seven recipe fixtures, and
  complete profile-specific round-trip acceptance remain separate required
  gates. Polo CUT geometry from S503/S507 remains failed unless the new measured
  evidence proves otherwise.
- No pattern/source geometry, production code, tests, protected export baseline,
  acceptance criterion, account/privacy setting, or user data outside the
  purpose-named C: folder may be changed. No CLO-SET/CONNECT/cloud, supplier
  contact, physical sampling, factory claim, or production-readiness claim.
- This stateful app test has no safe disjoint external-agent ownership; Codex
  controls the file flow, observations, analysis, and rendered review.

## Verification and next gate

- Focused evidence: fixture hash; exact UI settings/notices; both generations'
  source/output record and geometry comparisons; rendered output review;
  project/output hashes and locations; validated board replay; `git diff --check`.
- No repository production code changes are planned. Preserve 100% coverage,
  build/browser/output and protected-export gates for the settled integrated
  Epic candidate.
- At exit, record the observed AAMA path as pass/fail/unknown per measured gate,
  actual errors separately from visual/metric failures, elapsed implementation,
  focused verification, external-agent waits, and maintainer-decision time.

**Single next action:** create the named C: evidence folder, copy and verify the
pinned source, inspect the returned CLO window, then run only the controlled
AAMA import/export/reimport sequence above.
