# S319 production output review

## Replay result

The production Chromium replay used the S318 build through the live app UI.
It covered all seven recipes, 73 configurations, 146 requested faces and all
32 recipe-scoped option fields. The replay reports zero console, page or
remote-request errors. The exact S315 per-face reconciliation is unchanged:
28 assembled views accepted and 118 held, with no gained, lost or
status-changed face.

Accepted output remains two Tank faces, two Skirt faces and 24 Trouser backs.
The matrix retains the exact existing blocker counts: Tee sleeve contour and
instance (one front and one back); Fitted sleeve contour and instance (one
front and one back); Polo outer-stand contour (17 front and 17 back); Woven
front/source assembly plus sleeve-cap stitch conflict (28 configurations for
each blocker); and Trouser front-waistband center-front join (24). These are
complete visible holds with no partial flat output.

## Raster and visual inspection

All 28 emitted SVGs contain colorway areas. The raster harness inspected 78
fill regions; every region uses its one source/revision and the shared 0.16
opacity, with no double-dark overlap. Maximum summed RGB sample error against
the expected tint is 4. Retained raster files and per-fill measurements are in
`raster-review.json` and the matching `*-raster.png` files.

I manually inspected the accepted defaults and representative option states:

- `tank-default-front-raster.png` and `tank-default-back-raster.png`;
- `skirt-default-front-raster.png` and `skirt-default-back-raster.png`;
- `trouser-default-back-raster.png` and
  `trouser-backRiseEase-max-back-raster.png`;
- `trouser-default-front.png` and `trouser-legOpening-max-front.png` as held
  front examples.

The Tank and Skirt tints are visibly uniform beneath the independently drawn
construction strokes; labels, POM leaders and notices remain visible. The
Trouser back tint follows the rendered component regions and remains visible
at the back-rise extreme. Held examples show full guidance and no misleading
partial face.

I also inspected default visible holds and held option extremes:

- `tee-default-front.png`, `fitted-default-front.png`,
  `polo-default-front.png` and `woven-shirt-default-front.png`;
- `woven-shirt-buttonCount-min-front.png` and
  `polo-backHemDrop-max-back.png`.

The guidance identifies why those views remain held; no unresolved outline is
presented as an assembled flat. The Woven placket remains held as explicitly
directed by the maintainer because no construction reference is available.

## Finding and scope checkpoint

MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed` for the applicable
implementation checkpoints; MQF-015 remains `To be reviewed` for V03. The
findings remain review checks, not added remediation scope, and all documented
post-G17 deferrals remain in force.

This replay establishes regression stability and visible colorway rendering
for source-complete views. It does not complete V02: 118 requested faces remain
held, so supported recipe/option flats are still incomplete. V03 remains
gated. No CAD exchange, fit, factory acceptance or production-readiness claim
is made.
