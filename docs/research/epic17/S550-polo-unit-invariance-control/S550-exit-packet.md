# EPIC-17 / G04 V03 — Polo unit-invariance control — Slice 550 exit

## Result

The planned unit-invariance DXF exchange did not run. The fresh CLO state was initially coherent: both screenshot and accessibility showed the same loaded 2D pattern canvas and no Export DXF modal. Choosing File → Import → DXF then exposed CLO's “File not saved. Do you want to save?” prompt. Save As was selected to preserve the open project, and the screenshot showed a Windows Save File picker. At the same time, CLO accessibility continued to report the underlying save prompt rather than the visible file picker; `sky.list_windows()` returned only the CLO main window and no separate file-picker window. A second fresh screenshot still showed the file picker while the accessibility report contained no file-name or cancel controls. No path or filename was entered, no save occurred, and no import/export DXFs were opened or produced. CLO remains open in its current state; no additional input was attempted.

This is a confirmed UI-targetability mismatch for this step, not a CLO format failure. The user's written confirmation covers CLO product-development evaluation and local DXF processing, so rights and data-handling are not blocking the trial.

## Input evidence and local file boundary

The existing S549 millimeter fixture and source were copied unchanged into `C:\G04-CLO-DXF-Exchange\S550-polo-unit-invariance-control\` before the UI attempt. Their SHA-256 values were rechecked:

- `polo-standard-m-source.dxf`: `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- `polo-standard-m-mm-input.dxf`: `8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af`.

No files outside this named C: folder were used for CLO import/export. No output or exchange screenshot was created because the import did not begin. The current directory contains only the two verified input DXFs.

## Gate disposition

S550 establishes neither unit-dependent nor unit-independent contour loss. The five recurring Polo CUT contour failures remain at `0.01274–0.01399 cm` against the unchanged `0.001 cm` gate, as documented in S547/S549. No V03 requirement changed or passed. Exact industrial profile, CUT/SEW/mark semantics, grades/options, malformed-input rejection, and full seven-recipe qualified round-trip remain open. All pattern geometry, legacy DXF behavior, protected export identities, and user acceptance criteria remain unchanged.

## Next action

Do not repeat CLO actions while its screenshot and accessibility state disagree about the active Save As/file-picker controls. Keep CLO open. Resume the single S550 millimeter import/export only after one fresh target observation identifies the visible file picker and its actionable controls consistently. If the app remains unaddressable, continue V03 through independent evidence work and retain all holds; do not infer format failure from UI access failure.

## Verification and elapsed time

- Board start evidence/comment applied by the validated command layer, revision `3313→3315`; V03 remains In Progress.
- C:-only destination path was checked to remain under `C:\G04-CLO-DXF-Exchange\`; both copied input hashes match the source records above.
- No production code or tests changed; no full-repository gate was due. `npm run control-center:test`, packet/board preflight, and `git diff --check` are recorded after closeout.
- Started `2026-10-08 23:05 UTC`; closed `2026-10-08 23:08 UTC` (~3m). Implementation 0m; focused verification and UI-state diagnosis ~2m; durable packet/board/state closeout ~1m; external-agent waits 0m; maintainer-decision time 0m.

S550 is closed as an evidence-only diagnostic slice; V03 remains open. No physical-fit, factory-acceptance, or production-readiness claim is made.
