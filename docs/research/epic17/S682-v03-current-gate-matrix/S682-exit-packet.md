# S682 exit — current V03 evidence and shortest completion route

## Result

Created `V03-GATE-MATRIX-S682.md` after checking the actual S674/S585/S668/S675
receiver records, current S680/S681 source packages, C04, and the bounded Sol
review. The review was advisory; Codex verified the evidence and owns these
gate dispositions.

S680–S681 demonstrate real exporter defects and fixes: explicit units and
construction marks in the additive file, complete validated option values,
package identity/grades/stitch relations, and named source pattern marks bound
to visible DXF entities. The source package matrix passes all 73 options and
every registered recipe grade row. Legacy DXF remains byte-protected.

Those source fixes do not overturn measured receiver results. CLO's tested
profile loses five Polo CUT corners beyond `0.001 cm` and its negative-input
path does not fail closed. DGS's accepted `/2` pattern import returned a blank
canvas and 0/0 patterns. LibreCAD R12 preserved one Polo M geometry/mark set but
removed the centimeter declaration and is generic CAD. OpenCAD R14 passed its
generic source fixture matrix and repeatability, but its malformed input was
accepted and it is not an industrial apparel profile. No one receiver meets
the whole unchanged V03 contract.

No new software was installed or run. No app/profile/encoding variation was
repeated. No acceptance, threshold or hold changed. The next practical route
must meet the profile/rights entry gate and have a specific reason to differ
from already failed evidence; test one exact file once and stop on the first
fixed-gate miss. Until such a route passes, V03 cannot be truthfully marked
complete and the Epic cannot be merged as complete.

## Verification

- Matrix references exact existing receiver/source evidence and the bounded
  Sol review; no independent reviewer was asked to pass gates.
- `npm run control-center:test`: 42/42 after board closeout.
- `git diff --check`: passed.
- This documentation-only slice changed no production/test code; changed-code
  coverage is not applicable. Full repository coverage and final rendered
  output gates remain for the settled integrated Epic candidate.

## Slice ledger

- Started 2026-10-10 18:23:30 UTC from clean S681 `1b1975a1`, with refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` as ancestor. Board
  start replay 4041→4043; highest assigned slice 681; S682 unique.
- Closed 2026-10-10 18:25:21 UTC; board exit replay 4043→4045.
- Elapsed about 1m51s: source/evidence reconciliation ~40s; focused board
  verification ~2s; documentation and closeout ~30s; external-agent waits 0;
  maintainer-decision time 0.
- G04-V03 and EPIC-17 remain In Progress; V01/V02 Done. No PR, merge or
  deployment was attempted.
