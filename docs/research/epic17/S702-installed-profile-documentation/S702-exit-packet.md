# EPIC-17 / G04 V03 — S702 installed apparel-profile documentation check

## Finding: CLO has a distinct documented apparel interchange route

The current first-party CLO Help Center documentation says its DXF importer
lets the user select **Standard DXF, AAMA, or ASTM**, and its exporter offers
the same three formats. It separately describes DXF-AAMA and DXF-ASTM as the
2D pattern formats used with apparel CAD. The documentation says its
“Remove Non-Grading Points” option is specific to AAMA because its curve-point
handling differs from CLO's default; “Optimize All Curve Points” can change
the number of contour points.

This identifies a concrete route we had not tested: S700 imported and exported
using **Standard DXF**, not CLO's **DXF-ASTM** apparel profile. Therefore
S700's measured losses disqualify the Standard route only; they do not
disqualify CLO's distinct documented apparel-profile route. This is a
corrected test plan, not a claim that the S700 file conforms to ASTM or that
the ASTM route will pass.

## Evidence classification

- **Directly documented by CLO:** importer choice Standard/AAMA/ASTM; exporter
  choice DXF-AAMA/DXF-ASTM/Standard; only AAMA uses the special
  non-grading-point removal option; the app supports apparel CAD patterns in
  the AAMA/ASTM workflows.
- **Directly measured in S700:** the package used Standard import/export;
  named piece blocks returned, while five CUT contours and three buttonhole
  points failed fixed checks.
- **Not yet proven:** the current generic-centimeter DXF package is accepted
  as DXF-ASTM; whether the ASTM parser retains its named blocks, cuts, marks,
  units, grades, or option data; the profile's exact standards conformance;
  all-seven round-trip behavior and remaining negative/readability gates.

## Next action: one decisive, bounded CLO profile pilot

S703 will use the existing open CLO 2026.1.310 session and the exact
hash-pinned S700 Polo M package under
`C:\G04-CAD-Interchange\S700-named-piece-package\`. Import through the
documented **DXF-ASTM** apparel route, with centimeters, no rotation, and curve
optimization off. If the importer displays a format/structure error or fails
to produce the nine expected pattern pieces, stop immediately and preserve
the message. Otherwise export once through **DXF-ASTM**, at the same units and
size, then compare the returned geometry, marks, piece identities and rendered
output against the exact source using the unchanged 0.001 cm gates. Do not
continue to reopen or test all seven recipes unless this representative pilot
passes every applicable pre-export gate. Do not make any standards-conformance
claim from the dropdown label.

This is a distinct format/profile question that the first-party source
explicitly documents and directly addresses the missing apparel profile gate;
it is not a repeat of the Standard test. No other software, format or setting
variation is queued. Acceptance, rights approvals, scope, legacy byte identity
and protected outputs remain unchanged.

## Verification and closeout

- Official documentation: CLO Help Center, [2D Pattern (DXF)
  Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
  current updated Oct 10, 2026; [Compatible File
  Format](https://support.clo3d.com/hc/en-us/articles/115002000227-Compatible-File-Format);
  [Import - DXF](https://support.clo3d.com/hc/en-us/articles/115012380628-Import-DXF).
- These pages are vendor documentation. They establish menu choices and
  described use; they do not establish that our input conforms to ASTM/AAMA.
- No app operation, code change, or file generation occurred in S702.
- Canonical Control Center tests and validated board closeout are recorded
  below; no full repository gate applies to this docs-only slice.
- Start 2026-10-11 00:03:29 UTC from S701 `6b51e1d9018ff497247090980a46d246aee8097d`;
  refreshed origin/main remains an ancestor. S701 was highest; S702 is unique.
- Approximate elapsed time: 1m; implementation 0m; documentation review and
  plan under 1m; board closeout under 1m; external wait 0m; maintainer decision 0m.

V01/V02 remain Done; V03 remains held pending the specific apparel-profile
pilot and unchanged subsequent gates. EPIC-17 remains In Progress and the
goal remains active. Final integration, cleanup, PR, safe merge, ancestry and
production end-to-end verification remain due.
