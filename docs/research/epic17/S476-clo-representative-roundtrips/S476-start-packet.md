# EPIC-17 / G04 V03 CLO representative fixtures — Slice 476 start

## Verified start and timing

- Slice started 2026-10-08 06:26:15 UTC. Read-only official documentation
  research for the profile and license terms began after S475's boundary and
  before this S476 packet was written; no S476 CLO actions began before this
  packet.
- Branch/worktree: `codex/epic-17-g04`,
  `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- Starting commit: `84bb186cdda3df600e62911bf81bf182e57108b2`, landed S475;
  worktree clean. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor.
- Highest assigned slice across fetched refs was S475; S476 is reserved.
- Control Center board revision 2935; EPIC-17 In Progress, V01/V02 Done,
  G04-V03 In Progress. Validated start replay advances to revision 2939.
- Current primary usage window allows ordinary work. No delegation wait has
  begun yet.

## Scope

Use CLO `2026.1.310 (r58944)` for two more exact local fixtures from the S463
manifest: `polo-standard-m.dxf` and `woven-shirt-standard-m.dxf`. For each,
copy the byte-verified source into `C:\G04-CLO-DXF-Exchange\Input`, perform an
unmodified import → export → matching-profile reimport with the same observed
settings as S475, and save any CLO outputs and screenshots only under
`C:\G04-CLO-DXF-Exchange\Output` and `Evidence`. Compare actual output geometry
to the byte-identified source and record what happens to pieces, marks, units,
layer multiplicity and rendering. Do not alter input geometry or settings to
make a fixture pass.

Input fixtures and source contract:

- Polo M: 24,261 bytes, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`, nine
  pieces, 18 CUT/SEW closed outlines, 38 non-outline mark entities across
  button, buttonhole, cutline, foldline, placement-line and placement-point
  layers.
- Woven shirt M: 14,923 bytes, SHA-256
  `9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5`, 12
  pieces, 24 CUT/SEW closed outlines, 31 non-outline mark entities across
  button, buttonhole, foldline, placement-line and placement-point layers.

For import, repeat S475's observed choices: DXF-AAMA, centimeters, 100%, no
rotation, original grain direction, notches to both outline/seam allowance at
ratio, and other optional import toggles off. For export, repeat CLO's
DXF-ASTM, graded-nest, centimeters, 100%, no-rotation setting; keep duplicate
notch on seam allowance checked and other export toggles off. Reimport with
matching DXF-ASTM and centimeters. Record warnings, including any automatic
seam-allowance conversion, and inspect the rendered 2D result.

## Acceptance and holds

1. Both C: input copies must match their S463 manifest hash and byte count.
2. Record output hashes/lengths and parse the actual, unmodified DXFs.
3. Associate all source pieces/outlines to receiver output by geometry and
   reported order when supported. Report missing/extra outlines and marks,
   closure, vertex count, bounds, units/version declarations, and per-coordinate
   errors. C04's 0.001 cm maximum remains unchanged.
4. Inspect native CLO reimport rendering for expected distinct pieces,
   cut/sew contours, marks, misleading duplicates, or warnings. Keep every
   capture and receiver file exclusively under the named C: folder.
5. Close S476 with exact pass/fail/unknown by fixture. A successful Polo and
   Woven trial still cannot prove options, grading, all-seven coverage, a
   factory receiver, ASTM standard conformance, or the G04 V03 exit.

V03/EPIC-17 remain In Progress unless all unchanged V03 criteria are met; S476
must not complete either item. Preserve S475's semantic-layer ambiguity and
unknown 0.25 cm/other exchange gates as explicit review items. No product
exporter, pattern, source geometry, protected export identity, or baseline
change is authorized. No physical, supplier, factory, production-readiness,
launch spending, external upload, or hosted service claim/use is in scope.

## Decisions and evidence inspected

- S475 directly observed CLO's menu profile name `DXF-ASTM`, output AC1009,
  no DXF units declaration, six source outline matches under 0.001 cm, and
  coincident output layer duplicates. This is only one empirical Tee trial.
- Current CLO help documentation describes selectable DXF-AAMA, DXF-ASTM and
  Standard DXF modes and import/export options. It does not claim that the
  mode name certifies conformance to ASTM D6673.
- ASTM's own D6673-04 record describes an apparel two-dimensional pattern
  exchange practice, and indicates that D6673 is historical. Its standard
  profile must not be claimed from CLO's menu label alone.
- Autodesk DXF docs identify AC1009 as Release 11/12 and AC1012 as Release 13.
  S475's AC1009 output is older than the version identified by D6673's
  published scope. Record this as a format/version mismatch requiring
  profile evidence; do not relabel it or silently adjust output.
- CLO's published Trial License terms limit trial use to evaluating or
  demonstrating software capabilities and exclude competitive analysis and
  commercial/for-profit purposes. This slice uses only synthetic inputs for
  the maintainer-authorized local interchange evaluation; it does not compare
  CLO to other vendors, upload files, distribute CLO samples, or create a
  commercial output with CLO. Do not expand this use beyond the approved
  evaluation.
- Primary references: CLO DXF import/export help
  `https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export`;
  CLO free trial terms
  `https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version`;
  CLO Additional Terms `https://legal.clo-set.com/additional-clo`;
  ASTM D6673-04 `https://store.astm.org/d6673-04.html`; Autodesk DXF header
  codes `https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm`.

## Bounded delegation and next action

One independent, read-only OpenCode research task is reserved to check the
exact limits of the CLO `DXF-ASTM` label, the AC1009/D6673 version relation,
and any authoritative CLO layer-ID mapping. It owns no product files and may
not change the repository, perform CLO UI actions, infer unverified layer
semantics, or relax V03. Use only `opencode/muse-spark-1.3-contributor-free`
with `xhigh` in normal mode. Codex will compare its cited evidence with the
official sources and actual DXF files. If that exact mode is unavailable,
stop the delegated run and report the limitation; do not substitute a model.

Next: stage and verify Polo/Woven inputs on C:, then run the two UI workflows
and geometry/render checks without changing the S475 settings or V03 gates.
