# BUGFIX P3 execution record

Phase: `EPIC-BUGFIX-P3`, sequentially after P1 and P2 and before Epic 3.
Source of truth: `docs/BUG-LEDGER.md`. Physical sewing, physical fit, and
production-readiness validation remain out of scope.

## Scope and exit criteria

P3 closes BUG-UI-027 through BUG-UI-031 in bounded slices. Each slice must
preserve the stable ledger IDs, update the affected durable documents in the
same behavior commit, review the actual diff, and inspect the rendered/live
result before the next slice.

The P3 exit gate is: 100% test coverage; TypeScript; production build; parsed
SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech-pack checks; and all eight
legacy export hashes unchanged. The P3 exit report is not passing until every
affected ledger record is Closed and the gate is recorded here.

## Bounded slices

| Slice | Records | Scope | Non-goals |
| --- | --- | --- | --- |
| BF-P3-01 | 027–029 | Garment-appropriate defaults and truthful UI/journey copy | No silent change to saved material choices; no physical or production claim |
| BF-P3-02 | 030 | Explicit nesting scope labels and consequence helper | No change to nesting geometry or export bytes |
| BF-P3-03 | 031 | Product heading, section hierarchy, and visible swatch naming semantics | No new product workflow or physical validation |

## BF-P3-01 — Closed

Implementation: `733aff5` (`Slice BF-P3-01: align defaults and copy
[BUG-UI-027–029]`).

Fresh workspaces now choose Cotton jersey for knit-oriented garments and Cotton
woven for woven-oriented garments, with a stable woven fallback for unknown
future garment IDs. Existing saved material choices remain explicit and are
not replaced. The Style helper now describes numeric inputs and immediate
preview updates, and the journey checklist refers to the available garments
instead of a stale two-garment subset.

Focused verification and live evidence are recorded after implementation.

## BF-P3-02 — Closed

Implementation: BF-P3-02 behavior commit (immutable reference recorded after
the slice commit).

Nesting controls now say Single size and Graded marker. Each button exposes an
accessible scope description, and visible helper text explains that Single size
uses the selected size while Graded marker includes every graded size. The
underlying nesting and export behavior remains unchanged.

Focused verification and live evidence are recorded after implementation.

## BF-P3-03 — Pending

## P3 exit report — Pending

Epic 3 remains parked until this report passes. Physical validation remains
deferred.
