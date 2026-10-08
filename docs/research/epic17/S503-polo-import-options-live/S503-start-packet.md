# EPIC-17 / G04 V03 — Slice 503 live CLO Polo option matrix

## Verified start

Started `2026-10-08 15:11:57 UTC` from clean S502
`043dbb3d0063601c87a9e158b6a4c4ec24c8ee71` on `codex/epic-17-g04`.
Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
ancestor. S502 is the highest assigned slice; S503 is reserved. Board revision
3125 has EPIC-17 and G04-V03 In Progress, V01/V02 Done. The admitted goal
remains active. The maintainer reports CLO running; the Windows computer-use
inventory independently returned one running CLO app with one window titled
`CLO Standalone OnlineAuth`.


## Maintainer authority and rights boundary

The maintainer explicitly directed Codex to use the existing CLO trial for
practical import/export tests, and stated CLO is installed, signed in, and
currently available. Use is confined to evaluation with local files in this
slice's named C: folder; no cloud/CLO-SET/CONNECT upload or account-setting
change is permitted. The separate rights/profile acceptance gate remains
unresolved until reviewed evidence supports it; this test does not assert
commercial-use rights or industrial-profile conformance.
## Bounded scope

Retry the still-unrun four-cell matrix from S499/S501 against the same
hash-pinned Polo M DXF:

| Import format | Optimize All Curve Points |
| --- | --- |
| DXF-AAMA | off |
| DXF-AAMA | on |
| DXF-ASTM | off |
| DXF-ASTM | on |

Hold all other visible settings at centimeters, 100%, no rotation, maintain
original grain, and import notches to both at ratio, if the actual CLO dialog
exposes those controls. Export every successful cell as DXF-ASTM under a
unique name. Record the exact settings shown, informational notices/errors,
input/output hashes, analyzed contours, and rendered output. Compare against
the source and S498 generations at the unchanged 0.001 cm limit, emphasizing
the five source points identified in S500. Attribute a result only to the
tested receiver/options.

All exchange files, projects, captures, and analysis outputs must be beneath
`C:\G04-CLO-DXF-Exchange\S503-polo-import-options` (with `Input`, `Output`,
`Projects`, and `Evidence` subfolders). The input must be copied unchanged from
the existing C: exchange fixture with SHA-256
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.

## Stop conditions, gates, and non-goals

1. Use the already-running, uniquely returned CLO window. Inspect its screenshot
   before any action. If capture again returns a concrete error, re-enumerate
   once and stop UI input if it still fails; do not use stale coordinates or
   guess a window.
2. Run the four cells with unique filenames. Keep screenshots and warnings.
   Do not suppress a failure or treat a rendered import as a successful
   round-trip.
3. Compare source piece/contour associations, CUT geometry and output geometry
   numerically at 0.001 cm. Inspect actual rendered workspaces and settings.
4. Do not change pattern source, app/account/privacy settings, fixture bytes,
   acceptance rules, protected identities, rights/local-handling decisions,
   or any other V03 gate. No cloud/CLO-SET/CONNECT upload and no fit, factory,
   or production-readiness claim.
5. Close CLO through its normal UI once S503 no longer needs it, and verify
   closure through the supported window inventory. Never force-kill it.

Focused checks are input/output hashes, the four-cell geometry replay, image
review, board validation, and `git diff --check`. This evidence-only slice is
not independently releaseable; defer full-repository tests/coverage/build to
the settled Epic candidate. No safe disjoint delegation exists for a stateful
receiver UI matrix.

**First action:** create the dedicated C: folder and hash-check the input copy,
then inspect the current CLO window via the computer-use workflow before
selecting any import option.

