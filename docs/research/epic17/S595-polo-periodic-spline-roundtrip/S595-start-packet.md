# EPIC-17 / G04 V03 — Polo periodic degree-1 SPLINE round trip — Slice 595 start

## Verified start and authority

- Started `2026-10-09 08:24:23 UTC` on `codex/epic-17-g04` from committed S594
  `9e9903241150c606dbf1942f7b44d1e616729592`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S594 is highest; 595 is reserved uniquely.
- Canonical board revision `3506`: EPIC-17/V03 In Progress; V02 Done. S594's
  start/exit records and current V03 matrix are linked in project context.
- The user already authorized the CLO 2026.1.310 product-development trial
  and local file processing in writing. Use the existing open CLO session.
  Keep every S595 exchange, scene, screenshot and analysis file in
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\`.

## Hypothesis and scope

S594 proves the five S591/S592 nonperiodic degree-1 source curves are exact;
their observed CLO output still fails five CUTs. The variants differ only in
group 70's closed bit. The distinct, bounded hypothesis is a periodic
representation: use each closed source polygon's unique vertices once, degree
1, group 70=`27` (closed + periodic + planar + linear), and an unclamped,
strictly increasing knot vector `0,1,…,n` with `n` unique controls and `n+1`
knots. Autodesk's published API defines periodic splines separately from
nonperiodic splines, documents this control/knot count form, and says only
unclamped knot form is periodic. A source-exact mathematical preflight is
mandatory before opening the candidate in CLO.

## Ordered procedure and gates

1. Hash-check the original S536 Polo M DXF and pinned S594/S591 references.
   Convert only the five named target CUT polylines into periodic SPLINEs;
   retain every other entity/source pair, scale, orientation, mark and setting.
2. Generate a hash-pinned candidate in the named C: folder. Assert exactly
   five intended CUT records change, no other geometry changes, each output
   has unique non-repeated cyclic controls, group 70=`27`, degree 1, knots
   `0…n`, knot count = control count + 1, zero fit points, unit default
   weights, and the published periodic count convention.
3. Before CLO, independently evaluate the periodic degree-1 basis over every
   knot span using cyclic control extension. Compare each span's endpoints
   and seven parameters with the corresponding source edge under cyclic
   rotation. Require maximum residual `< 1e-12 cm`, exact closure over one
   period, and every source segment represented exactly once. If any assertion
   fails, stop without importing the candidate.
4. If source proof passes, perform one clean CLO 2026.1.310 DXF-AAMA import,
   render, export and fixed-threshold analysis using the pinned S591/S592
   settings. Do not toggle other controls, change scale/profile, run a second
   generation, or close/reopen CLO. Inspect the rendered output and verify
   all source/receiver block matching, nine pieces, all CUT and SEW contours,
   and output hashes.
5. This one M/default trial cannot clear the all-seven gate. Any CUT failure
   keeps the tested CLO candidate rejected and all V03 gates open. A pass
   qualifies only this fixture/build/profile; proceed to the remaining
   all-seven/profile/semantic/identity/marks/grading/negative/repeated-round-
   trip requirements without making a conformance or factory claim.

## Non-goals and preservation

- No product source, pattern geometry, stitch graph, production writer,
  protected export identity, V02 output, V03 gate, scope or threshold changes.
- No tuning another SPLINE flag, CLO option, receiver profile, scale, or
  geometry to make a failed contour fit. Do not infer layer meaning from
  numeric output layer IDs.
- Preserve all seven recipes, `0.001 cm` geometry gate, all required V03
  checks, legacy DXF behavior and protected export byte identities. No
  physical-fit, industrial-conformance, factory-acceptance or
  production-readiness claim.

## Focused verification and ownership

Codex owns fixture generation, source-side periodic evaluation, one CLO
operation after the strict preflight, output analysis, rendered review, and
integration. No safe disjoint task exists. Check script syntax and report
hashes, command-layer board preflight/replay, Control Center tests, and diff
cleanliness. No production code changes are expected; full repository gates
remain at the settled Epic/PR boundary. At exit, separately record fixture /
analysis work, UI/render review, focused verification, documentation/board,
external waits and maintainer-decision time.

## Single next action

Generate and independently validate the periodic DXF candidate. CLO import is
conditional on every exact-source and structure assertion passing.
