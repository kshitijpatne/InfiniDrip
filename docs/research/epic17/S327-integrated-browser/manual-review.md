# S327 integrated G04 regression review

Fresh production Chromium replay covers all 73 existing option configurations,
146 requested faces and 32 recipe option fields. It reports 52 accepted and 94
held faces, with zero console, page or request errors. Compared with S326's
28/146 accepted, the 24 Trouser front faces are the only status change. The
previously accepted Trouser backs, Tank faces and Skirt faces remain accepted;
no previously accepted face regressed.

The accepted default Skirt front and back rasters were manually inspected; the
waistband/body joins and same-revision waist/hip callouts remain clear, with no
new crossings. The default Tank front/back SVGs are retained and pass parsing,
revision, label-bound and zero-overlap checks; this runner did not emit Tank
PNG screenshots. Trouser raster and source-edge review is recorded in
`../S327-trouser-browser/manual-review.md`.

The 94 existing holds remain: Tee 2 (sleeve color contours), Fitted 2 (sleeve
color contours), Polo 34 (outer-stand color contours), and Woven 56 (28 front
color contours and 28 back sleeve-cap placement conflicts). No partial output
was accepted for a held face. G04 V02 remains In Progress, all-seven acceptance
is unmet, and V03 remains gated. No physical-fit, factory-acceptance or CAD
compatibility claim is made.
