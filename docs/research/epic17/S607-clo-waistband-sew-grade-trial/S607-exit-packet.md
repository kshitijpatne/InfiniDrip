# EPIC-17 / G04 V03 — CLO waistband SEW-grade trial — Slice 607 exit

## Verified result

- Closed 2026-10-09 10:55 UTC. Started 10:50:18 UTC from S606 `b00abc87`
  on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  is an ancestor. S606 was highest; S607 is unique. Start board revision
  3558; validated start replay advanced it to 3560.
- Used the existing CLO 2026.1.310 (r58944) window and the S565
  corrected-sizegroup1 disposable project. The current workspace shows
  `Size Group 1` with XS/S/M/L/XL and Edit Grading. The rightmost upper
  waistband vertex is highlighted on the outer silhouette; its grading
  property shows 20.0 mm X offset for XS→S, S→M, M→L and L→XL, with 0.0 mm Y.
  Its displayed position agrees with the source CUT outline corner, not the
  inset SEW corner.
- S606's mapped SEW endpoint is source `(102.0,70.5) cm` after cm-to-mm
  conversion `(1020,705) mm`, shown at the inset contour near screen `(875,293)`.
  With Edit Grading active, a click at that mapped endpoint did not move the
  highlighted outer CUT point or change the CUT point's grading table. The
  internal dashed sew contour remained rendered, but its grading point did
  not become selected. A second click after explicitly activating Edit
  Grading gave the same result. This is direct evidence that this current
  view/action did not provide unambiguous selection of the mapped SEW point;
  it does not establish that every CLO grading workflow fails.
- No grade value, path, garment geometry, project file, source code or DXF was
  changed, saved, imported or exported. S607 therefore fails its selection
  precondition and stops before exchange. This leaves the grading and all
  other V03 gates held.

## Evidence and limits

All S607 desktop evidence is stored only under
`C:\G04-CLO-DXF-Exchange\S607-clo-waistband-sew-grade-trial\Evidence\`:

- `s607-edit-grading-sew-point-not-selected.jpg` — SHA-256
  `9b5a1772beeabc3895c64944e067c454edf912ec9f84fe8f13fc81fa2b0e1488`.
- `s607-edit-grading-accessibility.txt` — SHA-256
  `038c528f4aa5b4bffbd9effc795db86849b2c73e1ca0a51e0a1472f8635140dd`.

The screenshot shows the active tool, five-size group, outer piece highlight,
inset dashed line and grading panel. The accessibility capture records the
visible `Edit Grading` control and the grading table's repeated 20.0 mm X
offsets. Neither capture claims a successful SEW-point selection. No
grade/round-trip or format compatibility conclusion is drawn from this
fail-closed selection result.

## Gate disposition and next action

Keep G04-V02 Done and G04-V03/EPIC-17 In Progress. Preserve all-seven recipe
acceptance, `0.001 cm` contour threshold, rights/profile evidence, CUT/SEW
semantics, marks, options, malformed-input handling, repeated round trips,
legacy DXF behavior and protected export identities. Do not claim industrial
ASTM/AAMA conformance, physical fit, factory acceptance or production
readiness.

Next: audit the current durable V03 matrix and select one untested, directly
measurable profile/round-trip question. Do not repeat S563–S566's waistband
size-group route, S531's malformed case, S532's synthetic AAMA fixture,
S595's Polo AAMA SPLINE route, or S606's geometry query. Keep CLO running
while G04 testing remains active. If the remaining admitted gates have no
tested receiver path that can satisfy them, record the precise failed evidence
and prepare an explicit closure recommendation without weakening criteria.

## Focused verification and timing

S607 start preflight and validated board start replay pass; canonical board
stays schema-valid, G04-V02 Done, and G04-V03/EPIC-17 In Progress. The
Control Center focused suite passed 42/42 at start; rerun it with exit replay.
`git diff --check` passes. No production source/tests changed; changed-code
coverage is not applicable. Full repository coverage/build remains for the
settled Epic/PR candidate.

- Implementation/UI investigation and evidence capture: 2 minutes.
- Focused verification and durable closeout: 2 minutes.
- External-agent waits: 0 minutes.
- Maintainer-decision time: 0 minutes.
