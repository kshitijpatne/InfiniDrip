# EPIC-17 / G04 V03 — S694 exit packet

## Result and scope

S694 made one authorized import/export check in the already-installed CLO
2026.1.310 Standard DXF route, using the exact S693 Polo STANDARD_M size-M
candidate and the verified centimeter-to-millimeter input transform. It was
bounded to the representative `0.001 cm` CUT/SEW comparison, mark inventory,
and actual saved-output rendering. No production source, cut geometry, legacy
exporter, acceptance threshold, or protected export identity changed. All CAD
files and renders are outside the repository under
`C:\G04-CAD-Interchange\S694-clo-candidate-cuts\`.

**Outcome:** units and all 9/9 SEW paths pass for this one run. Two of nine CUT
paths pass; seven fail the unchanged `0.001 cm` limit. 105/108 source marks
match; the three missing items are `MARK_BUTTONHOLE` points, each 1.4999966 cm
from its expected source point. The return uses 132 `LWPOLYLINE` entities,
has no `LINE`, `POINT`, or `CIRCLE` entities, and replaces semantic source
layers with numeric layers 1, 7, 8, and 14. Nine pieces were visibly returned;
the whole-pattern overlay and inner-stand detail were rendered and inspected.
This is a concrete candidate failure, not V03 acceptance.

The measured CUT residuals establish where the files differ, **not why**.
Four stand/collar maxima share source vertex index 182 and y=75.791 cm, while
their source and returned path vertex counts differ. A read-only source/output
sequence diagnosis is the next slice. No further receiver operation is
justified until that diagnosis identifies a specific candidate encoding fix;
if the receiver changes an otherwise exact path, retire this route rather than
distorting product geometry.

## Hash-pinned evidence

- Submitted centimeter candidate: 177,875 bytes,
  SHA-256 `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`.
- Exact CLO return: 367,021 bytes,
  SHA-256 `1fe2683a27e87afffd3686b174a3c9fd9189077562e101e003f24a128347ce89`.
- Return normalized to centimeters for comparison: 390,410 bytes,
  SHA-256 `3e3d8af9eec8232c309d3dd0fc15545295c49b5378521b80d8bb0f02c3f8d35a`.
- Fixed limit: 0.001 cm. All nine SEW maxima are 0.0000049055–
  0.0000092424 cm. Placket CUT maxima are 0.0000043417 cm. Other CUT maxima:
  front 0.0010352924, back 0.0029919752, sleeve 0.0014919714, outer stand
  0.0110151150, inner stand 0.0397678813, upper collar 0.0110151168, under
  collar 0.0110186067 cm.
- Missing mark source ordinals 20–22 are the three buttonhole points at
  x=124.791 cm, y=71.291, 67.791, and 64.291 cm in returned block `4_M`.
- Return inventory: top-level inserts `0_M`–`8_M`; block contents contain 132
  `LWPOLYLINE`s and no typed mark entities. Full comparator, normalization,
  inventory, and render reports are preserved in the C: evidence folder.
- Render SHA-256: whole-pattern overlay
  `ada090a64b82bc40e7dd08340ee7be87060d1f4131639f0edda25e78e660b8b0`;
  inner-stand detail
  `d6b46eb7486c94fbddf1669f061e94ae4e84e8789aca034c548447a8f6b9bb02`.
- CLO import was Standard DXF, millimeter, 100%, no rotation, original grain
  angle, notch position ratio, import-notch-to-both enabled, and draw-curve
  points enabled. Export was Standard DXF, graded nest, millimeter, 100%, no
  rotation. The C: folder contains the pre-import CLO session project but no
  screenshot/capture of the dialogs; these settings are recorded observations,
  not image-verified evidence. S695 records this evidence limitation and the
  next dialog will be visually checked before its single controlled test.

## Gate disposition

See `S694-v03-gate-update.md` for every gate's status, evidence, and remaining
proof. In brief: this run passes only its unit declaration/scale and 9 SEW
geometry checks. Its CUT geometry and visible-mark checks fail; semantic mark
types/layers are lost. Profile qualification, identity/sidecar behavior,
receiver breadth and grades, malformed-input rejection, repeatability, and
acceptance-level readability remain unproven. CLO Standard is only an
empirical vendor-specific candidate; no ANSI/AAMA or ASTM conformance is
claimed. No V03 gate passes as a complete route qualification.

One bounded Sol high-reasoning review of the matrix and plan returned an
explicit `WORK FINISHED`. It confirmed the gate statuses and recommended the
read-only point-sequence diagnosis. It also caught that the first draft
overstated a curve/serializer cause; the matrix and plan were corrected to
label that cause unproven. The reviewer did not inspect or approve receiver
evidence and did not declare any gate passed.

## Verification, state, and accounting

- Start: 2026-10-10 22:25:29 UTC from clean S693 commit
  `1d75e65b969150d98184b9c6fdcbb92e4d5be71b`; refreshed `origin/main` was
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Board revision
  4109; validated S694 start evidence moved it to 4110.
- No production code changed; changed-module coverage is not applicable. The
  candidate preparation, return comparison, inventory, hashes, and actual
  rendered output are the focused verification for this evidence-only slice.
  The required focused Control Center suite and `git diff --check` are run at
  closeout; full repository coverage/build remains for the settled integrated
  PR candidate.
- Approximate elapsed time to close: 11 minutes. CLO import/export and
  artifact preparation: about 5 minutes; comparison and rendered inspection:
  about 3 minutes; durable evidence, state, board and focused closeout checks:
  about 3 minutes. Sol review wait was not separately timed. Maintainer
  decision time: 0 minutes.
- Board after closeout remains G04-V03 **Blocked**, EPIC-17 **In Progress**,
  V01/V02 **Done**. The project goal remains active and unchanged.
- No physical sampling, fit, factory acceptance, standards conformance, or
  production-readiness claim.

## Single next action

Reserve the next unique slice for a read-only comparison of the exact S693
submitted path and exact S694 returned path at the seven measured CUT maxima.
Inspect the owning source curves, ordered point sequences, and entity
representation around source index 182 on the four stand/collar pieces.
Determine whether the source candidate approximated its own intended cut locus
or whether CLO changed an exact submitted locus. Make no code or pattern change
unless this comparison proves a candidate-encoding cause; do not run another
CAD round trip in that diagnostic slice.
