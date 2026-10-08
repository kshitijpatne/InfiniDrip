# EPIC-17 / G04 V03 local receiver trial runbook — Slice 469 exit

## Result

S469 creates `receiver-trial-checklist.md`, a controlled operator sequence for
the S468 Richpeace V8 Free English candidate and S463's synthetic test inputs.
It makes the order explicit: verify exact edition/build, evaluation rights,
visible exchange modes and local-only file handling before opening any
fixture; then use local copies, record units/settings and warnings, exercise
the representative fixtures and malformed-input negative control, and retain
the returned files for independent comparison against the source manifest.

The checklist identifies the fixture's limits: current generic DXF files do
not declare units, stable piece IDs, grade rules or paired-seam relationships;
the XS/M/XL inputs are separate files, not a native multi-size graded pattern.
It therefore cannot turn file opening into proof of unit, grading or complete
profile compatibility. It records no new gate, selected receiver, standards-
wide claim, or product change.

## Verification

- Started 2026-10-08 04:51:38 UTC from clean `b0817bbed6b54052b450af03b79f90b8f719d60e`
  (`Slice 468: qualify Richpeace free CAD candidate`) on
  `codex/epic-17-g04`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest
  assigned slice was 468; S469 is unique.
- Board started at revision 2883. Validated start preflight and command replay
  advanced it to 2887; validated exit preflight and replay advanced it to
  2891. EPIC-17 and G04-V03 remain In Progress; G04-V01/V02 remain Done.
- `npm run control-center:test`: 42/42 pass.
- S463 independent fixture verifier: six positive, one negative, size series
  XS/-2, M/0, XL/+2; hashes and structure pass.
- `git diff --check` passes (only the repository's expected CRLF conversion
  warnings were reported for tracked text files).
- No production code, fixture bytes, exporter, output, baseline, V02 result,
  acceptance criterion, receiver rights decision, or format claim changed.
  No software was installed and no fixture was opened or sent.

## Remaining gate and next action

V03 still needs an owner-installed exact build with an established evaluation
rights basis and local file handling, followed by observed import/export and
round-trip evidence using the S463 synthetic inputs. The installed menu labels
alone are not proof. If any preflight condition is unclear or requires cloud
processing, stop before opening a fixture and retain V03 In Progress. After a
successful local round trip, Codex must independently compare returned files
to the fixture manifest and bound any interoperability claim to the exact
demonstrated profile and behavior. The admitted representative simple,
complex, multi-size and negative-fixture acceptance remains unchanged.

## Scope and timing

Implementation: 0m (documentation-only). Source/fixture reconciliation and
runbook drafting: approximately 3m. Focused verification, board replay and
durable closeout: approximately 2m. External-agent waits: 0m. Maintainer-
decision time: 0m. Goal remains active through V03, final integrated output
review, required full gates, PR merge, ancestry and deployment verification.
