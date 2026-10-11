# EPIC-17 / G04 V03 — DXF named-block identity pilot — Slice 628 exit

## Result

S628 gives a positive, bounded CLO observation for piece-role identity carried
by generic DXF `BLOCK`/`INSERT`, with one qualification. The disposable,
geometry-identical Woven zero-vent fixture imported into CLO 2026.1.310 as 12
separately named patterns, exported and reimported into a fresh blank project.
The rendered reimport shows all twelve expected role names and all twelve
pieces. The CLO-exported DXF contains twelve uniquely named `BLOCK` definitions
and twelve bijective `INSERT` references, and the twelve in-block `PIECE NAME`
labels preserve the original role names. CLO appends `_M` to each literal block
and insert name for this one-size export, so exact block-token invariance did
not pass. The result supports a reversible piece-role mapping when that suffix
and CLO's piece-name annotation are interpreted together; it does not justify
silently stripping the suffix or treating the block name as a product revision
identifier.

The source-bound geometry comparison passes all 12 CUT and all 12 SEW
contours. The greatest cyclic/reversed vertex residual is `0.0007416873 mm`
against the existing `0.01 mm` (`0.001 cm`) threshold. Comparison uses distinct
output closed polylines for the source CUT and SEW contours, the DXF coordinates
without fitted translation/scale/rotation, and a numeric layer as an observed
locator only; it assigns no general meaning to CLO's numeric layer values.
The reimported 2D output was visually reviewed: all 12 pieces render without
gross damage. CLO notified that the DXF had no seam allowances and was imported
in Custom mode to preserve the original shape; that message was recorded, not
treated as a geometry error.

## Acceptance evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Disposable wrapper leaves all source entities unchanged | Pass: 12 named blocks and 12 identity inserts expand byte-for-byte to the source's 53 entities | `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Evidence\named-block-preflight.json`; `create-named-block-fixture.mjs` |
| CLO import renders the twelve source role names | Pass: all 12 patterns appear in the clean-project object tree and 2D view | `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Renders\named-block-import-overview.jpg` |
| CLO export retains a one-to-one block/reference set | Pass, with a size suffix: 12 unique definitions and 12 resolving inserts; each token is the source role plus `_M` | `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Evidence\named-block-roundtrip.json`; output DXF hash below |
| Exact literal BLOCK/INSERT tokens unchanged | **Not met:** CLO adds `_M` to each token. The in-block `PIECE NAME:` strings and reimported UI names preserve all twelve role labels. | `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Evidence\named-block-roundtrip.json`; reimport screenshot |
| Reimported CUT and SEW geometry | Pass: 12/12 pieces, 24/24 contours; maximum residual `0.0007416873 mm`, threshold `0.01 mm` | `analyze-named-block-roundtrip.mjs`; C:-only `Evidence\named-block-roundtrip.json` |
| Rendered reimport review | Pass for visible piece count and gross shape only; this is one Woven configuration | `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Renders\named-block-clo-reimport-overview.png` |

## Reproducibility and provenance

- Pinned S627 source DXF: SHA-256
  `9562BD53CD95558D5F635F319E90407125DB4B2E9A72BDBA9B84657915EDCDEA`.
- S628 named-block input: 17,039 bytes, SHA-256
  `DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6`.
- CLO DXF-AAMA export: 103,616 bytes, SHA-256
  `F17F5F2BC6D838DF52120375C1BA171D5CA56791A14D5CDFEBEEFE1F38A1879C`.
- Initial import overview: 114,245 bytes, SHA-256
  `CD0B6E64E18753EE9AC0CCD78798BC46F1F2372C103DEE0DC84C33B03CAACDC6`.
- Reimport overview with all twelve role names legible: 110,231 bytes, SHA-256
  `93C02F237DC438BF84D685CE9F69B84BDEAF85EE9805C18B7B92072A875D2BC8`.
- Output DXF version: AC1009/R12; no `$INSUNITS` declaration. CLO export was
  set to centimeter at 100%, DXF-AAMA, Graded Nest. The single source size
  produces the `_M` suffix; no grade was tested.
