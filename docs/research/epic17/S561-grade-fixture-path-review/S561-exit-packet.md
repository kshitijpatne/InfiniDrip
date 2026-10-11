# EPIC-17 / G04 V03 — Grade fixture path review — Slice 561 exit

## Result

S561 identified **CLO 2026.1.310 / DXF-ASTM** as the strongest documented
candidate for a DXF carrying grading: current CLO guidance identifies ASTM as
a supported import/export format; CLO's own designer says its separate Rule
File (`.RUL`) comes from a 2D CAD system and that grading included in DXF uses
DXF-ASTM. The official API docs also describe importing an existing `.RUL`
onto a grading group. This clarifies the receiver route, but does not give an
exact current normative edition, conformance map, source-grade fixture, or
verified product export. S560's grade/size gate therefore remains open.

## Evidence and limits

- CLO's current DXF Help documents DXF-AAMA, DXF-ASTM and Standard DXF options;
  it says a size group may be exported as a graded nest and that grading may be
  included in DXF or provided as a Rule File. It does not publish the grade
  point serialization or exact standard edition:
  <https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export>.
- In CLO's official community forum, a CLO designer says the `.RUL` input
  comes from 2D CAD with an AAMA DXF, CLO does not export `.RUL`, and for
  grading included in a DXF select DXF-ASTM. This is first-party product
  guidance, not a normative conformance declaration:
  <https://support.clo3d.com/hc/en-us/community/posts/26088722467225-Grade-rule-function>.
- The published CLO API v11.0.0 documents `AddGradingSizeGroup`,
  `AddGradingSize`, `ImportGradeRuleToSizeGroup`, and per-point grading
  setters/getters. The docs' SDK release notes cite sample project target
  2026.1.224, whereas the running installed app is 2026.1.310 (r58944); build
  compatibility with this session has not been verified. No API call was made:
  <https://developer.clo3d.com/changelog.html> and
  <https://developer.clo3d.com/list.html>.
- The source-backed XS/S/M/L/XL geometries from S559 are separate one-size
  files; they do not encode grade relationships. The existing product writer
  accepts one-size pieces only. A third-party parser lead lists DXF samples and
  claims ASTM/AAMA grading support, but the repository shows no license in its
  root listing, is parser/rendering code rather than a writer/receiver, and
  supplies no source-traceable relation to InfiniDrip `gradeRun`; it is not a
  lawful product fixture or verification path:
  <https://github.com/ksons/astm-parser>.
- CLO computer-use state is inconsistent: the visible screenshot showed the
  pattern workspace, while the accessibility tree reported an Export DXF
  dialog; `list_windows` returned only the parent CLO window. A fresh capture
  after activating the existing window still disagreed. No selection, export,
  or save was attempted. This is a control-state mismatch, not evidence of a
  CLO file-format failure.
- No fixture or capture was added to C: in S561; all existing exchange assets
  remain under their C:-only named folders. CLO remains running and was not
  restarted.

## Gate disposition

| Gate | S561 disposition |
|---|---|
| Candidate profile | CLO 2026.1.310 / DXF-ASTM is a documented candidate; exact edition/conformance remains unestablished. |
| CLO graded exchange route | First-party guidance identifies DXF-ASTM for grading in the DXF; exact source fixture and measurable round trip are still missing. |
| Grade values/source truth | Product `gradeRun` exists, but current writer exports a single size and the S559 XS round trip labels XS as M. No grade-bearing product input exists. |
| CLO practical verification | Not run. Conflicting visible/accessibility state prevented a safe UI action; not a product-format failure. |
| Acceptance/other V03 gates | Unchanged; grade/size, five Polo CUT contour, CUT/SEW semantics, marks, malformed-input, options, and all-seven proof remain held as recorded in the matrix. |

## Checks and timing

Documentation/research only; no product source or tests changed. Focused
checks: Control Center command tests pass 42/42; preflight verified the two
additive commands; start/exit replay was performed through the validated
command layer; `git diff --check` and exit helper syntax checks passed. No
full repository gate was due. External-agent waits: 0. Maintainer decision
time: 0. At the S561 boundary (00:31:30 UTC), elapsed time was 4m00s: source
search/evidence review 2m15s, CLO UI observation/recovery 0m50s, focused
verification 0m10s, durable packet/state/board closeout 0m45s, external waits
0m, maintainer decisions 0m. Start commit was S560 `c53c0d6`; refreshed
`origin/main` remained an ancestor; board revisions 3357→3359→3361.

## Next action

Continue with a testable source-to-receiver bridge: map the existing source
grade deltas to exact pattern points, determine whether the documented CLO
DXF-ASTM path can preserve those names/positions, and seek a lawful fixture
or a compatible current CLO API route. Retry no CLO control action until the
visible and accessible states agree. Do not ask the maintainer for general
construction research or repeat the S559 no-grade test. Keep all V03 criteria,
legacy output, protected identities, and claims unchanged.

V01/V02 remain Done; V03 remains In Progress. No physical-fit, factory, or
production-readiness claim is made.
