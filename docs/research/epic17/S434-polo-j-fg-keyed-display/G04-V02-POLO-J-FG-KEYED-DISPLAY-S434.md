# G04 V02 — Polo J/FG keyed display — Slice 434

## Start boundary and authority

- Started 2026-10-07 18:53:38 UTC on `codex/epic-17-g04` from clean S433
  commit `9939c65b514be581fd6ff81ffa472c7b2d23f1bf`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor of the current branch. Slice 433 is the highest assigned slice;
  reserve 434.
- Canonical board is revision 2574: EPIC-17 and G04-V02 In Progress, V01
  Done, V03 Backlog; 56 accepted / 90 held across 73 configurations / 146
  faces. All 34 Polo views and all 56 Woven views remain held.
- On 2026-10-07 the maintainer approved the exact S433 view-only trial for
  Polo's `Finished collar stand height` and `Stand front rise` presentation.
  The approval permits implementation and option-wide verification only; it
  accepts no face and does not change G04 criteria or other holds.

## Scope and acceptance

Implement only the approved J/FG source-centered keyed display for the exact
same-revision Polo front POMs, using the existing full-text schedule renderer:

1. Key **J** is centered at the exact `outerStand.frontEnd` start associated
   with `pom:polo:finished-collar-stand-height`.
2. One **FG** ring is centered at the exact
   `outerStand.frontNeckline` start associated with
   `pom:polo:stand-front-rise`, and groups the existing FG POMs
   `finished-placket-width` and `front-neck-drop` in the same schedule. All
   three rows retain their own source POM identity, exact anchor/target edge,
   value, tolerance and complete text.
3. Preserve source outlines, marks, pattern/cut geometry, stitch graph,
   revision, options, colorway, existing key-letter offsets and the 0.22 cm
   ring size. Do not create or claim a physical notch.
4. Validate unique same-revision POM identity, exact target outline and source
   edge for all four callouts; require the exact three-member FG group; fail
   closed on missing, duplicate, stale or mismatched source entities.
5. Replay all 17 supported Polo options through the production live compiler,
   colorway renderer and browser. Verify all 13 keyed full-text schedule rows,
   J/FG marker stations and source identities, zero compile/render/browser or
   unrelated text/marker collision findings, and unchanged back output.
   Retain full SVGs and reviewed rendered examples.
6. Keep all 34 Polo views held unless every applicable V02 output check passes;
   a passing keyed-callout check alone does not release them.

## Explicit non-goals and gates

- No changes to pattern geometry, source stitches, POM definitions, supported
  option values, approved unrelated keys, colorway behavior, DXF behavior,
  export identities, 0.25 cm residual rule outside the approved exact S351
  case, all-seven V02, or V02-before-V03.
- No Woven mapping changes, G09/D04 assembled views, G05 tech-pack content,
  broad UI redesign, new recipes, physical sampling, fit/factory claims,
  supplier contact, launch spending, hosted services or production-readiness
  claims.
- V03 remains gated behind completion of all-seven V02 plus a rights-cleared
  industrial receiver/profile and representative import/export round-trip
  evidence.
- Full repository tests/coverage, integrated build/browser/output replay and
  export byte-identity gate remain reserved for the settled integrated Epic
  candidate. Changed production code must have 100% statement, branch,
  function and line coverage; preserve thresholds and baselines.

## Ownership and risks

The mapping changes the shared live-view POM contract, so no safe disjoint
implementation ownership is available. Codex owns implementation, tests,
rendered review and integration; no agent is delegated. Main risk is that a
shared FG schedule ring may technically clear label placement while remaining
crowded against source construction marks. Any such collision or unreadable
output keeps Polo held. No further maintainer decision is required within the
approved trial boundaries.

## Start evidence

The exact 17-option trial and its reviewed crops are in
`docs/research/epic17/S433-polo-output-blocker-diagnosis/`:
`S433-polo-key-trial-matrix.json`, `render-pom-key-trial.mts`, and
`rendered-pom-trial/`. The default and maximum-rise detailed outputs show
separate J and FG circles; nearby source markings remain dense. The proposed FG
display point differs from its prior station by at most 0.103085 cm over the
17-option matrix. This is a view convention only.

## Exit evidence

### Implementation

- Implemented the approved J and FG mapping in
  `src/render/technical-flat-live.ts`; keyed POM compiler bypass is restricted
  to the two approved source IDs in `src/render/technical-flat-poms.ts`.
