# G04 V02 — Woven placement diagnosis — Slice 336

## Start boundary

- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, evidence-backed V03, final integrated output review, required gates, and safe merge to `origin/main`.
- **Slice start:** 2026-10-01 16:20:05 UTC.
- **Verified Git:** clean branch `codex/epic-17-g04`, HEAD `32bff6d165ae23ae87d6d89d2110f55aad69375b` (`Slice 335: close Woven front colorway contours`); refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Active history highest is 335; reserve 336.
- **Verified board:** revision 1116; EPIC-17/G04-V02 In Progress, G04-V01 Done and G04-V03 Backlog. Baseline remains 56 accepted / 90 held across 73 configurations / 146 faces / 32 option fields. All Woven (56) and Polo (34) faces remain held. S335 exit evidence is linked; commit evidence will be added through the command layer.
- **Usage:** primary 16%, weekly 7% informational, ordinary usage allowed.

## Scope and acceptance

Diagnose the exact source and generated-instance correspondences behind Woven's residual-bearing `Woven sleeve-cap ease`, `Outer stand ↔ woven neckline`, and back sleeve transform holds across the 28 supported configurations. Trace piece/edge identity, source stitches, raw/transformed endpoints, transforms, fold instances, reflection, and source-order traversal against S334/S335 matrices and production assembly/compiler code. Distinguish direct source facts from compiler behavior and proposed conventions. Preserve S335's revision-bound colorway closures.

Change implementation only when a correction is uniquely determined by source-encoded geometry/stitches and already approved view decisions. Do not change cut geometry, source stitch graph, option values, solver thresholds, or assembly topology to make output pass. If a remaining correction would choose physical placement/overlap semantics, hold affected faces and prepare a concrete decision request with piece/edge coordinates and rendered/annotated evidence. No face is releasable until all exact joins satisfy the existing 0.25 cm threshold and full configurations pass production rendering for joins, crossings, overlap, POM anchoring and readability.

For any production change: focused tests and 100% statement/branch/function/line coverage on changed modules; production build; protected byte-identity and legacy-DXF regression; 28-configuration/56-face production Chromium replay and manually inspected front/back rendered outputs; Control Center tests; `git diff --check`. Retain diagnosis scripts/matrices and exact verification. Do not run the full repository/global coverage gate until the settled integrated Epic/PR candidate. Do not rerun unaffected full gates.

## Dependencies, holds, and non-goals

- Preserve V02 all-seven-recipe acceptance and keep V03 gated. Do not lower the 56/90 accepted/held integrated baseline until a complete face independently passes all applicable criteria.
- S321 maintainer approvals cover view-only sleeve/collar transfers and Woven right-button-over-left-buttonhole closure. S325/S326 approve and implement the exact Trouser underlap repair; do not reopen those decisions.
- Preserve S335 fill-only closures and its 0.25 cm fail-closed assembly holds. No physical seam/notch, fabric join, fit, factory acceptance, production readiness, or CAD compatibility claim.
- No G05 tech-pack expansion, G09/D04 assembled views, new recipe, UI redesign, sampling, supplier contact, launch cost or hosted service.
- No independent low-risk task has disjoint ownership from the assembly/replay investigation; Codex retains implementation and integrated review. Do not use OpenCode without exact Muse Spark 1.3 xhigh normal mode.

## Exit record

### Findings and evidence classes

