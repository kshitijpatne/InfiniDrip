# S476 OpenCode profile and layer research

## Handoff and review

OpenCode completed a read-only research handoff using the required
`opencode/muse-spark-1.3-contributor-free` model at `xhigh` in normal build
mode. It did not inspect or change local files. Codex waited for its explicit
`WORK FINISHED` signal, then reviewed the cited claims against S475's observed
DXF and the official-source findings already recorded for S476. The result is
an independent research input, not a product compatibility certification.

## Findings

- CLO Help lists `DXF-AAMA`, `DXF-ASTM`, and `Standard DXF` as UI format
  choices, plus separate scale, rotation, size-format, grading, and notch
  settings. The reachable article does not provide a conformance certificate,
  receiver-acceptance statement, release-version requirement, or numeric layer
  semantics table. Source: [CLO 2D Pattern DXF Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export).
- ASTM's public D6673-04 record describes an apparel 2D pattern exchange
  practice and states that AutoCAD Version 13 DXF is to be used. ASTM lists
  D6673-10 as withdrawn in 2019 with no replacement. The full standard text is
  paywalled; its detailed layer/entity provisions were not independently
  checked. Sources: [ASTM D6673-04](https://store.astm.org/d6673-04.html),
  [ASTM D6673-10](https://store.astm.org/d6673-10.html).
- Autodesk identifies `AC1009` as AutoCAD R11/R12 and `AC1012` as R13. Its
  `INSUNITS` definition uses zero for unspecified units; the CLO outputs have
  no `$INSUNITS` variable. Thus the observed `DXF-ASTM` menu setting, AC1009
  header, and external centimeter choice do not by themselves prove D6673
  conformance or embedded units. Sources: [Autodesk DXF reference](https://damassets.autodesk.net/content/dam/autodesk/www/developer-network/platform-technologies/autocad-dxf-archive/acad_dxf_2006.pdf),
  [Autodesk INSUNITS](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm).
- The CLO article does not authoritatively map numeric layers `1`, `8`, `14`,
  `84`, `85`, `87`, `2`, `7`, or `15`. Do not assign semantics based on the
  trial file. The full D6673 text may contain relevant mappings, but that was
  not verified in this research.

## Limits and effect on G04

This does not qualify CLO as the selected G04 V03 receiver/profile or establish
factory acceptance. It confirms that any “ASTM” characterization must stay an
observed CLO menu choice unless a separate rights-reviewed profile and
independent round-trip validation justify a more exact claim. Layer semantics,
unit signaling, current-standard status, and target-CAD acceptance remain
unproven. V03 gates and claim limits are unchanged.
