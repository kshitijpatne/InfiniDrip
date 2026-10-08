# S476 read-only OpenCode research handoff

## Task

Research authoritative evidence about the observed CLO 2026.1.310 DXF export
profile. Answer only what primary sources support:

1. Does CLO's UI label `DXF-ASTM` claim conformance to ASTM D6673, or only
identify a CLO export mode? Cite current official CLO documentation and the
ASTM record.
2. Compare CLO's observed AC1009 output with the D6673-04 scope/version claim
and Autodesk's AC1009/AC1012 table. State what can and cannot be concluded;
do not infer full standard compatibility from a header code.
3. Search CLO's authoritative manuals/support material for any numeric DXF
layer/line-type mappings that can distinguish CUT, SEW, seam allowance,
notches, grainlines, foldlines, button/buttonhole, placement lines/points,
or labels. Give exact sources and version applicability. If no source is
found, report no authoritative mapping rather than guessing from examples.

## Evidence supplied

- Trial receiver: CLO 2026.1.310 (r58944), local evaluation only.
- Actual S475 Tee output: AC1009, no $INSUNITS declaration, multiple
coincident representations across numeric layers; the repository packet is
`docs/research/epic17/S475-clo-tee-roundtrip/S475-exit-packet.md`.
- S476 actual outputs are outside the repository under
  `C:\G04-CLO-DXF-Exchange\Output` and are not to be uploaded or copied.
- Official sources already checked by Codex: CLO DXF help
  https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export;
  ASTM D6673-04 https://store.astm.org/d6673-04.html; Autodesk DXF header
  variables https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm.

## Constraints

- Read-only research; do not modify repository files, launch CLO, or access
  the C: receiver artifacts.
- Use primary/official sources for factual claims and cite direct URLs, title,
  publication/version/date when available, and the specific supported claim.
- Clearly label evidence, inference, and unknowns. Avoid compatibility or
  conformance claims not established by evidence.
- Return a concise report ending with the exact phrase `WORK FINISHED`.