- **Directly encoded in the pattern source:** across the current 28 Woven option configurations, the `Woven sleeve-cap ease` stitch pairs `sleeve.capLeft` and `sleeve.capRight` to `front.armhole`, `yoke.armholeUpper`, and `back.armholeLower`; its allowed aggregate ease is -1 to +4 cm. The default combined cap length is 46.1014 cm and the body chain is 44.6014 cm (1.5 cm ease). The two cap edges are each about 23.05 cm. The source order around the neck joins `outerStand.neckline` from CF to CB to `front.neckline` then `yoke.neckline`; the front curve runs CF→shoulder and the yoke curve CB→shoulder. The default stand edge length (25.7772 cm) equals the sum of the front (14.5371 cm) and yoke (11.2401 cm) neckline lengths. Woven declares a yoke. The pattern does not encode how to nonrigidly deform cap or stand contours in an assembled view.
- **Source-backed compiler correction:** S336 now reverses `yoke.neckline` traversal (or `back.neckline` only when the yoke role is absent) to continue the authored CF-to-CB stand stitch sequence on the back face. It validates the exact stitch, role/edge names, stand front-end/fold junctions, body center and shoulder endpoints, and permitted reversal metadata. This is a view correspondence correction; authored edges and stitch graph remain unchanged. The no-yoke test fixture validates the fallback.
- **Maintainer-approved view conventions:** S321's sleeve/band normalized-arclength transfer, two mirrored sleeve/band instances, yoke on the back-facing seam layer, collar exterior station transfer, and closure A (right button placket over left buttonhole placket) remain in force. These are view decisions, not source facts. Their approval is conditional and does not pass a face.
- **Sourced reference boundary:** the pattern-specific and general collar/cap sources already reviewed in S320 and S296 describe construction principles but do not specify a nonrigid assembled-view deformation for this authored Woven pattern. No additional broad construction-reference search was run; no unchecked pattern-specific reference identified in current context addresses that missing view-deformation rule.

### Exact output observations

The diagnostic matrix covers all 28 supported Woven option configurations, with revision identifiers and current source edges/transforms in `S336-woven-placement/source-assembly-matrix.json`. After the source-order correction and exact underarm endpoint anchors, transformed default source stations show:

| View correspondence | Default | 28-case range | Status |
|---|---:|---:|---|
| `sleeve.capLeft.start` ↔ `front.armhole.end` underarm | 0.000 cm | 0–<0.000001 cm | Exact within floating-point precision |
| `sleeve.capLeft.end` ↔ `front.armhole.start` shoulder | 0.661 cm | 0.661–0.661 cm | Above 0.25 cm gate |
| `sleeve.capRight.start` ↔ `yoke.armholeUpper.start` shoulder | 1.738 cm | 0.830–2.064 cm | Above 0.25 cm gate |
| `sleeve.capRight.end` ↔ `back.armholeLower.end` underarm | 0.000 cm | 0–<0.000001 cm | Exact within floating-point precision |
| `outerStand.neckline` start ↔ `front.neckline` start (CF) | 0.705 cm | 0.688–0.740 cm | Above 0.25 cm gate |
| stand normalized shoulder station ↔ front shoulder | 0.705 cm | 0.688–0.740 cm | Above 0.25 cm gate |
| reversed stand shoulder station ↔ `yoke.neckline` end | 0.269 cm | 0.263–0.283 cm | Above 0.25 cm gate |
| reversed stand CB ↔ `yoke.neckline` start | 0.269 cm | 0.263–0.283 cm | Above 0.25 cm gate |

`front-sleeve.png` and `back-sleeve.png` annotate the default transformed authored cap and armhole curves; `front-collar.png` and `back-collar.png` annotate the straight stand seam edge against the source front/yoke neckline curves. Orange is sleeve cap, blue is body/yoke, and purple is outer-stand base. Red endpoint segments and labels show exact gaps. The production UI replay in `S336-woven-placement/production-replay/` covers 28 configurations / 56 face requests, all 32 Woven option fields, and reports zero browser/page/request errors. It emits 0 SVGs and holds all 56 faces. Default front reports 0.71 cm collar and 0.47 cm cap assembly residuals; default back reports a sleeve-transform conflict, 0.39 cm cap residual and 0.27 cm collar residual. The retained front/back screenshots show complete, readable issue guidance with no partial pattern or misleading geometry. A sleeve-band depth extreme was also manually inspected; it remains held with the same source conflict classes.

The source overlay is a diagnostic of rigid placement, not a proposed production drawing. No source geometry, stitch graph, options, resolver tolerance, closure order, pattern revision, legacy DXF behavior, or protected export identity changed. Board baseline remains 56 accepted / 90 held over 73 configurations / 146 faces / 32 option fields; Woven remains 0/56 emitted and Polo 0/34 emitted.

### Decision request for next slice

The remaining choices cannot be derived from the pattern or the already-reviewed references. No nonrigid rule has been implemented. Each proposal below keeps cut geometry, authored measurements and stitch topology unchanged; it would alter only assembled-flat depiction. Recommendation for both is **keep the affected Woven flats held** unless the maintainer explicitly wants the view-only approximation.

