# G04 V02 — Woven collar and POM remaining holds — Slice 346

## Start boundary

- **Started:** 2026-10-01 23:45 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, V03 CAD exchange proof, integrated gates, PR, safe merge and required deployment verification.
- **Verified Git:** refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; clean `codex/epic-17-g04` HEAD is S345 `e080bfcda7a7095c31e88d8df442e1eb04628b60` (`Slice 345: implement approved Woven eased-seam projection`), with upstream `origin/main` an ancestor. Highest numbered slice is 345; reserve 346.
- **Board:** canonical revision 1305; EPIC-14/15/16 Closed; EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog. S345 exit, gates and rendered holds are linked. Integrated acceptance tally remains 56 accepted / 90 held across 73 configurations, 146 faces and 32 option fields.
- **Usage:** primary 68% used, weekly 20% used (informational); ordinary use allowed.
- **S345 boundary:** focused 130/130 and four-module 100% coverage passed; TypeScript/build and protected export 8/8 passed. Production replay emitted 28 unaccepted Woven front candidates; all 28 backs remain held by open `outerStand`, `underCollar` and `upperCollar` colorway contours. Rendered review rejects all fronts for collar crossings/detached forms; ten front POMs lack geometry anchors. No face is accepted. The exact replays are in `docs/research/epic17/S345-woven-sleeve/`.

## Scope and evidence rules

Inspect the current Woven recipe, pattern-generation and POM source, current projection/assembly/rendering code, exact draft revisions/options, emitted geometry and S345 rendered evidence. Diagnose two related output surfaces only:

1. The approved collar/stand exterior transfers and visible single base-neckline seam, focusing on front overlap/crossings and all three back colorway contours that currently fail closed.
2. The ten current Woven front table-only POMs. Trace each method to its own same-revision source edges, vertices, marks or supported dimension reference; distinguish absent anchors from renderer/callout limitations.

For every candidate correction, name the exact source role/edge/landmark, face, topology and output layer. Classify the rationale as directly encoded source, pattern-specific reference, existing explicit maintainer decision, or a new proposed design decision. Do not make up physical collar joins, face-specific piece instances, measurement methods or POM anchors. Keep pattern coordinates, cut geometry, source stitch graph, options, generic tolerance, approved placket overlap A, approved base-seam suppression, legacy DXF behavior and protected output bytes unchanged. Apply only already-approved mappings or uniquely source-derived representation fixes. If any mapping requires a new design choice, preserve that hold and bring back one concise grouped decision request with a concrete recommendation; continue independent evidence work.

No changes to Tee/Fitted, Polo, Trouser, other Woven closure semantics, broad UI, G05 tech packs, G09/D04 assembled side/oblique/inside views, CAD receiver/profile selection, supplier contact, physical sampling, launch spending, hosted services or production-readiness claims. V02 remains all-seven; V03 is gated until the V02 acceptance criterion passes.

## Required exit gates

- Preserve deterministic source/revision binding and fail-closed behavior. Focused tests for any changed production code require 100% statement, branch, function and line coverage.
- Exercise all 28 Woven configurations after any production change. Production Chromium replay must retain per-face JSON, SVGs, images and zero-error status; inspect default, combined supported options and relevant extremes for contour closure, valid joins, crossings, overlaps, layer order, callout anchors and readability. Emission alone is not acceptance.
- If no safe complete mapping exists, make no production change and exit with exact diagnostic evidence and all affected holds intact.
- Run focused type/build/export checks only if relevant to code changes. Preserve legacy DXF output and protected export byte identities.
- Record MQF-004–007, MQF-011, MQF-012 and MQF-015 as output-review checkpoints. Do not change their durable status or add work outside this packet; preserve post-G17 deferrals.
- At the boundary record focused verification, rendered/output evidence, board revision through validated commands, pass/fail status, remaining holds, elapsed implementation/verification/render/docs/agent/decision time, and one next action. No safe disjoint delegated task is identified; Codex owns source mapping and review. OpenCode is not used.

