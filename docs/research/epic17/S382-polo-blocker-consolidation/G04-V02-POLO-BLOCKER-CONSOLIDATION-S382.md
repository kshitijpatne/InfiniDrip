# G04 V02 — Consolidated Polo front blocker diagnosis — Slice 382

## Start boundary

- Started 2026-10-02 21:31:25 UTC from clean S381 commit `02b559e1187e80e21c5b1c0389b389b186f34ae6` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 381; S382 is unique. Board revision 1960, with EPIC-17/G04-V02 In Progress. Primary usage at start 53%; ordinary work is allowed.
- Scope: consolidate the exact 17-option Polo front callout/path blockers from S379 against the current S380 actual keyed SVG output; separate the C marker's two cleared base renderer failures; combine the unchanged 0.68 cm sleeve-cap assembly residual and 0.25 cm threshold evidence. Bind failures to each source POM, target, source entity, nearest obstructing path(s), option incidence, and output revision. Recommend any remaining view-only choice only where code and topology cannot determine a layout.
- Required acceptance: verify the exact 17 option rows match between S379 and S380; same source POM identity/target/source entity and actual SVG leader geometry for every retained blocker; aggregate/path/text counts; 34 Polo faces still fail closed at 0.68 cm > 0.25 cm; inspect representative S380 actual whole/detail/overlay outputs; preserve every hold and all-seven/V02/V03/export requirements. Record reusable evidence and any genuinely unresolved presentation decision without implementing it.
- No source, stitch, renderer, POM, gate, option, acceptance, or face-status change. No broad UI work. No separate proposal is implemented before maintainer approval. A focused diagnostic harness and browser render/output comparison are required; no global coverage or full repository gate because production code does not change.
- No safe independent delegation: S379 geometry/path evidence, S380 actual render identity and the assembly residual must be reconciled as one same-option diagnosis. Codex retains analysis and review.

## Evidence sources to reconcile

- S379 exact 17-option audit and per-POM tables: `docs/research/epic17/S379-polo-front-callout-crossing-audit/`.
- S380 current production renderer output and exact keyed C matrix: `docs/research/epic17/S380-polo-collar-callout-key-implementation/`.
- S351/S353/S357/S358/S360 durable Polo ease residual evidence and the source-authored `Sleeve-cap ease` stitch; inspect current `src/drafting/polo.ts` and `src/render/technical-flat-assembly.ts` before concluding.

## Consolidated output diagnosis

### Exact current output and C disposition

- S382 audits the actual 17 S380 keyed production-renderer SVGs at `live-draft:polo:S380:<caseId>`. Its harness asserts exact option-value equality with S379 and the S331 supported matrix, same-revision source paths, current C marker/schedule identity, zero browser errors, and the complete current POM leader/path/text geometry. A second comparison proves that every remaining non-C POM leader's path data, source entity, and target are exactly identical to the S379 row across all 17 option values. The generated run revision IDs differ (`S378` vs `S380`); the current measurements below are bound to the S380 revision.
- **Already addressed by S380:** `pom:polo:collar-point-extension` is now the 0.22 cm source-centered C ring at exact `upperCollar.frontTip:end`, source entity `pattern:polo:role:upperCollar:edge:frontTip`, target `flat:polo:FRONT_FLAT:component:upperCollar:outline`. Its unchanged full POM text/value/±0.2 cm tolerance is in the C schedule for all 17 rows. The two original base `TEXT_COLLISION` rows (`polo-standFrontRise-max`, `polo-collarPointExtension-min`) clear in the keyed output. That repairs this local rendering issue only.
- No keyed-C rendering issues occur in S380's 17 rows. The separate path/readability audit still finds ten other POMs failing in every row. The keyed C does not clear these failures, the sleeve residual, or any face.

### Current POM-to-path blockers

Every `FRONT_FLAT` has ten non-C leaders with non-target geometry clearance below the fixed 0.25 cm threshold. Counts below use true crossings versus positive clearances that remain under 0.25 cm. `target` is the exact same-revision geometry/mark the POM represents; `source anchor` and `nearest obstructing source` are source-derived identities.

