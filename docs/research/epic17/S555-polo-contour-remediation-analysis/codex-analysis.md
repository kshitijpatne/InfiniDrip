# S555 Codex source and DXF-structure findings

## Directly observed

- `src/export/dxf.ts` describes a minimal R12 text DXF. It rounds each coordinate to `0.001 cm` and emits closed old-style `POLYLINE` contours (`70=1`) with one `VERTEX` record per point; cut/sew roles are placed on separate `CUT`/`SEW` layers.
- S552 maps five deleted Polo CUT vertices. Their incoming edge lengths are `0.04562–0.04696 cm` (45.6–47 rounding increments), turn is `16.28–17.39°`, and deviation from the replacement chord is `0.012736–0.013970 cm`, 12.7–14 times the unchanged `0.001 cm` limit.
- S536 converted the same coordinate/layer/closure sequences into R2000 `LWPOLYLINE` and declared millimeters; CLO still omitted the same five vertices. That exact encoding swap is already a failed trial.
- S518's native project save succeeded but its proprietary payload could not be measured by the available parser. S503/S519/S522 cover the already-tested CLO point/optimization controls; S545/S551 show repeat losses across cm and mm; S553 shows Standard and AAMA output residuals identical on the same imported workspace.

## Primary DXF reference notes

- Autodesk's [POLYLINE reference](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-ABF6B778-BE20-4B49-9B58-A94E64CEFFF3.htm) defines group 70 bit 1 as closed, bit 2 as curve-fit vertices added, and bit 4 as spline-fit vertices added. These are curve-fitting semantics, not a flag that tells a receiver to preserve an otherwise dropped corner.
- Autodesk's [VERTEX reference](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-0741E831-599E-4CBF-91E1-8ADBCFD6556D.htm) defines vertex flags for curve-fit/spline-fit generated points and tangent/control-point cases; it does not define a required/preserve-this-vertex attribute.
- Autodesk's [LWPOLYLINE reference](https://help.autodesk.com/cloudhelp/2015/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm) defines repeated coordinate pairs per vertex, optional bulge values, and closed/plinegen flags. The entity-type change itself was already tested in S536.

## Assessment before independent review

- More decimals could encode a closer coordinate approximation, but no primary evidence says it disables CLO's observed point loss. The shortest input edge is already over 45 current rounding increments; precision change has no demonstrated causal link.
- Curve-fit/spline-fit flags or SPLINE entities alter how a curve is interpreted and do not preserve a straight-segment polyline path by definition. A claim that they would maintain the exact cut path would require a separate geometric proof; the profile receiver could also ignore or reinterpret them.
- A separate POINT or duplicate mark cannot reinsert a missing vertex into the closed contour. Breaking the outline into standalone LINE entities would no longer be the same closed-polyline representation; apparel-profile association and receiver reconstruction are unproven.
- No new CLO setting, unit, precision, or entity-type trial is justified yet. Wait for independent Opus review. Preserve all V03 holds and do not change geometry, tolerance, baseline, or acceptance.

## Independent Claude Opus 5.5 review

Claude Code CLI 2.1.283 completed the read-only review on the detached branch
`claude/slice-555-polo-remediation-review` and returned the explicit
`WORK FINISHED` signal. It independently found no justified new CLO trial.
The reviewer could not fetch the CLO help page (403) or Autodesk reference
in its session and did not read the C: JSON report files; its conclusion used
the repository source and prior packets. Codex separately verified the
Autodesk DXF definitions using the official references linked above and
reviewed the local C:-only S536 evidence and S552 exact point map. The
reviewer's notes about flag semantics are therefore treated as its inference;
the official Autodesk definitions above are Codex-verified evidence.

The combined finding is limited: the corner loss is within CLO's tested
import/save/export path, but S518 still cannot attribute it to import or
export. No public or source evidence establishes a CLO vertex-retention
mechanism. Extra precision, fit/spline flags, entity substitution, and
companion points have no evidence-backed path to an identical closed garment
outline; do not test them by guesswork.

Review execution note: the first Claude CLI attempt hit its 16-turn ceiling
without findings or a completion signal and was not accepted as a result. A
bounded `-p` run using the same requested model completed and returned the
required signal. No files were changed by the reviewer.
