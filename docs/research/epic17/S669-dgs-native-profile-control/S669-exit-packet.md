# EPIC-17 / G04 V03 — DGS native ASTM control — Slice 669 exit

## Result

The installed DGS tree contained no DXF, RUL, PDF, TXT, XML, or CFG sample/profile file usable as an exchange fixture. The C:-only inventory is `C:\G04-CLO-DXF-Exchange\S669-dgs-native-profile-control\Evidence\local-install-file-inventory.csv` (SHA-256 `52D6B4C12B25F288709C3EBBCB7D85E99031589465FC9459CB53F2E3CFF75652`).

One native 100×100 mm rectangle (10×10 cm) was created and saved as `Input\g04-dgs-native-control.DGS`. DGS's own validator reported: `[1]Pattern name,Size:M,grainline is outside the border, please check again.` M is the reported default size; the validator explicitly flags the pattern name and outside-border grainline. The control therefore was not a valid positive pattern. It was nevertheless exported exactly once through the observed ASTM export path to `Output\g04-dgs-native-control.dxf`, then that exact output was imported exactly once into a fresh DGS document using ASTM/AAMA, Pattern, Import text on, 2 Way grainline, Unit of file, Point Ignore, Only base size off, Recognize seam on, Nest pattern on.

The output is 1,227 bytes, SHA-256 `92EEEB3623EEAF32917309455C84A6332AAAAACC9B26570FBEAD2B7B42C5CBEC`. Independent `dxf-parser@1.1.2` parsing finds 10 `TEXT` entities, all on layer `1`; zero piece geometry, zero blocks, no `$ACADVER`, and no `$INSUNITS`. It contains vendor/style/date/author/product/version/sample-size/rule-table/metric/tolerance text only. The actual self-import completed without an error dialog but rendered a blank canvas and registered `0/0` patterns. The saved render is `Evidence\S669-self-import-blank-render.jpg`, SHA-256 `6A9779201D84B6ED9A417A184D96395AC3C53A76E276B28C15152AC48B04E12C`.

This result does **not** expose a passing DGS profile contract: the native pattern failed DGS validation before export and the export omitted all geometry. It does, however, establish an actionable product fact in combination with S667–S668: the source-derived `/2` Polo fixture is not registered by either tested DGS route (S668 ASTM/AAMA Pattern: blank, 0/0), while S667's AutoCAD/Design export loses identity, layers, scale and geometry; no installed sample contract exists. The DGS candidate is retired. Do not repeat its import/export or try another decoder, setting, entity encoding, or mode.

## Gate disposition

| Gate | Status after S669 | Evidence / next proof |
|---|---|---|
| CLO trial rights and local handling | Passed for bounded evaluation | Maintainer's written confirmation in `docs/PROJECT-DECISIONS.md`; files remain C:-only. |
| DGS rights/build/local route | Passed for bounded evaluation | Installed `VID:20250610`, local import/export dialogs. This does not qualify an exchange profile. |
| Exact receiver/profile and standards status | Unproven | DGS menu labels are not conformance evidence; DGS routes retired. CLO can be described only as a vendor-specific empirical DXF-AAMA route. No ANSI/AAMA or ASTM claim. |
| Units/axes/scale/precision | Failed for S667 AutoCAD/Design; unproven for a passing profile | S667 recorded `$INSUNITS` 5→4 without scale conversion (max physical miss 191.201177 cm). S669 output has no INSUNITS or pattern geometry. Keep 0.001 cm. |
| CUT/SEW geometry | Failed for measured CLO Polo routes; failed for S667 DGS export; unproven all-seven receiver cohort | S640: 4/9 Polo CUT pass, 5 fail before export; S643 ties the same failure to source vertices whose removal changes CUT by 0.012741–0.013974 cm. No source edit may remove them. |
| All seven recipes/options/grades and piece/revision/inter-piece identity | Unproven | V02's 7/73/146 result is not CAD evidence; CLO/DGS cohort or a different qualifying receiver must prove full matrix and sidecar binding. |
| CUT/SEW layers, marks, grainline and readable detail | Failed on specific CLO/DGS tests; otherwise unproven | S637/S639 CLO Woven mark errors, S640 geometry failures, S667 layer flattening, S668 blank import. Require actual source-bound detailed renders. |
| Malformed-input rejection | Failed on tested CLO/OpenCAD paths; unproven on a passing industrial profile | S531 and S626 are candidate-specific failures. Reuse negative fixtures only after a viable valid round trip. |
| Repeatability / round trips | Failed for tested candidates or unproven | CLO trials fail earlier gates; DGS self-export contains no geometry; OpenCAD's byte-repeatability is generic R14, not an industrial apparel route. |
| Legacy DXF / protected export identities | Passed to date; integrated gate pending | No production writer/baseline changed in S667–S669. Full final regression required after implementation. |
| V02 prerequisite | Passed | S459 accepts 7 recipes, 73 configurations, 146 faces; no exchange acceptance inferred. |

No V03 technical acceptance gate advances. All-seven/options/grades, rights/profile, exact geometry, marks, malformed, repeatability, rendering, protected byte identities and legacy behavior remain unchanged. No physical-fit, factory-acceptance or production-readiness claim.

## Next action: S670, targeted recovery of the control's native validity

S670 uses DGS's installed first-party instructions plus one bounded high-reasoning check to determine how to assign a valid native piece name and place its grainline strictly inside the 10×10 cm cut border. The grainline `/2` convention itself is approved; this check concerns only constructing a valid native DGS control. This is a different gate from trying another DXF representation: it tests whether the DGS exporter emits geometry when its own validator is clean. If a documented UI path exists, create one fresh minimal valid pattern and run one ASTM export/import self-control; stop on any validation warning or zero geometry. Do not touch the product fixture. If the installed first-party instructions do not establish the valid native pattern path, retire DGS entirely and move straight to the existing CLO candidate evidence and source-bound remediation decision; no more DGS work.

## Slice closeout

No production source, pattern recipe, accepted threshold, legacy DXF output, or protected byte identity changed; changed-production-code coverage is not applicable. The C:-only output parser passes and records 10 text/0 geometry entities; the actual self-import render is saved. Run `npm run control-center:test`, parser syntax check, and `git diff --check` before commit. Board start revision was 3936, S669's start commands ended at 3942, and the validated exit is board revision 3956; the packet, matrix and plan are linked to G04-V03 and EPIC-17 without changing G04 acceptance/status. Implementation: 0m; native UI and evidence capture: approximately 8m in this continuation; focused repository verification and closeout: approximately 4m including diagnosis of two stale-summary assertion failures and the passing rerun; external-agent waits: 0m; maintainer-decision time: 0m. The inherited start record's 10:13 UTC timestamp is later than the live system clock during this continuation, so elapsed wall time is intentionally not fabricated.
