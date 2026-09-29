# G04 V01 — seven-recipe source-to-face mapping

**Status:** Slice 264 mapping and topology gate. This completes V01 when the linked focused coverage and build evidence pass.  
**Source of truth:** `src/render/technical-flat-mapping.ts` plus each recipe's drafted `Block`.  
**Boundary:** These are source-role memberships and visibility classes. They do not claim final component transforms or rendered assembled coordinates; V02 owns those.

## Role-to-face mapping

`SHELL` identifies the outside component source. `VISIBLE_OVERLAY` identifies a separately drafted external detail source that can be laid over the shell only after V02 computes its placement. `INTERIOR_HIDDEN` preserves an internal component's source reference without drawing it as an exterior surface. A role may appear in both face maps when the same source component contributes to both views.

| Recipe | Front flat roles | Back flat roles |
|---|---|---|
| Tee | `front` shell; `sleeve` shell | `back` shell; `sleeve` shell |
| Darted tee | `front` shell; `sleeve` shell | `back` shell; `sleeve` shell |
| Tank | `front` shell | `back` shell |
| Polo | `front`, `sleeve` shell; `buttonPlacket`, `outerStand`, `upperCollar` overlays; `buttonholePlacket`, `innerStand`, `underCollar` internal | `back`, `sleeve` shell; `outerStand`, `upperCollar` overlays; `innerStand`, `underCollar` internal |
| Woven shirt | `front`, `sleeve` shell; `pocket`, `outerStand`, `upperCollar`, `buttonPlacket`, `sleeveBand` overlays; `innerStand`, `underCollar`, `buttonholePlacket` internal | `back`, `yoke`, `sleeve` shell; `outerStand`, `upperCollar`, `sleeveBand` overlays; `innerStand`, `underCollar` internal |
| Skirt | `front` shell; `waistband` overlay | `back` shell; `waistband` overlay |
| Trouser | `frontLeft`, `frontRight` shell; `waistband` overlay; `flyShield`, `pocketBagLeft`, `pocketBagRight` internal | `backLeft`, `backRight` shell; `waistband` overlay; `flyShield`, `pocketBagLeft`, `pocketBagRight` internal |

Every role emitted by the drafted block must appear in the registry. A missing mapped role, an extra block role, or a duplicate role within one face produces a mapping issue; the mapper does not substitute a similarly named source.

## Construction and annotation sources

- A component outline references `pattern:<recipe>:role:<role>` and receives `GARMENT_SILHOUETTE`.
- Every `Stitch` relationship references both named interfaces and receives `SEAM` with `VISIBILITY_UNRESOLVED`. A stitch relationship is construction evidence, not proof that the seam line is visible on the finished face.
- Named pattern marks retain their source role/name. Button and buttonhole marks receive `CLOSURE`; pocket-role or pocket-named marks receive `CONSTRUCTION`; remaining marks receive `ANNOTATION`.
- A declared dart references its named leg edges and receives `DART`. The present model has no pleat data, so every recipe reports a `SOURCE_NOT_REPRESENTED` notice for pleats.
- An anchored POM references the front-role outline entity and keeps its current block-space anchor point for V02 transformation. A POM without `Pom.anchor` is explicitly table-only with a `SOURCE_REFERENCE_MISSING` notice.
- Artwork placements map through their exact `pieceRole` to each mapped face. Interior-only targets remain hidden. The flat primitive retains asset/source identity, original size, transform and z-order; the style model has placements but no explicit colorway graph.
- Topstitching has no first-class source in `Block`, `Stitch`, `PatternMark` or the recipe model. Every recipe reports `SOURCE_NOT_REPRESENTED`; BOM/construction text is not used to invent a line.

Missing pockets, closure marks and darts are likewise reported as source gaps. This is a statement about the current digital block, not a claim about a sewn garment. For example, the Skirt recipe's BOM mentions an invisible zip, but its block has no corresponding zipper mark or closure component; this map reports that gap rather than drawing an inferred zipper.

## Topology and option checks

`mapTechnicalFlatSources` validates exact role membership, each stitch's role/edge/mark references, POM anchor finiteness and role target, and artwork target roles. It maps component, stitch, mark, dart, POM and artwork source IDs into separate front/back entries. The role test drafts all seven recipes at defaults and each numeric option's declared minimum and maximum one at a time from defaults; each resulting block must match the admitted role map. This is a topology check, not a judgment that every cross-option combination is sewable or that any geometry has physical fit.

Colorways remain outside the source model: a chosen fabric color can be applied as a V02 presentation overlay, and existing artwork placements can be overlaid by role, but G04 will not invent colorway records or approvals.

## Slice 264 exit record

- **Result:** the source mapper resolves all seven recipes, exports explicit face membership and construction sources, and reports unsupported/ambiguous source cases without generating geometry.
- **Acceptance:** both view kinds are distinct; every current role is mapped exactly per face; hidden components are retained but not presented as exterior lines; stitch visibility is unresolved until a supported drawing rule exists; POM and artwork sources are revision/role traceable; option endpoints preserve topology; unsupported topstitch and pleat sources remain visible.
- **Verification:** see the Slice 264 record in `docs/planning/EPIC-17-ADMISSION.md` for focused 100% coverage, build, board evidence and the exact committed source state.
- **Manual findings:** G04's mapped MQF-004–007, MQF-011, MQF-012 and MQF-015 remain pending the applicable rendered-output review in V02. This mapping slice produced no visual output to mark reviewed.
