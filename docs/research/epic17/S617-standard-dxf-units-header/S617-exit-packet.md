# EPIC-17 / G04 V03 — Explicit centimeter header diagnostic — Slice 617 exit

## Verified outcome

- Closed 2026-10-09 13:01:01 UTC on `codex/epic-17-g04`, from S616 commit `2f1155de`. The S617 start packet records refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` as an ancestor and board revision 3601. Validated start replay 3601→3603. Exit replay is 3603→3606. G04-V02 remains Done; G04-V03 and EPIC-17 remain In Progress.
- The one-variable trial added only an AC1015 HEADER with truthful `$INSUNITS=5` (centimeters) to a disposable DXF. The hash-pinned original entity/body bytes, vertices, layers and coordinates remained unchanged. Input/output/evidence for CLO stays under `C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\`; no product source, pattern, production DXF, geometry threshold, baseline, test, or acceptance criterion changed.
- CLO 2026.1.310 Standard-DXF import at centimeters/100%/Do Not Rotate/Maintain Original imported nine pieces. It displayed the informational notice that seam allowances were imported in Custom mode to preserve original shape; no format error appeared. The imported scene was exported once through DXF-ASTM / Graded Nest / centimeters / 100% / Do Not Rotate with the established settings, then re-imported as Standard DXF at centimeters/100%, no rotation. CLO repeated the seam allowance notice; nine pieces rendered and no format error appeared.
- **The explicit header fixed this fixture's scale diagnosis:** exported source-bound paths now compare at 1.0× coordinates rather than 0.1×. The high-resolution source-bound report binds all nine pieces via unchanged SEW contours: 9/9 SEW pass, maximum cyclic coordinate delta 0.00003513 cm. CUT passes 4/9 (front, sleeve, button placket, buttonhole placket); back, outer stand, inner stand, upper collar, and under collar fail. Each failing output cut contour has one fewer vertex; conservative deviation is 0.01299–0.01423 cm versus the unchanged 0.001 cm gate. So a successful exchange and correct gross scale do **not** qualify this profile/round trip.
- Output DXF is 225,403 bytes, SHA-256 `42db6b2c7974637047bdcb39763a5e677d10b6d4a2696ce13ed837581be46525`, advertises AC1009, inserts nine blocks and contains numeric layers (`1`, `84`, `14`, `87`, `8`, `85`). CLO menu/profile labels and AC1009 alone do not establish a normative ASTM edition or industrial profile. This single Polo M result establishes no all-seven, option/grade, layer/mark semantics, piece/revision identity, malformed-input, repeated-round-trip, receiver-rights, or useful-detail render criterion.

## Artifacts and evidence

- Original Polo M input: 24,261 bytes, SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- Header variant: 24,326 bytes, SHA-256 `71f45fdca602bbddb32ba53f76f0b5d9b6e92094d96557414c182c5eaf42e5f5`.
- Source-variant preflight: SHA-256 `f7c9a8ca810e709f2c052da44fc5212b673d92259f30008fdcf035f66b9be99d`.
- High-resolution CUT/SEW analysis: SHA-256 `685ad4c76ca503db2e3b6c5234d1915523ed28722727be441bd1d65acb68a360`; analyzer is hash-pinned against baseline, variant, preflight and output. Method matches pieces by exact cyclic/reverse SEW vertices and compares the CUT contour symmetrically with arc-length sampling at ≤0.0005 cm; its conservative allowance is 0.00025 cm.
- CLO output re-import render: `Evidence\output-reimport-render.jpg`, SHA-256 `9093d51562f4cac3da6a2efe35c0df3b1ce2a947423666054691fc16efdcda46`; the re-import scene `Evidence\output-reimport-standard-dxf-cm-units.zprj` is 2,245,476 bytes, SHA-256 `bffce8d174a6fc5b875b8364f556454ad489a2f5e2b20b59cea8628dad3f09e1`. The matching import-settings screenshot `Evidence\output-import-settings.jpg` has SHA-256 `7c7e11bb3ab9b1740b2f6cdfc8d63a27ddf24e07c302a4d2f2b265cc531cbe80`. Source import render, settings and scene are hash-pinned in `preflight-exit.mjs`, under the same C: folder.

## Gate disposition

S617 confirms that explicit centimeter metadata on the tested Standard-DXF import path resolves the 10× scale mismatch for this single fixture. It does not clear V03: five CUT outlines fail unchanged geometry tolerance, and all seven recipes, supported configurations, industrial profile/version evidence, semantic fidelity, rights/profile selection, repeated exchange, invalid-input handling, and useful rendered detail remain unproven. Keep every V03 hold, V02-before-V03 dependency, all-seven recipe criterion, 0.001 cm contour gate, legacy DXF behavior and protected export byte identities unchanged. No physical fit, factory acceptance, or production-readiness claim is made. CLO remains open for active G04 work.

## Verification and time accounting

- `node --check analyze-header-fine-roundtrip.mjs` passed. The exact source-bound analysis completed in about 51 seconds: 9/9 SEW, 4/9 CUT. The output was re-imported and all nine gross shapes visually reviewed in CLO; the seam-allowance notice was captured as non-error context. Output DXF, renders, settings, and CLO scenes were written only under the named C: folder and hashes checked.
- No product code changed, so changed-code coverage is not applicable. Full repository tests and 100% global coverage stay due on the settled integrated Epic/PR candidate. Focused Control Center tests, exit preflight, validated command replay, and `git diff --check` are run during closeout.
- Slice start was 12:43:36 UTC; elapsed 17m25s (12:43:36–13:01:01 UTC, ending at the S617 commit). CLO diagnostic preparation/import-export-reimport/render capture: about 8m; high-resolution comparison and focused verification/records/board/commit: about 9m25s, including the 51-second analyzer and 42/42 Control Center tests; external-agent waits: 0; maintainer-decision time: 0. CLO remains open.

## Single next action

Select a distinct, evidence-backed source of the remaining one-vertex CUT simplification before spending another CLO exchange. Do not repeat unit/scale permutations on the same fixture. Maintain all V03 holds until all admitted profile, identity, semantic, geometry, negative-input, repeated-round-trip, and rendered-detail gates have evidence.
