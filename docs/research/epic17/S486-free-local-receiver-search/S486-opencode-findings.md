# Slice S486 — OpenCode candidate research findings (read-only)

Scope: at most three NEW free/local apparel-CAD receiver candidates, excluding
CLO, Richpeace V8 / Super V8 / V10, Pixie Space, GetonAgain, Seamly2D,
OpenMarker, garment.dev, Open Patterns, Valentina, LibreCAD, and every other
candidate assessed in S465–S485. Unknown is OPEN, never pass. Generic DXF
labels are not apparel-profile evidence. No download, install, account,
fixture, vendor contact, or hosted-CAD use occurred. All sources below are
primary publisher/project pages, accessed 2026-10-08.

## Candidate gate table

| Gate → / Candidate ↓ | Exact build/version | Windows 11 support | License / evaluation rights | Local-only input/output | Apparel DXF import AND export | Documented profile / units / layers | Round-trip + grade / negative behavior |
|---|---|---|---|---|---|---|---|
| **A. FreeSewing (freesewing.org)** | Website; latest noted release 4.10 (Sasha). No installed build — FAIL as installed receiver | N/A (browser service); no Windows installer — FAIL installed-receiver premise | Open-source code (Codeberg) BUT account-backed hosted service with Sign In — FAIL hosted exclusion | FAIL: hosted online editor; its docs say it stores settings and measurements, not the pattern itself, and users download PDF or SVG copies for local archiving | FAIL: documented export is PDF or SVG only; no DXF import path (generator, not receiver) | FAIL: no AAMA/ASTM profile, units, or layer map documented | FAIL/OPEN: no receiver round-trip, grade-rule, or malformed-input evidence |
| **B. GarmentCode (ETH Zurich IGL research framework)** | `pygarment v2.0.0` (news 2024-08-30); Python 3.9 library via pip/conda, no versioned Windows installer — FAIL as installed receiver | OPEN: install doc notes Windows cairo-DLL quirks; no Windows 11 support statement | MIT (framework code). No receiver evaluation terms because it is not a receiver — OPEN, not rights evidence | Local Python execution, but there is no receiver I/O path to clear — not applicable | FAIL: outputs are JSON/SVG/simulation; no DXF/AAMA/ASTM import or export documented | FAIL: no apparel exchange profile, unit declaration, or layer mapping documented | FAIL: no round-trip, grade-rule interchange, or negative-input behavior documented |
| **C. Wild Ginger Cameo v8** | Exact version identified: Cameo v8 — PASS version identity | OPEN: publisher requires Windows (even on Mac) but no Windows 11 statement found on pages checked | FAIL free gate: Pattern Design $950, Grading $950, Made to Fit $950; only a limited FREE Demo; 15-day money-back paid product | OPEN: desktop software, but local-only file handling not documented on pages checked | FAIL apparel gate: Import/Export is "standard AutoCAD DXF format" (generic); no AAMA/ASTM direction documented. Publisher disclaims interoperability ("check with the manufacturer") | FAIL: no AAMA/ASTM profile, declared units, or layer semantics documented | OPEN: paid grading/marker modules exist but no documented representative round-trip, grade-rule interchange, or negative behavior |

## Primary-source URLs (all accessed 2026-10-08)

- FreeSewing homepage (open-source claim, Sign In, account model):
  `https://freesewing.org/`
- FreeSewing "Your Sewing Patterns" (account-stored settings; archive via
  "download the pattern as PDF or SVG"):
  `https://freesewing.org/docs/about/site/patterns`
- FreeSewing "How to generate bespoke sewing patterns" (online editor; view
  menu "Export pattern: Allows you to export the pattern as PDF or SVG";
  no DXF import/export):
  `https://freesewing.org/docs/about/site/draft/`
- GarmentCode repository (MIT; "modular programming framework for designing
  parametric sewing patterns"; `pygarment v2.0.0` news 2024-08-30):
  `https://github.com/maria-korosteleva/GarmentCode`
- GarmentCode installation doc (Python 3.9, pip/conda, `svgwrite`/simulation
  outputs; no Windows installer, no DXF receiver):
  `https://github.com/maria-korosteleva/GarmentCode/blob/main/docs/Installation.md`
- Wild Ginger Cameo v8 page ($950 Pattern Design / $950 Grading /
  $950 Made to Fit; "Export to standard AutoCAD DXF format"; FREE Demo):
  `https://www.wildginger.com/cameo/default.htm`
- Wild Ginger Cameo Import/Export Options ("Import/Export - standard AutoCAD
  DXF format"; "You may be able to open DXF files exported from Cameo into
  programs such as Gerber, Lectra, Assyst, and Optitex. You will need to
  check with the manufacturer"; no AAMA/ASTM):
  `https://www.wildginger.com/cameo/cameoexport.htm`

## Direct claims and limitations (no inference beyond the pages)

- FreeSewing exports PDF/SVG only per its own editor docs; it imports
  measurements/design options, not DXF fixtures. It is an account-backed
  hosted service, so it is excluded twice over (hosted; not a receiver).
- GarmentCode is a Python research framework for *generating* parametric
  patterns (JSON/SVG/simulation). A repository-wide search for DXF
  exchange surfaced no GarmentCode DXF/AAMA/ASTM evidence; it documents no
  receiver, profile, round-trip, grade, or negative behavior.
- Cameo v8 is real Windows apparel CAD with grading, but it is a paid
  product ($950/module) whose only documented DXF path is generic
  "standard AutoCAD DXF" with an explicit non-guarantee of third-party
  import. Generic DXF is not an apparel profile; price alone fails the
  no-cost rights gate.
- Screened but NOT counted: a search-index excerpt for `openclo`
  (`sssamuelll/openclo`, "AAMA/ASTM D6673 layer mapping … round-trip
  capability") could not be verified — the primary repository URL
  returned 404 on direct fetch (2026-10-08). Unverifiable leads are OPEN,
  never pass, and are not candidates.

## Conclusion

**No lead qualifies.** None of the three new candidates satisfies the V03
gates (rights-cleared + locally installed on Windows 11 + documented
apparel exchange profile + exact local-file handling + representative
round-trip with grade/options + negative behavior). All V03 gates are
preserved unchanged; S485's Super V8 disposition stands; no receiver or
profile is selected and no compatibility, ASTM-conformance, production-
readiness, or factory-acceptance claim is made. Next: continue only toward
an already accessible rights-cleared local receiver or an explicitly
approved inspection whose Gate 0 may prove an additional local apparel
export path.
