# G04 V01 — source inventory and view mapping

**Status:** Slice 262 inventory baseline; V01 remains in progress.  
**Scope:** Record the existing digital sources that can support front/back flats for the seven admitted recipes. This is an observed-source inventory, not a claim that a professional-flat renderer already exists.  
**Authority:** `docs/planning/EPIC-17-ADMISSION.md`, the accepted C04 contract, and the G04 criteria in `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`.

## Source-to-view rules

1. A finished flat is an assembled garment view. `Block.roles` and `Piece.edges` provide component outlines; they are not automatically a finished view. A composition rule must place, orient, and connect the right components for the requested front or back.
2. Named `Stitch.interfaces` describe edge relationships used in construction and validation. They can support seam adjacency, but do not say whether a seam is externally visible, whether it is topstitched, or what finish to draw.
3. A piece `dart.legs` pair and explicit construction marks can support their own source-derived overlays. Absence of such data means “not represented in source,” not “feature absent on a real garment.”
4. Pattern marks are limited to cut line, fold line, placement line, button, buttonhole, and placement point. Marks are construction geometry and must not be mistaken for the piece's cut boundary.
5. Recipe option definitions and current resolved options can select drafted geometry. The view may only display option-driven details present in that exact drafted block. It must not infer geometry by matching option labels.
6. Artwork placement is a separate style overlay with an asset reference, target role, dimensions, transform, stable placement ID, and z-order. It can be composited when the referenced role is mapped to a view; it is not pattern geometry or an inferred print.
7. POM query functions can calculate values from a block. Current POMs do not all provide a view anchor or explicit measured path. A callout is drawable only when its target has a resolved geometry anchor in the same revision; otherwise expose the missing anchor as a validation issue.
8. Every visible line/annotation keeps stable identity, source class, source reference and layer. Current source class vocabulary follows C04: `PATTERN_DERIVED`, `PARAMETRIC_TECHNICAL`, `USER_REFERENCE`, `SCHEMATIC`, and `3D_SIMULATION`. G04 flats may use the first three when their source qualifies; do not relabel the current schematic renderer as pattern-derived.

## Observed source inventory

| Concern | Current source | What it can support | Not currently represented |
|---|---|---|---|
| Component silhouette | `Block.roles`; `Piece.edges` (named line/curve edges); `Piece.onFold` | Exact drafted boundary of each role for one recipe input set; fold-side semantics | Finished view assembly, visible/hidden seam convention, fabric drape, physical result |
| Seam relationships | `Block.stitches`; each stitch has named edge interfaces and role references | Pairing/matching relationships and a candidate seam location when both referenced components map into a view | Seam visibility, seam allowance in a finished view, stitch type, seam finish, topstitch offset |
| Darts | Optional `Piece.dart` naming two outline-leg edges | Exact source-linked dart legs for pieces that declare one | General pleat/tuck/fold construction and multiple named darts per piece |
| Internal marks | `Piece.marks` / `PatternMark` | Explicit fold/placement lines; button, buttonhole, placement points | Arbitrary seam guides, topstitch runs, closure hardware, complete construction annotation |
| Options | Recipe `GarmentOption` definitions and recipe draft resolver | Geometry selected by the exact validated option set | Generic option-to-view semantic mapping and presentation/visibility rules |
| Artwork | `ArtworkPlacement` within style surface state | Source asset placement on a mapped role; transform, dimensions, z-order | Colorway system and approved color/material mapping |
| POMs | Recipe `Pom` functions and optional point anchors | Calculated numeric values from a drafted block; some front anchors | Uniform method path, stable geometry target, back-view anchors, guaranteed collision-free callout placement |
| Layer order | Artwork z-order; vector draw order can be chosen by renderer | Artwork relative stack order | Shared semantic layer policy for silhouette, seam, stitch, annotation and overlays |

These gaps are product-model gaps. The renderer must report a missing or conflicting source and must never silently clamp an option, fabricate missing construction geometry, or draw a hidden feature as if the source proved it.

## Seven-recipe front/back map