| Source POM | Source anchor → exact target | Nearest interfering emitted path (pattern source) | Option incidence; measured clearance |
|---|---|---|---|
| `pom:polo:across-shoulder` | `front.shoulder` → `front:outline` | `view-seam:polo-sleeve-cap:front:armhole` (`front.armhole`) | 17/17 crossings; 0 cm |
| `pom:polo:body-chest-finished` | `front.side` → `front:outline` | `sleeve:outline` (`pattern:polo:role:sleeve`) | 17/17 crossings; 0 cm |
| `pom:polo:button-spacing` | `buttonPlacket.button-1` mark → same button-1 mark | `buttonPlacket:outline` (`pattern:polo:role:buttonPlacket`) | 17/17 crossings; 0 cm |
| `pom:polo:finished-placket-length` | `buttonPlacket.attachmentRaw` → `buttonPlacket:outline` | `front.placketBaseReinforcement:fold-reflection` 16 rows; `front.placketBaseClipRight:fold-reflection` 1 row | 17/17 crossings; 0 cm |
| `pom:polo:finished-placket-width` | `buttonPlacket.attachmentLine` mark → same attachmentLine mark | `buttonPlacket:outline` (`pattern:polo:role:buttonPlacket`) | 17/17 crossings; 0 cm |
| `pom:polo:front-neck-drop` | `front.neckline` → `front:outline` | `buttonPlacket:outline` (`pattern:polo:role:buttonPlacket`) | 17/17 crossings; 0 cm |
| `pom:polo:neck-width` | `front.shoulder` → `front:outline` | `outerStand:outline` (`pattern:polo:role:outerStand`) | 3 crossings, 14 positive clearances; 0–0.04755 cm |
| `pom:polo:shoulder-seam` | `front.shoulder` → `front:outline` | `outerStand:outline` (`pattern:polo:role:outerStand`) | 2 crossings, 15 positive clearances; 0–0.09799 cm |
| `pom:polo:sleeve-bicep-width` | `sleeve.sideLeft` → `sleeve:outline` | `front:outline` (`pattern:polo:role:front`) | 17/17 crossings; 0 cm |
| `pom:polo:finished-pointed-collar-leaf` | `upperCollar.centerBack` → `upperCollar:outline` | `underCollar:centerMatch` 15 rows; `outerStand:centerMatch` 2 rows | 15 crossings, 2 positive clearances; 0–0.00005 cm |

The full-text/default-value details, per-row identities, exact leader segments, option values, nearest paths, and clearances are in `per-pom-summary.json` and `leader-crossing-matrix.json`. These are callout presentation collisions, not missing pattern geometry or evidence for changing the construction.

### Cross-callout and text collisions

- There are 51 leader pairs below 0.25 cm: `body-chest-finished` ↔ `sleeve-bicep-width` in all 17 options; `finished-placket-width` ↔ `front-neck-drop` in all 17; and `neck-width` ↔ `shoulder-seam` in all 17.
- Chromium `getBBox()` checks identify three true leader-to-glyph intersections: `finished-placket-width` crosses the front `CENTER FRONT` and upper-collar `CENTER FRONT` labels in `polo-placketWidth-min`; `shoulder-seam` crosses `outerStand.shoulder` in `polo-standFrontRise-min`.
- Corrected current path measurements find 139 leader/path crossings plus 31 positive clearances under 0.25 cm: 170 blocker instances across 17 fronts. No option passes the POM/path review. The current rendering still has dense text and crossing paths in the default, minimum-placket-width, minimum-stand-front-rise, and maximum-collar-point-extension output; their S380-derived whole/detail overlays are retained under `annotated/`.

### Correction to S379 path-sampling evidence

S379's `audit-leaders.mjs` set cubic parameter `t=n/40` for `n=1..200`, which sampled `t` through 5 and extrapolated each cubic well past its true endpoint. S382 reparses the current S380 SVGs and samples the 200 parameter intervals from `t=0` through `t=1`. This preserves exact M/L/Z segments and uses the corrected cubic path only where the emitted source path is curved. The corrected run supersedes S379's 171 clearance failures / 141 crossings / 30 positive clearances with 170 / 139 / 31.

The sole prior extra blocked POM, `front-body-length-hps-hem` at `polo-standFrontRise-min`, has 27.5 cm nearest-path clearance on the corrected current geometry, so it is not a <0.25 cm blocker. It must be removed from any continuing active-blocker tally. This correction does not clear a Polo face: the other ten POMs still fail in each front, the independent assembly residual remains, and the rendered output remains unreadable.

### Independent sleeve-cap residual

