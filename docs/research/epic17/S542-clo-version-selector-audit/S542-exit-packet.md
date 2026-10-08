# EPIC-17 / G04 V03 — CLO version-selector evidence — Slice 542 exit

## Result

The current official CLO Help article's Export table offers a **DXF Format**
choice of DXF-AAMA, DXF-ASTM, or Standard DXF. It documents the size group,
scale/unit, rotation, baselines, notches, curve handling, bounding boxes, and
selected patterns, but does not specify a DXF database version or a normative
ASTM edition. The saved S523 export-dialog screenshot for CLO 2026.1.310
shows the format, size, scale, rotation, and other export controls; no database
version or standard-edition selector is visible. The screenshot's SHA-256 is
`186889C87EE57DD4BBC697E8C17592818E9C3B638A1A3CD93A2EC4626478EA72`.

**Conclusion:** there is no documented or visible control in the tested
export flow for choosing AutoCAD R13 / `AC1012` or a specific D6673 edition.
Therefore CLO's present DXF-ASTM menu mode is not an evidenced way to correct
the S541 version discrepancy. The actual all-seven files remain `AC1009`;
ASTM D6673-04 requires Version 13 DXF. This does not prove that no undocumented
setting exists or that CLO's own ASTM label claims D6673-04 conformance; it
means the tested/documented route cannot support that claim.

## Evidence

- Official CLO help, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated September 28, 2026. Its Export section names only the three format choices and describes other controls without naming a database-version or standards-edition option.
- Existing saved dialog: `C:\\G04-CLO-DXF-Exchange\\S523-clo-remaining-recipe-roundtrip\\Evidence\\fitted-gen2-export-settings.png` (SHA-256 above). Visually shows the `DXF Format` field set to `DXF-AAMA`, with size format, scale, rotation, and export checkboxes; no version or edition field is visible.
- S541 hash-pinned file audit: all seven recipe exports declare `AC1009` (R11/R12), the ASTM D6673-04 record specifies AutoCAD Version 13 (`AC1012`), and ASTM lists D6673-10 as withdrawn in 2019. See `docs/research/epic17/S541-dxf-header-profile-audit/S541-exit-packet.md` and its C:-only report.

## Gate disposition

- **Narrowed:** the tested/documented CLO export menu is not presently a
  verified way to produce the D6673-04 R13 version required by S541.
- **Still held:** exact current apparel profile/edition; receiver rights and
  version; all-seven CUT/SEW/mark semantics; five Polo CUT misses; grading and
  option matrix; malformed-input handling; independent receiver round trip.
- **Unchanged:** all-seven G04 acceptance, V02 Done, V03 In Progress, protected
  DXF identities, legacy DXF behavior, and all thresholds. No CLO operation or
  new exchange file occurred; no production-code/test change.

## Verification and closeout

- Verified official article title, update date, and export-format list; opened
  and visually inspected the prior saved screenshot and checked its hash.
- Board start replay: `3279→3281`; validated exit replay: `3281→3283`;
  `npm run control-center:test` passed 42/42 after replay. No changed-code coverage or full
  repository gate is due.
- Started `2026-10-08 22:04:09 UTC` and reached verified closeout at
  `2026-10-08 22:06:23 UTC` (about 2m14s): official source review and saved
  screenshot/hash inspection `1m00s`; focused verification, board and durable
  closeout `1m14s`; external-agent waits `0m`; maintainer-decision time `0m`.
  Start state was clean S541 commit
  `5cdb1471747152729784b726b3e2ab32f3bd3225`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Highest
  slice was 541; S542 is unique. Record elapsed time split between source
  review, focused verification/closeout, agent waits, and maintainer decisions.

**Next action:** search primary documentation for a different receiver/profile
whose exact version and apparel semantics are both published and whose
product-development rights are acceptable. Do not repeat CLO exports or claim
ASTM compatibility based on the menu label. Keep the V03 gates closed.
