# Polo V1 — build contract

_Status: Slice 70 complete. V1 core geometry is drafted; Slice 71 is ready
to integrate the Polo recipe through every product pipeline._

## Outcome

InfiniDrip drafts, checks, renders, grades, nests, and exports one real
short-sleeve loose-knit polo with collar-plus-stand and a three-button folded
placket. It must remain a sewable pattern, not a decorative tee render.

## P0 acceptance contract

- Polo is selectable as a separate recipe; Tee, Darted tee, Tank, and Skirt
  output remains byte-identical.
- Default polo: loose tee body, existing set-in sleeve, 14 cm × 3 cm finished
  folded placket, three buttons at 3.5 cm centres, self knit + light knit
  stabilizer, collar-plus-stand.
- Pattern contains front, back, sleeve, collar, stand, and both placket pieces;
  true-scale exports contain cut / fold / placement / button / buttonhole marks
  and required cut quantities.
- Every stitch interface checks against real edge lengths. Guidance gives exact,
  actionable corrections; never hides invalid selections by clamping.
- Recipe-owned polo options persist, grade, render, export, and appear in its
  tech pack. They do not pollute body `Measurements`.
- Full tests, 100% coverage, TypeScript, production build, parsed exports, and
  visual review pass. Physical sewing remains a separate, required validation.

## Explicit V1 exclusions

- Long sleeves, cuff, yoke, pocket, side vents unless separately approved,
  contrast fabrics, alternate collar shapes, additional button counts, and
  button-spacing controls.
- Generic reusable collar/placket component extraction. Current architecture's
  two-real-consumer rule applies; V1 implements polo-specific construction,
  then later shirt/blouse work may extract proven common parts.
- 3D drape, automatic sew order, and fabric simulation.

## Slice sequence

| Slice | Scope | Model | Exit proof |
|---|---|---|---|
| 68 | Pattern-mark / internal-cut-line capability; recipe-owned persisted garment options; no polo garment geometry | Terra medium | **Complete:** existing garments byte-identical; marks survive canvas, SVG, DXF, tiled PDF, A0, and projector |
| 69 | Polo draft: front slit, body, sleeve reuse, placket pieces, allowances, raw stitch interfaces | Terra high | **Complete:** true slit / placket geometry and every shell seam match; no fake centre-front seam |
| 70 | Collar and stand draft; options + guardrails; collar/stand/neckline stitches | Terra high | **Complete:** every interface measured; default and boundary warnings tested |
| 71 | Polo recipe integration: POMs, notches, BOM, construction order, grading, nesting, checker | Terra medium | Full garment pipeline works in every view/output |
| 72 | UI/persistence/Body and assembled rendering; visual evidence; hardened regression suite | Luna medium, Terra review | User controls own geometry; all pre-existing outputs unchanged |
| 73 | Cross-size/export final gate and production-readiness evidence | Luna medium, Terra review | 100% coverage, parsed exports, human visual review |

Model move: keep Terra through Slices 68–70. Luna medium becomes safe for
mechanical integration in Slice 71 only after stand, collar, placket, and option
contracts have passing geometry tests. Use Terra again for any failed seam,
export, or visual review.

## Build status

Core geometry is resolved. Slice 71 connects the existing draft into recipe,
POM, notches, BOM, construction, grading, nesting, and checker pathways.
