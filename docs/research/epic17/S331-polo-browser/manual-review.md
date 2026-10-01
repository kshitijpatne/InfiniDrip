# S331 Polo rendered review

## Evidence and scope

The initial SVG/PNG captures in `S331-polo-browser/` were diagnostic renders produced before complete-face hold enforcement. Their matrix reported 34 rendered faces; they are retained to show the crossing that triggered the hold and are not accepted output. After adding the Polo sleeve hold, rebuilt production Chromium replayed all 17 Polo configurations and both `FRONT_FLAT` and `BACK_FLAT` requests (34 total). Current complete-face evidence is in `S331-polo-browser-final/`.

The final configuration matrix records 17 cases / 34 held face requests across all 8 option fields, with 0 accepted, 34 withheld, zero console/page/request errors, and no SVG for any held request. All 34 PNGs show the explicit full-face hold and no partial flat. The current view revisions are included in each replay case. Label-overlap checks do not apply to held views and are not used to accept a face.

## Colorway closure result

Every emitted SVG contains exactly one fill for each of `outerStand`, `upperCollar`, and `underCollar`, and exactly three `G04-S321-COLLAR-EXTERIOR-ARCLENGTH` closure sources. All SVG entities use that face's current `live-draft:polo:<revision>:<revision>` value. The fill closure is colorway-only: it appears in the `GARMENT_SILHOUETTE` color-area paths with `stroke="none"`; it creates no visible partition/stitch stroke and does not edit any pattern source edge or stitch relation. This confirms the narrow S331 closure behavior on all option configurations.

## Complete-face blocker

**Observed in the production images:** the Polo sleeve role is placed across the bodice instead of forming a readable sleeve exterior. On the default front SVG its outline starts at `(22.3838, 3.535) cm`, follows the cap to approximately `(27.6162, 24.465) cm`, then continues down to `(29.3217, 45.9716) cm` and across to `(7.1259, 46.5606) cm` and `(1.156, 10.0453) cm`. The body silhouette occupies the same interior region (approximately `x=0..27.5 cm`, `y=24..70 cm`); the sleeve path visibly crosses and covers the bodice. The back capture also shows sleeve/collar line overlap at the shoulder. These are rendered geometry findings, not inferred garment construction rules.

**Disposition:** retain all 34 Polo faces as held. Do not count the pre-hold option-matrix `accepted` field as face acceptance: that field established that the renderer emitted an SVG without a compiler/browser blocker, and its overlap check is label-box-only. It did not detect this visible component crossing. The Polo role map now records a complete-face hold for `sleeve` until exact source-topology and rendered view checks pass. Current production replay confirms no partial Polo flat is emitted.

## Other observations

- The visible outer stand/collar closure does not add a partition stroke. No collar closure-specific crossing or malformed fill was found in the fills inspected at default and extreme options.
- The renderer still reports the pre-existing 0.48 cm `Sleeve-cap ease` residual in the default output. This is a separate assembly-quality finding and remains visible; it is not resolved by colorway closure.
- On held output, the UI correctly reports the sleeve blocker and a dependent `POM callouts need the mapped role outline in the same face and revision` hold. Several Polo POMs remain explicitly table-only in the diagnostic output; they are not accepted as geometry-anchored.
- Nothing in this digital review establishes sewn fit, factory acceptance, or CAD compatibility.

## Next gate

Investigate Polo sleeve source edges, exact `Sleeve-cap ease` interface order, placement transform, multiplicity and front/back view mapping. Keep all affected Polo faces completely held until source-backed mapping and a rebuilt production replay show a continuous sleeve-cap/armhole join, no body-interior crossing or misleading overlap, and readable anchored callouts. Only then run the full 73-configuration integrated replay.
