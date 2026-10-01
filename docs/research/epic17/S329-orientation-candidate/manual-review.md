# S329 paired-placement candidate — rejected

This is a four-face production candidate from a temporary S329 renderer experiment. The browser harness emitted all four SVGs and reported four unblocked faces, no text-box overlap, and no parser or browser errors. Manual geometry review rejects this candidate. In Tee and Fitted FRONT_FLAT, the selected side edge begins at the shoulder/crown point and runs inward across the bodice instead of from the sleeve underarm outward to the hem. The path therefore does not form the approved exterior sleeve half. These SVGs are diagnostic only and do not change the S328 held state.

The source overlay JSON records the exact live pattern revision, source intervals, and candidate landmarks. The 0.48 cm default cap-ease endpoint residual remains visible; it is not clamped. See `../S329-integrated-browser/manual-review.md` for the final no-regression replay and current accepted/held state.
