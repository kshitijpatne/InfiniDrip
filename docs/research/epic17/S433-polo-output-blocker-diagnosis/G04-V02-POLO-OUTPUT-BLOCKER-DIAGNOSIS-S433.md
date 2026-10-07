# G04 V02 — Polo repeated output blocker diagnosis — Slice 433

## Start boundary and authority

- Started 2026-10-07 18:18:31 UTC on `codex/epic-17-g04` from clean S432 `f5aa0d55fd2edfef6ab620caf8b2a13452c7341c`.
- Fetched `origin/main` at `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an ancestor. Highest assigned slice on the active branch is 432; reserve 433. Board revision 2558: EPIC-17 In Progress, V01 Done, V02 In Progress, V03 Backlog. Current integrated count is 56 accepted / 90 held across 73 configurations / 146 faces.
- S432's exact current-revision 17-option replay leaves 17 Polo front POM layout failures and 17 Polo back sleeve colorway contour-closure failures. All 34 Polo views remain held. V02 acceptance and V03 gates are unchanged.

## Scope

Diagnose the repeated Polo front POM callout placement failures (`finished-collar-stand-height`, `stand-front-rise`) and back sleeve colorway closure failure from the exact production source, same-revision pattern topology, option fixtures, and actual renderer. Establish whether a deterministic geometry-bound/layout fix is fully supported by existing source and already-approved view decisions. If a remaining design choice cannot be settled from those facts, produce an exact candidate with its option-wide rendered consequences and retain the affected holds pending maintainer approval. Implement only a source-justified and already-authorized correction; otherwise close as an evidence/decision packet without weakening output gates.

## Acceptance and verification

1. Attribute each repeated error to the exact POM, target geometry, source component/edge/landmark and code path, or to the exact colorway boundary paths/endpoints and renderer validation.
2. Reproduce all 17 supported option configurations with exact source revision identifiers through the actual compiler and SVG renderer. Preserve diagnostic matrices and rendered crops/full outputs.
3. Distinguish source-encoded facts, directly computed topology, existing approved view conventions, and any proposed design decision. Do not present inference as construction evidence.
4. If source uniquely determines the correction, implement a minimal view/output-only fix with focused tests and 100% changed-code statement/branch/function/line coverage; preserve pattern geometry, stitch graph, POM values, source/revision identity, full text schedule, overlays, and export bytes.
5. Re-run all 17 options / 34 views after an implementation. Inspect actual rendered output for source binding, missing/duplicated strokes, intersections, fills, labels, overlaps and readable output. Any unresolved error keeps that face held.
6. If no unambiguous correction is established, make no product-semantic change; provide a concrete proposed mapping/layout and effect for the maintainer, keep all applicable faces held, and continue independent G04 work.
7. Keep V02 all-seven coverage, the 0.25 cm residual rule outside exact approved S351, 100% global coverage, protected export byte identities, V02-before-V03, CAD rights and round-trip gates unchanged.

## Non-goals and dependencies

- No cut geometry, pattern topology, stitch graph, authored POM or garment-option changes.
- No face release based solely on this diagnosis; no broad gate relaxation.
- No changes to Woven, Trouser, other recipes, G09/D04 assembled views, G05 tech packs, UI redesign, physical sampling, supplier contact, launch spend, hosted services, or production-readiness claims.
- S432's residual decision remains narrow and exact. Woven's 56 holds and Polo's 34 holds remain until full applicable V02 checks pass.
- V03 is not started; it still requires all-seven V02 plus documented rights for a selected receiver/profile and representative import/export round-trip fixtures.

## Delegation and gates

No safe disjoint ownership is identified for this shared live-view path; Codex owns the source/topology/output reconciliation and integration. Focused tests and changed-code coverage only for this slice. Reserve the full repository test/coverage gate and integrated build/browser/output replay for the settled Epic/PR candidate. Preserve and diagnose any failures; do not rerun unaffected full gates.

## Start board record

`S433-start-board-commands.json` records this bounded diagnosis through the validated command layer. It changes no status or acceptance criterion.

## Verified diagnosis and implementation

### Back sleeve colorway closure — source-supported renderer correction

Directly encoded source facts: the exact Polo body armhole edges are
`pattern:polo:role:front:edge:armhole` and
`pattern:polo:role:back:edge:armhole`. The compiler already emits those exact
same-revision seams as visible body-role paths. The approved S351 sleeve-cap
projection closes each sleeve fill from the sleeve hem midpoint to the
receiving armhole's shoulder endpoint. The visual contour is therefore
already source-defined at both ends; the missing contour segment is precisely
the existing body armhole seam path.

The failure was in role selection: sleeve colorway contour assembly collects
sleeve-role outline paths and the S351 closure, while the receiving armhole
curve remains body-role linework. The exact curve was visible but omitted from
the sleeve fill boundary, causing the renderer to reject the unclosed sleeve
contour. S433 now adds a duplicate of that exact source seam as a fill-only
boundary primitive, with the exact armhole `sourceEdgeIds`, current revision,
and the approved S351 decision identity. It adds no visible stroke, no cut or
stitch geometry, and no inferred seam. Malformed source/edge identities fail
closed. This is a renderer-boundary correction from source topology, not a
new construction decision.

`S433-polo-output-diagnostic.json` retains all 17 current option revisions and
the pre-correction diagnosis. `render-back-options.mts` then compiled and
rendered every supported option through `renderTechnicalFlatSvg` with its
colorway. `S433-polo-back-colorway-render-matrix.json` records 17/17 SVGs with
all sleeve fills present, zero compiler/renderer issues, exact single revision
per output, and no Chromium errors. Actual default, placket-width-min, and
placket-width-max output images are retained under `rendered-colorway/` and
were inspected. No Polo face is accepted: independent front callout failures
and other V02 checks still hold the entire recipe.

### Front POM label placement — exact facts and proposed display choice

Directly encoded in `src/drafting/polo.ts`: `Finished collar stand height`
measures the `outerStand.frontEnd` source edge and is anchored at its start;
`Stand front rise` is anchored at the start of
`outerStand.frontNeckline`. Their target piece, source edge, values, tolerance,
and same-revision identity are all present and individually renderable. Both
fail only when the full set of callouts is laid out: `placeLabel` searches a
finite set of eight directions and eight radii, then rejects placements that
collide with earlier labels/leaders. The same two POMs fail in all 17 supported
options, while each succeeds alone and the complete view succeeds when these
two are omitted. This is a repeated label-layout limitation, not missing
pattern geometry or POM data.

The S433 in-memory trial is not a production mapping and does not change the
accepted callout definitions. It proposes a keyed schedule presentation:

1. Key **J**: 0.22 cm open ring at the exact `outerStand.frontEnd` start; the
   full-text schedule retains “Finished collar stand height” and its source
   value/tolerance.
2. Key **FG**: one shared 0.22 cm open ring at the exact
   `outerStand.frontNeckline` start for `stand-front-rise`, alongside the
   existing `finished-placket-width` and `front-neck-drop` schedule entries.
   Each keeps its own POM identity, source edge/mark, value, tolerance, and
   full schedule text; no source mark or cut geometry moves. Relative to the
   pre-existing FG station, the new exact source point moves the displayed
   ring by at most 0.103085 cm across the 17 options (zero at the
   `standFrontRise` minimum).

This shared station is a view-only presentation decision, not evidence that
the three distinct source measurements share one physical notch. The
same-revision rendered trial emits all 17 fronts without compiler, renderer,
or browser errors. `S433-polo-key-trial-matrix.json`, full default output and
default/maximum-rise detail crops are retained under `rendered-pom-trial/`.
The default detail visibly separates J and FG rings, but crowded source
markings remain nearby; this trial does not by itself clear output readability
or any face. A separate K ring was rejected in the diagnostic because it
nearly overlapped the existing FG ring. Maintainer approval is still required
before the J/FG semantic marker mapping can be implemented. Until then, the
production compiler continues to fail closed for those two POMs and all 34
Polo faces remain held.

## Slice exit evidence

- **Implemented:** exact fill-only duplicate of each same-revision Polo
  armhole seam under the already approved S351 sleeve-colorway boundary;
  fail-closed source identity checks and regression assertions added. Pattern
  geometry, visible paths, source stitch graph, POM definitions, legacy DXF,
  export baselines, acceptance criteria and face holds are unchanged.
- **Focused verification:** four focused suites pass, 147/147 tests. Targeted
  coverage reports 99.76% statements/lines, 100% branches/functions; the only
  uncovered lines are pre-existing `technical-flat-live.ts` lines 803–804,
  outside the S433 diff. All changed S433 production lines are exercised. The
  module-wide 100% threshold is therefore still not met by that command; no
  threshold was changed. `npm run control-center:test` passes 42/42 after
  restoring historical exact summary phrases via additive, validated board
  commands; the first run correctly exposed those summary text contracts. No
  board-test source changed. Full repository coverage remains reserved for
  the settled integrated Epic candidate.
- **Rendered evidence:** actual 17-option back colorway SVG replay passes with
  exact revision/fill assertions and zero browser errors. Reviewed rendered
  default/min/max examples and the 17-option proposed front-marker trial.
  Remaining front POM placement failures and unrelated V02 checks keep every
  Polo face held. All 56 Woven faces remain held for previously recorded
  construction/view conflicts. Integrated accepted/held tally remains 56/90
  across 146 faces.
- **External research:** S431's exact `claude-opus-5-5` read-only repository
  review found no verified Woven remedy and identified the Polo residual as a
  mismatch between endpoint-only RMS and the approved unequal-length eased
  seam correspondence. The S433 back correction is established from exact
  current source/topology and renderer behavior; no general construction
  reference is being treated as pattern-specific evidence.
- **Outstanding decision:** approve or reject the exact J/FG keyed-marker
  presentation above. No production marker code is implemented before that
  decision. This does not block independent G04 work.
- **Elapsed time (2026-10-07 18:18:31–18:48 UTC, approximate):** source and
  output diagnosis/implementation 10m; focused tests and coverage 8m; option
  render/visual inspection 5m; board regression/summary reconciliation 4m;
  durable packet/context/board closeout 3m; maintainer decision wait 0m;
  external-agent wait 0m.

## Boundary and next action

The S433 board start was applied through the validated command layer,
revision 2558→2560. Exit evidence and updated descriptions were replayed
through the same layer; additive summary reconciliation preserved established
historical evidence phrases and the final board is revision 2574. EPIC-17 and
G04-V02 remain In Progress; V01 remains Done, V03 remains Backlog. All 56 Woven/34 Polo holds and the all-seven V02,
V02-before-V03, fixed residual, protected-export, and rights/round-trip gates
remain unchanged. The sole next action for Polo callout layout is to receive a
decision on the exact J/FG mapping; meanwhile continue independent V02 blocker
work. The complete evidence inventory and validated exit replay are in this
directory.
