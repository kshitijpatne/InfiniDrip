# Woven shirt slice execution record

Read with `../research/garments/WOVEN-SHIRT-RESEARCH.md` and the authoritative
project state/decisions. Full component-library exit is Slice 93; the currently
requested continuous implementation group ends at Slice 92.

## Slice 85 - Research

Objective/scope: establish the first relaxed woven block's evidence, measurements,
construction, guardrails, grading and verification requirements before code.
Acceptance: durable equivalent of Tank research; applicable supplied references
consulted, primary web sources cross-checked, conflicts/estimates/choices/deferred
questions explicit, reuse reasons recorded, confirmed button-count semantics.
Non-goals: implementation, physical validation, Polo V2, fullness or extra styles.
Dependencies: completed C3, confirmed Phase 4 scope, supplied references.
Risks: treating educational numbers as standards; knit geometry reuse; missing
physical quantities; collar overlap or sleeve-length semantic errors.
Drafting/data-model change: no in this slice; Slice 86 resolves additions first.
Owner: Codex. Narrow source extraction could be delegated, but construction
interpretation remains with Codex. No delegation was used.
Recommended model: GPT-6 Astra; reasoning: high, for construction interpretation.
Gates: source/diff inspection; existing full 100% coverage, typecheck/build,
parsed export suite and eight unchanged legacy SHA-256 baselines. No new UI to
visually inspect; PDF hem-source diagrams inspected. Word renderer unavailable
(no bundled LibreOffice); source paragraphs/tables read, no layout claims.

Result: research accepted against the scope; 69 files / 883 tests, 100% in all
coverage dimensions; TypeScript/production build pass; eight SHA baselines pass.

## Slice 86 - Construction and data contract

Objective/scope: resolve the research questions before drafting: neck is an
independent body circumference; front overlap is measured from cut centre front
to the closure line; button spacing is finished centre-to-centre; collar leaf
depth is from stand seam to collar point; stand height is the finished stand
depth; sleeve length remains the existing finished cap-top-to-hem input; and
collar/stand, placket, yoke, sleeve band and vent joins must later expose named
sewable interfaces.
Acceptance: a typed recipe-owned option schema covers every selected design
choice; six or seven front-placket buttons are distinct from one stand button;
the 16 physical-role quantities are explicit; the new neck input is present in
controls, facets, plausibility and backward-compatible persistence; live option
resolution preserves finite values verbatim.
Non-goals: drafting geometry, recipe registration, UI garment rendering,
physical validation, Polo changes, or baseline movement.
Dependencies: Slice 85 research and the existing Measurement/Option,
Piece/Mark/Interface and export contracts.
Risks: option ranges are guardrails rather than universal standards; the
eventual geometry must still reject impossible combinations with actionable
guidance and must not inherit knit assumptions.
Drafting/data-model change: `Measurements.neck` defaults to 40 cm and old saves
fall back to that value; `shirt-contract.ts` defines the woven-shirt fields,
options and physical roles. Existing recipes omit the new field and preserve
their export behavior.
Owner: Codex. Model: GPT-6 Astra; reasoning: high, for data and construction
semantics. Delegation: none; geometry and data ownership stay with Codex.
Gates: focused contract/persistence tests, then the full 100% coverage,
TypeScript/production build, parsed export suite and eight unchanged legacy
SHA-256 baselines. No physical claim.

Result: contract implemented; focused tests pass (60 tests); full verification
is recorded with the slice commit.
