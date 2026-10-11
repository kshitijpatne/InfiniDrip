# EPIC-17 / G04 V03 — Polo CUT segmented-LINE import — Slice 640 exit

## Outcome

S640 isolated a subset of an existing CLO connected-LINE experiment: only the
five shallow-corner Polo CUT polylines were changed to ordered,
coordinate-identical connected LINE segments; every other DXF group/value
record was kept as asserted by the preflight manifest. This is not a novel
entity-encoding family. S620/S621 had already tested DXF-AAMA on the S574
connected-LINE fixture, and S622 had tested Standard DXF on that fixture; both
failed the same five-piece CUT gate. This history gap was discovered during
the S640 exit audit, after its start packet incorrectly described the LINE
family as untested. The narrower mixed-entity fixture remains a measured
isolation result, not a new route to acceptance.

CLO 2026.1.310 Standard-DXF import returned nine patterns with no
Python-query error. The corrected source-bound analyzer searched every native
pattern rather than assuming source-ordinal and numeric-pattern order. Four
source CUT contours map uniquely and meet the unchanged `0.001 cm` threshold;
five do not:
limit. The four controls (front, sleeve and both plackets) match within
`0.000012 cm`. The back is 33/33 points but its best all-pattern cyclic
comparison is `2.236068 cm`; both collar stands return 58 points against 54
source vertices; both pointed collars return 44 points but differ by as much
as `9.310850 cm`. These are measured native-input differences in the imported
project, before any export. The experiment therefore stopped at the required
pre-export gate. **No ASTM export or reimport was performed.**

This result rejects this connected-LINE representation for this fixture; it
does not diagnose CLO's internal cause or establish DXF conformance. It clears
no V03 gate, changes no acceptance criterion, threshold, hold, source pattern,
stitch graph, product code, legacy DXF behavior, or protected export identity.
V01/V02 remain Done, V03/EPIC-17 remain In Progress, and all seven-recipe
V03 acceptance remains open. No physical-fit, factory-acceptance, or
production-readiness claim is made.

## Inputs and artifacts

All exchange inputs, project files, renders and measured output remain under
`C:\G04-CLO-DXF-Exchange\S640-polo-cut-segmented-line-import\`.

| Artifact | Bytes | SHA-256 | Result |
| --- | ---: | --- | --- |
| S617 source `polo-standard-m-cm-units-header.dxf` | 24,326 | `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5` | input, unchanged |
| S640 `polo-m-five-cut-contours-as-lines.dxf` | 28,376 | `9CD017391E428BB26B12644D01814ABC3EFFA5CE02BC7D0DB368BDCBEB7370F3` | five CUT contours converted; exact coordinate/order and no-other-record assertions passed |
| `S640-segmented-lines-standard-import.zprj` | 2,309,428 | `F1B34462C189F33E676F3CE9418493AB2886D9FE45FD53666BF71F8A684EB603` | actual CLO import project |
| `native-input-information.json` | 703,182 | see evidence folder | nine patterns, no API errors |
| `native-cut-contour-comparison.json` | see evidence folder | see evidence folder | repeatable, source-bound 9-piece comparison; 4 pass / 5 fail |
| `CLO-import-overview.jpg` | 85,374 | `A9A36D8ADBE9571C99F2BB72653C4A1A967DAFD9B793F4627DC96568AB9C` | actual CLO 2D overview of all nine imported pieces |

The derivative manifest maps the five changed contours to back, outer/inner
collar stand, and upper/under pointed collar, including their exact shallow
corner coordinates and vertex counts. The analyzer reads the original source
contours and searches all CLO native child contours, cyclically in both
directions, after the verified cm-to-mm scale. A pass requires one unique
native pattern per source contour and a one-to-one identity mapping. It does
not assume numeric CLO order equals source order, or allow translation,
rotation, vertex deletion, geometry repair, or tolerance relaxation. CLO
labels child shapes `Base Line`; the measured correspondence is the native
child point-list geometry, not a presumed semantic label.

The overview confirms nine visible pieces and no obvious gross fragmentation
at fit scale. Since the numeric pre-export contour gate fails, no detail-scale
readability pass or output/reimport render was attempted. Rendered output and
exchange readability remain open. The input notice about seam allowances
being imported in Custom mode was informational, not an error.

## Gate disposition

| Gate | S640 result |
| --- | --- |
| Source/derivative preflight | pass: only the five admitted CUT contours changed representation; coordinates/order and all other DXF group/value records are asserted unchanged |
| Nine stable piece identities | nine native patterns returned; exact source-to-native identity is proven only for the four passing contours, so the all-piece identity gate remains open |
| CUT geometry | **fail**: four exact controls; back, both stands and both pointed collars fail `0.001 cm` before export |
| SEW geometry and marks | not qualified; no export and the all-CUT preflight already fails closed |
| Grades/options and seven recipes | untested by this one-revision CLO fixture; remain open |
| Malformed input | untested; remains open |
| Repeated exchange | not attempted; remains open |
| Render/readability | 9-piece actual overview retained, but detail and reimport are unverified; remain open |
| Receiver rights/profile/conformance | unchanged; CLO 2026.1.310 Standard DXF is still an empirical vendor route only |
| Legacy DXF/protected export identities | untouched; final integrated regression gate remains required |

## Slice and repository verification

- Start recorded `2026-10-09 22:02:35 UTC` at S639 commit
  `be7b7d6a8df0cfa48146d19879a6b2fa6ca1504d`, with refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` an ancestor and a
  clean worktree. S639 was highest; S640 was reserved once. Start replay was
  validated at board revisions `3701→3703`.
