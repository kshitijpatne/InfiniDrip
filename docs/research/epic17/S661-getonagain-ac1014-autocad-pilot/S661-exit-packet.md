# EPIC-17 / G04 V03 — one GetonAgain AutoCAD-mode pilot — Slice 661 exit

## Outcome

Sign-in is complete and DGS is usable. The single DGS `VID:20250610`
`AUTOCAD` import of the hash-pinned S648 generic AC1014 Polo M fixture returned
nine pattern entries, but the native Error Box reported for **all nine**:
`Pattern nameN, Size:M, grainline is outside the border, please check again.`
The rendered DGS window shows the imported pieces and `9/9`; error validation
remains open. This is a concrete failure of the exact fixture/build/mode route
against the warning-free pilot criterion. Per S661 stop condition, no export
was attempted. No other mode, format, encoding or setting was tried.

The whole-window rendered evidence is saved on C: at
`C:\G04-CLO-DXF-Exchange\S661-getonagain-ac1014-autocad-pilot\Output\dgs-import-grainline-errors.jpg`
(137,564 bytes, SHA-256
`e6f654e0c5d3ff23a1c31104167db08646b758acdef3a603462df15a1a144bb3`). The
independent source inventory is saved at
`C:\G04-CLO-DXF-Exchange\S661-getonagain-ac1014-autocad-pilot\Output\source-dxf-structure.json`
(6,353 bytes, SHA-256
`a8ee385803ea2ebbd7c35be15fd3cf93ca46802263beab292ce17a8573c56086`).
Both files and the imported DXF are confined to the approved
`C:\G04-CLO-DXF-Exchange\S661-getonagain-ac1014-autocad-pilot\` folder.

## Evidence and cause classification

- **Direct UI evidence:** the path field names the S661 copy; `AUTOCAD` and
  `Pattern` are selected; Import text is on; Grainline is `2 Way`; Unit of file
  is selected. In this mode, Only base size is disabled/unchecked, Recognize
  seam disabled/checked, and Nest pattern disabled/checked. The import form's
  mode-specific controls were not toggled. The Error Box lists nine matching
  grainline-outside-border errors; status shows `9/9` patterns.
- **Direct fixture evidence:** independent `dxf-parser@1.1.2` parsing confirms
  the 153,647-byte source copy has the expected SHA-256
  `ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461`,
  `$INSUNITS=5` (centimetres), nine named piece INSERT/block pairs, CUT/SEW
  polylines, construction-mark layers, and revision/piece XDATA. No source
  layer or entity is named `GRAINLINE` in any of the nine piece blocks.
- **Direct product-source evidence:** the garment model has recipe-specific
  grainline rules resolved by `resolveGrainline`; legacy `src/export/dxf.ts`
  emits CUT, SEW and pattern marks, but not grainlines. Legacy DXF byte
  identities remain untouched.
- **Inference, not receiver evidence:** the missing grainline representation
  in this generic fixture is a plausible cause of DGS's nine warnings. The
  installed manual and dialog do not establish which DXF layer/entity or
  geometry DGS recognizes as a grainline, so this does not prove DGS's parser
  behavior or a universally defective receiver.

## Gate disposition

Rights/local evaluation and direct DGS access: **passed**. Exact receiver build
and import mode were pinned. This fixture/mode produced a warning and therefore
**failed the warning-free pilot criterion**. CUT/SEW numeric fidelity, marks,
identity/relationships, grades, malformed-input rejection, export, repeatability
and round trip remain **unproven**; none can be inferred from `9/9` or a
screenshot. No V03 gate passes and no acceptance/hold changes.

## Recommended next resolution

Prepare one source-derived, versioned G04 exchange-profile proposal: preserve
the legacy writer; in the new profile, emit each recipe's resolved grainline
as a LINE on a dedicated `GRAINLINE` layer inside its source-identified piece
block, alongside unchanged CUT/SEW and marks. Use actual source rule endpoints,
not guessed positions. Then test that single profile encoding through the same
DGS build, AutoCAD mode and frozen settings, with the distinct decisive gate
that the grainline warning clears while all source CUT/SEW geometry stays
within `0.001 cm`. This encoding is **not documented by GetonAgain** and is a
proposed empirical mapping, not a proven receiver convention; it needs the
maintainer's specific design approval before implementation. Do not claim that
passing the grainline check would pass other V03 gates.

## Verification and slice accounting

- Start: 2026-10-10 07:44 UTC from clean S660 commit
  `f2293d8fa26d6ba4650358e100bc2deae2133147`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S660 was highest; S661 was unique. The board was revision 3838 at start and
  the S661 evidence/comment records were applied before copy/import.
- Source copy is byte-identical to S648: 153,647 bytes and the same SHA-256.
- No production code or test changes. Validated S661 start/exit commands
  advanced the board from revision 3838 through 3850; G04-V03 and EPIC-17
  remain In Progress and every technical gate remains open. S661's focused
  Control Center suite passes 42/42 and `git diff --check` passes; no code
  coverage applies.
- No agent delegation/wait or maintainer decision time in this slice. Elapsed
  time 9m17s (07:44–07:53:17 UTC): implementation 0m; focused verification
  about 1m; UI import/render inspection about 2m; independent parser/source
  diagnosis about 2m; durable records and board closeout about 4m; external
  waits 0m; maintainer-decision time 0m.
- DGS remains open with the imported document/error visible; it is still needed
  for the next approved profile test. No exported DXF exists.

Next action: derive exact grainline endpoints for the hash-pinned Polo M
fixture from the referenced source revision and product rules, then prepare a
single versioned-profile mapping proposal for maintainer decision. Do not
implement the new profile or run a second import until that decision. V03,
all-seven recipe/option/grade acceptance, `0.001 cm`, legacy DXF identities,
full final gates, safe merge and deployment remain unchanged.
