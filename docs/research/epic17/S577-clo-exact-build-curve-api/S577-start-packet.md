# EPIC-17 / G04 V03 — CLO exact-build 2D curve API check — Slice 577 start

- Started: 2026-10-09 04:52:07 UTC.
- Branch: `codex/epic-17-g04`.
- Start commit: `afea6505` (S576); clean worktree.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor.
- Start board revision: 3421; EPIC-17 and G04-V03 remain In Progress.
- Highest assigned slice: 576; this reserves unique S577.
- Usage: ordinary work allowed; primary 3%, weekly 68% used.

## Question and bounded research

S575 found no source CUT path in the tested generation-one DXF. S576 confirmed
the saved projects' geometry-bearing payloads use CLO-specific binary formats
that cannot be safely inspected as transparent documents. Earlier official
screens (S513, S515, S569) found the public SDK build lagged installed CLO
2026.1.310 and that outline-point APIs existed without proving exact-build
support. S577 checks only whether the official CLO developer documentation has
since published a build-matched API and a documented read-only way to retrieve
2D pattern-outline coordinates from that project.

Use first-party CLO Developer/Help Center sources only, refresh the exact
download/build listing and the specific documented 2D outline-point method,
and compare those claims with installed `2026.1.310`. Do not repeat general
API catalog browsing, run an unversioned/mismatched script, operate the CLO
UI, open or modify projects, or change any DXF. Do not infer method support
from an API name alone. No third-party container decoder or software install.

## Acceptance and limits

- Confirm whether the published API SDK/build explicitly matches 2026.1.310.
- Confirm whether a documented method returns the exact 2D outline geometry
  required to compare source CUT and SEW paths at 0.001 cm, not only grading
  offsets, meshes, screenshots, or sampled aggregate lengths.
- Distinguish documented capability, exact-build support, and practical
  behavior. If either version match or coordinate access is absent, stage
  attribution remains unresolved; preserve the existing failure evidence.
- No script/API operation, production code, pattern geometry, acceptance,
  tolerance, profile identity, or compatibility claim changes. Keep all
  V03 and all-seven V02 gates/holds and the local-only handling boundary.
- Save a short source-linked research note and output evidence under
  `C:\G04-CLO-DXF-Exchange\S577-clo-exact-build-curve-api\Evidence`.

## Verification, ownership, and exit

This is a narrow first-party source check; delegation is not safe or useful.
Validate source URLs and current claims, record sources and limits, run the
S577 start/exit command preflights and focused Control Center tests after the
exit board replay, and run `git diff --check`. No full product gate is due.
Apply board changes through the validated command layer at 3421→3423 for the
start; keep statuses unchanged. At exit separately record research time,
focused verification, agent waits, maintainer-decision time, and the single
next action.
