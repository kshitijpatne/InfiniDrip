# Independent Claude Opus 5.5 source review — S630

Status: `WORK FINISHED`. The reviewer made no file changes in its detached
worktree. This record preserves its claims and limitations; Codex checked the
NIST figures visually and rechecked the relevant primary sources.

## Findings

- **ASTM D6673-10:** the official product record says “Withdrawn 2019” and
  “No replacement”, last updated 2019-01-09. The abstract/scope describes
  2D sewn-product flat pattern pieces and grade-rule tables; it excludes
  piece relationships and 2D/3D geometry correspondence. Its public scope
  names AutoCAD Version 13 DXF. The public product record does not expose a
  mark layer table or entity mapping. Sources:
  [ASTM record](https://store.astm.org/d6673-10.html),
  [ASTM textile catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html).
- **CLO help:** its listed modes are DXF-AAMA, DXF-ASTM and Standard DXF; the
  help article gives no edition/year or mark layer/entity map. It describes
  notch and annotation options, but not button circles, buttonhole points, or
  their preservation. CLO says DXF-AAMA produces the same output as the older
  “Gerber (DXF-AAMA)” label; that is only a UI statement. The reviewer read
  the article via CLO's official Help Center API after its HTML page returned
  403. The API currently records its last update as 2026-09-28.
- **NISTIR 5969:** the 1997 report is a STEP/EXPRESS research model, not a
  normative DXF-AAMA encoding. Section 2.1 lists `MARK_FEATURE_TYPE` as drill
  hole, lift-and-plunge, stacking, facing, or cut-entry point. Figure 2.9
  shows a mark with `feature_type` and `location` to a point; Figure 2.10
  gives point X/Y real coordinates. There is no button or buttonhole type,
  circle/radius mark representation, or AAMA layer mapping in those figures.
  Sections 3.3–3.4 describe a Level 1 prototype translator to ANSI/AAMA-292,
  using 14 apparel-information layers. It reports two single-size military
  sample garments, geometry captured and text relocations; it does not
  demonstrate grading. The report describes the AAMA-292 basis as AutoCAD
  Version 11 DXF and calls it an interim solution / initial proposal for a
  future official apparel STEP specification.
- **NISTIR 5823:** historical context only. It lists ANSI/AAMA-292-1993 but
  has an internal inconsistency assigning the same title in one footnote to
  ANSI/AAMA-001-1992 (a cutting-machine standard). It cannot establish
  current status or conformance.
- **Version identity cross-check:** the S628 file records `$ACADVER=AC1009`.
  Autodesk defines AC1009 as R11/R12 and AC1012 as R13. Thus the tested
  output's database version is not D6673-10's named Version 13. This is a
  header-version observation, not a standalone apparel-conformance test.
  [Autodesk DXF header reference](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm).

## Conclusion and limits

None of the named sources supports a specific, rights-accessible conversion
hypothesis for S629's lost button circles and buttonhole points, so the review
does not recommend another CLO receiver test based on these documents. The
measured S629 outcome remains specific to that CLO build, mode, fixture, and
output. The audit does not prove every receiver/profile fails, identify a
current replacement for D6673-10, or clear any V03 gate. The reviewer used
only the official ASTM public product record/catalog, CLO's official article
and API copy, and public NIST reports; it did not read the full paid standards.

Codex visually inspected NISTIR 5969 Figures 2.9 and 2.10 in the official
PDF and independently verified the official ASTM record, CLO API metadata,
S628 header observation, and Autodesk `$ACADVER` definitions before accepting
these findings into S630.
