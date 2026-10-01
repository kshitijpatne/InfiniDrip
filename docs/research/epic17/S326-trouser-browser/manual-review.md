# S326 Trouser production output review

- Production Chromium replay: 24 configurations / 48 front-back faces / 11 option fields. Source matrix: `matrix.json`.
- 24 back views emitted and passed parsed-SVG, same-revision, callout target/leader, label overlap, view-bound and notice-bound checks. Zero browser console, page or remote-request errors.
- 24 front views are completely held. Each reports `COLORWAY_CONTOUR_UNCLOSED` for `live-flat:trouser:FRONT_FLAT:waistband:waistband:frontLeft:waist:top` and `TEXT_COLLISION` for `flat:trouser:FRONT_FLAT:callout:hip-depth-body-reference`. No partial SVG is emitted. The held-output screenshots preserve both reasons.
- Manually inspected the emitted default back, maximum waistband-depth back and supported combined-option back. The leg silhouettes remain upright and symmetric; source-ordered waistband fragments meet each panel waist; the center-back and waist callouts target represented same-revision geometry; grain/crease balance marks and source notices stay inside the view. No false front-closure construction is shown on the back.
- Manually inspected default and maximum-fly-length held front screenshots. The UI clearly withholds geometry and names both the incomplete waistband color contour and unreadable hip-depth callout. The front is not accepted.
- `trouser-source-topology.png` and `.svg` visualize the exact current drafted waist/center-front/fly edges, underlap boundary and actual stitch chain. Assembly records show upright panel transforms and the original waistband intervals. This is a source-topology overlay, not an accepted assembled front.
- The underlap is an interior role omitted from exterior geometry. Because all fronts remain held and no visible overlap stack is emitted, S326 does not claim the conditional overlap/readability review has passed.
- Strict initial browser attempt stopped on the hip-depth collision after preserving the default front/back capture; see `strict-replay-failure.txt`. `--capture-held` is an evidence-only mode that completes matrix capture and retains held screenshots. It does not suppress, accept or relabel the underlying issues.

## Reviewed captures

- `trouser-default-back.png`
- `trouser-waistbandDepth-max-back.png`
- `trouser-combined-supported-back.png`
- `trouser-default-front.png`
- `trouser-flyLength-max-front.png`
- `trouser-source-topology.png`
