# EPIC-17 / G04 V03 — Super V8 cloud boundary — Slice 484 exit

## Publisher evidence

Richpeace's official 2021 Super V8 launch article says its Cloud Super
Arrangement runs as SaaS: Super V8 sends marker commands to the cloud, where
the marker task is run and the resulting marker is retrieved locally. The
article calls this a paid function. This is direct evidence that this
particular marker workflow is hosted and paid; it must not be used for G04.

The article does not say that all Super V8 functions require cloud access, and
it does not explain whether pattern import/export or the separate,
limited-time cloud-conversion feature sends source files or derived data. The
product page's “cloud computing” and cloud-conversion claims therefore still
leave the local-only CAD exchange path unresolved. No local operation is
verified merely by the cloud marker feature being separately named.

S483 remains accurate with this refinement: Super V8 is a conditional
inspection lead because the publisher describes the product as genuine free,
but its official page lists only HPGL/CUT exchange and does not document
apparel DXF/AAMA/ASTM, local processing, or Windows 11. The third-party DXF
claim is not sufficient to select or qualify the candidate. The paid SaaS
marker path is explicitly excluded; the remaining unknown conversion/import/
export path cannot clear V03.

## Decision boundary and preserved scope

- No download, installation, account, cloud feature, fixture, or file transfer
  occurred. No vendor was contacted.
- The Super V8 candidate remains conditional and unselected. All C04 V03
  rights/local/profile/round-trip/grade/negative gates remain unchanged.
- V01/V02 remain Done; legacy DXF behavior and protected export byte identities
  are untouched; no physical/factory/production claim is made.
- A question is pending for explicit approval to obtain the official package
  under `C:\G04-CLO-DXF-Exchange` and launch a standard installation for Gate 0.
  No silence is treated as consent. Stop before accepting terms, creating an
  account, using hosted functions, or opening a fixture absent the required
  separate approval/evidence.

## Verification

- Official Super V8 news article opened and checked: identifies cloud marker
  commands, remote marker processing, local retrieval, and a paid function.
- Board start replay `2999→3003`; validated exit replay `3003→3007`. EPIC-17
  and G04-V03 remain In Progress.
- `npm run control-center:test`: 42/42 passed; canonical board validates;
  `git diff --check` passes.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains
  an ancestor. Full repository gate remains reserved for the settled Epic/PR
  candidate.

Started `2026-10-08 08:12:54 UTC`; closeout completed `2026-10-08 08:14:11 UTC`
(~1m17s): product implementation 0m; focused publisher-source check ~15
seconds; durable record, board replay and regression ~1m02s; external-agent
waits 0m; maintainer-decision time 0m.

## Source

- Richpeace, [Super V8 official launch article](https://www.richpeace.com/richpeace_news-show-746.html) — SaaS workflow sends marker commands for remote processing; this paid feature is distinct from the uncharacterized limited-time cloud-conversion function.
- Related exact-version disclosures are recorded in
  `docs/research/epic17/S483-richpeace-super-v8-candidate/S483-exit-packet.md`.
