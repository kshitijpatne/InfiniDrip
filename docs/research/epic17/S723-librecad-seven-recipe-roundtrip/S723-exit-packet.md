# EPIC-17 / G04 — S723 seven-recipe LibreCAD round trip

## Result

S723 ran the existing LibreCAD 2.2.1.5 **DXF 2000, Save As once** route on a current-source M-size package from each of the seven supported recipes. The current `GARMENTS` registry contains Tee, Fitted, Tank, Polo, Woven shirt, Skirt, and Trouser; there is no separate Woven-trousers recipe. Inputs, manifests, receiver returns, generator and audit report are retained only in `C:\G04-CAD-Interchange\S723-librecad-seven-recipe-roundtrip\`.

The existing `auditDxfInterchangeRoundTrip` reports **7/7 pass**, with source identity and input hash bound in each row, centimeter declaration retained, piece names, CUT/SEW outlines and construction marks retained, and maximum measured geometry delta of 0.000 cm for every tested contour. Recipe results:

| Recipe | Revision | Pieces | CUT/SEW outlines | Mark entities | Max delta |
| --- | --- | ---: | ---: | ---: | ---: |
| Tee | `ba2dfa2244717328834abb77d0f4e7e76b2a63c94f59618c7dd6ff1e152ded0d` | 3 | 6 | 26 | 0.000 cm |
| Fitted | `0abe7703349420f35e75343c9f051d926ee7bfa278b00e6c5ed8fba847cc501a` | 3 | 6 | 26 | 0.000 cm |
| Tank | `0e5af88c9e733858640563c0db5bc5770a0f000e65fddd64c85e1974931801d1` | 2 | 4 | 15 | 0.000 cm |
| Polo | `4d61e504b2d006dce52a502c81915189018e362d246f6e533e20881d5f8fd999` | 9 | 18 | 111 | 0.000 cm |
| Woven shirt | `a0713005fba92b54cfdb03d9475cd0b73d9fb22a4b851b539deef9709f112eec` | 12 | 24 | 111 | 0.000 cm |
| Skirt | `1edaaaebc104eb76e6326792385565f213e33b6b38305a400a66e2e8692d5eb3` | 3 | 6 | 21 | 0.000 cm |
| Trouser | `78167b04ab1ab7b896210309f5a969fb342665669c8f471e2ce39d63c4ebaf86` | 9 | 18 | 103 | 0.000 cm |

The seven saved **return files** were reopened and visually inspected in LibreCAD; the pieces and returned CUT/SEW/MARK layer set were visible. Trouser remains visibly crowded/crossing in its current arrangement; this is an existing V02 output/readability hold and is not a DXF transfer failure. Polo and Woven also retain their recorded V02 presentation holds; this slice does not relax or clear them. Tee, Fitted, Tank, and Skirt reopened with their returned outlines and marks visible. Review was performed on the actual saved returns, not only the source drawings.

## Gate effect and limits

- **New evidence:** representative M-size geometry, units, identity, semantic layer/mark retention and reopened display pass for all seven recipes on this exact receiver/version/profile.
- **Still unproven:** 73 supported option/grade rows; extreme-option visual review; a second semantic round exchange; and final settled full-repository/release gates.
- **Separate product check:** malformed/unsupported input handling passed the tested local auditor/panel cases in S716–S718; that is not a LibreCAD property and does not prove every negative case for a round-trip candidate.
- **Still held:** any V02 view with a recorded crossing, seam, join, residual, or readability failure. S723 neither alters nor clears these holds.
- **Claims:** this is measured empirical compatibility only for LibreCAD 2.2.1.5 with the documented DXF 2000 Save As route. It is not an ANSI/AAMA, ASTM, industrial-CAD, factory, physical-fit, or general-CAD conformance claim.

The returned files differ in byte length from their inputs, as expected for a receiver rewrite; semantic geometry/content equality, not byte identity, is the exchange criterion. Legacy export byte identity remains an independent protected product regression gate.

## Verification and time

- Receiver: LibreCAD 2.2.1.5; each generated input opened and saved once as DXF 2000; each return reopened from the `Output` folder in the same session.
- Focused verification: existing source-bound round-trip audit, seven rows all pass; visible UI review of each returned drawing; board command-layer tests and diff checks recorded below. No production code or tests changed, so changed-code coverage was not applicable. No full repository gate is due before the 73-row candidate settles.
- The audit script emitted a non-fatal Vite pre-transform warning while importing the source auditor by file URL, then exited successfully and produced all seven structured rows. This is a harness diagnostic, not a receiver failure; resolve the invocation through a repository-supported runner before treating later automated matrix output as final evidence.
- Start: 2026-10-11 04:58:08 UTC from S722 `eb40e204dba555516029fe00d80515152c80a50a`.
- Closeout: 2026-10-11 05:12 UTC. Implementation/receiver exchange and fixture generation: 10m; focused audit and rendered reopen review: 4m; external reviewer waits: 0m; maintainer decision time: 0m. Timing is approximate.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Existing untracked S700 coverage diagnostics are untouched.

## Next step

Reserve S724 and use the same LibreCAD route and existing 73-row option/grade matrix, with no new application, format, or setting variation. First eliminate the file-URL harness warning through a direct repository-supported runner; then audit the complete matrix and perform one semantic repeat comparison. Preserve exact outputs and any failed row in the C: evidence folder. V03 remains In Progress and the goal remains active.
