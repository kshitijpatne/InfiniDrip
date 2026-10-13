# S777 rendered and output review

**Review status:** Pass. **Date:** 2026-10-13. **Branch:**
`codex/epic-18-g05`. This review covers the actual Tee and Woven Shirt sample
packages, the bounded import-review renderer, and its explicit DRAFT apply
presentation.

## Package, manifest, and numeric reconciliation

The retained PDF/ZIP files were generated from each saved local style revision.
Both archives contain exactly `manifest.json`, `records/tech-pack.json`, and
`documents/production-pack.pdf`. For each style, the extracted record and
manifest parse equal the separately retained JSON files, and the embedded PDF
is byte-identical to the standalone PDF. The browser replay regenerated the
same outputs on repeat and recorded `deterministic: true`.

| Style | Saved revision / digest | Sample QA actual | Edited candidate | PDF SHA-256 | ZIP SHA-256 | Edited ZIP SHA-256 |
| --- | --- | --- | ---: | --- | --- | --- |
| Tee | r2 / `04a7762b64e099043f11bf988dedfea8b7e786de59fd7864011b0977e710a9c7` | 52.25 cm | 52.375 cm | `9de8974f9aea940c365035d1e387533d71aedd901c74428f80e2d93ab880b0e1` | `0f1eb14bedcb321e807f66915233c36a97014a9112f3a51a24e3562ec90dc907` | `6fc0bdd71a472a3c71679c1a8ed3355578f67617469f96e864f4a75efcb46d36` |
| Woven Shirt | r3 / `0b94eefb3f87fbb0c0b5f30d24794135c4ff9d50d1515ba972c3a74bd4a667dc` | 73.5 cm | 73.625 cm | `11ec8b25d95fab3b17fee313225e8ef28f11507d31d8ab299921225d78aed406` | `d28e9aeac158f9d8fcf18711ffefad3b0587aed238270265adc08967fc9d38f9` | `129f2c0bb9cc0132c1fda08d8d342ce25a7e9fa1c93b95fb7ff392c2eae47d9e` |

The retained manifests select `identity`, `measurements-qa`,
`sources-open-items`, and `approval-disclaimer`. Their style ID, revision ID,
revision number, and content digest match the editable records. The extracted
sample readings remain `status: MEASURED`, use `unit: cm`, and have explicit
synthetic evidence labels (“not a sewn-garment measurement”). The rendered QA
pages 2–3 show 52.25 for Tee and 73.5 for Woven Shirt; `pdftotext` confirms
the same values, units, measured status, sample labels, and local-review
disclaimer. The values match the JSON exactly; no rounding or normalization
occurred.

The import diff displays the exact changed paths and values:

- `pomData.sampleQaRounds[0].readings[0].actualValue`: `52.25` → `52.375` for
  Tee; `73.5` → `73.625` for Woven Shirt.
- `pomData.sampleQaRounds[0].sampleLabel`: the original synthetic/no-physical
  label → the same label with “reviewed edit” appended.

The edited candidate retains the sample round's immutable-history target and
all unaffected numeric/source fields. A sample reading contains `actualValue`
only; it does not add `predictedValue`. T02 prediction calculations remain in
their separate path and were not copied into the sample record. The previously
accepted S770 rendered review documents the separate prediction table and
unresolved source state; this S777 import does not invent prediction or
construction values. See
[`S770 exit packet`](../S770-T02-callout-size-run-validation/exit-packet.md)
and the revision-bound sample/QA contract in
[`S769 exit packet`](../S769-T02-sample-qa-revision-binding/exit-packet.md).

Both PDFs are five-page A4 files. Pages 2 and 3 were re-rendered after the
final browser replay and visually inspected: [Tee QA page 2](evidence/final-tee-measurements-qa-page-2.png),
[Tee QA page 3](evidence/final-tee-measurements-qa-page-3.png), [Woven Shirt
QA page 2](evidence/final-woven-shirt-measurements-qa-page-2.png), and [Woven
Shirt QA page 3](evidence/final-woven-shirt-measurements-qa-page-3.png). Poppler
reported that Symbol and ArialUnicode display fonts were unavailable; the
rendered pages show no missing required glyphs. The PDF disclaimer states
that local digital review does not establish supplier or production
acceptance. These synthetic outputs do not establish physical fit, sewing,
supplier acceptance, or production readiness.

## Import-review browser output

[`viewport-review.json`](evidence/viewport-review.json) records the actual
Playwright Chromium run, output hashes, exact review values, focus transitions,
table scroll positions, screenshot hashes, and page errors. All four style and
viewport combinations report no page errors and no document-level horizontal
overflow. The comparison table is wider than its bounded scroller (520 px
inside 313 px on mobile and 289 px on desktop); keyboard Right Arrow moved the
scroller, and Tab moved from the file picker to the field table and Apply.

| Style | 390×844 | 1280×800 |
| --- | --- | --- |
| Tee | [review identity](evidence/tee-mobile-review-identity.png) · [saved approval](evidence/tee-mobile-saved-approval.png) · [diff left](evidence/tee-mobile-diff-left.png) · [diff right](evidence/tee-mobile-diff-right.png) · [DRAFT apply](evidence/tee-mobile-draft-apply.png) | [review identity](evidence/tee-desktop-review-identity.png) · [saved approval](evidence/tee-desktop-saved-approval.png) · [diff left](evidence/tee-desktop-diff-left.png) · [diff right](evidence/tee-desktop-diff-right.png) · [DRAFT apply](evidence/tee-desktop-draft-apply.png) |
| Woven Shirt | [review identity](evidence/woven-shirt-mobile-review-identity.png) · [saved approval](evidence/woven-shirt-mobile-saved-approval.png) · [diff left](evidence/woven-shirt-mobile-diff-left.png) · [diff right](evidence/woven-shirt-mobile-diff-right.png) · [DRAFT apply](evidence/woven-shirt-mobile-draft-apply.png) | [review identity](evidence/woven-shirt-desktop-review-identity.png) · [saved approval](evidence/woven-shirt-desktop-saved-approval.png) · [diff left](evidence/woven-shirt-desktop-diff-left.png) · [diff right](evidence/woven-shirt-desktop-diff-right.png) · [DRAFT apply](evidence/woven-shirt-desktop-draft-apply.png) |

The saved approval is shown only for the exact current revision: state `REVIEW`,
scope `cover.styleName`, and the matching revision identity. The UI says
package approval is never trusted. The captured explicit Apply result creates
a new immutable revision in `DRAFT` with no approved field scope. Attachments
remain read-only descriptors; package bytes do not replace local attachments.
The inspector itself is vertically scrollable on both viewports so each
anchored identity, approval, diff, and Apply capture is reachable without
page-level overflow.

The application adapter tests additionally verify stale-head and approval
scope races, malformed/oversized packages, immutable-history validation,
request cancellation, failed reads/saves, and disposed mounts. Renderer and
adapter coverage results are in the S777 exit packet.
