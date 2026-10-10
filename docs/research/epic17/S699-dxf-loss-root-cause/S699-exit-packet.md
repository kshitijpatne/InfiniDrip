# EPIC-17 / G04 V03 — S699 source/return root-cause audit

## Outcome and decision

S699 reconciles the exact S698 candidate/return with the current writer and prior controlled format/density evidence. It finds no remaining coordinate serialization defect: S697's six decimals are below the fixed tolerance, and S671 proved exact path preservation. The S698 CUT deviation appears after CLO converts the source contours, with the same shallow-point family already lost under classic/LW-polyline, connected-line, and source-path-density cases. The S698 mark failure is specific to its recorded import setting: `Import Draw Curve Points` was off, while the source writer emitted all three typed POINTs correctly. The piece identity gap is directly in our candidate structure: identities live in the side manifest, but DXF uses a flat sheet and global generic layers.

S628 supplies a concrete, previously measured source fix for the identity structure: named BLOCK/INSERT pieces preserved 12 Woven role names and all CUT/SEW geometry within tolerance. It did not prove Polo or all-seven acceptance. The next slice will integrate that proven structure into the opt-in package and validate exact expansion across the existing seven-recipe/grade/73-option matrix, then perform one justified Polo M CLO round trip with Draw Curve Points on. No more point-density or entity-form permutations. Stop the CLO route if the five curved CUTs still fail `0.001 cm`.

## Gate disposition

| Gate | S699 status | Evidence / next proof |
|---|---|---|
| CUT source precision/path | Passed at source | S697 serializer error `0.000000702921 cm`; S671 exact mathematical path proof. |
| CUT receiver fidelity | Failed | Six of nine S698 contours fail; prior S635/S636/S640/S672 trials show no encoding/density fix. Next named-block candidate gets one measured attempt; stop if curves fail. |
| SEW fidelity | Passed for S698 Polo M only | All nine within threshold; all-seven receiver matrix still due. |
| Buttonhole marks | Unproven with enabled setting | Candidate emits all three POINTs. S698 had Draw Curve Points off. Test one authorized existing option as part of the next candidate. |
| Piece/revision identity | Failed in current DXF structure/round trip | Source drawing is flat and unnamed; S628 named-block round trip is the concrete implementation basis. Revision identity still needs sidecar/block binding. |
| Units | Passed for S698 fixture | Return declares mm and deterministic comparison normalization passed. Broader grades/options remain due. |
| Rights/profile | Rights/local processing confirmed; qualified empirical profile unproven | CLO route remains vendor-specific empirical only; no standards claim. |
| Malformed input/repeatability/readability/all-seven | Unproven | Remain fixed gates for eventual accepted package. |
| Final coverage, cleanup, PR/merge/deployment | Pending | Run only on settled candidate, then remove irrelevant repo artifacts before PR. |

## Verification and boundary

No product source or test changed, so changed-code coverage does not apply. S698's exact candidate, return, inventory, comparison, and renders were rechecked read-only; S628/S635/S636/S640/S671/S672 packets were consulted to avoid repeating known trials. `npm run control-center:test` passed **42/42** and `git diff --check` passed. Validated start/exit replay moved board revision **4129→4130→4131→4132**; the evidence and exit comment are in this packet directory. V03 stays held and EPIC-17/goal stay active.

Start 2026-10-10 23:27:33 UTC from S698 `a4c1354361da8e514e1ff65eaa8bd8e76e4f0e52`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S698 was the highest; S699 is unique. Audit and plan work approximately 3m; no implementation or receiver operation; external wait 0m; maintainer-decision time 0m. Focused closeout results and exact board revision are recorded at exit.

**Next action:** S700 implements the source-bound named-piece block structure, with exact entity expansion checks, all-seven package coverage, changed-code coverage and one bound CLO pilot; all existing gates remain unchanged.
