# EPIC-17 / G04 V03 — CLO synthetic DXF-AAMA round-trip — Slice 532 start

## Objective

In the single already-running CLO 2026.1.310 (r58944) process, perform one
positive-control synthetic non-garment DXF-AAMA import → CLO export → fresh
project re-import. Inspect the actual export controls, save the DXF and every
capture only in `C:\G04-CLO-DXF-Exchange\S532-synthetic-roundtrip\`, and
compare the output entities and rendered contours against the exact input.
This is a bounded practical path check, not an industrial compatibility claim.

## Boundaries and acceptance

- Use one 10 cm square CUT contour and 8 cm inset SEW contour, copied from the
  validated S531 positive synthetic fixture. Confirm the copied bytes match
  S531's SHA-256 before import.
- Use the existing CLO session only. Do not close/relaunch it, connect to
  CLO-SET/CONNECT, change settings/account, or contact a vendor.
- All source/import/export files, saved test projects, logs and screenshots for
  this slice must reside in the named C: folder. No G04 pattern or source data.
- Record the exact import/export format/profile labels, units, scale and other
  visible options; capture every warning/error; compare the exported CUT/SEW
  vertex geometry and rendered contour against the input. Re-import the exact
  exported file into a fresh CLO project to verify the actual round trip.
- Preserve the malformed-input failure from S531 and all independent V03
  holds. This slice cannot clear rights/trial-purpose, local-only handling,
  formal profile conformance, seven-recipe coverage, grade, exact semantics,
  or negative-input behavior.
- Do not change source code, legacy DXF behavior, protected export identities,
  V02/all-seven acceptance, or V03 acceptance criteria.

## Verified start

Started `2026-10-08 20:44:31 UTC` from clean S531 commit `2ce6173` on
`codex/epic-17-g04`. Refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned
slice is 531; S532 is reserved. Canonical board revision is 3239;
EPIC-17/G04-V03 is In Progress, V01/V02 Done. The current CLO process is
already running in one window and currently displays the isolated S531
malformed synthetic test; S531's preserved project/session copies remain in
its own C: folder. Usage window permits work (26% used).

## Delegation and elapsed-time ledger

This is a single stateful application round trip; no safe disjoint delegation
exists. Codex retains UI, output inspection, and integration responsibility.
Exit packet will record app interaction, focused output comparison, durable
closeout, agent wait, and maintainer decision time separately.
