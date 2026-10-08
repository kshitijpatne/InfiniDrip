# EPIC-17 / G04 V03 — Public apparel DXF profile evidence — Slice 511 exit

## Finding

The source search found named legacy apparel-DXF modes, but no current,
publicly inspectable complete specification that would justify a present-day
conformance claim or a numeric layer map by itself.

- ANSI Standards Action dated November 22, 2002 states that ANSI/AAMA 292-1993
  (Pattern Data Interchange — Data Format) was withdrawn for not being
  reaffirmed/revised and that the AAMA standards accreditation was withdrawn,
  effective November 13, 2002. This is direct official evidence of the
  standard's historical withdrawal, not proof that CAD vendors stopped using
  AAMA-compatible profiles.
- ASTM's current public textile catalog lists ASTM D6673-10 (Sewn Products
  Pattern Data Interchange—Data Format) as withdrawn in 2019. Its public
  product page describes DXF pattern-piece data plus a separately formatted
  ASCII grade-rule table; it also explicitly says the practice does not encode
  relationships between pattern pieces or correspondence between 2D/3D piece
  geometry. Detailed normative clauses are not publicly inspectable from the
  catalog page.
- NISTIR 5969 (1997), an official NIST research report, describes ANSI/AAMA-292
  as an interim DXF-based exchange. It says AAMA-292 used grade-rule
  identifiers that referred to information elsewhere and did not define grade
  growth values; a historical single-size prototype therefore did not prove
  graded exchange. This is historical research, not the normative standard.
- CLO's official DXF help page (updated September 28, 2026) documents
  `DXF-AAMA`, `DXF-ASTM`, and Standard DXF import/export menu modes; units,
  rotation and several import/export settings; export of one size group per
  file; and grading embedded in the DXF or supplied separately as a Rule File.
  It does not publish a numeric layer/mark map, identify the exact standard
  edition implemented, certify conformance, or document an independent
  receiver's round trip.

### Evidence labels and limits

- **Directly documented:** the 2002 ANSI withdrawal action, ASTM D6673-10's
  withdrawn status and public scope summary, NISTIR 5969's historical account,
  and CLO's current menu/settings behavior.
- **Inference:** CLO's current mode labels alone cannot establish current
  ANSI/ASTM conformance, a layer mapping, grading preservation, or acceptance
  by a specific CAD receiver. An explicitly documented *legacy* profile could
  still be useful if the exact target receiver accepts it and the required
  round trip is measured.
- **Not established:** whether any exact CLO build remains licensed/authorized
  for this project use; file handling beyond ordinary local file selection;
  exact profile semantics; a supported/versioned target receiver; or any new
  CLO AAMA exchange result. The S509/S510 UI-control failures remain access
  failures, and S503/S508 results remain mode-specific technical evidence.

## Sources reviewed

1. ANSI, *Standards Action*, November 22, 2002, pp. 6–7 and 19–20,
   [official PDF](https://share.ansi.org/Shared%20Documents/Standards%20Action/2002%20PDFs/SAV3341.pdf).
2. ASTM, [D6673-10 withdrawn record](https://store.astm.org/d6673-10.html)
   and [current textile-standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html).
3. ASTM, [D6673-04 public scope and significance summary](https://store.astm.org/d6673-04.html); detailed standard is sold/licensed.
4. NIST, Y. Tina Lee, *Data Sharing Implementation Based on the Information
   Model for Apparel Pattern Making*, NISTIR 5969 (January 1997),
   [official report](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf).
5. CLO, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
   updated September 28, 2026.

## Gate disposition and next action

No receiver/profile was selected. V03 remains In Progress; all V03 gates,
all-seven-recipe acceptance, the `0.001 cm` geometry criterion, legacy DXF
behavior, protected export byte identities and the V01/V02 Done state are
unchanged. No pattern/CAD file was opened or created in this research slice.

The bounded search narrows the next work: do not treat a named AAMA/ASTM menu
mode as a current standard claim. Continue V03 only with a rights-reviewed,
exact receiver/build and a versioned profile definition, then demonstrate its
measured imports/exports and all-seven fixtures. Retry CLO AAMA only when the
supported desktop helper can safely target the live workspace. Do not buy or
copy a licensed standard under this slice.

## Verification and timing

- Start preflight passed at board revision 3157; validated start replay advanced
  `3155→3157`. Exit preflight/replay and the focused Control Center test are
  recorded with this closeout.
- Documentation/research only; no production code/test or export baseline
  changed, so changed-code coverage and the full repository gate are not due.
- Elapsed from `2026-10-08 17:44:22 UTC` to closeout (approx.): source review
  7m; synthesis and records/board 5m; focused tests 1m; external-agent waits
  0m; maintainer-decision time 0m.
