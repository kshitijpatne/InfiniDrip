# EPIC-17 / G04 V03 — New receiver candidate screen — Slice 554 exit

## Verified boundary

- Start: 2026-10-08 23:30:27 UTC, from S553 commit `aebaa02` on `codex/epic-17-g04`.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of the branch.
- Slice: 554, unique next number after S553.
- Board start replay: revision 3329 → 3331; G04-V03 remains In Progress.
- Maintainer's written authorization for CLO product-development evaluation and local DXF processing is confirmed and already recorded in S552/PROJECT-DECISIONS. This resolves CLO use/locality; it does not qualify another receiver.

## Scope and result

Screened only publisher evidence for new receiver candidates. No software was installed, no supplier was contacted, no account was created, no paid service was used, and no pattern data was transferred.

| Candidate | Capability evidence | Unresolved before fixture transfer | Result |
|---|---|---|---|
| Optitex PDS | Official indexed docs advertise AAMA/ASTM/DXF import and DXF/AAMA/ASTM export plus RUL grading sidecar. Current official help pages redirect to a login. | Exact standard/profile edition, complete marks/CUT/SEW semantics, evaluation terms/product-development rights, and desktop-only file locality. Public EULA permits only documented business use and allows technical-use data transmission, but does not establish trial rights or upload of DXF contents. | Strongest new technical lead, not qualified. No install or transfer. |
| TUKAcad | Current official product page documents a 14-day free Learning Edition and Windows 11 support. | Data import/export is listed only on paid CPE plans; no apparel AAMA/ASTM profile, grading interchange, mark semantics, local-only handling, or round-trip contract is evidenced for the free edition. | Free tier cannot prove V03 exchange. Paid use is out of scope. |
| Gerber AccuMark | Official help documents ASTM/AAMA/Standard DXF import/export and local storage paths. | Current normative profile edition/semantics and authorized no-cost evaluation rights not established; current installation uses assigned email/USB/network licensing. | Technically plausible, not available as an authorized candidate under current constraints. |

Codex independently checked the official linked sources listed in `S554-start-packet.md`. The source links support the stated narrow capabilities and gaps; no candidate is represented as technically failing when evidence only remains unknown. The required independent Claude Opus 5.5 read-only scan ended with an explicit `WORK FINISHED`; its Optitex/TUKAcad shortlist was reviewed against primary pages. OpenCode was not used because its required Muse Spark 1.3 xhigh normal-mode configuration was not available.

## Acceptance and holds

- V03 candidate-selection gate: **not passed**. No new receiver has all required public capability, exact-profile, rights, locality, and round-trip evidence.
- Seven recipes, exact industrial-profile, CUT/SEW and marks, grading/options, malformed-input handling, geometry tolerance, two-generation replay, and independent receiver gates: **still held**, unchanged.
- CLO remains the available authorized practical receiver. Its product-development evaluation and local handling are maintainer-confirmed. S553 showed CLO Standard and AAMA outputs identical on the same tested Polo workspace; the five concrete Polo short-edge contour errors remain. No repeated Standard/AAMA, unit-invariance, or previously exhausted optimizer controls.
- Next action: continue CLO practical evidence against the unchanged all-seven V03 matrix, first addressing the five known contour failures through a discriminating import-vs-export stage test only if the existing harness can isolate that stage; otherwise prioritize untested semantics/grades/negative-input gates without changing fixture geometry or acceptance. Keep evidence under `C:\G04-CLO-DXF-Exchange\<slice-folder>` and CLO open.

## Time and verification

- Implementation/research: 4 minutes 45 seconds; no production code changed.
- Focused verification: 59 seconds, including independent official-source review, contributor evidence review, board preflight/replay, Control Center command-layer tests, and `git diff --check`.
- External contributor wait: 18 seconds for the final response; explicit `WORK FINISHED` received (the contributor had run for about a minute overall).
- Maintainer decision time: 0 minutes.
- Risks: candidate access/terms may change; login-gated Optitex documentation prevents current public verification. These do not alter the authorized CLO path.

## Board and checks

Exit evidence and comment are replayed through the validated command layer at revisions 3331 → 3332 → 3333. G04-V03 stays In Progress. No V02/V03 criteria, tolerances, exports, source geometry, or byte identities changed.

Focused checks: `npm run control-center:test` — 42/42 passed; start/exit board preflight — passed; Node syntax checks — passed; `git diff --check` — passed. An initial custom replay script attempted a direct `writeFile` and hit a Windows `UNKNOWN` open error; it made no board change. The script was corrected to invoke the repository's validated Control Center CLI, and the two exit mutations replayed successfully from revision 3331 to 3333. No full repository tests/build are required for this research/documentation-only slice.

**Single next action:** start S555 from this packet and run the next untested CLO practical V03 gate in the persistent session, keeping all recipe/format/round-trip holds unchanged.
