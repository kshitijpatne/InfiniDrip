# EPIC-17 / G04 V03 — Seven-recipe gate reconciliation — Slice 547 exit

## Result

S547 consolidates the seven M/default DXF-AAMA runs without conflating them
with older ASTM-mode tests. The four-recipe S523 cohort (Fitted, Tank, Skirt,
Trouser) and three-recipe S545 cohort (Tee, Polo, Woven) both used CLO 2026.1.310,
DXF-AAMA, centimeters, 100%, no rotation, and two exchange generations. All
seven recipes and 41 expected pieces were exercised. These results prove
bounded receiver behavior, not an exact standard edition or industrial
conformance.

The unified current contour result is **77/82 contours within `0.001 cm` in
each generation**. S523's 34/34 contours pass. In S545, Tee passes 6/6 and
Woven passes 24/24, while Polo passes 13/18; five Polo CUT outlines fail at
0.01274–0.01399 cm. The same five role/count failures repeat in generation 2.
The renderings establish gross piece presence only.

## Current gate dispositions

The full matrix is
`docs/research/epic17/S547-v03-seven-recipe-gate-reconciliation/V03-CURRENT-GATE-MATRIX-S547.md`.

- **Authorized for bounded test:** maintainer's written confirmation covers
  product-development trial use and local DXF processing (S538; reaffirmed in
  this thread). Do not ask again. It is not independent legal review.
- **Receiver build:** CLO 2026.1.310 (r58944) is observed. Independent receiver
  acceptance is not established.
- **Named industrial profile:** not established. The AAMA menu label provides
  no exact edition or conformance map. ASTM D6673-10 is withdrawn; D6673-04 is
  historical and requires R13; AAMA-292A current status/full clauses remain
  unresolved (S533, S541–S543).
- **Geometry:** fails on the five Polo contours above. Preserve the threshold.
- **Semantics:** CUT and SEW share layer 8 in S545's new AAMA outputs for Tee,
  Polo and Woven. S523/S525 document the same layer ambiguity for Fitted,
  Tank, Skirt and Trouser AAMA outputs. Layer 8 cannot be treated as a unique
  CUT/SEW contract.
- **Marks:** incomplete. S525's 78/100 source marks without direct geometric
  matches are not automatically proven lost; the current AAMA cohort still
  lacks a full semantic interpretation.
- **Grades/options:** not established beyond M/default.
- **Malformed input:** failed for S531's tested CLO AAMA negative fixture; it
  was silently accepted with expected SEW geometry omitted.
- **Two-generation round trip:** attempted for all seven; not a V03 pass because
  Polo geometry fails and profile/semantics/grades/negative case remain.
- **Render:** gross piece presence reviewed; this does not certify the CAD
  profile or sewing semantics.

No acceptance criterion, status, geometry, code, settings, protected export
identity, or claim boundary changed. V03 remains In Progress; V01/V02 remain
Done. CLO stays open while G04 still needs it.

## Next action

Do not repeat the same CLO AAMA controls or transfers: the tested path already
has a measured geometry failure, semantic collision, and malformed-input
failure, while the standard edition is unproven. Screen one new, concrete
published lead before any pattern transfer. The current [Pro2CAD publisher
page](https://www.pro2dev.it/pro2cad/index.html) claims AAMA/ASTM import and
export and offers a download plus a separate license-request step. That is
only a lead; exact build, evaluation rights,
Windows compatibility, local processing, profile edition and round-trip
behavior are unverified. S548 should inspect only the publisher's current
manual, download/license information, and build claims. No install, license
request/contact, purchase or pattern transfer unless the evidence first
establishes a no-cost permitted local trial.

If this lead fails its rights/build/locality/profile screen, update the V03
plan from the evidence and present the exact remaining choice to the maintainer;
do not silently relax a gate. All seven recipes, legacy DXF behavior,
protected identities, and no physical/factory-readiness claims remain in scope.

## Verification, board and time

- S523/S545 source packets and C:-only reports reviewed. S545's stored results
  were queried directly: layer 8 contains both CUT and SEW in all three new
  AAMA recipe outputs. S525 establishes the other four AAMA recipe cases.
- S547 matrix is evidence-only. `npm run control-center:test` passes 42/42;
  board start/exit preflight and validated replay pass; `git diff --check`
  passes. No production code changed and no full repository gate is due.
- Board start/exit: `3299→3301→3303`; G04-V03 remains In Progress.
- Started `2026-10-08 22:47:59 UTC` from S546 `8184f86`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an
  ancestor. S547 is unique. Closed `2026-10-08 22:50:17 UTC` (2m18s): evidence
  reconciliation 1m; matrix/state/board and focused verification 1m18s;
  external-agent waits 0m; maintainer-decision time 0m. No safe disjoint
  delegation existed.
- At the boundary, the goal remains active and matches EPIC-17 through safe
  merge; it remains needed.
