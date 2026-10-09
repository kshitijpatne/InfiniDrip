# EPIC-17 / G04 V03 — compare CLO line-info across DXF representations — Slice 598 start

## Verified start

- Started `2026-10-09 09:04:00 UTC` on `codex/epic-17-g04` at S597
  `f785a532072d24fcc0da17c817e09460b1517872`. `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor.
  No `Slice 598:` commit exists; S598 is uniquely reserved.
- Board revision `3522`: EPIC-17/G04-V03 In Progress, G04-V02 Done. Preserve
  every V03 requirement and the `0.001 cm` round-trip acceptance threshold.
- CLO 2026.1.310 stays open. The written product-development and local-file
  processing permissions remain settled. No import/export, CLO project
  mutation, UI-setting change, or new trial is in this slice.
- Any new machine evidence is written only to
  `C:\G04-CLO-DXF-Exchange\S598-clo-api-representation-diff\`.

## Bounded objective

Compare existing successful read-only `GetPatternLineInfo` captures from:

1. S580's CLO scene imported from the connected-LINE derivative of the exact
   Polo M R12 source; and
2. S597's CLO scene imported from the five-periodic-SPLINE candidate derived
   from that same pinned R12 source.

Verify both fixture/source relationships, capture hashes and available import
profile facts first. Then compare API line counts, bounds, closure, direct
absolute-frame outline geometry, and source-contour proximity for indexes
0–8. Treat indexes only as per-capture observation slots because the CLO API
does not document them as stable piece identities. Do not fit transforms or
infer CUT/SEW API roles. Record any settings or project-context differences
that could confound the representation comparison.

## Acceptance limits and focused checks

This is a diagnostic comparison of already-captured pre-export API results,
not a CLO receiver round trip and not the V03 contour gate. It cannot qualify
an industrial CAD profile, prove post-export preservation, or clear any
V03 criterion. If source fixture equivalence or coordinate-frame
comparability cannot be demonstrated, report only per-capture facts and keep
the comparison inconclusive. No new CLO action is authorized or needed for
this bounded slice.

Pin source, both representation fixtures and both API JSON hashes. Run the
new analyzer's `node --check`, verify all nine schema records, inspect the
machine output, then use validated board preflight/CLI replay, Control Center
tests and `git diff --check`. This evidence-only work changes no production
source/tests; full repository gates remain reserved for the settled Epic/PR
candidate. No safe independent delegation exists for a single evidence
comparison.

## Single next action

Preflight both representations against the identical hash-pinned R12 source
and then calculate the direct API-output comparison. Preserve all existing
V03 gates and CLO's open session.
