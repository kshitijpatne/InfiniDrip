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

## Slice 87 - Woven bodice

Objective/scope: draft the woven-only front/back body block with independent
neck circumference and ease, a relaxed waist/hip path, separate centre front,
and named shoulder, armhole, side and hem boundaries.
Acceptance: front is a separate cut piece, back is on fold, neckline responds
to neck input, waist/hip inputs affect the lower shape, and shoulder/three-part
side interfaces match without importing knit body geometry.
Non-goals: collar, stand, plackets, buttons, yoke, pocket, sleeve, vent,
recipe registration, UI rendering or physical validation.
Dependencies: Slice 86 contract; existing Piece, Block, neckline and stitch
primitives.
Risks: the relaxed lower path is a digital drafting estimate and needs the
later guidance slice to surface malformed proportions rather than hide them.
Drafting/data-model change: `draftWovenShirtBody()` and its two declared body
stitches are added in `shirt.ts`; existing recipes and exports are untouched.
Owner: Codex. Model: GPT-6 Astra; reasoning: high, for geometry and interfaces.
Delegation: none. Gates: focused geometry tests, full coverage/typecheck/build,
parsed export suite and unchanged legacy hashes; no physical claim.

Result: body component implemented; focused tests pass (6 tests); full
verification is recorded with the slice commit.

## Slice 88 - Point collar and separate stand

Objective/scope: add two stand layers and two point-collar layers whose base
seams are measured from the actual woven front and back necklines.
Acceptance: outer stand joins the body neckline, under collar joins outer
stand, upper collar joins inner stand, and the two collar layers share their
complete outer seam; all four pieces are on the centre-back fold and their
height/depth options remain live.
Non-goals: buttons, plackets, yoke, pocket, sleeve, vent, recipe/UI
integration or physical validation.
Dependencies: Slice 87 body neckline edges and Slice 86 collar semantics.
Risks: the pointed leaf flare and default values are digital estimates, not
physical fit evidence; later guidance must catch stand/leaf and neckline
collisions without clamping.
Drafting/data-model change: `addWovenShirtCollar()` composes four named pieces
and four stitch interfaces onto the body block; no existing recipe changes.
Owner: Codex. Model: GPT-6 Astra; reasoning: high, for component geometry.
Delegation: none. Gates: focused collar tests, full coverage/typecheck/build,
parsed export suite and unchanged legacy hashes; no physical claim.

Result: layered collar/stand component implemented; focused tests pass (5
tests); full verification is recorded with the slice commit.

## Slice 89 - Full plackets and button system

Objective/scope: add two full-length folded front plackets with a live closure
line, six or seven evenly spaced button/buttonhole marks, and the one additional
button plus buttonhole on the collar stand.
Acceptance: placket attachment lengths equal the real centre-front edge;
button/buttonhole counts and centre-to-centre spacing follow the options; six
and seven are supported without fractional-count fabrication; front overlap and
placket width move the marks/outline; stitch data names both physical joins.
Non-goals: yoke, pocket, sleeve, hem/vent, recipe/UI integration or physical
validation.
Dependencies: Slice 88 collar/stand and Slice 86 button semantics.
Risks: full-placket placement is a digital construction estimate; short bodies
or excessive spacing must be warned about in the later guidance/recipe slice.
Drafting/data-model change: `shirt.ts` adds full placket pieces, live mark
positions, explicit stand button/buttonhole marks and two placket stitches.
Owner: Codex. Model: GPT-6 Astra; reasoning: high, for closure geometry.
Delegation: none. Gates: focused marks/stitch tests, full coverage/typecheck/
build, parsed export suite and unchanged legacy hashes; no physical claim.

Result: button system implemented; focused tests pass (7 tests); full
verification is recorded with the slice commit.

## Slice 90 - Back yoke and patch pocket

Objective/scope: split the actual back armhole at the selected yoke depth into
a lower-back piece and a two-layer folded yoke, then add one placed patch
pocket with live width/height.
Acceptance: yoke seam lengths match exactly; the yoke retains neckline,
shoulder and upper armhole boundaries; lower back retains the lower armhole,
side and hem; front pocket placement is a named mark and the pocket top joins
it as a stitch; yoke depth and pocket dimensions move the output.
Non-goals: sleeve, folded sleeve band, curved hem/vent, recipe/UI integration
or physical validation.
Dependencies: Slice 87 body edges, Slice 88 collar neckline ownership, and
the generic cubic/stitch/mark primitives.
Risks: yoke depth outside the armhole is intentionally drafted verbatim and
must be surfaced by later guidance; the pocket placement is a product estimate,
not a physical validation result.
Drafting/data-model change: `shirt.ts` now performs a cubic armhole split,
composes the yoke and lower back, adds the pocket placement mark and one pocket
stitch; collar composition recognizes the yoke's neckline role.
Owner: Codex. Model: GPT-6 Astra; reasoning: high, for seam topology.
Delegation: none. Gates: focused yoke/pocket geometry/stitch tests, full
coverage/typecheck/build, parsed export suite and unchanged legacy hashes; no
physical claim.

Result: yoke and patch pocket implemented; focused tests pass (10 tests); full
verification is recorded with the slice commit.
