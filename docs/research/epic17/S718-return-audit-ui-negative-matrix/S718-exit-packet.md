# EPIC-17 / G04 V03 — S718 return-audit UI negative matrix exit

## Result

S718 routes seven distinct malformed or misleading returned-DXF cases through
the real local panel and production `auditDxfInterchangeRoundTrip` auditor
using a generated registered Polo M package: malformed DXF structure, missing
piece identity, wrong CUT layer, non-finite geometry, geometry outside the
fixed tolerance, missing outline, and duplicate piece instance. Every case
produces the exact auditor reason in a `role="alert"` and no partial counts.
Each expected reason is obtained from the real auditor, not a mock.

Together with S716's malformed source-JSON/read-error UI checks and S717's
real missing-units and tampered-package cases, this closes the local
product-visible fail-closed handling checks for the tested return classes.
This is a source/package-to-auditor UI result only; it does not prove that an
external receiver rejects every malformed file, qualify an exchange profile,
clear CLO's measured contour/units/identity/mark failures, or prove returned
readability/breadth/repeatability. All V03 acceptance and fixed thresholds
remain unchanged.

## Verification

- Focused panel suite: 12/12 passed.
- Changed production panel module coverage: 100% statements, branches,
  functions, and lines. S718 changes tests only.
- `git diff --check` and Control Center suite are recorded at closeout below.
- No build, browser/Electron replay, external app, new receiver, format,
  setting, encoding, pattern, source output, or production-code change was
  needed. The failure results are accessibility assertions in the actual
  rendered DOM; S716 contains the prior browser-rendered panel evidence.

## Time and state

- Start: 2026-10-11 03:38 UTC from S717 `d89c3805` on
  `codex/epic-17-g04`; refreshed `origin/main` remained an ancestor; board
  start commands advanced revision 4199→4201.
- Close: 2026-10-11 03:40 UTC. Test implementation: about 1m; focused
  verification: about 1m; durable closeout: about 1m; external-agent waits:
  0m; maintainer-decision time: 0m.
- S718 is uniquely reserved and closed. V01/V02 remain Done, G04-V03 and
  EPIC-17 remain In Progress, and the goal remains active. Existing two
  untracked S700 diagnostic files remain untouched.

## Remaining work

The central V03 gap is unchanged: no rights-reviewed receiver/profile among
the tested routes passes the representative geometry, units, piece identity,
semantic marks/layers, and rendered-output requirements. Existing CLO output
has concrete fixed-gate failures; the saved point-loss diagnosis finds no
source-side geometry-preserving correction, so no app/mode/format retry is
justified. Preserve S709's stop rule. All-seven recipe/options/grade exchange,
repeatability, and receiver-readable output remain unproven. After a truly
eligible source-backed route passes a representative fixture, reuse the
existing breadth matrices once. At the final candidate boundary, perform the
full repository 100% gate/build/browser/Electron/output review, necessary-file
cleanup, PR review and safe merge, refreshed ancestry, required deployment,
and production end-to-end checks. No fit, factory, or standards claim is made.
