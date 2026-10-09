# EPIC-17 / G04 V03 — Open CAD Studio desktop R14 receiver screen — Slice 624 exit

## Result

The official Open CAD Studio Windows portable release `v2026.40.1` passed the bounded **local general-CAD R14 exchange screen**. The official x86-64 release asset is 113,595,808 bytes, SHA-256 `301D64CFA5B6CE442DC4DEF5FC0B35CAF4E4C3E39E370852AFE15553A8C4E321`, and its Windows Authenticode signature is valid for Impertio Studio B.V. Its `--version` reports 2026.40.1 / revision `7d5ee91665b1`.

The exact versioned source routes `--export` through a local input path and `io::save_as_version` with an explicit target format. Product inputs and outputs were all in the required directory on C:. A synthetic R12 drawing first established controllable local write/reopen behavior: its closed `CUT` rectangle, `SEW` diagonal, centimeter units, coordinates and layers remained exact through two R14 generations. Only after this local proof were nine current-source generic garment DXFs generated and tested.

The nine cases are the seven supported recipes at default size M (Tee, Fitted, Polo, Woven, Tank, Trouser, Skirt) and Tee XS/XL. Across the first R14 write, all 45 CUT and 45 SEW contours match at the unchanged `0.001 cm` threshold; the measured maximum residual is zero. Output remains R14/AC1014 with the same entity/layer counts and contour multiplicities. A second explicit R14 write after reopen is byte-identical to the first for all nine. A deliberately truncated DXF fails closed with exit code 1 and no output.

Open CAD Studio generated a one-page, A3 landscape extents PDF for each output through its authenticated loopback REST plot route. I inspected the nine-page contact sheet and Polo/Woven pages at full resolution. All expected CUT/SEW contours are present and fit within the plotted extents; there is no missing-piece, clipping, or gross rendering defect. The PDFs and raster renders are hash-pinned in the C: `Evidence\render-review.json` record. These plots are actual receiver output, rasterized only for visual inspection.

The product DXFs have no $INSUNITS header. Open CAD Studio preserves their numeric coordinates but does not add unit metadata. The synthetic control's explicitly declared centimeter unit survives. The product plots therefore prove shape visibility, not physical scale interpretation.

## Limits and V03 disposition

This is a positive, bounded **geometry/format candidate result**, not V03 completion. Open CAD Studio is general CAD software, not a demonstrated apparel-specific industrial exchange profile. The current generic DXFs contain only CUT and SEW polylines; this trial does not prove serialized piece/revision identity, POM/notch/artwork semantics, independent manufacturing-role semantics, grade rules, or supported-option exchange. The nine-fixture cohort is not a full options/grades Cartesian matrix. Exact industrial-format compatibility is not claimed.

The official CLI performed the work locally with explicit input/output paths. Its source path and C: artifacts support locality for this tested desktop CLI operation. This does not generalize to the rejected browser app or other workflows. The maintainer's written product-development/local-processing authorization for CLO is independently settled and need not be revisited.

No product source, pattern geometry, stitch graph, renderer, generic DXF writer, protected export identity or acceptance criterion changed. V02 remains Done. G04-V03 and EPIC-17 remain In Progress. Preserve the complete all-seven acceptance, all options/grades and marks requirements, the fixed `0.001 cm` contour gate, rights/profile criteria, malformed-input and repeated-round-trip criteria, rendered-output review, legacy behavior and protected byte identities. No physical-fit, factory-acceptance or production-readiness claim is made.

## Evidence

