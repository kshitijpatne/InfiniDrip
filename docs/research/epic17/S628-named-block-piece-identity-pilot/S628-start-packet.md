# EPIC-17 / G04 V03 — DXF named-block identity pilot — Slice 628 start

## Verified start

- Started `2026-10-09 16:42:32 UTC` from clean S627 commit
  `95d30bd9bedfa5b2d08940234756458238de89bb` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S627 is the highest assigned slice; S628 is reserved.
- Canonical Control Center board revision 3652 has EPIC-17 and G04-V03 In
  Progress and G04-V02 Done. The validated start replay adds evidence and a
  comment only; statuses, scope, and gates stay fixed.
- The maintainer has confirmed in writing that the existing CLO 2026.1.310
  trial may be used for InfiniDrip product-development DXF evaluation, and
  that imported/exported DXF files are processed locally. No further use or
  locality decision is required for this bounded trial.
- The existing CLO process remains open. Every experimental file will be
  under `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\`.

## Bounded objective

Test one untried, standard-DXF identity mechanism: whether native `BLOCK` /
`INSERT` names, assigned one per same-revision Woven piece, survive a single
CLO `DXF-AAMA` import/export/reimport. Use the S627-repaired Woven
`sideVentDepth=0` source so the control fixture is finite and has an existing
positive CLO geometry baseline. Wrap the existing piece entities in blocks
named from the source piece roles, with base point `(0,0)` and identity
insertion transform. Prove before import that expanding the blocks reproduces
every original entity type, layer, coordinate, and visible outline exactly.

This tests preservation of source piece-role names only. It does not supply a
product revision ID (none is present in the current DXF export input), a
grading relationship, mark identity, or an apparel-specific meaning for
generic DXF block names. Autodesk documents BLOCK definitions and INSERT
references as generic DXF constructs; neither they nor this pilot establish
an apparel standard. CLO's tested `DXF-AAMA` menu label remains a narrow
receiver/profile label, not normative conformance.

## Acceptance and fail-closed rules

- Produce a disposable 12-piece Woven zero-vent derivative and a deterministic
  preflight report from the pinned S627 source fixture. The report must show
  twelve unique source names, twelve unique block definitions and references,
  identity transforms, exact expanded-entity equivalence (including CUT,
  SEW, and mark entities), and unchanged closed-contour inventories.
- Import once into the existing CLO session using `DXF-AAMA`, centimeters,
  100% scale, and the recorded S627 import controls. Save a getter snapshot
  and a readable 2D output image. Stop before export if import does not return
  exactly twelve patterns with source names bijectively represented, or if
  any source CUT/SEW contour exceeds `0.001 cm` or the rendered piece layout
  has gross damage.
- If the import gate passes, export once as `DXF-AAMA`, reimport once, and
  compare piece names and source-bound CUT/SEW geometry at `0.001 cm`. Inspect
  the saved rendered reimport. A name passes only if it remains bijective and
  unchanged through both import and reimport; do not infer identity from
  ordering, block handles, or contour geometry.
- If CLO renumbers/drops the names, record this mechanism as failed for this
  tested fixture/build/profile. Do not try alternate name placements, blocks,
  or a second CLO mode in this slice. Preserve every other V03 hold.

## Scope, risks, and non-goals

- No production writer or pattern source change, no new apparel profile,
  grading, marks contract, acceptance exception, or protected export-baseline
  update. No changes to all-seven coverage, the `0.001 cm` threshold, V02,
  legacy DXF behavior, or the V02-before-V03 dependency.
- Main risk: CLO may flatten, renumber, or reject standard blocks; that is the
  direct measured outcome, not a reason to alter the test. A positive result
  still covers one Woven zero-vent fixture and source piece-role names only.
- No physical sampling, supplier contact, launch spending, hosted service,
  physical-fit, factory-acceptance, or production-readiness claim.
- No safe independent delegated work exists: fixture structure, CLO identity
  query, source geometry comparison, and rendered review form one experiment.
- Focused gates: deterministic block expansion/preflight, source hash and
  entity inventory checks, any parser/test coverage for changed analysis code,
  Control Center command-layer tests, saved rendered output review, and
  `git diff --check`. No production code changes or full repository gate are
  planned in this slice.

## Evidence basis and non-repeated work

- S586 proves the product writer currently emits flat R12 POLYLINE/mark
  entities and no stable piece/revision names.
- S588 tested registered-app XDATA and observed 0/56 IDs in CLO output; do
  not repeat XDATA.
- S585/S590/S593-S594 and S591-S592 retain the distinct Polo CUT failures and
  reject prior profile, fillet, topology, and SPLINE trials. This Woven
  identity pilot does not retry or reinterpret those results.
- S627's exact Woven zero-vent DXF passed one bounded CLO AAMA geometry
  round-trip. That baseline supports a clean identity test; it does not
  qualify the receiver or clear the all-seven gate.
- Primary generic-DXF references: Autodesk, [BLOCK (DXF)](https://help.autodesk.com/cloudhelp/2019/ENU/AutoCAD-DXF/files/GUID-66D32572-005A-4E23-8B8B-8726E8C14302.htm)
  and [INSERT (DXF)](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-28FA4CFB-9D5E-4880-9F11-36C97578252F.htm).
  They document the generic block definition/name and reference-name fields,
  not garment semantics or CLO preservation.

## Single next action

Replay the validated S628 start evidence/comment at board revision 3652, then
generate and prove the disposable named-block derivative before interacting
with CLO. If preflight is exact, perform the one bounded round-trip and close
the slice with the observed name/geometry/render result. Keep G04-V03 and
EPIC-17 In Progress unless separate complete evidence clears every admitted
criterion.
