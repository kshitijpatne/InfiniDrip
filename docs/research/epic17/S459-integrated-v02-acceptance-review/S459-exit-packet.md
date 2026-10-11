# EPIC-17 / G04 V02 integrated acceptance review — Slice 459 exit

## Decision

The current integrated V02 review passes. Accept all 146 front/back requests across all seven recipes and the 73-row canonical supported-option fixture. Move G04-V02 to Done with verified evidence. Keep EPIC-17 In Progress, V01 Done and V03 Backlog until V03 plus final review, merge and deployment gates complete. This accepts digital V02 behavior only; it does not claim physical fit, factory acceptance or production readiness.

The all-seven result also fulfills the user-approved Woven front and back view recommendations recorded in S457: the collar-leaf front mask and reflected back sleeve/band view both remain present in every one of 28 options, with source cut/stitch geometry unchanged. The back sleeve/band annotation explicitly says “DETAIL ONLY—not at assembly location”; it does not present those bands as sewn at the depicted position.

## Verified starting state and execution

- Started 2026-10-08 03:31:36 UTC from S458 `a26a25b9c889bb5dbbe43fce9e0e9aee30f8308c`, clean on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice S458; S459 unique.
- Canonical board start revision 2773; S459 start replay reached revision 2777. Start commands and validated-layer script are retained in this directory.
- Current preview is the live application production bundle built from unchanged rendering source after S457; S458 is evidence-only and S459 adds no product code.
- Ran the complete S330 matrix through Playwright Chromium and the live UI at exact options, including both `FRONT_FLAT` and `BACK_FLAT`: 73 configurations, 146 face outputs, seven recipes.

## Integrated matrix

| Recipe | Configurations | Front/back outputs | Callout records | Colorway fill references |
| --- | ---: | ---: | ---: | ---: |
| Tee | 1 | 2/2 | 9 | 4 |
| Fitted | 1 | 2/2 | 3 | 4 |
| Tank | 1 | 2/2 | 9 | 2 |
| Polo | 17 | 34/34 | 576 | 187 |
| Woven shirt | 28 | 56/56 | 279 | 448 |
| Skirt | 1 | 2/2 | 4 | 4 |
| Trouser | 24 | 48/48 | 168 | 144 |
| **Total** | **73** | **146/146** | **1,048** | **793** |

The captured face records show zero technical-flat issues, option mismatches, front/back revision-pair mismatches, invalid output identities, colorway revision mismatches or unresolved callout target IDs. Chromium reported zero page, console or failed-request errors. All 146 paired outputs use one exact current revision; children and overlay references match their SVG revision. The current SVGs contain 277 full-text source-POM schedule rows: Polo has 13 rows on each of its 17 fronts (221); Woven has two on each of its 28 fronts (56). Other faces preserve their recipe-specific on-view callout counts. Source POMs whose measured edge is not represented on that face remain table-only with a visible source notice; no geometry is invented.

A corrected callout-target audit splits pipe-delimited union targets and resolves each member against the same face. The first draft counted those valid unions as misses; the corrected full matrix has zero genuine misses. An independent Chromium `getBBox` audit covered every rendered text node in every layer in all 146 actual SVGs (not just `TEXT_LABELS`): zero intersecting text-box pairs. Maximum UI zoom was exercised at 250%; actual Polo full-text schedule, construction labels and Woven detail-only disclaimer were visually reviewed at zoom. Labels fit the zoomable canvas; dense technical sheets require canvas zoom/pan rather than being read at the full-paper fit scale.

The 25 cm Trouser fly-length fixture correctly surfaces the existing actionable warning that it reaches the 24 cm front rise after waistband; it does not silently clamp the option. The output remains visibly identified as a geometry warning in the UI. No fit claim is made.

All source notices are preserved rather than converted to synthetic lines. The canonical 73-option fixture has no selected artwork assets: the 146 SVGs contain the structural `ARTWORK` layer group but no artwork elements. Thus source-bound overlays and colorway revisions are covered, but a user-selected artwork instance is not exercised by this fixture. The finding review below retains MQF-011 as “To be reviewed”; this does not add artwork-asset selection or UI redesign to G04. Current model notices disclose source features/edges that are not represented.

## Source/topology and rendered review

- The current fixture was replayed from the actual UI, not a disconnected sketch renderer. Per-face SVGs preserve role/entity/source IDs, face identity, current option values, exact paired revision, explicit layer order and colorway references. There is no face-specific redraw or pairing drift.
- Actual 100% whole-canvas captures are retained for every face. Maximum-zoom UI screenshots cover Tee, Fitted, Tank, Polo default and limiting collar extension, Woven default and combined-supported, Skirt, and Trouser fly-length maximum, front and back. Reviewed crops include the Polo keyed-marker/placket region and 13-row source-POM schedule; Woven closure and reflected sleeve-band detail; Trouser front waistband/fly and the visible maximum-fly warning. See `zoom-review/` and `production-replay/`.
- All seven recipes preserve their source-declared silhouettes, joins, seams, construction and marks; option-specific geometric extremes resolve without renderer issues. Unsupported topstitch/pleat/dart/pocket/edge facts are not fabricated; where not modeled on a face the source notice states why or that the value remains table-only. Colorway fill references remain revision matched. Woven’s accepted sleeve-band display and Polo’s accepted projection/callout conventions are view-only and preserve source cut geometry and stitch graphs.
- The all-layer text-overlap audit is `all-layer-label-overlap-audit.json`. The full raw results are `production-replay/matrix.json`, its per-face JSON/SVG/PNG files, `S459-replay-summary.json` and `zoom-review/matrix.json`.

