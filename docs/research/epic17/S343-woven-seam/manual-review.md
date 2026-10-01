# S343 production output review

## Scope and method

Reviewed the rebuilt production Vite preview in Chromium through the live app UI. The replay uses the 28 canonical Woven-shirt option configurations in `S330-integrated-browser/matrix.json`, checks both `FRONT_FLAT` and `BACK_FLAT`, saves the hold screen, issue payload and browser status per face, and writes the consolidated `production-replay/matrix.json`.

## Results

- Coverage: 28 configurations / 56 face requests; 0 SVGs emitted and 56 faces held. This matches the fail-closed acceptance rule while independent Woven joins remain invalid.
- Browser errors: 0 page errors, console errors, or failed requests.
- The prior `Outer stand ↔ woven neckline` endpoint residual is absent from every face's production guidance. No face is accepted on the basis of the display-only suppression.
- Every front request retains the source `Woven sleeve-cap ease` hold at 0.47 cm (28/28). Every back request reports a solved-placement conflict (28/28); 26 back requests also report a 0.39 cm residual, `woven-shirt-yokeDepth-min` reports the conflict without a numeric residual, and `woven-shirt-yokeDepth-max` reports a 0.73 cm residual. The 0.25 cm acceptance threshold is unchanged.
- Output screenshots `production-replay/woven-shirt-default-front_flat.png` and `production-replay/woven-shirt-yokeDepth-max-back_flat.png` were inspected. The default front shows a readable, explicit technical-flat hold and actionable 0.47 cm Woven sleeve-cap guidance; the yoke-depth maximum back also stays fully withheld and clearly reports its exceptional 0.73 cm residual and solver conflict. There is no partial face in either representative. The other 54 saved screenshots and issue payloads were checked through the consolidated issue/status matrix for matching fail-closed behavior and the absence of the removed collar-base warning.
- The changed geometry test verifies the exact source body neckline seam is emitted once on the `SEAM` layer, while the duplicate stand-base line is omitted from the visible role outlines and retained only as a hidden colorway-fill boundary. Assembly tests verify that only the exact approved collar-base residual is exempted and that unrelated sleeve residuals continue to block. The production replay therefore confirms that the exception does not release any Woven face.

## Decision boundary

S343 resolves only the approved Woven base-seam display conflict. Woven remains 0/56 accepted due to sleeve-cap joins/solver conflicts. This output review does not pass Woven topology, crossing, overlap, closure/colorway, POM, or readability gates beyond the observed held-state behavior. No physical-fit, factory-acceptance, CAD compatibility, or production-readiness claim is made. V02 and V03 remain open/gated.

## Mapped manual findings

Reviewed the durable register `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md` against S343's actual held output. Its applicable G04 statuses remain **To be reviewed**; this partial output slice does not complete those reviews:

- MQF-004: retained as **To be reviewed** for the accepted V02 construction/closure views. This slice proves fail-closed behavior only; it does not assess button depiction in an accepted flat.
- MQF-005–007: retained as **To be reviewed** for construction-key context, semantic geometry anchors, annotation legibility and collisions across accepted recipe output. No partial flat was emitted here, so the held warning cannot satisfy those checks.
- MQF-011: retained as **To be reviewed** where G04 artwork views apply. The incomplete overlap remains outside this view-only fix; broader selection/placement and fabric-response questions stay deferred as the register directs.
- MQF-012: retained as **To be reviewed** at the Polo/G04 and G05 collar exits. S343 is Woven-only and does not re-diagnose the Polo finding; any uncovered research/remediation scope remains deferred until the prescribed post-G17 discussion.
- MQF-015: remains **To be reviewed** at V03's applicable CAD/export contract exit. S343 makes no CAD or export-compatibility claim and runs no standards comparison.

No new work item or unscoped corrective slice is created from these review findings. G09/D04 assembled views and the post-G17 deferrals remain unchanged.
