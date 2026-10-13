# Slice 780 — integrated rendered and generated output review

## Scope and evidence crosswalk

S780 reviews the settled S779 candidate. The all-recipe evidence below is a
crosswalk to the already accepted T01–T05 outputs; it does not claim seven
sewn garments, seven supplier-approved packs, or seven independently authored
sample records. Tee and Woven Shirt remain the two selected numeric/output
fixtures for T04, as admitted. Their source observations are synthetic.

| Acceptance area | Recipes / fixture | Retained evidence and review |
| --- | --- | --- |
| T01 editable record and visible unresolved values | Tee, Darted Tee, Tank, Polo, Woven Shirt, Skirt, Trouser | Reopened and visually inspected the seven final-source Chromium captures in `../S767-T01-editor/rendered/`; each retains recipe-specific fields, explicit unknowns/reasons/next actions, cost inputs without fabricated totals, and no fit claim. |
| T02 POM and sample/QA completeness states | All seven recipes | S770's all-seven rendered review records missing source definitions as actionable unknowns, with no invented readings or grade rules; see `../S770-T02-callout-size-run-validation/`. |
| T03 operation/component reference reconciliation | All seven recipes | S773's read-only reference renders and evidence record component/stitch counts and unresolved references without converting pattern identifiers into construction facts; see `../S773-T03-reference-reconciliation/`. |
| T04 editable output, numeric reconciliation, import/review | Tee and Woven Shirt | The two admitted synthetic fixtures have actual PDF/ZIP, round-trip, numeric and rendered review in `../S777-T04-review/`; S780 rechecked the Tee integrated output below. |
| T05 stale/frozen change control | All seven registered recipe IDs; saved-file browser sequence uses a synthetic Tee | S779's manager test renders the stale-share guidance for all seven IDs; its actual local Chromium workflow verifies current/historical labeling, edits, and byte-identical historical downloads in `../S779-T05-change-control/`. |

## S780 local browser output

The S780 Chromium change-control replay exercised a local synthetic Tee style:
freeze a scoped share, edit and save, observe the historical/stale label, then
download the retained historical ZIP and PDF, including the keyboard PDF
action. It completed at 1280×800 and 390×844 without horizontal overflow or
page errors. The report and viewport captures are under `browser/`.

The actual standalone production-pack PDF is 12,082 bytes with SHA-256
`53697be9d3b5b5b3248a15dbaacb93744b6fb1d8b0b1274988085b0dcaa73d9a`. Its
editable package is 3,731 bytes with SHA-256
`89fa57b033539d8350c52f1a8c3f1c413d5fe468c8bb5e8a125e92fbd85f2ad8`. The ZIP
contains `manifest.json`, `records/tech-pack.json`, and
`documents/production-pack.pdf`; the embedded PDF is byte-identical to the
standalone file. Both files are retained in `browser/` and summarized in
`browser/pack-inspection.json`.

The PDF opens as an unencrypted PDF 1.4 with seven A4 portrait pages at
595×842 points. All seven 120-dpi page renders were inspected. No clipping,
overlap, or illegible text was found. Poppler warned that display fonts for
Symbol and ArialUnicode were unavailable, but the retained renders show no
missing glyphs. The synthetic sample has no BOM, sample/QA observations,
construction operations, or artwork attachments; its unknowns remain explicit
with reasons and next actions. The local approval and page text do not claim
supplier acceptance, physical fit, factory acceptance, compliance, or
production release. Review notes and images are in `browser/pdf-review.md` and
`browser/pdf-pages/`.

## Packaged Electron output

The packaged Electron verification passed from the isolated per-user temporary
build recorded in `electron/package-alt-path.txt`. Its 72-file inventory hash
is `a5b1aed4e5cda00e7d05e1b5149795827e1ede6cca7f81cdc12898ac8d4318b1`; no
absolute development path was found. Fresh-profile, offline reload, malformed
save/recovery handling, output failure paths, and window lifecycle passed.
Six output kinds were each exercised through button and menu routes; all 12
files were valid and each button/menu pair was byte-identical. The verification
record and artifacts are under `electron/packaged-release/`.

For the established Tee SVG, DXF, and legacy PDF routes, packaged output hashes
match the protected fixtures. The new Tech Pack PDF is a separate synthetic
packaged-run capture from the S780 browser PDF; its bytes are recorded in the
Electron verification JSON and are not a new baseline.

The standard `npm run electron:pack` output path failed twice with a Windows
`EPERM` rename from `release/win-unpacked.tmp` to `release/win-unpacked`. The
preflight showed no existing final target, and each attempt left no final
target. The same pinned Electron/electron-builder setup succeeded when directed
to the separate verified temporary output path, and the packaged app then
passed functional verification. This documents a standard-path filesystem
limitation; it is not evidence of signing or production release. No release
output remains in the repository worktree.

## Claims and limits

The review uses local synthetic records and existing source/render evidence.
No physical sewing, fit, supplier, factory, standards-conformance, signed
release, or production-readiness result is established. No output or protected
legacy export baseline moved. The S780 PDF/ZIP are test evidence, not approved
production instructions.
