# EPIC-17 / G04 V03 — CLO internal-shape runtime result — Slice 581 exit

## Result

S581 began 2026-10-09 05:22:32 UTC at S580 commit
`ad7c28672dc6549b8edf40b9900761a1f7e587d1`, on `codex/epic-17-g04`.
The refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
remained an ancestor. The canonical board was revision 3439 after the
validated start replay; G04-V02 remained Done and G04-V03 In Progress. Slice
581 was the next unique slice.

In the still-open CLO 2026.1.310 Python Editor, one run queried the nine
indexed patterns with `GetPatternCount`, `GetPatternPieceName(index)`, and
the documented `GetInternalShapeInformation(index)` method. Count returned
9 and the name getter returned indexes `0`–`8`. On all nine indexes the
installed `pattern_api` raised the same concrete error:

```text
AttributeError: module 'pattern_api' has no attribute 'GetInternalShapeInformation'
```

No internal-shape result was returned. The method is listed in the public CLO
API reference but is absent from this installed build's runtime module. The
probe therefore says nothing about whether the corresponding geometry exists
in CLO's internal model, and does not attribute the S574 CUT loss to import,
internal representation, the API, or export. No geometry or stage claim is
made.

## Evidence and verification

- Exact output: `C:\G04-CLO-DXF-Exchange\S581-clo-internal-shape-info\Evidence\internal-shape-info.json`
  — SHA-256 `901DAB698FF621B7268EAAD060FF55F0CD5EAE7F59ECC341D843220ED62309B3`.
- Live CLO 2026.1.310 editor screenshot:
  `C:\G04-CLO-DXF-Exchange\S581-clo-internal-shape-info\Evidence\clo-s581-run.jpg`
  — SHA-256 `FA6C8EC6273EAEB7A87472432F2EBEDE3295DC269B39F3CB9F0B2F23DDC22738`.
  The visible log shows the count/name calls; the saved JSON records the
  missing-method exception for every pattern.
- The script remained inside the named C: folder and contained no setter,
  import/export, project-save, simulation, or cloud call. It was run once.
- Public API references:
  [CLO API List](https://developer.clo3d.com/list.html) documents the method;
  [CLO API Option & Type](https://developer.clo3d.com/optiontype.html)
  describes its result schema. The installed runtime result takes precedence
  for this exact-build capability claim.
- Focused evidence checks: JSON schema/error-count/hash validation, Control
  Center tests, board preflight/replay/status/evidence checks, and
  `git diff --check` are recorded below. No product source or tests changed;
  the integrated full repository gate is still reserved for the settled PR
  candidate.

## Acceptance and scope

This slice clears no V03 acceptance gate and does not change V02. The receiver
identity remains CLO 2026.1.310 / DXF-AAMA; its compatibility and technical
round-trip claims stay held. Preserve the 0.001 cm geometry threshold, all
seven V02 recipes, legacy DXF behavior, protected export byte identities,
rights/local handling, and all existing acceptance criteria. No garment
geometry, application renderer, or export implementation changed. CLO remains
open for the remaining bounded runtime work.

## Boundary, timings, and next action

Slice closed at 2026-10-09 05:27:12 UTC (elapsed 4m40s from the recorded
start):

- Evidence/packet/state/board implementation: about 2m (no product source
  implementation).
- Focused verification and output review: about 2m40s, including raw JSON and
  rendered screenshot review, output/hash/schema checks, Control Center tests,
  board preflight/replay/status checks, and `git diff --check`.
- External-agent waits: 0m; no disjoint independent task existed for one live
  CLO API call.
- Maintainer-decision time: 0m.

Next: S582 should make one bounded read-only inventory of the actual installed
`pattern_api` names related to pattern lines, outlines and shapes. This checks
whether a different documented geometry getter is exposed by .310 before any
new CLO call is selected. Do not repeat the missing method, infer API
availability from current online documentation, relax the fixed tolerance,
or alter the V03 acceptance profile. If no documented applicable getter is
actually exposed, close that investigation with the precise capability
boundary and continue to a different acceptance item rather than retrying
unsupported methods.

## Board and durable-state closeout

Validated Control Center replay advances board revision 3439→3441. G04-V02
remains Done and G04-V03 remains In Progress. The active goal remains aligned
with the admitted EPIC-17 objective through safe merge. State and context
index now point to this exit packet and the S582 next action.