- The S640 start statement that connected LINE entities were untested was
  corrected after reviewing S620/S621/S622's source-linked packets. S640's
  same-family subset-isolation result remains measurable, but adds no novel
  receiver-mode or entity-family evidence. The all-pattern identity search
  also corrects the preliminary same-index-only analysis; final results and
  failure status are based on that broader search.
- Existing post-S622 evidence was checked before choosing follow-up work:
  S623's browser receiver could not guarantee the required C:-only output path
  and was not given product data; S624's local Open CAD Studio v2026.40.1
  passed a bounded nine-fixture geometry/repeatability/malformed-input screen,
  but is generic R14 rather than a demonstrated apparel industrial profile;
  S626's 73-row R14 cohort was run twice and S627 repaired its valid zero-depth
  source geometry. Those results do not close the documented apparel-profile,
  grade/identity, or all-seven CLO acceptance gates. S638 remains the latest
  explicit gate reconciliation; the next work must target a genuinely
  distinct, rights-reviewable receiver/profile question.
- At the durable S640 checkpoint (`2026-10-09 22:19 UTC`), `get_goal` reports
  `active`; its objective still matches the admitted G04 path through V01,
  V02, V03, required gates and safe merge. No status or wording reconciliation
  is needed and the goal was left unchanged. “Stalled” is not its recorded
  status; it is active and still needed until the admitted objective completes.
- Focused verification: derivative-preparation assertions, native query
  project-hash and nine-piece checks, source-bound contour analyzer,
  retained CLO overview, `npm run control-center:test`, and `git diff --check`.
  The Control Center suite passes 42/42; validated exit replay is
  `3703→3705`, followed by a validated prior-art correction at `3705→3706`;
  `git diff --check` passes. There is no production-code change;
  changed-production-code coverage does not apply. Full repository
  tests/100% coverage, build, browser, and integrated output gates remain for
  the settled Epic/PR candidate.
- Approximate elapsed time from start to durable exit: 19 minutes. Split:
  receiver UI/import/query and render review 5m; analysis implementation and
  focused data comparison/history audit 8m; packet, state, board replay and
  focused repository verification 6m; external-agent waits 0m; maintainer-decision
  time 0m. No independent delegation was safe because the source/pattern/API
  correspondence and live CLO output are one coupled experiment.
- Refreshed `origin/main` to
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, confirmed it remains an
  ancestor, verified S639 as the highest previous slice, and confirmed S640
  unique. Final diff review and commit remain at this exit boundary.

## Next action

Use the S638 matrix and checked S623–S627 evidence to research a genuinely
distinct, free-to-evaluate industrial apparel CAD receiver/profile whose
documented local import/export contract can be verified under already granted
rights. Do not repeat a CLO profile/entity permutation on this Polo fixture;
do not send patterns to an unapproved web service. Do not export the failed
S640 project. Keep CLO open in the existing session and preserve every
threshold, all-seven acceptance, profile/rights gate, and hold.