1. **Sleeve cap:** `sleeve.capLeft` to `front.armhole` and `sleeve.capRight` across `yoke.armholeUpper`/`back.armholeLower`; front and back orthographic views, with two mirrored sleeve/band instances and the yoke behind the back-facing cap seam as already approved. Proposed optional convention: use the source stitch-chain stations as fixed landmarks and apply a smooth view-only displacement to the displayed cap curve so the shoulder stations meet the body chain while both exact underarm endpoints stay anchored; retain the cap's source role identity and current layer order (`GARMENT_SILHOUETTE`, then `SEAM`, then construction/details and labels). This addresses the 0.661 cm front and 0.830–2.064 cm back cap-shoulder gaps and may resolve the 0.39 cm+ production cap residual. It would change the apparent cap contour in the flat, with the easing distribution unspecified by source and no physical sample to validate the approximation. **Choice:** keep all affected faces held (recommended), or approve this explicitly view-only eased registration and require the same 28-case join/crossing/overlap/readability replay before acceptance.
2. **Stand base seam:** `outerStand.neckline` (source straight line CF→CB) against `front.neckline` (CF→shoulder) in FRONT and reversed `yoke.neckline` (shoulder→CB) in BACK, one visible stitched contour per face at the source-normalized shoulder station. Proposed optional convention: draw the assembled base seam once on the body neckline curves and suppress the duplicate straight stand-base stroke; keep the stand exterior edge and source/cut piece geometry unchanged, preserve body silhouette before seam and existing subsequent closure/topstitch/callout/annotation layers. This resolves the 0.688–0.740 cm front and 0.263–0.283 cm back endpoint residual by displaying the source-authored body seam path; the visible stand base follows the curved neckline rather than its straight flat-cut edge, and that depiction convention is not in the source or reviewed reference. **Choice:** keep the Woven flats held (recommended), or approve this exact one-stroke assembled seam convention, subject to full option-matrix output checks.

These choices do not waive the existing 0.25 cm gate for any other stitch, the all-seven-recipe V02 criterion, or any crossing/overlap/POM/readability check. Keep Polo's 34 faces and the other unresolved recipe faces held. Woven closure A remains approved. V02 remains In Progress; V03 remains Backlog. MQF-004–007, MQF-011, MQF-012 and MQF-015 remain review checks at the applicable output exit; post-G17 deferrals are unchanged.

### Verification and boundary

- Focused renderer suites: 117/117 pass. Both modified production modules pass 100% statement, branch, function and line coverage. `npm run build` passes (existing large-chunk advisory only).
- Protected regressions: export identity, legacy export regression and tech-pack surface suites pass 24/24; no export baseline changed.
- Production rendered output: 28/28 Woven configurations and 56/56 face requests replayed; 0 SVGs emitted, 56 visible complete holds, zero browser errors. Default front/back and sleeve-band-depth extreme screenshots manually inspected. Four annotated source overlays manually inspected and corrected for label clipping/overlap before retention.
- `node --check` passes on the S336 replay/overlay scripts; `git diff --check` passes. Canonical Control Center board validates at revision 1159; the full Control Center suite passes 33/33 after all S336 evidence and description updates.
- No full repository/global coverage gate at this slice; it remains for the settled integrated Epic/PR candidate. No Electron/full build beyond applicable production build/replay at the Epic boundary.
- **Elapsed:** 51m (2026-10-01 16:20:05–17:11 UTC). Implementation and source-order correction: 9m; focused test/coverage/build/protected regressions: 5m; 28-case diagnosis and overlay generation/refinement: 8m; production Chromium replay and wait: 14m; rendered manual review: 3m; durable records and validated board closeout: 12m; external-agent waits: 0m; maintainer-decision time: pending.
- **Next action:** keep both nonrigid mappings unimplemented until the maintainer decides. Meanwhile, start a separately bounded diagnosis of remaining non-Woven V02 holds from exact pattern/topology and production output. Do not start V03 while V02 acceptance remains unmet. Record S336's landed commit evidence through the validated command layer at S337 start.
