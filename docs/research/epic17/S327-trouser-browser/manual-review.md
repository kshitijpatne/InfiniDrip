# S327 Trouser production output review

The final strict Chromium replay was generated from a fresh `npm run build` and
covers 24 option configurations, 48 front/back faces and all 11 Trouser option
fields. Its matrix reports 48 SVGs, no holds, no parser or revision mismatches,
zero measured label/stroke/artwork/leader overlaps, every label within its
viewBox, and no console, page or request errors.

## Source and join review

- The two front waistband top fragments terminate at the verified center-front
  join. Their outer endpoints close through the corresponding source-derived
  `frontLeft` and `frontRight` waist stitch boundaries. The center-front join is
  not drawn twice.
- The colorway path uses both exact same-revision waist subpaths and ends in a
  closed `Z`; independent outline strokes remain visible. Its accepted output
  does not imply an extra physical seam or change the pattern.
- Every front carries both boundary source IDs from the four-leg/waistband
  stitch. The matrix contains no topology or color-contour issue in all 24
  fronts.
- The `Seat / hip` and `Hip depth` callouts retain their common `frontLeft`
  outline anchor at the current `sideUpper` vertex. Each label is measured at a
  distinct non-overlapping position; its leader endpoint moves with the label.
  Hip-depth text, value and ±0.5 cm tolerance remain unchanged. All 24
  configuration matrices resolve same-revision geometry targets.

## Raster review

Manually inspected `trouser-default-front.png`, `trouser-default-back.png`,
`trouser-waistbandDepth-max-front.png`,
`trouser-combined-supported-front.png` and
`trouser-combined-supported-back.png`. The front waistband closes at both outer
edges and center, without crossings or duplicated center strokes. Front panels
remain upright; the fly and crotch contours remain separate; max-depth
waistband and changed-option back outputs retain their valid joins. Callout
leaders reach their represented edges and labels are separated. Matrix bounds
and overlap evidence covers the other 43 faces. This is digital output review,
not a fit or factory check.

## First replay diagnosis

An initial replay before rebuilding `dist` served the prior production bundle
and left 24 fronts held by the old color-contour failure. It is not acceptance
evidence. The bundle was rebuilt and both the strict Trouser replay and the
integrated replay were rerun; their matrices are the final evidence. S326 keeps
the earlier blocked screenshots and diagnostics.

## Related manual-quality findings

Reviewed the G04-mapped MQF-004–007, MQF-011, MQF-012 and MQF-015 entries. This
Trouser output directly checks exact annotation anchors and collision-free
labels (MQF-005–007). MQF-004's Woven buttons, MQF-011's broader artwork
interaction, MQF-012's held Polo collar and MQF-015's CAD/export review are
still `To be reviewed` at their applicable exits. Post-G17 deferrals remain in
force; this review adds no out-of-scope remediation.
