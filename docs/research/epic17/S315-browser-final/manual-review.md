# Slice 315 production-output review

- Browser matrix: `matrix.json` (Chromium production-preview UI, 1440 × 3000); 73 configurations, 146 requested faces, 32 recipe-scoped option fields.
- Default accepted output reviewed at rendered size: Tank front/back, Skirt front/back, and Trouser back. The Tank review PNGs were rasterized by Chromium from the exact Tank SVGs captured from the production UI; `render-output-review.mjs` records that step. The Skirt and Trouser PNGs were captured by the matrix run.
- Default held output reviewed at the live UI: Tee front/back, Fitted front/back, Polo front/back, Woven front/back, and Trouser front. Representative changed-option output reviewed: Woven button-count minimum, Trouser back-rise minimum/maximum, and Trouser waistband-depth maximum.
- Accepted output retained closed source outlines and source-linked marks/callouts. The 24 Trouser backs now each show the two expected callouts on one revision: back-rise to the back-left outline and waistband depth to the authored waistband center-back mark. Their labels remain within the view, do not collide, and leader endpoints meet their labels. Tank and Skirt body-POM leaders resolve to their source geometry; all accepted label/notice bounds and non-overlap checks passed in the matrix.
- Held output shows the complete-face hold message and its source/assembly issue without emitting a partial SVG. Tee/Fitted sleeve contour mapping, Polo outer-collar/stand split, Woven sleeve/collar/front-instance evidence, and Trouser front waistband joins remain unresolved. The Woven placket instance/overlap order remains held per maintainer instruction; no generic seam convention was substituted.
- Reconciliation against S298's full matrix: 24 Trouser `BACK_FLAT` requests transitioned from held to accepted following S305–S311 source-mapped waistband placement and back POM work. No face transitioned from accepted to held. The current S314 handoff tally of 28 accepted / 118 held is confirmed; S315 adds no acceptance.

## Mapped manual-quality findings

MQF-004, MQF-005, MQF-006, MQF-007, MQF-011 and MQF-012 remain **To be reviewed** with partial G04 coverage as defined by the findings register; this replay does not resolve their retained post-G17 work or make an external technical-design claim. MQF-015 remains **To be reviewed** and not applicable until the V03 CAD import/round-trip exit. No finding expands this slice.

The images and matrix are internal digital review evidence only. They do not establish physical fit, factory acceptance, or CAD interoperability.
