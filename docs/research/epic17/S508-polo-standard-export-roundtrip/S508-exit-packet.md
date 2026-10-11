# EPIC-17 / G04 V03 — CLO Standard DXF round-trip diagnosis — Slice 508 exit

## Result

**The tested Standard DXF path does not pass round-trip acceptance for the
hash-pinned Polo M fixture.** CLO imports and exports the files without a
dialog error, but the second-generation DXF reimports as a narrow stack of
overlapping outlines. Its entity structure also changes substantially. This
rejects this specific Standard DXF exchange path for this fixture and setting;
it does not establish a general claim about CLO or other receivers. G04-V03
remains In Progress and every V03 gate is unchanged.

## Reproduction

- CLO `2026.1.310 (r58944)` was already running in its normal workspace. No
  authentication, cloud, CLO-SET, or CONNECT operation was used.
- Input: `C:\G04-CLO-DXF-Exchange\S508-polo-standard-export-roundtrip\Input\polo-standard-m.dxf`,
  24,261 bytes, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- First import: Standard DXF; centimeter; 1000%; Do Not Rotate; Maintain
  Original grain; Import Notches Both / Ratio; Optimize All Curve Points off.
  CLO displayed nine pattern pieces.
- First export: plain `DXF` mode; Graded Nest; centimeter/100%; Do Not Rotate;
  Duplicate Notch on Seam Allowance on; curve optimization off; remaining
  export options off.
- Clean reimport of generation one: Standard DXF; centimeter/100%; Do Not
  Rotate; Maintain Original grain; notches Both / Ratio; optimization off.
  CLO completed the import and rendered the piece contours. The native project
  was saved before the next export.
- Second export used the same plain DXF/graded nest/centimeter/100% settings.
- Clean reimport of generation two used the same centimeter/100% import
  settings. CLO completed without a dialog error, but the rendered pattern
  outlines were visibly collapsed into a narrow, overlapping stack. The second
  reimport project and screenshot were saved.
- An earlier exploratory reimport used 1000% on a DXF already declaring
  `$INSUNITS=4` (centimeters). Its project/output are preserved, but that run is
  excluded from the corrected round-trip conclusion. The clean 100% run above
  directly tests the declared units.
- CLO was closed normally after the last project save. The app inventory then
  reported it stopped with no open CLO windows.

## Measured output

| Measure | First Standard export | Clean second Standard export |
|---|---:|---:|
| Bytes | 58,246 | 66,971 |
| SHA-256 | `2b27bf1ed1ede414e6b67cc83fc0221b87d358691f6e59fcbd73c067943a0afb` | `ed1e13ddb359f4ab0e1ffff1ca638ad8500a26a5a62ffbabdfaf230e8798ca04` |
| `$INSUNITS` | 4 (centimeters) | 4 (centimeters) |
| DXF blocks (includes Model/Paper Space) | 11 | 38 |
| Pattern block INSERTs | 9 | 36 |
| LWPOLYLINE records | 59 | 141 |
| Polyline vertices | 1,185 | 713 |

The first export was compared with the pinned source using the S507-documented
0.1 coordinate factor and a same-vertex cyclic/reverse distance check at
`0.001 cm`. Eight of 18 source CUT/SEW contour records matched. The two Back
contours had best same-vertex displacements approximately `3.12 cm` and
`3.10 cm`; the eight collar contour records had no same-vertex candidates.
Those figures are diagnostic witnesses, not a complete Hausdorff proof.

The second export's same-vertex cyclic/reverse source comparison produced no
matches among the 18 source contour records at `0.001 cm`. This matcher does
not equate split/merged polylines or infer layer semantics. Independently, the
actual second-generation CLO import visibly stacks the contours; the saved
render is the decisive round-trip usability failure for this run. The analyzer
reports 90 closed and 51 open LWPOLYLINE records in generation two. The 36
pattern INSERTs use the origin `(0,0)` and unit scale/rotation; do not infer
industrial meaning from the generated block names or numeric layers.

The primary geometry report is
`C:\G04-CLO-DXF-Exchange\S508-polo-standard-export-roundtrip\Evidence\Analysis\first-export\standard-dxf-initial-geometry-diagnostic.json`.
The corrected second-generation report is
`C:\G04-CLO-DXF-Exchange\S508-polo-standard-export-roundtrip\Evidence\Analysis\first-export\standard-dxf-roundtrip-geometry-diagnostic.json`.
The 1000%-reimport report is preliminary only and must not be used to pass the
round-trip gate.

