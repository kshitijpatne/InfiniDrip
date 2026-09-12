# InfiniDrip functional consistency audit

Status: `FC-01` closed; final gate passing, 2026-09-12.
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

## FC-01 exit report — Passing

Behavior commit: `c2c8f48` (`Slice FC-01: align cross-garment Body inspection
[BUG-UI-032-034]`). The complete gate was rerun after the final behavior change:

- `npm test`: 73 test files / 963 tests passed.
- `npm run coverage`: 73 test files / 963 tests passed with 100% statements,
  branches, functions, and lines.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; TypeScript and the Vite production build completed
  with 87 modules transformed.
- Parsed export checks: `npx vitest run src/export` passed 13 files / 140
  tests covering SVG/DXF, tiled PDF, A0 PDF, projector SVG, tech-pack, marker,
  nesting, and final woven/Polo consumers. `src/export/regression.test.ts`
  passed all 8 unchanged legacy export hashes.
- Rendered/live evidence: the in-app browser verified top Side → Skirt Side
  with the shared toolbar visible and Side pressed, lower Side → Front + Back
  with the skirt dimensions rendered, Skirt → Polo with two figures restored,
  all Woven lower fields at 2 dimensions/2 edges, and focused Hip remaining at
  edge opacity 1 / figure opacity 0.15 after pointer exit. The responsive
  matrix covered 1280/900/700/560/390px; the final 390px screenshot showed the
  four-button Body toolbar wrapping without horizontal overflow. No physical or
  production-readiness claim is made.

BUG-UI-032 through BUG-UI-034 are Closed, all original BUG-UI IDs remain
preserved, and Epic 3 has not begun.

## Epic 3 boundary

No Epic 3 implementation may begin from this audit. The master BUGFIX goal is
complete for the digital BUGFIX scope; Epic 3 remains explicitly on hold until
the maintainer instructs otherwise. Physical validation remains deferred.
