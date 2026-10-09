# EPIC-17 / G04 V03 — compare pre-export getter to measured DXF output — Slice 599 start

## Verified start

- Started `2026-10-09 09:12:46 UTC` on `codex/epic-17-g04` at S598
  `b8bed366ba7a5ab3ee7f4013a475080dc87ce7b4`. Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S598 was
  highest; no `Slice 599:` commit exists; S599 is reserved uniquely.
- Board revision `3526`: EPIC-17/G04-V03 In Progress; G04-V02 Done. All V03
  acceptance gates and the fixed `0.001 cm` round-trip threshold remain.
- CLO 2026.1.310 remains open. S599 is static evidence analysis only: no CLO
  window action, API call, import/export, project save, or new DXF is planned.
- New machine output stays under
  `C:\G04-CLO-DXF-Exchange\S599-clo-api-vs-export-evidence\`.

## Bounded objective

Join the already-pinned S597 pre-export `GetPatternLineInfo`/source contour
matches to S595's already-pinned source-to-export result for the same periodic
Polo M fixture. Determine whether getter source matches distinguish passing
from failing source CUT contours. The join uses the known source contour
ordinals and S595's block binding through source SEW geometry; it does not
map API indexes to pieces or promote API output into manufacturing semantics.

## Focused gates and limits

Pin the S536 R2000 source, S595 periodic fixture, S595 round-trip JSON, and
S597 API-comparison JSON by hash. Validate exact nine-piece coverage and
join-by-source-ordinal. Report how many S595 passing and failing CUT contours
had a direct S597 API match. If even one passing CUT is absent, the getter
cannot serve as a complete pre-export CUT-presence indicator; do not infer
import loss from its omissions. No V03 gate is cleared or changed.

Run `node --check`, analyzer assertions, validated board preflight/replay,
Control Center tests, and `git diff --check`. No production source/tests
change; full integrated coverage/build gates remain for the settled Epic/PR
candidate. No independent delegation is safe for a pinned JSON join.

## Single next action

Perform the pinned source-ordinal join. If the getter cannot distinguish
passing from failing CUT contours, stop API stage-attribution work and proceed
to remaining V03 acceptance work using actual DXF round-trip evidence.