All receiver-side files are under `C:\G04-CLO-DXF-Exchange\S624-opencadstudio-desktop-r14-receiver\`:

- `OpenCADStudio-v2026.40.1-windows-x86_64-portable.exe` — official asset; identity and signature recorded above and in `Evidence\fixture-manifest.json`.
- `Input\` — seven size-M recipe fixtures, Tee XS/XL, plus the hash-pinned malformed negative control.
- `Output\` — R14 output and reopened R14 output for all nine positives, plus synthetic source/output/reopen. No negative output exists.
- `Evidence\fixture-manifest.json`, `conversion-record.json`, `roundtrip-analysis.json`, and `render-review.json` — source/output identity, process codes, geometry, malformed-control and render evidence. `roundtrip-analysis.json` SHA-256: `8C65A56E07BC45362170EBC3A01482CDDD4939237658F20930CEA6547A7DCB26`. `render-review.json` SHA-256: `7604A79B29297F5E0495868D5EAA3119043C58AB3ABDE786EB1C74FB43C0EAA6`. Contact sheet SHA-256: `47B0C0BC6C6E2839E493DD4B4B10935F9A07E1AB428904B64A2BE5C8DF70BBEA`. Rasterization helper: `render-pdfs.py`.
- `Renders\` — nine receiver-generated PDFs, their nine PNG inspection renders, and `S624-r14-nine-fixture-contact-sheet.png`.

Official references checked: [Open CAD Studio v2026.40.1 release](https://github.com/HakanSeven12/OpenCADStudio/releases/tag/v2026.40.1), [project repository and GPL-3.0 license](https://github.com/HakanSeven12/OpenCADStudio), [versioned local-export implementation](https://github.com/HakanSeven12/OpenCADStudio/blob/v2026.40.1/src/main.rs), [versioned headless export implementation](https://github.com/HakanSeven12/OpenCADStudio/blob/v2026.40.1/src/app/automation.rs), [versioned automation API specification](https://github.com/HakanSeven12/OpenCADStudio/blob/v2026.40.1/docs/automation/API-SPEC.md). The local CLI `--help`, `--version`, official source and actual conversion/render outputs agree on the tested R14 route.

## Verification and next action

- **Pass:** binary origin/version/signature; official local source route; C:-only synthetic preflight; all nine fixture conversions and repeated reopen; 90/90 product CUT/SEW contour comparisons at 0.001 cm; R14/AC1014 headers; entity/layer/count and closure checks; byte-identical second generations; malformed DXF rejected without output; all nine actual receiver PDFs visually reviewed.
- **Still open:** product-file units metadata; an applicable industrial apparel profile/contract; explicit semantic identity and marks; grade rules and supported-option matrix; all remaining V03 profile/receiver acceptance evidence. S624 clears no full V03 acceptance item.
- **Preserved:** all G04/V03 acceptance criteria and V02 state; no product-source or protected-export changes.
- **Next:** S625 tests a single hash-pinned S624-generated AC1014 R14 Polo M DXF in CLO Standard-DXF import, using the exact S622 baseline settings. Query all nine native CUT and SEW contours against their exact source at the unchanged 0.001 cm threshold and inspect the rendered 2D output. Export only if every contour passes; if any fail, close this specific R14-version hypothesis without changing settings or repeating another profile permutation. CLO product-development use and local-only handling are confirmed in writing; no further permission check is needed.

## Slice closeout and timing

Started 2026-10-09 14:37:06 UTC from clean S623 commit c4b1eac82cfcbe9ec49981d7f1d08cf2356b7caa on codex/epic-17-g04; refreshed origin/main a5af5e13c2e967946b3f6035fcea66ff03a5e0e0 remained an ancestor. S623 was highest; S624 was uniquely reserved. Board start replay: 3632→3634; validated exit replay: 3634→3637. The validated Control Center suite passes 42/42; helper syntax, source-pinned round-trip analysis, S624 start/exit preflights and diff checks pass. No product source or tests changed, so changed-production-code coverage and the full integrated Epic gate do not apply in this research-only slice.

Elapsed 18m51s (14:37:06–14:55:57 UTC): release/source review and local handling proof about 3m; synthetic exchange and product fixture generation/conversion about 6m; round-trip analysis and rendered evidence/review about 5m; durable packet/state/board and focused validation about 4m51s; product implementation 0m; external-agent waits 0m; maintainer-decision time 0m. No safe independent task existed for this single receiver/evidence chain, so no coding agent was delegated.