The first attempt to reuse the S507 analyzer failed its input assertion because
that script expects legacy POLYLINE entities and embedded piece labels. CLO's
Standard export emits LWPOLYLINE and lacks those labels; this is an analyzer
format assumption, not a CLO error. The replacement parser reads Standard DXF
blocks, INSERTs, and LWPOLYLINE entities directly. The earlier 1000%
reimport also remains preserved but excluded because of the declared-centimeter
unit mismatch.

## Rendered and native evidence (C: only)

- `Evidence\standard-reimport-100-settings.png` and
  `Evidence\standard-reimport-100-render.png` document the corrected import
  settings and first-generation reimport.
- `Evidence\standard-roundtrip-export-settings.png` and
  `Evidence\standard-roundtrip-export-render.png` document the second export.
- `Evidence\standard-reimport-2-100-settings.png` and
  `Evidence\standard-reimport-2-100-render.png` document the failing second
  reimport.
- Native projects include `Projects\s508-standard-1000-import.zprj`,
  `Projects\s508-standard-100-roundtrip-import.zprj`, and
  `Projects\s508-standard-100-roundtrip-reimport2.zprj`.
- The second-reimport project is 2,179,663 bytes, SHA-256
  `a29bdd840fd1e9475484b91834dc11330be6dbad133476b4febf8fb39a76455a`.
- All imported/exported files, projects, screenshots, and analyses are in the
  named S508 folder on C:. No fixture was sent to a service.

## Gate disposition

- **Practical CLO operation:** import/export/reimport all completed without a
  CLO error dialog. That proves only that these operations execute.
- **Source geometry:** not passed. First-generation diagnostics retain eight
  exact contour matches; the Back and collar contours remain unresolved.
- **Round trip:** **failed** for this Standard DXF run. The second-generation
  import visibly stacks outlines and its 141 polyline records do not map to
  the 18 source contour records under the unchanged matcher.
- **Receiver/profile and rights/local handling:** not established. The UI mode
  name `DXF` does not prove an industrial apparel-CAD profile, permission, or
  local-only product behavior. CLO is not selected as the V03 receiver.
- **Still required:** a rights- and local-handling-qualified exact receiver and
  documented profile; representative source-scale geometry/layer/mark/unit
  evidence; native grade behavior; negative-control behavior; round-trip
  retention; and representative fixtures for all seven recipes.
- **Unchanged:** all-seven V02, V02-before-V03 dependency, V03 acceptance,
  `0.001 cm` contour threshold, generic/legacy DXF behavior, protected export
  byte identities, and physical/factory evidence limits. No production code,
  source geometry, test, export baseline, or acceptance criterion changed.

## Verification and slice boundary

- No repository production code changed; changed-code coverage does not apply.
- The pinned input hash was verified. Both corrected import settings and export
  settings were captured. The native projects, outputs, hashes, block/INSERT/
  polyline counts, point-mapping diagnostic, and actual rendered result were
  inspected. Full repository coverage/build/browser/output gates remain
  reserved for the settled integrated Epic candidate.
- Validated board replay adds `E-G04-S508-EXIT` to G04-V03 and a result comment;
  no status or V03 acceptance changes.
- `node docs/research/epic17/S508-polo-standard-export-roundtrip/preflight-exit.mjs`
  passes at revision 3147; validated replay reaches revision 3147. Focused
  `npm run control-center:test` passes 42/42; `git diff --check` passes.
- Elapsed from `2026-10-08 16:59:03 UTC` to closeout: about 30 minutes.
  Implementation: `0m`; focused CLO import/export/render verification:
  `~17m`; geometry/output analysis: `~5m`; durable packet/board/state closeout:
  `~8m`; external-agent waits: `0m`; maintainer-decision time: `0m`.

**Next action:** test the remaining CLO industrial DXF mode only as a separate,
bounded practical diagnosis. Preserve the ASTM round-trip loss, Standard
round-trip stacking, rights/profile/local-handling, native-grade,
negative-control, and all-seven fixture gates; do not describe V03 as passed.
