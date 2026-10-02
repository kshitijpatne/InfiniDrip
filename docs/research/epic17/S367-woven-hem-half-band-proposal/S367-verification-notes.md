# S367 verification notes

Diagnostic setup and reporting failures were retained with causes and corrections:

- The first source-correspondence probe read `projection.roles`; `TechnicalFlatProjectionMap` stores faces in `faces[].roles`. The script now selects the BACK face and reproduces all 28 configurations.
- The first candidate renderer passed the full record rather than its `geometry` object to the SVG helper; the call was corrected. A screenshot path then used URL pathname syntax that became `C:\C:\...` on Windows; it now uses `fileURLToPath`.
- The first focused assertion used the wrong field name (`bandToSleeve`); after correcting it, the test assumed max band depth had the same crossing count as other options. The matrix shows that option has zero band-to-sleeve intersections, while the mirrored hem seam still crosses. The test now checks option-specific results and the aggregate 54 band-to-sleeve crossings over 28 options. Final focused result: 2/2 pass.
- A raw closed-fill polygon counter includes invisible half-boundary and seam segments, so it is not the visible-contour acceptance measure. `half-band-crossing-pairs.json` reports visible seam, band-edge and sleeve intersections separately, excludes shared-node events within 0.001 cm, and retains exact pair coordinates.

All failures were diagnostic or test setup/reporting issues; no production code changed.