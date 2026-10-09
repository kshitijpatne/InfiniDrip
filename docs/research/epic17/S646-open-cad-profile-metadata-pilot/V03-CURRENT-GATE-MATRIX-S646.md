# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 646

## Decision summary

S646 adds one bounded profile-structure result and a distinct practical CLO
receiver result. OpenCAD Studio v2026.40.1's local, GPL-licensed generic DXF
R14 route preserves the nine named Polo M blocks, explicit centimeter units,
CUT/SEW/MARK layers, and registered-application XDATA role/revision IDs. Its
first and second outputs are byte-identical and preserve all 56 entity
geometries exactly. This does not qualify OpenCAD as industrial apparel CAD
or make `idr-pattern-exchange/1` a documented industry profile.

CLO 2026.1.310 DXF-AAMA then imports that exact R14 output with nine named
pieces and no native-query API errors. Its source-bound contour query passes
13/18 at the unchanged `0.001 cm`: all nine SEW and four CUT contours pass;
the same five CUT contours fail (back, both collar stands, both pointed
collars). The actual CLO PDF confirms a rendered nine-piece overview with
names, but the pre-export geometry gate fails, so no CLO export or round trip
is attempted. This is a concrete measured failure, not an assumption about
the output path.

## Gate matrix

| Admitted V03 gate | Latest evidence through S646 | Disposition |
|---|---|---|
| Receiver, documented industrial profile, and rights | OpenCAD is rights-cleared generic R14 only. CLO use is authorized and its DXF-AAMA mode is documented, but the exact edition/conformance and a successful source-exact exchange are not established. | **Open / blocking.** No proven industrial receiver/profile pair. |
| Units and coordinate contract | S646 explicitly writes `$INSUNITS=5` (cm); OpenCAD retains it, AC1014, and all 56 coordinates across two byte-identical generations. CLO was set to cm/100%/no rotation, but no passing round trip exists. | **Partial / blocking.** Generic profile evidence only. |
| Source validity and CUT/SEW geometry | OpenCAD input→first and first→second preserve 9 blocks / 56 entities with 0.000 cm maximum residual. CLO passes 13/18 source CUT/SEW contours and fails five CUT contours at `0.001 cm`, unchanged from S642. | **OpenCAD generic pass; V03 open / blocking.** Target apparel receiver gate fails before export. |
| Seven recipes, supported options, and grades | S646 tests only Polo M/default. No complete profile-specific seven-recipe/options/grade exchange passes the admitted gates. | **Open / blocking.** |
| Piece, garment, revision identity, and relationships | All nine role/revision XDATA records, named blocks and inserts survive both OpenCAD generations; CLO returns all nine source-role piece names. Garment and relationship semantics have not completed a receiver round trip. | **Partial / blocking.** |
| Manufacturing marks and layer/entity semantics | OpenCAD retains CUT/SEW and six `MARK_*` layers with all 56 source geometries in this Polo M fixture. CLO's native query does not qualify mark identity, values, or receiver behavior. | **Open / blocking.** |
| Malformed/invalid input | S646 does not test the profile's malformed, negative, or invalid-option cases. Prior generic receiver results do not qualify this profile. | **Open / blocking.** |
| Repeat round trip | Two OpenCAD generations are byte-identical and geometrically exact for this one fixture. CLO export/reimport was correctly stopped after its failed native CUT gate. | **Partial / blocking.** |
| Rendered output/readability | Actual CLO 1:1 PDF shows nine named patterns in an overview. It is not a passing exchange output and does not prove mark/detail readability. | **Open / blocking.** |
| Legacy DXF/protected identities | S646 changes only research scripts and evidence; no production writer, pattern source, baseline, or protected export identity changed. | **Preserved; final integrated gate still due.** |
| V02/all-seven dependency | Canonical board still has V01/V02 Done and V03/Epic In Progress. | **V02 prerequisite met; V03 incomplete.** |

## Decision and next action

Keep every acceptance criterion, threshold, and hold unchanged. Do not repeat
the same CLO Polo DXF-AAMA import: this candidate preserves more profile
metadata in the generic R14 producer, but its five source CUT failures are
unchanged, and the fail-closed gate prevented a misleading downstream export.
The remaining critical dependency is a rights-reviewed industrial apparel
receiver/profile that can preserve those source curves and complete the
all-seven, mark, invalid-input, grading, repeated-round-trip, and readable
output checks. No V03 gate or exact compatibility claim clears in S646.

## Evidence references

- S646 start/exit and scripts: this directory.
- Raw candidate, two R14 outputs, CLO native query, contour comparison, PDF
  and rendered PNG: `C:\G04-CLO-DXF-Exchange\S646-open-cad-profile-metadata-pilot\`.
- Prior OpenCAD rights and generic R14 results: S624; input named-block
  provenance and CLO failures: S642; current writer/encoding audit: S645.
