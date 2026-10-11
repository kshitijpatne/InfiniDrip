# Slice 341 — integrated output review

The production-built app was exercised through its UI for all 73 canonical supported option configurations, 146 front/back face requests, and 32 option fields. The replay emitted 56 SVG faces and withheld 90. It recorded no console, page, or request errors. Exact request/result data, screenshots and emitted SVGs are in `production-replay/`; normalized per-recipe counts and every distinct issue identity are in `hold-inventory.json`.

## Reconciliation

The emitted/held result for each case/face matches the 56 accepted / 90 held status in the last integrated matrix (`S330-integrated-browser/matrix.json`): zero acceptance-status changes, regressions, or newly released faces. The historical S330 hold text is stale because later numbered slices changed mapping and validation behavior. This refresh preserves S330 as the comparison source and records current issue text and identities from the actual S340 production build; it does not copy old blockers forward.

| Recipe | Configurations | Accepted | Held | Current hold family |
|---|---:|---:|---:|---|
| Tee | 1 | 2 | 0 | Both default faces emit. |
| Fitted | 1 | 2 | 0 | Both default faces emit. |
| Tank | 1 | 2 | 0 | Both default faces emit. |
| Polo | 17 | 0 | 34 | All 17 front faces have label-position failures for `Finished collar stand height` and `Stand front rise`; all 17 backs have a label-position failure for `Sleeve bicep width`. Both faces also report the source sleeve-cap endpoint residual of 0.68 cm, above the 0.25 cm gate. |
| Woven shirt | 28 | 0 | 56 | Every front has residuals on `Outer stand ↔ woven neckline` (0.69–0.74 cm) and `Woven sleeve-cap ease` (0.47 cm). Every back has the collar join residual (0.26–0.28 cm) and sleeve-cap placement/residual issues; reported sleeve-cap endpoint residuals range 0.39–0.73 cm, with the solver also reporting a conflicting sewn placement in affected configurations. All remain above 0.25 cm or otherwise unsolved. |
| Skirt | 1 | 2 | 0 | Both default faces emit. |
| Trouser | 24 | 48 | 0 | All front/back option-matrix faces emit, including the approved fly-underlap source role. |

The inventory groups hold occurrences by recipe, face, stage and full source issue identity. Its machine-readable case rows preserve each case's exact option values and issue text, including per-option residuals.

## Visual review

- Tee default front and Trouser default front production screenshots show emitted vectors and callouts. The accepted Tee sleeve halves remain outside the torso contour with no visible partition stroke; the Trouser front retains upright panels and the approved underlap. These outputs match their already accepted status; S341 accepts no new output.
- Polo default front screenshot is a complete hold state with explicit POM-label and sleeve-cap reasons and no partial SVG. Woven default front/back screenshots are also complete hold states with the current collar/sleeve join residuals; no partial SVG leaks through. Similar selectors and holds were confirmed throughout all 73 cases.
- S340's two Polo dimension annotations do not appear as live production SVG while Polo remains held. Their source mapping and diagnostic-only render are separately recorded in the S340 packet and diagnostic folder; they do not release or replace the complete-face hold.
- This is a digital output review only. It does not establish physical fit, sewn sample behavior, factory acceptance, or CAD interoperability.

## Next target from current evidence

The largest single recipe hold family is Woven shirt: 56 faces. Its front and back are blocked before a complete view can be accepted by the approved assembly checks for the outer-stand-to-neckline and sleeve-cap interfaces. The next bounded work should inspect those exact current Woven pieces, stitches, transforms and endpoint residuals separately, beginning with the narrower collar join to determine whether the approved view station/role placement can resolve it without changing source geometry. Keep all 56 Woven holds until every applicable join is at or under 0.25 cm and sleeve/band/collar topology, closure layer order, POMs, overlap and readability also pass. Do not infer a source stitch or change cut geometry from this replay alone.