“Component source” means the exact role outline from the same drafted block. A recipe role omitted from a view may still belong in the opposite view or may be a hidden/internal part. Detailed visibility and seam treatment remains a V01 decision to be encoded in explicit mapping data.

| Recipe | Front source candidates | Back source candidates | Construction and overlay evidence | Explicit source gaps |
|---|---|---|---|---|
| Tee (`tee`) | `front`, `sleeve` | `back`, `sleeve` | named body/sleeve edges and stitch interfaces | No pocket, dart, closure or topstitch metadata. Neckband is described by construction text, but no distinct neckband role is in this grammar. |
| Darted tee (`fitted`) | `front`, `sleeve` | `back`, `sleeve` | front declares `bustDartUpper`/`bustDartLower`; stitch graph derives from fitted grammar | No closure or topstitch metadata. No general pleat model. |
| Tank (`tank`) | `front` | `back` | neckline and armhole are part of each drafted outline; style/measurement options affect geometry | No sleeve role. Binding is described in construction notes but no separate binding component or topstitch source is exposed. |
| Polo (`polo`) | `front`, `sleeve`, `plackets`, `collar` as resolved by grammar | `back`, `sleeve`, `collar` as resolved by grammar | center-front/placket and button/buttonhole marks; options resolve collar/placket construction | No general topstitch route or finish metadata. Internal collar/placket components need explicit face mapping to avoid duplicating their pattern-piece view. |
| Woven shirt (`woven-shirt`) | `front`, `pocket`, `collar`, `plackets`, `sleeve`/cuff components as resolved by grammar | `back-yoke`, `collar`, `sleeve`/cuff components as resolved by grammar | pocket placement and closure/placket marks; options alter construction geometry | No topstitch source. The grammar's semantic nodes compose into role pieces; mapping must inspect actual composed roles and preserve front/back-specific placement. |
| Skirt (`skirt`) | `front` | `back` | front/back panels and waistband; named waist/side relationships | No dart, pleat, closure, pocket or topstitch source in current grammar. Do not imply their absence beyond this modeled recipe. |
| Trouser (`trouser`) | left/right front legs, waistband, fly, pockets where exposed by composition | left/right back legs, waistband where exposed by composition | fly and pocket construction marks; left/right component topology | No topstitch route or general pleat source. Exact waistband/fly/pocket face visibility requires explicit mapping from actual composed role names. |

The matrix is a source inventory, not a full assembly drawing. V01 must encode exact composed role IDs, side/face placement, overlap and visibility rules and test them against drafted blocks for supported options. For all seven recipes, composition must fail visibly when a required role or referenced edge is missing or duplicated.

## Slice 262 exit record

- **Result:** recorded current source capability and seven-recipe front/back candidates, with unsupported construction data called out explicitly. No product code or export behavior changed.
- **Acceptance:** source categories and current gaps are traceable to the existing model; all seven admitted recipes are represented; unknown construction is not treated as evidence of absence.
- **Git:** started from S261 commit `89d7cf780d155bfb4331371000f2b166b34bad35`; highest assigned slice remained 261 at start; S262 is reserved. `origin/main` was unchanged at the verified S261 base.
- **Board:** G04-V01 is `In Progress` in canonical board revision 382, transitioned through `executeBoardCommand`.
- **Verification:** `npm run control-center:test` passed 33/33 after updating the admitted V01 status regression from Ready to In Progress. The inventory was checked against `Block`, `Piece`, `PatternMark`, recipe grammars, C04 and the G04 acceptance contract. No production code changed, so production coverage gates do not apply in this documentation slice.
- **Blockers:** none for V01. Detail visibility and typed vector semantics remain to be encoded in S263–264. V03 receiver/rights remains separately gated.
- **Remaining dependency:** primitive schema and source-reference types must consume this observed inventory without turning absence into a guessed construction detail.
- **Next action:** define the versioned technical-flat primitive and source-reference model, with focused unit tests and full changed-code coverage.
- **Elapsed time:** implementation and source review 5m 02s; focused verification 1m 20s; external-agent wait 0m; maintainer-decision time 0m.
