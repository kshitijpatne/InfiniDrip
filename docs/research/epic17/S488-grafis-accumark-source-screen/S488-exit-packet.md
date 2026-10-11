# EPIC-17 / G04 V03 — GRAFIS and AccuMark source screen — Slice 488 exit

## Result

S488 screened two specifically named industrial apparel-CAD candidates using
publisher and product-help sources. Neither is a currently qualified no-cost
local receiver for G04:

- **GRAFIS:** Its free training edition supports Windows 10/11 but disables
  pattern output and import/export. The edition is restricted to private
  training/test use. The full commercial system documents AAMA/DXF and
  ASTM/DXF output, while its help states that the data-exchange module may
  need separate purchase; the publisher's 2026 price table lists paid annual
  and three-month license terms. No free exchange-enabled version was found.
- **Gerber AccuMark:** Official help documents AAMA/ASTM input and output, and
  Windows 11 support is version/edition-specific. Current product materials
  show AccuMark 2026.1; detailed help documents are not tied to that exact
  build. Access requires assigned product licensing and account validation;
  Lectra publishes annual subscriptions. The sources reviewed document no
  free trial or self-serve no-cost license. Strict local-only processing,
  same-receiver fixture fidelity, grade-rule round-trip, and malformed-input
  behavior remain unproven.

No software was downloaded, installed, launched, or licensed; no account,
vendor, hosted CAD service, fixture, or file was used. Neither candidate is
selected. The GRAFIS license page also contains conflicting expiry dates; this
does not affect its no-cost edition's inability to import/export. OpenCode's
independent review and Codex's source check are linked in the S488 folder.

## Acceptance and holds

- Exact official-source evidence was recorded for no-cost status, platform,
  local-handling boundary, profile directionality, grades/sizes, round-trip,
  and negative-input behavior. Unknowns remain unknown, not passes.
- The candidates do not change the existing V03 gates. No purchase, download,
  install, account, fixture, or vendor contact is authorized or performed.
- EPIC-17 and G04-V03 remain In Progress; V01/V02 remain Done. Preserve
  all-seven V02 acceptance, rights/local/exact-profile/round-trip/grade/
  negative gates, legacy DXF behavior, protected export identities, and the
  no-physical/factory/production-claim boundary.

## Verification and next action

Focused verification: `npm run control-center:test` at slice start and exit;
S488 preflight/replay uses the shared `applyBoardCommand`/validated board
store; all S488 scripts pass `node --check`; `git diff --check` passes. No
production code changed, so changed-code coverage is not applicable and the
full repository gate remains at the settled Epic/PR boundary.

Board closeout: the validated command replay advances revision `3034→3039`,
links this packet, the Codex candidate matrix, and the OpenCode review to
G04-V03, links the exit evidence to EPIC-17, and records the continuing hold.
EPIC-17/G04-V03 remain In Progress; G04-V01/V02 remain Done. The Control
Center suite passes `42/42`; `node --check` and `git diff --check` pass.

Elapsed time: `11m55s` (`08:45:17–08:57:12 UTC`; category estimates): source
research and candidate assessment `3m35s`; independent-agent wait and source
cross-review `3m15s`; implementation `0m` (research-only); focused
verification `1m30s`; rendered/output review `0m` (no software or fixture
qualified for this stage); durable records and validated board closeout
`3m35s`; maintainer-decision time `0m`. These are slice-task elapsed
categories, not compute time.

**Next:** continue only with one exact, previously unreviewed apparel-CAD
candidate supported by current primary evidence for a rights-cleared no-cost
Windows local path and documented apparel-profile input/output. Reuse
S465–S488; do not repeat a broad search, install paid software, or use
fixtures until Gate 0 passes. If no such candidate/access emerges, keep G04
open and preserve every acceptance gate.
