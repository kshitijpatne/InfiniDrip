# S469 local apparel-CAD receiver trial checklist

## Purpose

This is an operator guide for a possible local trial of Richpeace Garment CAD
V8.0 Free Version-English. It does not select Richpeace or an exchange profile,
establish format compatibility, or relax G04-V03. The receiver must first pass
rights, exact-build, format-menu, and local-processing checks. Use only the
synthetic S463 files listed below; never use a private or production pattern in
this trial.

## Gate 0 — inspect before opening any pattern

1. Confirm the installed product is **Richpeace Garment CAD V8.0 Free
   Version-English**, not Super V8. Record the full Help/About version/build
   and the installer source.
2. Review the displayed evaluation/license terms for permission to use the
   program for local format evaluation. Record the relevant terms or a short
   summary. If the terms are unclear, require account/cloud use, or do not
   permit this evaluation, stop here.
3. Without opening a file, inspect the file-open/import and export menus. Record
   their exact labels and supported extensions. The V8 manual lists AAMA/ASTM
   import and ASTM export, but the installed build must expose the required
   choices. A label alone is not proof of successful exchange.
4. Confirm ordinary import/export uses local file paths and does not invoke a
   login, upload, cloud conversion, or cloud marker. If local-only handling
   cannot be established, stop before selecting a fixture.
5. Send Codex the About/build result, exact menu labels, and rights/local-use
   outcome. Do not send credentials, license keys, or unrelated personal data.

## Gate 1 — controlled fixture exchange (only after Gate 0 passes)

Work on copies in a new local trial folder. Keep the originals read-only.
Record every prompt, warning, import setting, export mode, and output filename.

1. Import `tee-standard-m.dxf` first. If the app requests units, explicitly
   choose centimeters and record the setting. If it does not, record the
   default and compare its known 70 cm source length to establish observed
   scale; do not infer units from a menu label.
2. Inspect the three named pieces (`front`, `back`, `sleeve`), CUT/SEW layers,
   contour closure, orientation, and scale. Save a receiver-native copy without
   editing geometry. Export using the exposed AAMA/ASTM apparel exchange option
   and record its exact label and extension. Reopen that exported file in the
   receiver if supported; record whether the geometry and marks persist.
3. Repeat the same unedited import/native-save/export/reopen sequence for
   `polo-standard-m.dxf` (nine pieces with button/collar/fold/placement marks)
   and `woven-shirt-standard-m.dxf` (12 pieces with yoke, pocket, collar,
   plackets, sleeve/band and marks). Capture any dropped, merged, renamed or
   reinterpreted entities.
4. Import the separate `tee-grade-xs.dxf`, `tee-grade-m.dxf`, and
   `tee-grade-xl.dxf` as a controlled size family. Record whether the receiver
   preserves per-file size identity and whether it can create or retain a
   native graded set. These are three separate generic DXFs; successful
   opening does **not** demonstrate native grade-rule exchange.
5. Test `negative-truncated-group-value.dxf` last. It is intentionally
   malformed, not a garment. The receiver must reject it or clearly report the
   malformed input; do not save or silently repair it as a successful pattern.
6. Preserve the returned files and screenshots/logs locally. Provide the
   synthetic-fixture outputs to Codex for independent structural, unit/scale,
   contour, piece/layer/mark, and coordinate-difference checks against
   `S463-v03-receiver-fixture-pack/fixture-manifest.json`. Do not upload them to
   any service.

## Required result record

For the exact build/profile, record: rights basis; local/cloud behavior;
import/export menu labels and extensions; per-fixture import result and
warnings; explicit unit setting or measured scale; piece/entity/layer/mark
counts; contour closure; orientation; native-save and exported-file reopen
results; maximum per-coordinate deviation; grade behavior; malformed-input
handling; and screenshots of the receiver canvas and exchange dialogs.

V03 remains In Progress until the permitted receiver/version/profile and
round-trip evidence meet the admitted acceptance criteria. Report only the
specific input/output path demonstrated. Do not claim exact standards-wide
compatibility, native grading, physical fit, factory acceptance, or production
readiness beyond observed evidence.

## Fixture limits and provenance

S463 generates these files from source commit
`b8462cf6bda2097167ef16c13c3ab49727e2d78e`; their hashes, byte lengths,
source measurements/options, pieces, entity counts, and layers are in
`fixture-manifest.json`. Coordinates use centimeters and CAD-up Y inversion,
but the generic DXF stream does not declare units, stable piece IDs, grade
rules, or paired-seam relationships. The sidecar manifest is audit evidence;
it is not embedded in the DXF. These tests do not prove true multi-size grade
interchange or support for every garment recipe.
