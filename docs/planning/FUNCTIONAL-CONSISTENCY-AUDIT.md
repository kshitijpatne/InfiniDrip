# InfiniDrip functional consistency audit

Status: `FC-01` behavior slice prepared; final gate pending, 2026-09-12.
Master goal: complete the BUGFIX phase before Epic 3. Epic 3 remains explicitly
on hold.

This audit is an independent-user pass over the already completed P1/P2/P3
BUGFIX work. It looks for small inconsistencies that a unit test or a single
happy-path screenshot can miss. Physical sewing, physical fit, and production
readiness remain out of scope.

## Breadth and method

| Area | Coverage |
| --- | --- |
| Garments | Tee, Darted tee, Tank, Polo, Woven shirt, Skirt |
| Analytical views | Pattern, Body, Size run, Spec, Nesting, Check, Edit |
| Body projections | Front + Back, Front, Back, and schematic Side where exposed |
| Controls | Measurement and option inputs, keyboard increment/decrement, garment and view buttons, Body projection buttons, style target, material/stretch, color, nesting scope, selected export size, preview collapse, guidance Review actions, and Edit controls |
| Responsive widths | 1280, 900, 700, 560, and 390 CSS pixels; explicit viewport overrides are reset after the audit |
| Evidence | Live DOM state after each action, rendered screenshots for changed inspection surfaces, parsed renderer/unit tests, and the required export/coverage gate |

The audit treats `docs/BUG-LEDGER.md` as the source of truth. A declared body
field must have a matching dimension and, where it shapes an outline, a matching
edge in the garment's Body view. `ease` is intentionally excluded from Body
dimensions. Side remains a clearly labelled schematic exception with no
fabricated side-specific measurements.

## Independent checks completed

- Every garment reached all seven primary views without an empty inspection
  surface; the active view button remained the only pressed view control.
- Every exposed measurement was checked against its Body dimension/edge map.
  The initial mismatch was Woven shirt `waist`, `hip`, and `hipDepth`; these are
  now rendered on both front/back figures and follow the shirt draft's finished
  lower shaping.
- Polo and Woven option rows were focused one by one. Each exposed option had a
  real matching detail marker in the assembled preview, with the expected
  opacity lift; no option marker was missing.
- Keyboard ArrowUp/ArrowDown changed and restored the length input on all six
  garments. Woven and Polo option spinners were also exercised within their
  declared ranges.
- Invalid measurement/option inputs paused drafting, preserved the typed value,
  and exposed exactly one associated Guidance Review target for each tested
  garment family.
- Garment switching preserved explicit material and recipe option choices while
  updating fields, style choices, rendered output, and export-size options.
- Switching a top Body view through Side into Skirt preserves the valid lower
  Side schematic and keeps the projection toolbar truthful; Front + Back and
  Side both work on the lower garment, and switching back to a top keeps the
  toolbar and pressed state synchronized.
- A focused measurement remains spotlighted when the pointer leaves its row;
  leaving the row only clears a hover-only spotlight.
- At every tested width, the document and key panels stayed within the viewport
  at fit zoom. Dense Woven controls wrapped without horizontal overflow.

## Bounded fix slices

| Slice | Records | Scope | Non-goals |
| --- | --- | --- | --- |
| FC-01 | BUG-UI-032–034 | Woven lower-body Body parity; cross-garment Body projection state; focus/hover spotlight precedence | No export-writer change, no baseline move, no new garment, no physical or production claim |

## FC-01 exit report — pending full gate

The focused renderer/UI tests and TypeScript check pass, and the live rendered
verification above is complete. The final FC-01 exit status is not complete
until the full project gate is rerun and recorded: 100% coverage, TypeScript,
production build, parsed SVG/DXF/PDF/A0/projector/tech-pack checks, and all eight
unchanged legacy export hashes.

## Epic 3 boundary

No Epic 3 implementation may begin from this audit. The master BUGFIX goal stays
active until the full gate is recorded and all audit records are closed. Physical
validation remains deferred.
