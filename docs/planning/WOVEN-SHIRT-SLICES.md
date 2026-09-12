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
