# S676 exit — additive explicit-centimeter DXF candidate

## Result and correction

The S674 LibreCAD test input already contained centimeter metadata; LibreCAD's
R12 save omitted it. The measured S674 omission was receiver-side. Separately,
the live InfiniDrip writer in `src/export/dxf.ts` creates centimeter
coordinates but no header that says they are centimeters. S675's broad
statement that there was no product-code defect is superseded by this separate
source finding.

S676 adds `exportDxfCentimeters` in `src/export/dxf-centimeters.ts`. It prefixes
an AC1015 HEADER declaring centimeter units and then returns the exact existing
legacy DXF stream unchanged. It is an opt-in serialization candidate only: it
does not alter the default UI export, legacy bytes, geometry, marks, identity,
grading, or any receiver behavior. It is not an apparel CAD profile, a
standard-conformance claim, or V03 acceptance.

## Verification

- `npm run test -- src/export/dxf-centimeters.test.ts
  src/export/regression.test.ts`: 9/9 passed. The test compares the new output
  with the expected header plus the entire byte-identical legacy stream.
- Focused changed-code coverage for `src/export/dxf-centimeters.ts`:
  statements 100%, branches 100%, functions 100%, lines 100%.
- `npm run build`: passed; Vite reported its existing large-chunk advisory.
- `npm run control-center:test`: 42/42 passed after the S676 board transition.
- `git diff --check`: passed.
- The S674 rendered CAD view is unchanged by construction because the new
  helper preserves every legacy entity byte; S676 did not claim a new
  receiver-open/render result. Full receiver rendering and round-trip remain
  pending for a qualified empirical profile.

No production default, export identity, or acceptance threshold changed.
G04-V03 and EPIC-17 remain In Progress; V01/V02 remain Done. Every V03 gate
other than the presence of explicit units in this candidate remains open or
unproven, including receiver/profile qualification, all-seven/options/grades,
identity/relations, mark labels, malformed-input rejection, repeatability,
readable receiver output, and legacy/protected final gates.

## Boundary and time

Started 2026-10-10 17:23:45 UTC from S675 `336d3a2a`; refreshed
`origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
Board start replay 4016→4019 and exit replay 4019→4021. Slice 676 is unique.
Approximate elapsed time: 8.5 minutes total, including 7 minutes of
implementation/evidence review and about 1 minute waiting for the bounded Sol
review. Focused unit/regression tests, 100% changed-code coverage, Control
Center and diff checks took about 12 seconds; the build took about 15 seconds.
Maintainer-decision time was 0. No physical-fit, factory-acceptance,
production-readiness, or standards-conformance claim is made.

## Next

S677 will inspect the remaining code-owned exchange gaps documented in C04:
piece/revision identity, grade/size correspondence and mark identity/labels.
Keep the existing writer protected and the candidate non-default. Do not claim
V03 completion until the exact candidate passes the fixed receiver, option,
grading, negative-input, round-trip and rendered-output gates.
