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
