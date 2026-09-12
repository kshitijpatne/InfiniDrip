# InfiniDrip — Confirmed project decisions

_Confirmed directly by Kshitij on 2026-09-10 after the Slice 63 handoff. These
decisions resolve the open questions recorded in that handoff._

## Development sequence

The required sequence is:

1. Slice 64: perform the Tank rework reality-check.
2. Fix every real-world failure found by that review before moving on.
3. Build the polo end-to-end.
4. Complete Phase C3.

Do not begin polo before the Tank reality-check and any resulting fixes are
closed. Do not move Phase C3 ahead of the polo without a new maintainer decision.

## Physical validation

No physical garment validation has occurred yet. No garment drafted by InfiniDrip
has been confirmed by cutting, sewing, and fitting it on a real body. This remains
the project's highest product risk and must not be represented as complete.

Physical sampling is currently on hold at the maintainer's request because no
manufacturer or printer is available. Do not suggest or schedule physical
sampling, sewing, or measurement validation unless the maintainer explicitly
reopens it.

## Polo V1 — confirmed 2026-09-11

- Construction is **collar plus stand**.
- Base is the loose tee with the current tee sleeve.
- Placket is visible, clean, folded, uses the same body knit with lightweight
  stabilizer, and finishes at 14 cm long × 3 cm wide.
- It has exactly three buttons at 3.5 cm centre-to-centre.
- Meaningful polo dimensions must be user-adjustable with guardrails.
- Finished collar stand: 2 cm default, adjustable 1–3 cm.
- Finished pointed collar leaf: 5 cm default, adjustable 4–7 cm.
- Button centres are 3.5 cm, 7.0 cm, and 10.5 cm below placket top.
- Side vents are excluded from V1.

The build contract and researched construction evidence live in
`research/garments/POLO-RESEARCH.md` and `planning/POLO-V1-SCOPE.md`.

## Garment research

`docs/research/garments/TANK-RESEARCH.md` is durable project documentation.
Every future garment must have an equivalent research document created before
implementation. Each document must record sources, construction rules, conflicts
between sources, estimates, product decisions, and unresolved questions.

## Adjustability and guidance

Tank neckline width must become user-adjustable.

The broader product principle is that every garment aspect should be adjustable
where meaningful. Validity must be protected through guardrails rather than
hidden limits: invalid or incompatible combinations must remain visible and be
detected by the guidance system, which must explain the problem and offer
actionable corrections. Do not silently clamp or replace a user's selection.

## Code signing

Code-signing procurement and implementation have not started.

## Resource-document lineage

`docs/research/ASSET-RESOURCES.md` is the refined, analyzed successor to
`apparel_design_resources.md`. They serve the same purpose. The legacy document
is retained only for provenance and should not be used for current decisions.

## Planning decisions confirmed 2026-09-12

- Phase C3 includes a visible Side view. Its initial contract remains
  render-only unless a genuine measurement/data requirement is separately
  approved.
- Edit remains preview-only through Phase 5. A later cross-garment final
  design-editing system must define durable overrides, persistence,
  size/grading semantics, downstream validation, and export behavior first.
- The first woven shirt is a reusable relaxed short-sleeve button-up block with
  a point collar and separate stand, front button placket, back yoke, one simple
  patch pocket, turned sleeve cuff/band, curved hem, small side vent, and six
  or seven evenly spaced buttons. Spacing must become research-derived and
  adjustable. Long/two-piece sleeves, sleeve plackets, complex cuffs, multiple
  pockets, pleated backs, princess seams, decorative details, and Polo V2
  changes are deferred.
- The woven shirt is a digital component-library milestone. Do not schedule or
  suggest physical validation unless the maintainer explicitly reopens it.
- The first trouser is a reusable relaxed casual straight-leg block with a
  separate waistband, simple front closure, and minimal pocket construction.
  Its rise, crotch, seat, waistband, grading, and fit logic should support
  later shorts and joggers.
- Surface design is a separate later Epic after the trouser block.
- OpenCode is preferred for higher-volume research, documentation, UI polish,
  export QA, and test expansion. Claude Code is preferred for shorter,
  high-signal tasks. Codex retains geometry, drafting, garment architecture,
  shared pipeline, data model, grading, exports, physical-validation
  decisions, final review, and integration.

## Refined forward Epic plan

### Woven-shirt button count clarified 2026-09-12

The six or seven evenly spaced buttons are on the front placket. The collar
stand has one additional button. The maintainer confirmed this during Slice 85;
UI, BOM, pattern marks and reports must agree.

### Epic 1 — Phase C3 croquis and views (Slices 80–84)

Complete upper/lower croquis routing, expose the visible Side view, add
cross-garment front/side/back render-contract tests, prove croquis remains
outside drafting, grading, checks, nesting, and exports, then run the C3 exit
gate and update durable context.

### Epic 2 — Phase 4 reusable woven shirt (Slices 85–93)

Research and document the block; define construction and component contracts;
implement the bodice, point collar/stand, placket, button spacing, back yoke,
pocket, sleeve band, curved hem, side vent, recipe integration, and complete
digital gate. Narrow research, documentation, focused tests, and export QA
may be delegated; geometry, drafting, architecture, data-model, grading, and
exports remain Codex-owned.

### Epic 3 — Phase 5 trouser block and later surface foundation (Slices 94–103)

Research and define the reusable trouser measurement/ease, rise, seat,
waistband, grading, closure, and pocket contracts; implement and verify the
straight-leg trouser; define the later shorts/jogger relationship; then keep
surface design independent from unfinished garment geometry.

Every slice must state scope, acceptance criteria, non-goals, dependencies,
ownership, recommended model/reasoning, whether the drafting/data model must
change, and applicable verification gates before work starts.
