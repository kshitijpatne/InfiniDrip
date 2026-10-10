# S699 source/return loss audit

## Finding

The remaining S698 defects split into two distinct causes. The candidate writer now serializes its high-resolution geometry accurately, but its DXF is a flat, anonymous sheet; and CLO's tested return path drops geometry points and point marks under the exact imported settings. This audit found no evidence supporting another coordinate-precision, point-density, POLYLINE/LWPOLYLINE, or connected-LINE experiment.

## Source-bound facts

| Area | Source implementation and exact-file evidence | Classification |
|---|---|---|
| CUT coordinates | `src/export/dxf.ts` writes every point of each closed cut polyline; S697's candidate-only writer uses six decimal places. S697 measured maximum two-axis serialization error `0.000000702921 cm`. S671 independently inserted only collinear subdivisions and proved the represented path remains exactly source-equivalent (`0.000 cm`). | Directly encoded; source rounding is no longer the S698 cause. |
| CUT curvature after exchange | S698 source has 448–763 CUT vertices per piece; returned CLO blocks have 341–488. Back, both stands, and both collars exceed `0.001 cm` (six fails overall), while exact SEWs pass. S635/S636 showed the same five omitted shallow points for coordinate-identical classic/LW polylines; S640 connected-LINE input and S671/S672 path-density evidence did not make CLO pre-export geometry pass. | The loss occurs on the tested CLO conversion route; no specific remaining writer-side numerical defect is demonstrated. Prior evidence rules out arbitrary point-density/entity-form trials. |
| Buttonhole marks | `src/export/pattern-mark.ts` emits the three marks as `POINT` entities on `MARK_BUTTONHOLE`; S698 source inventory confirms 3 POINTs on that layer. The S698 CLO import explicitly had `Import Draw Curve Points` off; returned file has no typed POINT entity and all three locations are absent by `1.4999984 cm`. | Writer is directly encoding the points. S698 does not prove behavior with the documented import option on; test the already-supported option once before changing mark encoding. |
| Piece and revision identity | `src/export/dxf-interchange-package.ts` records `recipe:role` piece IDs and a content revision in an external manifest. The DXF itself has zero BLOCKs: each piece is only CUT/SEW and its marks in a global flattened ENTITIES section, using shared generic layers. S698 output has generic `0_M`…`8_M` blocks and numeric layers. | Direct source-structure gap: the drawing carries no named piece container/revision token; the side manifest alone cannot survive receiver export. |

## Concrete source repair supported by prior evidence

S628 already proves that wrapping each piece's unchanged entities in a named BLOCK with an INSERT can preserve piece roles through CLO import/export/reimport: all 12 Woven pieces retained names (CLO appends `_M`) and all 24 CUT/SEW paths met the existing geometry gate, with max `0.0007416873 mm`. That is the strongest already-tested code-path evidence for addressing the current flat-drawing identity gap. S628 was one Woven configuration and does not prove Polo or seven-recipe acceptance.

Next slice: integrate a deterministic per-piece BLOCK/INSERT structure into the opt-in interchange package, with safe ASCII block names tied to recipe and piece role. Keep every entity payload, coordinate, layer, and cut/sew geometry unchanged inside blocks. Update the side manifest validator to resolve mark entity references through block identity rather than assuming one global flat entity ordinal. Generate focused all-seven/grade/73-option package outputs and verify that expanding each block reconstructs the exact original entity stream. Then run one decisive existing-CLO round trip of Polo M using the named-block package and `Import Draw Curve Points` enabled. This single candidate tests the proven grouping route, the concrete missing identity representation, and the remaining buttonhole-point gate. If its curved CUTs still exceed `0.001 cm`, stop the CLO path; earlier source-form and density evidence gives no support for another encoding sweep. No V03 gates are relaxed.

## What this does not establish

CLO 2026.1.310 / Standard DXF remains an empirical vendor/version/mode path only; no ANSI/AAMA/ASTM conformance claim. Rights and local processing remain maintainer-confirmed. Grades/options and all-seven receiver behavior, malformed-input rejection, repeatability, full readable output, and the final integrated gates remain unproven. No physical-fit or factory claim.
