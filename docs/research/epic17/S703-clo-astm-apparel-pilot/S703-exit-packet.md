# EPIC-17 / G04 V03 — S703 CLO DXF-ASTM pilot exit

## Result

S703 imported and exported the exact S700 Polo M named-piece fixture once in
the already-installed CLO 2026.1.310 **DXF-ASTM** mode. CLO opened the source
and emitted a DXF without a dialog error. This is an empirical result for this
vendor mode; it is not an ASTM conformance claim.

The returned drawing retains all nine named piece blocks (CLO adds `_M`) and
the nine piece instances. It does **not** pass the fixed return checks:

- Five of nine CUT outlines definitively fail the unchanged `0.001 cm`
  tolerance: back `0.002579 cm`, outer and inner stands `0.032934/0.032935 cm`,
  and upper/under collars `0.010851/0.010851 cm`. These are source-vertex to
  returned-segment lower bounds, so a measured lower bound above the limit
  proves failure. Front (`0.000140 cm`) and sleeve (`0.000764 cm`) are below
  the limit but are **not proven passes** by this one-sided measurement.
- All nine SEW paths have lower bounds below `0.000024 cm`; this is not a full
  symmetric contour pass proof.
- The three known typed buttonhole marks are not preserved at their source
  coordinates. Nearest returned POINT distances are `3.418`, `2.100`, and
  `3.418 cm`; nearest returned path is `1.500 cm` away. All three fail the
  fixed `0.001 cm` anchor check.
- Piece names survive, but the source semantic layer names do not: CUT and
  SEW return on numeric layers `14` and `8`. The source declares centimeters
  with `$INSUNITS=5`; the returned AC1009 file has no `$INSUNITS` declaration
  despite centimeter selections in the CLO dialogs, so returned units are not
  self-describing.
- No returned-file rendered inspection was made after the predeclared geometry
  and mark stop conditions failed. Do not claim rendered-output acceptance.

The returned file has 1,558,969 bytes and SHA-256
`918c177a6330c7be6768d02c562e5076cb885e24f5848438d9deaccab189e3fb`. The exact
source remains SHA-256
`142e6d8aaf79e15eb703ca339023e35192b458128328a7e18c93a7e6f2579634`. Files and
the reproducible one-sided measurement report stay outside the repository in
`C:\G04-CAD-Interchange\S703-clo-astm-pilot\`; the report states its limits.

## Gate disposition and next action

This distinct CLO apparel mode fails the representative fixture's fixed
geometry and mark gates. Do not repeat CLO settings, entity encodings, or
profile labels for these same failures. It does not qualify CLO or clear any
V03 acceptance gate. V01/V02 remain Done; V03 remains held; EPIC-17 remains In
Progress; the goal remains active. All seven recipes, supported options and
grades, identity/relations, layers, grainlines, malformed-input rejection,
repeatability, readable returned output, rights/profile evidence, protected
legacy output identities, and final integration gates remain required.

Next: reconcile the fixed V03 gate matrix against the exact CLO Standard and
ASTM evidence, current source writer and existing receiver evidence. Produce
one prioritized source-side remediation plan only where code inspection proves
a specific change can preserve exact geometry/marks and address a named gate.
No new software, receiver, profile, trial, threshold change, or acceptance
relaxation is authorized by this result.

## Verification and timing

- Start: 2026-10-11 00:04:51 UTC from S702 `f06e9691b8ccb5c7ea8b3e0fb3c0e9a21e4dd61a`;
  refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S702 was highest; S703 is unique.
- Implementation: 0m; focused UI/import/export and saved-output comparison:
  CLO interaction approximately 4m; saved-output analysis approximately 5m; focused verification approximately 1m; external-agent wait 0m; maintainer-decision time 0m;
  durable closeout and validated board replay approximately 2m (revision 4141→4144).
- No product code changed. No receiver rerun is warranted. The focused Control
  Center suite passed 42/42; `git diff --check` passed; validated board revision 4144 preserves G04-V03 Blocked / EPIC-17 In Progress. No full-repository gate is due for this evidence-only slice.
