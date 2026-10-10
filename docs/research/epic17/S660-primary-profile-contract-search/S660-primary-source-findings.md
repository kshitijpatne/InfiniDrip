# EPIC-17 / G04 V03 — primary profile-contract source search — Slice 660

## Question and result

Does an already-checked, freely accessible primary technical source define a
GetonAgain ASTM/AAMA, TIIP, or AutoCAD DXF import contract closely enough to
bind its entities and identity/relationship data to an existing G04 fixture?

**Result: no.** The receiver remains an empirical candidate, not a standards-
conformant profile. This source search did not find a reason to abandon the
candidate: its exact import behavior, geometry, marks, and round-trip are still
untested. The user has authorized bounded evaluation and confirmed product-
development use/local file handling. The live application is now past the
registration screen, but the current CAD document is empty.

## Primary sources checked

| Source | What it establishes | What it does not establish for this receiver |
|---|---|---|
| GetonAgain, [Garment CAD V2024.1](https://www.raiseagaintech.com/CAD_Software/garment_CAD/274.html) and [Free Version listing](https://www.raiseagaintech.com/CAD_Software/garment_CAD/509.html) | First-party product pages advertise import of DXF(AAMA/ASTM/AUTOCAD), and expose an instruction-manual link. | No DXF database version, menu-to-edition mapping, entity/layer role map, units/precision contract, identity/grade relationship schema, or round-trip guarantee. A menu label is not a conformance declaration. |
| ASTM, [D6673-01](https://store.astm.org/d6673-01.html) public catalogue summary | The historical practice uses DXF and specifies AutoCAD Version 13 for the pattern exchange file, with a separate ASCII grade-rule table. Its scope explicitly excludes relationships between pattern pieces and correspondence between 2D/3D sewn-piece geometries. The page presents the text as historical, not a current active edition. | Public summary is not the full normative entity/layer specification, does not map DGS's `ASTM/AAMA` choice to D6673-01, and does not supply the piece/seam relationship contract G04 requires. It is not evidence that the installed receiver conforms. |
| ASTM, [textile standards catalogue](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html) | Lists D6673-10 as withdrawn in 2019. | Does not establish an active replacement or GetonAgain's implementation. |
| NIST, [Data sharing implementation based on the information model for apparel pattern making](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf) and the [apparel data-exchange technical report](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=821391) | Historical research records the AAMA-292 / DXF effort and its interim status in the 1990s. | It is historical background, not a current receiver contract or evidence of vendor implementation. |

## Current desktop observation

At 2026-10-10 07:38 UTC, Computer Use directly inspected both returned
windows. DGS is open on a blank CAD workspace (`noname.DGS`, status `0/0`);
GMS is open as `Untitled` behind it. Neither has a registration or sign-in
dialog. The user reported signing in, and the live workspace is past that
screen; the UI does not reveal account identity and no CAD pattern is loaded.
This proves access to the local workspace, not any DXF exchange. S659 remains
the latest verified local route: DGS
`VID:20250610`, local `DXF Files (*.dxf)` picker, observed `ASTM/AAMA`, `TIIP`,
and `AUTOCAD` menu modes; export is disabled until a pattern exists.

## Source-exact empirical hypothesis and measurement readiness

Do not make an ANSI/AAMA or ASTM conformance claim. The two read-only reviews
agree that the next test should not use the apparel-labeled `ASTM/AAMA` mode
without evidence it accepts this generic input. The bounded test hypothesis is
the observed DGS `AUTOCAD` import mode for S648's generic AC1014 DXF, pinned to
DGS `VID:20250610` and executable SHA-256
`97CBBEFCAAD74EF558D19695F898611F7FE0E8E503525D0832EECAC01C859EB0`. This is
only a falsifiable input/mode choice, not a compatibility conclusion.

The exact S648 input is
`C:\G04-CLO-DXF-Exchange\S648-getonagain-fixture-preflight\Input\polo-m-idr-profile-r14-first.dxf`,
153,647 bytes, SHA-256
`ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461`.
Read-only preflight confirms the file exists and its hash matches S648. The
independent MIT `dxf-parser@1.1.2` package under
`C:\G04-CLO-DXF-Exchange\Tools\open-patterns-astm-parser\node_modules\dxf-parser`
parsed it with nine top-level INSERTs, 11 named blocks, and 56 nested
entities. This is the underlying standalone DXF parser only; the previously
rejected Open Patterns converter is not reused. The parser can serve as an
independent source/re-export coordinate and entity reader. It cannot expose
DGS's private pre-export model. Therefore, compare the source with the actual
re-exported DXF for end-to-end round-trip fidelity and retain DGS whole/detail
views for readable output. If the export does not contain enough numeric data
to check `0.001 cm`, stop as an evidence-capability blocker rather than infer
fidelity from screenshots.

S648 includes named piece blocks and custom revision/piece XDATA, but has no
version-matched C04 seam/grade relationship sidecar. C04 permits an
integrity-bound, version-matched sidecar where the format lacks relationships;
prepare and verify that binding before claiming piece/seam/grade relations.
The sidecar cannot compensate for missing geometry or visible marks.

Freeze one import mode/settings only: Pattern, Import text on, Grainline
2-way, Unit of file, Only base size off, Recognize seam on, Nest pattern off
(the manual advises avoiding nesting for fidelity checks). Do not rotate,
scale, repair, or vary modes/encodings. On a valid import, inspect the export
dialog once; the S653 manual says RUL output omits quilt/sew lines, so a route
used to assess required SEW geometry must not use an RUL export that omits
those paths. Any result is limited to this exact input/build/mode/settings.

All exchange files remain confined to the named C: exchange folders. S660
created no import/export files and changed no production code or DXF.
