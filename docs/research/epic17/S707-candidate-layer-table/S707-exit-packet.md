# EPIC-17 / G04 V03 — S707 exit: layer-table hypothesis falsified

## Result

S707 added deterministic R2000 `LAYER` table records to the opt-in named-piece
DXF package and ran the planned single LibreCAD 2.2.1.5 Drawing Exchange DXF
2000 save, close/reopen, and visual inspection on the generated Polo M
candidate. LibreCAD retained the table—including an unused `CUT` entry—but
saved all nine cut-outline entities on layer `0`. The proposed table-only
correction did not preserve semantic CUT assignment. This is a measured
failure of that narrow source-format hypothesis, not a reason to repeat or
vary the LibreCAD route.

## Exact evidence

- Candidate: `C:\G04-CAD-Interchange\S707-candidate-layer-table\polo-m-buttonhole-cross.dxf`, 211,032 bytes, SHA-256 `f0d8e6d7161dd9b4245c571920bfa19b67689d4a3ed77d690fc208b417842e36`.
- Returned DXF: `C:\G04-CAD-Interchange\S707-candidate-layer-table\polo-m-librecad-roundtrip.dxf`, 212,083 bytes, SHA-256 `88d531281941513947c1a79e1199393d1a2579d775d83b329600b07d75ac5463`.
- Independent parsed comparison: `C:\G04-CAD-Interchange\S707-candidate-layer-table\S707-r2000-analysis.json`.
- Rendered clean-reopen evidence: `C:\G04-CAD-Interchange\S707-candidate-layer-table\polo-m-librecad-reopened.png`.
- Candidate and return both identify all nine Polo M pieces/revisions. All 18 CUT/SEW paths are closed and have 0.000 cm XY residual. All 111 typed marks are within 0.001 cm. Both declare centimeters (`$INSUNITS=5`). The saved return reopened and rendered without warning.
- The 11 source layer names, including `CUT`, remain declared after return. However, the returned semantic-layer counts show 0/9 cut outlines on `CUT` and 9/9 on `0`; this fails the unchanged layer gate. The screenshot shows the reopened whole drawing and layer tree, but does not prove full readability across recipes/options/grades.
- LibreCAD is a generic CAD receiver. No industrial-apparel profile, ANSI/AAMA/ASTM conformance, or rights qualification is claimed.

## Gate delta

| Gate | S707 result | Remaining proof |
|---|---|---|
| Rights/local handling | Passed for this bounded local evaluation per recorded maintainer authorization | No broader rights or profile claim follows. |
| Piece/revision identity | Passed for this Polo M fixture | All seven recipes, supported options and grades. |
| CUT/SEW geometry | Passed for this fixture; 18/18 at 0.000 cm | All-seven/options/grades and a qualifying profile. |
| Units | Passed for this fixture; cm declaration retained | Breadth and qualifying-profile evidence. |
| Typed marks | Passed for this fixture; 111/111 within 0.001 cm | Breadth and full output review. |
| Semantic layers | **Failed**; the table survives, but all nine CUT entities return on layer `0` | A source-side correction must be demonstrated against a specific entity-level cause; no criteria relaxation. |
| Clean reopen | Passed for this fixture | Complete readability matrix. |
| Industrial apparel receiver/profile | **Unproven/not qualified**; this LibreCAD route cannot establish it | Existing route evidence/rights/profile decision must satisfy admitted gate; no more app candidates are started by this slice. |
| Malformed-input rejection | Unproven | Existing candidate verifier negative cases and the admitted receiver path. |
| Repeatability | Unproven | Deterministic repeat round-trip evidence on the chosen route. |
| Protected legacy export identities | Preserved by code-test evidence so far | Reconfirm in the settled full gate. |

The layer-table experiment does not clear the V03 gate and does not change G04
acceptance, thresholds, option/grade breadth, protected output identities,
status, or cleanup requirements.

## Source and verification record

- Production change: `src/export/named-dxf-blocks.ts` now emits a sorted,
  deterministic R2000 layer table for the entity layers and rejects unnamed
  layers or an already-present `TABLES` section. This change is candidate-only;
  it does not alter legacy writers or cut geometry. The round-trip result
  falsifies its intended CUT-preservation effect, so retain it only if the
  follow-up source audit confirms that a declared but currently unused layer
  table remains useful and its contract is tested; otherwise remove it in a
  separately numbered slice without touching protected output identities.
- Tests added for table ordering, declared names/handles and invalid inputs.
- Focused candidate-package, centimeter, export and protected tests: 42/42;
  changed production file statement/branch/function/line coverage: 100%;
  `npx tsc --noEmit`: passed. (Recorded at the verified implementation
  boundary.)
- Native receiver: the exact saved return was reopened and visibly inspected
  in LibreCAD 2.2.1.5. The app remains open for the admitted exchange work.
- No full repository test/coverage gate ran; reserve it for the settled
  integrated Epic/PR candidate.
- No repository CAD input, return, screenshot, or generated local analysis
  output was added. All such material is in the named C: folder above.

## Next bounded action

S708 audits the already-existing candidate writer and exact S703 CLO DXF-ASTM,
S706 LibreCAD, and S707 LibreCAD evidence to isolate why only CUT outlines
change to layer `0` when saved from named blocks, while the other entities and
all geometry survive. Reuse those files and parser reports; do not run another
application, format, setting, or encoding trial. The audit must state whether
the source representation can preserve the semantic layer under the current
fixed gate and whether any existing receiver can satisfy the admitted
industrial-profile and rights gates. Implement a correction only if the
entity evidence supports it; verify focused behavior and rendered output, and
do not claim a gate passed from source reasoning alone. If no present route
can qualify, document the concrete minimal external prerequisite once, while
continuing every independent Epic closeout task. The current criteria remain
unchanged.

## Slice ledger

- Start: 2026-10-11 01:00 UTC, S706 `a5b196e34586f39a4d4ab2e3bb61146ba816f5c5`; `origin/main` was refreshed and was an ancestor. Start board revision 4154.
- Implementation: approximately 8 minutes; candidate-only table and tests.
- Focused verification/receiver inspection: approximately 12 minutes; results above.
- External-agent wait: 0 minutes. Maintainer-decision time: 0 minutes.
- Exit: 2026-10-11 01:25 UTC. Board closeout used validated commands from revisions 4156–4157; resulting board revision is 4158.
- Landed commit subject: `Slice 707: declare layers in candidate DXF blocks`.
