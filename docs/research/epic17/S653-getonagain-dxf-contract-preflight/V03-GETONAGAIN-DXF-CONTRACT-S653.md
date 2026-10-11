# GetonAgain V2024.1 DXF contract preflight — Slice 653

## Decision at this evidence boundary

GetonAgain Garment CAD V2024.1 is **authorized for a bounded local evaluation**
under the maintainer's written-use/local-file confirmation and official Free
Version authorization recorded in `docs/PROJECT-DECISIONS.md`. The exact build
is not installed or verified, and no fixture has been opened. Do not call it a
selected or qualified G04 profile yet.

The first-party manual documents candidate modes and user-facing options, but
does not define the entity, layer, metadata, or sidecar contract needed to bind
InfiniDrip output to those modes. The next receiver step remains an installed-
build and dialog preflight; **do not import a pattern until the observed local
input path and exact accepted fixture contract are recorded**.

## Source inspected

- `C:\G04-GetonAgain-CAD-Exchange\S651\Garment_CAD_V2024.1_Manual.pdf`,
  SHA-256 `1AC8D9B390C21E205B94F14C4D08566CDA853974A460995CE5EBDEA752D1514C`.
- Its extracted text has SHA-256
  `8B499BE3AD7A45737F472E9792BB5285E5D0371A8CF11255B560B219D8680A38`.
- Printed manual pages 239–241 were visually inspected from the corresponding
  rendered pages (`manual-page-242.png` through `manual-page-244.png`); those
  render hashes are recorded in the S651 C-drive evidence folder.
- Relevant headings: “Import DXF file” and “Export DXF file”.

## What the manual establishes

| Area | Documented behavior | V03 implication |
|---|---|---|
| Import file modes | Import dialog offers `ASTM/AAMA`, Japanese `TIIP`, and `Auto CAD`. The text says ASTM/AAMA reads all patterns; Auto CAD can open a pattern or design line. | These are documented menu labels only. No DXF edition, entity grammar, conformance, or role/layer map is specified. Do not claim ASTM/AAMA conformance. |
| Import units and content | Dialog shows `Unit of file` or `Scale by mm` with a numeric factor; pattern/design-line choice; import text; only base size; recognize seam; nest pattern; grain-line choice; and point handling. | The visible choices are candidates for a single controlled profile. Their exact effects, default values, unit-header behavior, and source-role semantics must be observed/verified before pattern import. |
| Import grading | “Only base size” limits a graded input to its base size. Without it, the manual says all sizes are imported. If no RUL is present, optional nesting can nest non-base sizes into the base size; otherwise imported size data is read as given. | All-seven/options/grades acceptance cannot be inferred from the manual or a base-size pilot. Avoid the nest option for fidelity checks unless its role is separately justified. |
| Export file modes | Export dialog offers `ASTM`, `AAMA`, and `Auto CAD`; pattern selection can cover the selected pattern, work area, or all patterns of a style. Auto CAD mode exposes separate/overlap, output design line, output pattern, base size only, and outward-notch options. | Distinct vendor settings exist; a mode name is not proof of a standard. Record the exact build and chosen setting as an empirical profile only if all gates pass. |
| Export grading/marks | `Include RUL` emits a same-name RUL alongside DXF but does not output quilt/sew lines. If drill/buttonhole count varies by graded size, RUL output uses base-size counts. `No RUL` places contents in DXF and is described for quilt/sew-line output. Other toggles affect notch control points, grain-line rotation, and whether seam lines become assistant curves. | Grade-dependent mark counts are a documented limitation for this route. It must be tested against existing grade fixtures; do not rely on RUL for varying drill/buttonhole counts or silently accept omitted sew/quilt lines. Any sidecar must satisfy C04's version/revision binding and integrity requirements. |

## What remains unspecified

The manual does not identify the DXF database version for either mode; map
DXF entities to CUT/SEW/notch/allowance/marks; define layer names, order, or
color semantics; explain handling of splines, short segments, closed contours,
text/POINT/circle marks, XDATA, stable piece/revision IDs, or seam relations;
define a sidecar schema; or specify import/export coordinate precision and
round-trip guarantees. It also cannot prove that the installed desktop's
specific file path remains local; that claim currently rests on the
maintainer's written confirmation, and must be checked against the actual
desktop workflow before exchanging data.

## Ordered next action and stop conditions

1. The maintainer manually approves the still-live Windows consent prompt; the
   Computer Use policy forbids Codex from operating security prompts.
2. Verify the installed application/build without launching a second setup.
   Stop before authentication; do not create an account or enter credentials.
3. Inspect the installed desktop's DXF open/save route and import/export
   dialogs without selecting a pattern fixture. Confirm a direct local file
   path. If the application requires online registration/login or a cloud
   conversion for DXF, stop and report the observed requirement.
4. Compare the exact observed mode/version contract to existing source-exact
   fixtures and C04 sidecar constraints. Only if one match is supportable,
   freeze one representative Polo M fixture and perform one pre-export pilot
   with declared units and no rotation, scale override, geometry repair, or
   threshold change. A failed gate ends this exact candidate route; do not
   cycle through modes or encodings without a distinct evidence-based
   mechanism.

No V03 gate passes in this slice. Preserve the all-seven/options/grades scope,
`0.001 cm` geometry limit, marks/identity/negative/repeatability/readability
gates, legacy DXF behavior, protected export bytes, and all holds. Keep
ANSI/AAMA and ASTM conformance unclaimed. No physical-fit, factory-acceptance,
or production-readiness claim.
