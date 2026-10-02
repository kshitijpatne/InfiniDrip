# Slice 346 — Woven collar and POM rendered review

## Candidate and scope

Production Chromium replay from the live technical-flat UI covers 28 supported
Woven option configurations and requests both faces at the same current draft
revision per configuration. The default capture is
`live-draft:woven-shirt:14:14`. The matrix, per-face result JSON, SVGs and
screenshots are retained in this directory's `production-replay/`; the earlier
55/56 run and its diagnosis are preserved in `production-replay-initial/`.
The replay reports 56 emitted SVGs, zero compiler issues, and no browser,
console, request, or page errors. These counts establish repeatable rendering,
not visual acceptance.

## Manual outcome: reject every Woven face

No Woven face passes V02 review. The front and back captures show invalid
assembly even though the source-bound entities and SVG contours are emitted.

- **Front collar/stand:** the `outerStand`, `upperCollar`, and `underCollar`
  filled contours are visible as detached pieces. The default overlay
  `production-replay/default-front-collar-source-overlay.png` traces the exact
  emitted contours by source role. `upperCollar` and `underCollar` occupy
  coincident geometry, while their other contour segments are remote from the
  neck opening; the stand/collar strokes cross or meet away from a plausible
  joined neckline. The approved normalized CB-to-CF exterior transfer and
  body-neckline single-stroke convention are present, but this replay does not
  establish a coherent placed collar assembly.
- **Back:** the yoke and neckline entities render, and the base-neckline
  duplicate remains suppressed as approved. Long diagonal strokes cross the
  upper torso and intersect one another well below the yoke. The screenshot
  establishes the visible crossing, but does not alone identify which approved
  reflected role or placement relation causes every stroke; no new semantic
  mapping is inferred from it.
- **Other geometry:** source outlines, mirrored sleeves/bands, pocket,
  plackets, button marks, vent and hems remain revision-bound. The default
  preview contains small labels that are difficult to read at the canvas zoom;
  emitted SVG text remains available at the recorded physical scale. This does
  not cure the invalid collar and crossing back lines.
- **Configuration coverage:** default, minimum and maximum options, the
  combined supported-option case, and all remaining entries in the 28-case
  matrix emitted both faces. In particular, the zero-depth vent endpoint
  emitted safely after its source edge was treated as collapsed/table-only.
  Visual inspection of the default, combined case, vent minimum, sleeve-band
  maximum and hem maximum did not reveal a configuration that clears the
  assembly defect. The complete matrix remains available for per-option
  follow-up.

The accepted-face tally is unchanged at 56/146 overall. Although this replay
now produces 56/56 Woven SVG candidates, all of those candidates remain
unaccepted and held from the accepted tally. Do not treat `issueCount: 0` as a
manual acceptance result.

## POM review

Same-revision source edge/mark references now anchor the front measures whose
geometry appears on that face: body chest to `front.sideUpper`, finished
placket width to `buttonPlacket.top`, front button spacing to the
`buttonPlacket.button-1` mark, pocket width/height to `pocket.top` and
`pocket.sideRight`, finished sleeve-band depth to `sleeveBand.sideRight`, and
side-vent depth to `front.vent` when that edge has positive length. The back
yoke-depth callout targets `back.yokeSeam` on the back face. These are source
edge/mark references transformed with their exact assembled role and current
revision; they do not add or move a physical pattern feature.

Body length and neck circumference still name edges not represented on these
exterior faces and remain table-only; back yoke depth is front-table-only.
Front-only measures stay table-only on the back. The minimum vent option
collapses `front.vent` to zero length, so its 0 cm value remains in the
measurement table without a fabricated visible leader. POM values,
measurement formulas, tolerances and option inputs are unchanged.

## Review checkpoints and decision

MQF-004–007, MQF-011, MQF-012 and MQF-015 were reviewed as applicable output
checks. None changes status: they remain **To be reviewed** until its applicable
complete-output criterion passes; the findings document's post-G17 deferrals
remain intact. G04 V02's all-seven requirement is still unmet; V03 remains
gated. The next slice must diagnose exact Woven collar/role placement and the
crossing back strokes from source transforms and emitted entities, then
propose only a source-supported or already-approved view correction. Preserve
all Woven holds until that correction passes the entire 28-option matrix and
manual output review.