- All 13 Polo keyed full-text rows are emitted for all 17 front options. The
  three FG rows retain separate POM IDs, source edges, source points, values,
  tolerances and complete row text while sharing the approved
  `outerStand.frontNeckline` ring. J retains the exact
  `outerStand.frontEnd` source edge. No geometry, stitch, mark, export, option,
  colorway or POM definition changed.
- `ARCHITECTURE.md` now documents the keyed schedule contract and its limits.

### Verification and rendered review

- Focused suite: `npx vitest run src/render/technical-flat-poms.test.ts
  src/render/technical-flat-live.test.ts` — 59/59 tests pass.
- Focused V8 coverage: POM module 100% statements/branches/functions/lines;
  live-flat module 100% branches/functions and 99.77% statements/lines. Its only
  uncovered statements are pre-existing lines 835–836 in the Polo residual
  diagnostic, outside this slice's diff. The required coverage threshold was
  not changed. The test command reports the global 100% threshold failure
  because it runs only these two targeted suites; the integrated global gate
  remains reserved for the settled Epic candidate.
- Production compile, actual SVG renderer with Chromium text metrics, and
  browser replay passed all 17 exact S331 options / 34 faces with no compile,
  renderer, page or console errors. All 13 keyed schedule rows are present on
  each front, including the exact J marker and three-member FG marker group;
  all schedule text remains separate and complete. Matrix:
  `S434-production-render-matrix.json`; production SVGs and reviewed images:
  `rendered-production/`.
- Reviewed the full default front and magnified neck crop. The new J/FG rings
  remain on their exact source stations and the full schedule is readable in
  rendered output. The preliminary `S434-marker-clearance-matrix.json` reports
  raw glyph-to-path/mark proximity, including target-station contacts. It does
  not measure the corrected source-label collision criteria and is superseded
  for label-readability interpretation by S435's full-label audit. Do not treat
  its 34 J path/mark contacts as 34 verified unreadable collisions.
- `scan-j-glyph-offsets.mjs`, `S434-j-glyph-offset-scan.json`, and
  `rendered-j-offset-trial/` are a diagnostic exploration only. The constant
  `(0,+0.70 cm)` J text shift was not approved, was not implemented, and is not
  required by S435's corrected label-collision result. Keep the J ring at the
  approved exact anchor unless later evidence identifies a real output defect.
- The surrounding source shoulder/collar annotation region is visually dense,
  but S435's actual 17-option full-label audit finds no label/key/schedule box
  intersections. See S435's exact findings before deciding whether a separate
  construction/topology blocker remains.

### Boundary, holds and next work

- S434 closes the approved display change only. It does not pass overall V02
  acceptance. S435/S436's corrected current-output audit finds no Polo POM
  label/marker/schedule collision and clears the 17-option compiler, colorway,
  join/residual and POM schedule checks in the retained evidence. All 34 Polo
  faces remain held while the all-seven V02 gate is incomplete; all 56 Woven
  faces remain held for the unresolved 28 front collar/neckline contacts and 28
  back sleeve-hem crossings. The 0.25 cm residual limit outside the exact
  approved S351 case, legacy DXF and protected export identities are unchanged.
  V03 remains gated by all-seven V02, rights review, a selected industrial
  receiver/profile and representative import/round-trip evidence.
- Board statuses remain EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog.
  Validated start replay: 2574→2577; exit replay: 2577→2583; additive clearance
  reconciliation: 2583→2588. The exit packet and collision matrix are linked
  from both G04-V02 and EPIC-17; Control Center tests pass 42/42.
- Elapsed time from 18:53:38 to 19:28:10 UTC: 34m32s total (approximate
  allocation: implementation and focused tests 9m; coverage diagnosis 4m;
  production replay and rendered review 7m; path/mark collision and 144-offset
  scan 8m; packet/state/board closeout 6m32s; agent waits 0m; maintainer-
  decision wait within this slice 0m, with S434 mapping approval recorded
  before implementation began).
- Landed as `Slice 434: implement Polo J/FG keyed POM display`. Refreshed
  `origin/main` ancestry and clean worktree are recorded by the commit and
  verified closeout.
- Next action recorded at S434 and completed by S435/S436: reconcile raw path
  contacts with full-label evidence and audit per-face Polo output. S436 finds
  no remaining Polo-specific renderer/readability error in the current 17-case
  evidence. Continue with the source-bound Woven crossings; do not release any
  face or start V03 before all-seven V02 acceptance passes.
