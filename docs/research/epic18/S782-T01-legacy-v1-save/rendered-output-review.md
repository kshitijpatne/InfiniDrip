# S782 rendered legacy-v1 T01 output review

## Browser workflow

`rendered-proof.cjs` seeds the Chromium profile with the checked-in synthetic
version-eight database fixture: a schema-v4 style row without `techPack`, a
payload-v1 revision head, and its field-history record. The app opens and
migrates that database through its real browser IndexedDB path. The initial
T01 record is unlinked (`revisionId: null`, `revisionNumber: 0`); the rendered
review action is disabled until an authored T01 save creates a revision.

The browser changed `cover.styleCode` to `TP-S782-UI-01`, supplied explicit
user-captured provenance and validation, and saved it as revision r2 without
changing design data. The frozen v1 parent retains its original digest and
exactly one v2 child is present. The page then completed scoped review,
self-attested approval, and local share freeze. Chromium was
`HeadlessChrome/151.0.7922.34`. The complete verification summary is in
`rendered-proof-verification.json`; the saved field and final review/share UI
are shown in `rendered-t01-saved-field.png` and `rendered-t01-frozen.png`.

## Frozen PDF and ZIP

The browser's IndexedDB manifest returned the exact PDF and ZIP bytes. Their
lengths and SHA-256 values were checked against the manifest before saving the
files here. The ZIP was opened and its `manifest.json` and T01 record were
checked against child revision r2 and the entered style code.

| Artifact | Bytes | SHA-256 | Review |
| --- | ---: | --- | --- |
| `S782-legacy-v1-tech-pack.pdf` | 11,686 | `d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4` | Seven A4 pages, all rendered and visually inspected; style code and unresolved values remain visible. |
| `S782-legacy-v1-tech-pack.zip` | 3,902 | `9d9bff4729c4239ba16765cf3d82b7efd02a37ad40da4c055f5c659849397665` | Contains `documents/production-pack.pdf`, `manifest.json`, and `records/tech-pack.json`; manifest and record bind revision r2, payload digest, and `TP-S782-UI-01`. |

`pdfinfo` reports seven unencrypted A4 pages. The rendered pages show the T01
style code and its user-captured provenance, the unresolved cover fields with
their next actions, empty materials/sample/construction/artwork sections, and
the self-attested approval scope. Pages 2–5 are sparse because those records
were not entered; the PDF labels their absence. All seven pages show the local
digital-review disclaimer. The renderer emitted Symbol/ArialUnicode font-map
warnings, but visual inspection found no missing glyphs, clipping, overlap, or
illegible text.

The package repeatedly states that local digital review does not establish
supplier acceptance, physical fit, factory acceptance, compliance, or
production release. The fixture and screenshots are synthetic workflow
evidence; they establish no physical garment result.
