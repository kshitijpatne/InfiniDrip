# S328 Tee/Fitted sleeve output review

## Review scope

Rebuilt production Chromium, default Tee and Fitted front/back at their live draft revisions. The reviewed faces are `tee-default-front`, `tee-default-back`, `fitted-default-front` and `fitted-default-back`; screenshots and matrix data are beside this file.

## Finding

The first matrix run marked all four faces accepted. Manual inspection of its generated SVG paths and screenshots found that the sleeve sides entered the torso and the mirrored instances overlapped across the center. The front-side path ran from `(1.156, 10.045)` to `(4.141, 28.303)` cm inside the body; the mirrored back-side path reached `(0.1358, 11.1958)` cm near the center axis. The exact IDs are `pattern:<tee|fitted>:role:sleeve:edge:sideLeft` on FRONT_FLAT and `...:sideRight` on BACK_FLAT. Source edge order and endpoint joins are valid; the body-relative side placement is not.

## Final rendered result

The final matrix reports 0 accepted and 4 withheld, with each full face withheld for its exact side-edge projection issue. The four screenshots show the held-state message; no partial body or sleeve geometry, crossing stroke, or color fill is rendered. POM-anchor follow-on notices also remain visible because the held role outline is unavailable. No console, page, request or parser errors occurred. No colorway overlay is emitted for a held face.

The fill-only hem-midpoint-to-cap-crown boundary remains an approved view convention. It does not resolve the body-relative placement conflict and is not evidence of a physical seam. All four faces stay held. S322's changed-measurement cases with the 0.48 cm `Sleeve-cap ease` residual remain separate holds and are not part of this default-only browser matrix.

## Decision

Do not accept these faces. Next work must resolve the source-to-view transform and repeat the relevant configuration and output checks. Do not change cut geometry, add a seam, or infer physical construction from this review.
