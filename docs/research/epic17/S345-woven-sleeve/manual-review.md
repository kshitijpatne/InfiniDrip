# S345 Woven sleeve projection — production review

## Candidate and method

- Production build replayed through the live app in Chromium at the S345 candidate state.
- The 28 supported Woven option records from the S330 matrix were each replayed for FRONT_FLAT and BACK_FLAT (56 requests, current live-draft revision attached to each SVG).
- Full per-face JSON, emitted SVGs, app screenshots and replay summary are retained in `production-replay/`; `replay.mjs` reproduces the run. `default-front-source-annotated.png` and `default-front-component-bounds.json` annotate source-role bounds on the emitted front SVG.
- Output layer order is `GARMENT_SILHOUETTE`, `ARTWORK`, `SEAM`, `CONSTRUCTION`, `DART`, `PLEAT`, `CLOSURE`, `TOPSTITCH`, `CALLOUT`, `ANNOTATION`, `TEXT_LABELS`, `SOURCE_NOTICES`.

## Replay result

- 28/28 front requests emitted an SVG and report no compiler hold issue. They remain **unaccepted candidates**; emitted SVG is not a G04 pass.
- 28/28 back requests were withheld, each with three `COLORWAY_CONTOUR_UNCLOSED` issues for `outerStand`, `underCollar` and `upperCollar`. The eased sleeve-cap closure is no longer reported as the back hold.
- Browser/page/console/request errors: 0.
- No face was accepted from this replay. All seven-recipe acceptance and the V02-before-V03 gate remain unchanged.

## Inspected geometry and unresolved output checks

The default, combined-supported, maximum sleeve-band depth and maximum hem-turn front screenshots were inspected. The default was also rendered directly from its production SVG at higher scale and annotated against emitted source roles. The drawing shows crossing/overlaid strokes around the neckline and collar junction. The upper and under collar emitted role bounds coincide (`x=-4.299..41.268`, `y=-27.548..10.593`); `outerStand` occupies `x=-0.551..41.268`, `y=-23.565..10.593`; the front body occupies `x=-27.5..27.5`, `y=0..70.75`. The `outerStand` fill is tagged to `pattern:woven-shirt:role:outerStand`, and its `STAND BUTTON` callout is tagged to `pattern:woven-shirt:mark:outerStand:stand-button`. These same-revision bounds and visible intersections do not establish a valid collar join or a readable complete flat. Keep every Woven front unaccepted pending a focused collar-placement/overlap and legibility resolution under the already-approved view mapping.

Ten default-front POM notices explicitly say “has no geometry anchor and remains table-only”: Body chest (finished), Body length (HPS–hem), Neck circumference (pattern), Back yoke depth, Finished placket width, Front button spacing, Patch pocket width, Patch pocket height, Finished sleeve band depth and Side vent depth. This fails V02's geometry-anchored POM requirement. Do not infer missing anchors from the screenshot; trace each method to its same-revision source geometry in the next bounded slice.

The approved Woven closure order and shared sleeve-cap seam are represented in the front candidate. That does not clear the collar intersection, table-only POMs, or other V02 checks. Back output remains withheld on the three exact collar contours above. No source pattern, cut geometry or stitch graph was changed. No physical fit, factory acceptance or production-readiness conclusion follows.

## Manual finding checkpoints

- MQF-004: buttons appear in the candidate, but the flat is not accepted; recheck the complete closure depiction at the G04 output exit.
- MQF-005–007: detached-key context, label anchors and annotation collision/readability remain open; the current rendered candidate fails the readable-complete-output check. Review at the G04 output exit.
- MQF-011: artwork behavior is a relevant G04/G05 overlap. No artwork feature was changed or accepted here; retain its G04 review at the applicable output exit.
- MQF-012: keep the scoped existing Woven collar-output defect visible. Do not add unowned collar research/remediation beyond G04; preserve the finding's post-G17 deferral.
- MQF-015: unchanged legacy DXF identity passed its focused regression gate, but G04 V03 CAD-exchange evidence is not produced. Keep **To be reviewed** for the applicable V03 export exit and preserve post-G17 deferrals.

