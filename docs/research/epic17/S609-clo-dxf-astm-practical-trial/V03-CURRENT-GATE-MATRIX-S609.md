# G04 / V03 current evidence matrix — Slice 609

S609 tests one practical CLO 2026.1.310 DXF-ASTM export and same-profile
reimport using the hash-pinned original Polo M fixture. It changes no scope,
acceptance criterion, tolerance, legacy DXF behavior, or protected export
identity.

| V03 gate | Current disposition | S609 evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **Narrow CLO trial only; not qualified** | CLO 2026.1.310 exposes DXF-ASTM export; emitted header says AC1009. One Polo M trial does not identify a normative edition or prove apparel profile conformance. | Select and document rights-reviewed industrial apparel exchange receiver/profile; substantiate any exact-format claim with import and round-trip evidence. |
| Permission and local handling | **Settled for bounded trial** | Maintainer confirms product-development evaluation and local-only handling. Trial files remain under the named C: folder. | No repeated permission query; do not transmit files to a hosted service. |
| Seven-recipe presence and repeated exchange | **Incomplete** | S609 tests one Polo M source/export/reimport generation. | Representative all-seven recipes and supported options with required repeated generations. |
| CUT/SEW geometry at 0.001 cm | **Fail** | Nine SEWs pass. Four of nine CUTs pass; five fail: back `0.0129907 cm`, outer stand `0.0132274`, inner stand `0.0142242`, upper collar `0.0132402`, under collar `0.0132489`. Failing output contours have one fewer vertex. | Every applicable CUT and SEW under the unchanged threshold. |
| Piece/revision/size identity | **Partial** | Nine output blocks bind uniquely for this measurement via source-SEW paths. Output labels are numeric identifiers. | Stable, explicit source piece/revision/size identity through representative exchange. |
| CUT/SEW semantics and layers | **Incomplete** | Output layers observed as `1`, `84`, `14`, `87`, `8`, `85`; role meaning is not inferred. | Documented, stable manufacturing role and layer mapping validated through round trip. |
| Marks, notches, labels and seam allowance | **Incomplete** | Import/export settings were recorded; CLO reports seam allowances imported in Custom mode. Gross PDF shows nine pieces; marks are too light at sheet scale to certify. | Source-linked useful-zoom checks for marks, notches, labels and seam allowance. |
| Units and scale | **Setup evidence only** | Both input and ASTM reimport use centimeters at 100%; export is centimeter/100%. | Profile-defined units and independent measurements across accepted fixtures. |
| Sizes, grading and options | **Incomplete** | ASTM Graded Nest export option was enabled, but only a single Polo M configuration was measured; no grade result is proven. | Supported size, grade and option matrix with intact geometry and relationships. |
| Malformed-input handling | **Open** | Not exercised in S609. Prior negative AAMA evidence remains controlling. | Clear rejection/actionable error and preservation of expected geometry for negative fixtures. |
| Rendered/detail evidence | **Gross presence only** | CLO reimport rendered all nine labeled pieces on one PDF sheet without a format error. | Useful-zoom contour, mark, notch and construction review across required fixtures. |
| Repeated-round-trip compatibility | **Fail / incomplete** | This first-generation ASTM route fails five Polo M CUTs. No second generation, other recipes or complete semantics were checked. | All-seven geometry, identity, semantics, marks, grades/options, negative tests and repeated generations. |
| Legacy DXF and protected export byte identities | **Preserved** | Research-only trial and scripts; no product writer, export baseline or fixture changed. | Preserve through integrated Epic/PR gates. |

## S609 disposition and next step

CLO successfully imported, exported an AC1009 DXF-ASTM-labeled file and
reimported/rendered it without a format error. The source-bound geometry gate
still fails five CUT contours at `0.001 cm`; therefore neither the ASTM label
nor a successful UI operation establishes compatibility. No V03 acceptance
gate clears. Keep all seven-recipe coverage, V02-before-V03, all other V03
gates, legacy DXF behavior and protected output identities unchanged. The
written product-development/local-processing permission remains settled.

Next inspect only a distinct source-backed path that can address the measured
vertex-loss behavior and open semantic/profile gates. Do not repeat the same
Polo M ASTM settings or previously rejected AAMA spline variations. CLO may
remain open during continued G04 work. No physical-fit, factory-acceptance or
production-readiness claim is made.