- CLO import was DXF-AAMA, centimeter, 100%, no rotation, Load Type Open,
  notches Both/Ratio, Draw Curve Points enabled, Auto Distribute and curve
  optimization disabled. Reimport used the same settings into a clean blank
  document.
- Input/output DXFs, machine-generated reports, and rendered evidence are
  under `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\`.
  CLO was authorized for this product-development test and the maintainer
  confirmed local processing. CLO remains open while EPIC-17 is active.

## Limits and V03 disposition

This is one repaired Woven `sideVentDepth=0`, one-size fixture. It supports
generic piece-role names and CUT/SEW geometry only. CLO's output is unitless
AC1009 and carries many generated point and auxiliary entities. S628 does not
establish a normative industrial apparel profile, a rights-cleared profile,
unit/grade semantics, durable revision IDs, manufacturing-mark meaning or
identity, negative-input behavior, all-seven recipe/option/grade coverage,
repeat-generation determinism, other receiver compatibility, or exact literal
BLOCK/INSERT token stability. It does not claim production CAD compatibility.

V03 remains In Progress, gated behind V02 and the admitted profile/rights,
unit, representative all-seven fixtures/options/grades, semantic identity and
mark, malformed-input, repeated round-trip and rendered-output requirements.
V02 remains Done as its subtask status; no accepted-view counts, holds,
protected exports, legacy DXF behavior, roadmap scope, or acceptance criteria
changed. No source pattern, production code, production writer, or export
baseline changed. No fit, physical sampling, factory-acceptance or
production-readiness claim is made.

## Slice boundary

- Start: `2026-10-09 16:42:32 UTC`, from S627 commit
  `95d30bd9bedfa5b2d08940234756458238de89bb`, clean branch
  `codex/epic-17-g04`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor. Board start
  replay completed at revision 3654; G04-V02 Done and G04-V03/EPIC-17 In
  Progress.
- End: recorded by the S628 exit commit and validated board replay below.
- Time accounting (approximate): fixture/report implementation and durable
  analysis helper 7 min; focused preflight, one CLO import/export/reimport,
  source-bound geometry analysis and render review 18 min; packet/state/board
  closeout, tests and commit 11 min; external-agent wait 0 min; maintainer
  decision time 0 min (CLO-use/local-processing authorization was already
  recorded at slice start).
- No independent, disjoint, low-risk task existed: fixture, receiver operation,
  identity interpretation and geometry/render review form one experiment.
- Focused verification: start preflight passed at board 3654; deterministic
  fixture generation and named-block round-trip/geometry analyzer passed;
  exit preflight passed at 3656; `npm run control-center:test` passed 42/42;
  `git diff --check` passed. One attempted post-exit rerun of the *start*
  preflight rejected board revision 3656 by its intended start-state guard;
  the start preflight had already passed at 3654, and the separate exit
  preflight passed. This was a sequencing mistake in the final command batch,
  not a fixture, board, or receiver failure.
- No production code changed, so changed-production-code coverage is not
  applicable; the full repository coverage gate remains reserved for the
  settled integrated Epic/PR candidate.
- One landed commit, `Slice 628: verify CLO named-block DXF round-trip`.
  Board closeout adds only a verified evidence item and G04-V03 comment.
  G04-V02 remains Done; G04-V03 and EPIC-17 remain In Progress. The next
  action is to inspect the remaining documented V03 rights/profile and
  representative-option gaps for a distinct evidence-backed candidate; do
  not repeat S628 or relax V02/V03 gates.
- End: `2026-10-09 17:18:15 UTC`, with validated board exit replay at 3656.
- Total elapsed: approximately `35m43s` (`16:42:32–17:18:15 UTC`). Allocation:
  implementation/analysis helper 7 min; focused verification including CLO,
  geometry and rendered review 18 min; durable packet/state/board, tests and
  commit 11 min; external-agent waits 0 min; maintainer-decision time 0 min.