## Exit record

### Implementation and focused verification

S346 added same-revision, role-transformed source edge/mark targets for the
Woven POMs that are represented on each exterior face. The front now anchors
body chest, placket width, button spacing, pocket width/height, sleeve-band
depth and noncollapsed vent depth; the back anchors back-yoke depth. Body
length and neck circumference remain table-only because their named source
edges are not drawn on either exterior face. Back-yoke depth remains
front-table-only, front-only measures remain back-table-only, and a zero-length
vent at the option minimum remains table-only instead of receiving a fictive
visible anchor. Measures, formulas, tolerances and options did not change.

The already-approved normalized collar transfer is now available as a
fill-only contour closure on both faces for `outerStand`, `upperCollar` and
`underCollar`. It does not add a physical notch or sew line. The same-revision
Woven back POM target resolves to the exact `back.yokeSeam` source edge; absent
face geometry still fails closed.

Focused verification passed 113/113 tests. All changed production files
`src/drafting/shirt.ts`, `src/render/technical-flat-live.ts`, and
`src/render/technical-flat-projection.ts` have 100% statement, branch,
function and line coverage. `npm run build` passed with its existing Vite
chunk-size advisory. Protected export regression passed 8/8; no byte identity
or legacy DXF baseline moved. The Control Center, canonical board validation
and whitespace gates are recorded below.

### Rendered evidence and acceptance

Production Chromium exercised all 28 Woven configurations / 56 faces and
emitted 56 candidate SVGs at their live revisions, with zero compiler or
browser errors. The previous replay's single zero-depth-vent hold is preserved
in `S346-woven-collar/production-replay-initial/`; after the source-backed
collapsed-edge guard, that 0 cm vent is correctly table-only and its candidate
renders. Output and review are in
`docs/research/epic17/S346-woven-collar/manual-review.md` and its retained
`production-replay/` assets.

Manual review rejects all 56 Woven candidates. Front `outerStand`,
`upperCollar` and `underCollar` remain detached/crossing in the exact emitted
contours; the approved exterior transfer alone has not established valid
physical placement. The back contains long diagonal strokes crossing the
torso; rendered evidence establishes the crossing but does not justify
inventing which unapproved semantic transform should change. No Woven face is
accepted. The integrated tally stays **56 accepted / 90 held** across 73
configurations and 146 faces. All seven recipes remain required for V02;
V03 cannot start while these holds remain.

MQF-004–007, MQF-011, MQF-012 and MQF-015 were checked as applicable review
checkpoints and remain **To be reviewed**; post-G17 deferrals are unchanged.
No physical-fit, factory-acceptance, or production-readiness claim is made.

### Boundary and next action

- **Elapsed since start (2026-10-01 23:45 UTC to 2026-10-02 00:40 UTC):**
  implementation ~18m; focused tests/coverage/build/export ~10m; production
  replay and rendered inspection ~11m; durable records and validated board
  closeout ~16m; external-agent waits 0m; maintainer-decision time 0m.
- **Still held:** all 56 Woven faces; integrated 90/146 faces across seven
  recipes. V02 all-seven acceptance unmet; V03 remains Backlog/gated.
- **Next action:** after committing this exit and refreshing Git/usage/board,
  reserve the next unique slice to trace the exact Woven front collar and back
  crossing strokes through source transforms, projection metadata, SVG entity
  identities and role layer/order. Make no new semantic mapping without a
  source-unique basis or maintainer approval; replay all 28 configurations
  before any face is considered for acceptance.

The board exit evidence is linked to G04-V02, the EPIC-17 work card and Epic
record through validated commands at canonical board revision **1326**.
`npm run control-center:test` passes 33/33, canonical board schema validation
passes, and `git diff --check` passes. Do not start V03 while any V02
recipe/configuration remains held.
