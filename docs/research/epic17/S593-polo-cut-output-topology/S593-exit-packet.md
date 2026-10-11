# EPIC-17 / G04 V03 — Polo CUT output-topology diagnosis — Slice 593 exit

## Verified boundary

- Started `2026-10-09 08:02:55 UTC` on `codex/epic-17-g04` from S592
  `3b357de410cbcdccfeb232a1317a6b5b0ac2e2bc`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S593 was unique. Validated start board replay: `3491→3493`; V02 Done,
  V03/EPIC In Progress.
- S592's slice packet now records that commit and its ancestor verification.
  The maintained goal audit remains `active` and aligned with the admitted
  Epic through merge. CLO's existing authorized session remains open; no
  further CLO operation was made in S593.

## Candidate inventory and method

Using only hash-pinned S591/S592 files, S593 bound all nine output blocks by
their unchanged source SEW contours, then enumerated every closed non-SEW path
in each bound block. This avoids relying on INSERT order or treating numeric
layer values as manufacturing semantics. For the five target pieces this
found 19 closed-flag candidate paths in S591 and 14 open-flag candidates in
S592. Candidate inventory, path descriptors, exact prior round-trip
measurements, duplicate-coordinate relationships, bounds/perimeters/areas,
and residual witnesses are in the C:-only machine report.

Exact pass/fail values are copied from the hash-pinned S591/S592 analyzers,
which sampled at `0.0005 cm` and add `0.00025 cm` conservative allowance.
Additional neighborhoods here use `0.01 cm` steps and are diagnostic only;
they do not replace or relax the fixed `0.001 cm` limit. The source segment
numbers below are zero-based indices in the corresponding original S536 CUT
polyline; segment endpoints and witness coordinates are in the JSON.

| Target piece | S591 paths / unique shapes | S591 best bound; coarse source segment | S592 paths / unique shapes | S592 best bound; coarse source segment |
|---|---:|---|---:|---|
| Back | 3 / 3 | `13.113897 cm`; seg 32 | 2 / 2 | `4.063040 cm`; seg 29 |
| Outer collar stand | 4 / 2 | `0.853255 cm`; seg 14 | 3 / 3 | `0.467174 cm`; seg 40 |
| Inner collar stand | 4 / 2 | `0.841822 cm`; seg 14 | 3 / 3 | `0.467258 cm`; seg 40 |
| Upper pointed collar | 4 / 2 | `0.853243 cm`; seg 14 | 3 / 2 | `0.159214 cm`; seg 15 |
| Under pointed collar | 4 / 2 | `0.853248 cm`; seg 14 | 3 / 2 | `0.159193 cm`; seg 15 |

All candidates in these five blocks fail. S591 duplicated geometries occur
across multiple paths, including numeric layer `8`; S592's upper/under pointed
collars also have duplicate geometry under multiple numeric layer locators.
These are duplicate path observations, not independent passing alternatives
or proof of layer role. S592 changed the shape/residual distribution, but the
worst-error neighborhoods moved on the back and stands. Pointed-collar errors
remain on a neighboring source edge at about `0.159 cm`. This is a measured
geometric observation, not a cause attribution.

The four non-target CUT contours and all nine SEW contours remain passes in
both pinned one-generation analyses. All nine output block bindings reproduced
from the unchanged SEW geometry. Source outlines contain only straight edges;
the witness algorithm confirmed all enumerated output candidates contain no
bulge arcs before calculating segment neighborhoods.

## Result, limits and next step

No enumerated candidate for the five target CUT pieces meets the gate, and the
candidate inventory yields no single source-exact correction. Do not select a
candidate by numeric layer or try additional SPLINE flags based on this result.
S593 ran no CLO import/export and changed no DXF fixture, source geometry,
stitch graph, product code, legacy writer, protected export bytes, or V03 gate.
V02 remains Done; all-seven acceptance and every V03 identity, CUT/SEW,
marks/notches, grading/options, malformed-input, useful-detail and repeated
round-trip gate remain unchanged. No industrial conformance, universal
compatibility, physical-fit, factory-acceptance or production-readiness claim.

Next S594 will do a source/specification audit of the exact degree-1 SPLINE
entities and flags using primary DXF documentation and an independent source
curve evaluation. This is a bounded check before any further receiver trial;
it will not change source geometry or acceptance. If the encoding already
matches the documented curve semantics, use that evidence to decide whether a
different receiver/representation is required instead of generating more
unsubstantiated variants.

## Evidence and verification

- Analysis script:
  `docs/research/epic17/S593-polo-cut-output-topology/analyze-cut-candidates.mjs`.
- Machine-readable candidate map:
  `C:\\G04-CLO-DXF-Exchange\\S593-polo-cut-output-topology\\Evidence\\Analysis\\S593-cut-candidate-topology.json`, 185,843 bytes, SHA-256
  `9a8016041cf92b18a04c4866b6edf516cb81768ed6895ee49dc57e34c3e696d4`.
- Inputs and prior reports are hash-pinned in that file: S536 source outline
  baseline, S591/S592 fixture/output files and their round-trip reports. No
  binaries or unreviewed receiver output were added to the repository.
- Focused checks and time accounting are recorded at the final boundary below.

## Time and final boundary

- Goal audit at `08:12:18 UTC`: `get_goal` returned **active**. Its objective
  still names EPIC-17/G04 through admitted V01→V02→V03, durable evidence,
  final output review, required gates and safe merge; it matches this packet
  and the canonical board. “Stalled” is stale wording from an earlier
  checkpoint, not the current status. The goal is still required until the
  admitted Epic is complete; no UI resume, goal edit or status change is
  needed.
- The first post-replay Control Center run was `40/42`. Both failures were
  existing board assertions that pin canonical strings for the accepted S459
  seven-recipe/73-configuration/146-face record and approved S457/S406 view
  evidence. The updated descriptions had paraphrased those statements. S593
  corrected only the Epic and summary descriptions using the validated
  command layer at board revisions `3497→3500`, retaining statuses, scope and
  gates. The suite then passed `42/42`; this diagnosed documentation/test
  wording drift, not a product defect. The corrective commands and replay
  verifier are retained beside this packet.
- Start `08:02:55 UTC`; boundary `08:12:18 UTC` (9m23s elapsed). Implementation
  0m; analysis preceded this resumed closeout and its category timing was not
  retained; the closeout verification and record corrections therefore have
  no reliable finer split. External-agent wait 0m; maintainer-decision time
  0m.
- Board start revision `3491`; initial validated exit replay `3493→3497`;
  wording correction `3497→3500`. Canonical board descriptions retain the
  expected S459/S457/S406 evidence language and the V02/V03 statuses.
