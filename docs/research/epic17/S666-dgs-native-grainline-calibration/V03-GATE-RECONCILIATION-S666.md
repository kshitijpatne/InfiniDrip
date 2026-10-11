# V03 gate delta after S666

S665's complete row-by-row matrix remains the baseline at
`../S665-v03-gate-refresh/V03-GATE-RECONCILIATION-S665.md`. This delta updates
the calibration, warning, and rendered-output rows only; all other S665
statuses remain unchanged.

| Gate | Status after S666 | Strongest evidence | Shared cause / next proof |
|---|---|---|---|
| Source fixture geometry and units | **Source pass; receiver unproven** | Independent parser: one closed 20×30 cm CUT, zero explicit grainline entities; exact source hash recorded. | No source ambiguity. DGS Pattern rendered unexpected internal strokes and warning; S667 Design mode distinguishes importer path. |
| Warning/loss-free import | **Failed for exact DGS AutoCAD/Pattern candidate** | One exact DGS row after import and again after selected-pattern native recreation: “grainline is outside the border, please check again.” Source has no GRAINLINE entity. | Same observed warning appears for S661 no-grainline and S664 source-line candidates. Receiver interpretation is unproven; S667 tests only the separate documented Design import mode. |
| Geometry, unit scale and 0.001 cm | **Unproven** | Source dimensions and file units pass; DGS render is not a measurement and contains unexpected strokes. | Requires a clean, measurable receiver representation and independent output parse. Stop on first miss. |
| Grainline entity/layer/ownership | **Unproven** | Canvas shows a centered two-way marker despite zero source grainline entities; Ctrl+R recreation leaves same display and warning. | No DGS-saved native entity or output DXF exists. Do not infer encoding from the icon. |
| Export and round trip | **Unproven; not attempted** | Import never passed its warning-free stop. | Only after a clean and measurable Design candidate may one No RUL export, parse and reimport be attempted. |
| CUT/SEW/marks, identity/relations, grade/options, invalid-input behavior, repeatability | **Unproven or previously failed as in S665** | No receiver output; S665 cites the strongest source/CLO/OpenCAD records for each gate. | Dependent on one stable receiver profile; do not re-test before a candidate passes. |
| Rendered readability | **Failed for this import view; broader status unproven** | Hashed actual DGS screenshot shows warning overlay and unexpected large strokes. | S667 must show intact, recognizable geometry before further pilot. |
| V02 prerequisite | **Passed** | S459's 7 recipes, 73 configs and 146 front/back faces, with later view fixes; V01/V02 are Done. | No rework absent an actual receiver-output defect. |

No acceptance gate is waived or pre-passed. The word “grainline” inside the
input's lowercase piece ID does not change the parser result: no explicit
GRAINLINE entity exists. It is not identified as the receiver-warning cause.