## Manual quality finding review

These findings remain review checks, not permission for additional work. Required disposition remains **To be reviewed** in `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md`.

| Finding | S459 evidence and limitation | Disposition |
| --- | --- | --- |
| MQF-004 | Current closure marks and view-layer order are present for their declared recipes; Woven front closure is visible. This review does not cover pattern-linked assembled side/oblique/inside views in G09/D04. | Partial; To be reviewed |
| MQF-005 | Source-bound construction labels and exact keyed POM schedules are visible and non-overlapping in the actual zoomable view. This does not add per-piece construction instructions or broader help redesign. | Partial; To be reviewed |
| MQF-006 | All rendered POM targets resolve to same-face entities at the exact current revision; table-only measurements are explicitly noted. This is digital source-binding evidence, not physical measurement validation. | Partial; To be reviewed |
| MQF-007 | Across all 146 outputs, text bounding boxes across every layer have zero intersections; representative dense regions and full schedules are readable at 250% canvas zoom. Whole-paper fit remains overview scale. | Partial; To be reviewed |
| MQF-011 | Current colorway overlays/revisions are included. No artwork placement is selected in the canonical fixture; selection interaction and print-response remain outside this evidence. Preserve the documented post-G17 deferrals. | Partial; To be reviewed |
| MQF-012 | Current approved Polo and Woven collar mappings are represented in the final exact revision output and review. This does not supply G05’s production construction narrative or claim physical sewing/fit. | Partial; To be reviewed |
| MQF-015 | No industrial CAD receiver/profile or round-trip artifact is part of V02. This is the V03 rights/profile/export review. | Not applicable to V02; To be reviewed at V03 |

No deferred finding is converted into additional G04 work. Preserve G09/D04 scope for assembled views, G05 for production tech-pack content, MQF-011/012 post-G17 deferrals, and all claim boundaries.

## Acceptance and preserved gates

V02 all-seven criteria pass for the exact current 73-option/146-face fixture. V01 is Done. V02 is Done in the validated canonical board. V03 remains the only admitted capability task and is still Backlog pending its ordered start after this verified V02 boundary. It requires rights review before receiver/profile selection, then documented representative fixtures and witnessed import/export/round-trip behavior. Exact format compatibility may be claimed only inside that evidence.

No change to the 0.25 cm residual gate or its exact approved S351 exception; other relations remain subject to the gate. No change to all-seven coverage, V02-before-V03, generic/legacy DXF behavior or any protected export bytes. No new garment recipe, physical sampling, supplier contact, launch spending, hosted service, broad UI redesign, side/oblique/inside views, tech-pack production content or factory/production-readiness claim.

## Verification and durable closeout

- Current Chromium replay: 73/73 configurations and 146/146 front/back outputs; zero browser errors, zero issue rows, zero option/revision/identity/colorway/callout-target mismatches.
- Text audit: all text nodes in every rendered layer for all 146 faces; zero intersections; maximum UI zoom 250% checked in rendered app.
- Artifact/packet scripts: syntax and summary checks pass. No production source changed, so no changed-production coverage, full repository gate, build/Electron or export-identity rerun is triggered at this evidence-only boundary. Preserve the one required full repository coverage/build/output gate for the settled integrated V03/PR candidate.
- Board closeout: start revision 2773→2777; exit/status/evidence and summary reconciliation 2777→2795. The complete S459 command chain was replayed through the validated command layer and preflighted from the S458 board snapshot on an isolated copy. The verified V02 work card is Done; EPIC-17 stays In Progress and V03 stays Backlog. The first Control Center gate exposed stale V02 status/summary assertions; after updating those assertions against the accepted S459 board, `npm run control-center:test` passes 42/42. Canonical board/schema validation and `git diff --check` pass.
- S459 will be one commit with subject `Slice 459: accept integrated seven-recipe V02 output`.
- Elapsed: 03:31:36–03:59:32 UTC (about 27m56s). Production implementation 0m; focused full-matrix verification/audit 10m; visual review 8m; packet/state/board closeout and stale-test repair 9m56s; external-agent waits 0m; maintainer-decision time 0m.

## Next action

Reserve S460 after a fresh Git/board check and begin V03’s rights-reviewed receiver/profile and fixture proof work. Preserve V03 Backlog until that ordered packet is ready; no receiver may be selected on assumed rights or marketing claims alone.