- **Directly encoded by source:** `src/drafting/sleeve.ts` uses `CAP_EASE = 1.5 cm`; `src/drafting/polo.ts` passes the summed live front/back armhole length as the sleeve's target. The source stitch `Sleeve-cap ease` relates `sleeve.capLeft`/`capRight` to `front.armhole`/`back.armhole`. The 17 supported options keep the same armhole topology: total sleeve cap length 43.19145806476 cm versus 41.69145806677 cm combined receiving armhole length.
- **Approved view projection:** `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH` depicts the front/back eased seam along the corresponding receiving armhole, without modifying source cut curves, source stitch, or solver behavior.
- **Current independent hold:** assembly still reports a 0.68 cm `Sleeve-cap ease` endpoint residual for both faces of all 17 options. This is greater than the maintainer-confirmed 0.25 cm gate. The view projection does not change the rigid assembly residual. The source-backed receiver paths are `flat:polo:FRONT_FLAT:view-seam:polo-sleeve-cap:front:armhole` and the corresponding BACK_FLAT `...:back:armhole`. Preserve authored ease and keep all 34 faces held.

### Proposal for the next decision checkpoint — diagnostic only, not approved

The source and topology settle each target and anchor; they do not prescribe how to lay out crossing labels. A bounded view-only candidate for S383 is to keep all anchors exactly where the source maps them, replace the ten remaining blocked inline leaders/text with open 0.22 cm-radius source-centered key rings, and put their exact full text/value/tolerance in the measured schedule alongside the existing C row. Use one A ring for the three POMs sharing `front.shoulder` (`across-shoulder`, `neck-width`, `shoulder-seam`), with three A schedule rows; B for `front.side`; D for `buttonPlacket.button-1`; E for `buttonPlacket.attachmentRaw`; F for `buttonPlacket.attachmentLine`; G for `front.neckline`; H for `sleeve.sideLeft`; and I for `upperCollar.centerBack`. Keep C for `upperCollar.frontTip:end`. The output would carry eight new source points, nine total markers including C, and eleven full-text POM rows including the three-row A group.

This candidate changes only annotation presentation and preserves all source POM IDs, measurements, tolerances, exact target geometry, same-revision anchors and pattern topology. Its risks are marker overlap with the button/center-match/shoulder construction marks and the taller full-text schedule. S383 must render all 17 options and inspect whole/detail views, exact mark visibility, crossings, overlaps, text metrics, colorway-on/off output and fail-closed behavior before asking for approval. No production or semantic mapping change is authorized by S382. Keep all 34 faces held unless a later approved implementation passes every gate; the residual alone keeps them held regardless of callout outcome.

## S382 exit and next action

- S382 makes no production change, no acceptance change and no hold release. Keep all 34 Polo faces held, all-seven V02 unchanged, and V03 gated.
- Durable output: `audit-current-polo.mjs`, `compare-rendered-leaders.mjs`, `diagnosis-summary.json`, current-revision `leader-crossing-matrix.json`, `per-pom-summary.json`, `render-comparison.json`, plus Chromium-rendered `annotated/` whole/detail overlays.
- Start/exit board revisions: 1960/1971. Control Center validation: 42/42. `node --check` passes for both scripts, `git diff --check` passes, and the actual-browser matrix records zero browser errors. Manual output review covers default, `placketWidth-min`, `standFrontRise-min`, and `collarPointExtension-max` whole/detail views; all show remaining crossings and readable current C schedule, with all holds retained.
- Approximate elapsed active time: 20m total — analysis/harness 8m; focused 17-option and browser checks 7m; rendered inspection 2m; packet/state/board closeout 3m; external waits 0m; maintainer-decision time 0m. No production files changed, so production coverage/build/export gates are not slice-local requirements.
- **Next action:** reserve S383 at the next clean boundary and run only the diagnostic A/B/D–I keyed-marker/schedule candidate above across the exact 17 options. Do not implement it in the production renderer before maintainer approval.


## Holds and boundaries

Keep all 34 Polo faces held unless every applicable topology, join, crossing, overlap, colorway, exact POM and readability condition passes. Preserve the approved C marker at exact `upperCollar.frontTip:end`, its full source text/value/tolerance schedule, the 0.25 cm residual gate, authored +1.5 cm sleeve-cap ease, source/stitch graph, all-seven-recipe V02 acceptance, V02-before-V03, protected legacy DXF behavior and all protected export byte identities. G05 tech-pack content and G09/D04 assembled side/oblique/inside views stay outside scope. No physical-fit, factory-acceptance, CAD-compatibility or production-readiness claim.
