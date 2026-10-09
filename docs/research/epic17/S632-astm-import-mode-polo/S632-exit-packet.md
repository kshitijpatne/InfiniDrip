# EPIC-17 / G04 V03 — CLO DXF-ASTM import-mode comparison — Slice 632 exit

## Outcome

S632 completed one controlled CLO 2026.1.310 exchange using the exact
hash-pinned S617 Polo M centimeter-header source, changing only import mode
from Standard DXF to CLO's DXF-ASTM menu mode. Export and reimport used
DXF-ASTM throughout, with fixed centimeter, 100%, Do Not Rotate, grading,
notch, curve, grain, and seam-allowance settings as recorded in the start
packet. CLO showed its informational Custom-seam-allowance notice on initial
import and each reimport; it returned nine gross pieces at every stage, with
no format error. Generations 1 and 2 were independently reimported, reviewed,
and saved. This is a bounded observation of CLO's menu path, not evidence of
a normative ASTM edition or conformance.

The mode change did **not** remove the measured contour or mark losses. Both
generations have identical gate outcomes: all 9/9 SEW outlines pass; 4/9 CUT
outlines pass and 5/9 fail `0.001 cm`. The failures are back (0.01299073 cm
conservative upper bound), outer collar stand (0.01322744 cm), inner collar
stand (0.01422421 cm), upper pointed collar (0.01324019 cm), and under
pointed collar (0.01324893 cm). Front, sleeve, button placket, and buttonhole
placket CUT outlines pass. The five failing CUT upper bounds are about
13–14 times the gate. No contour criterion was relaxed.

The two output DXFs are not byte-identical (both are 221,643 bytes, with
different hashes). The pass/fail classifications remain the same; the second
generation's worst failing CUT upper bound is 0.01422316 cm on the inner
collar stand. Thus the repeat was measured, but neither byte identity nor
contour acceptance passes. Full per-piece values for both runs are in the
geometry JSON reports.

The same 38 source marks were measured in each generation: 12/21 source
POINTs have exactly one direct output-point candidate, 6 have multiple
candidates, and 3 have no distinct output point; 11/14 source LINEs match
separate output paths, with 3 coincident with source outlines and therefore
not independently represented; 0/3 button CIRCLEs pass whole-curve tolerance
after conversion to 12-vertex polylines. No output entities preserve source
semantic layer names. Generation 1 and generation 2 aggregate mark outcomes
are identical. This does not prove CLO loses marks on every profile or
configuration; it proves this tested route did not resolve the S631 findings.

## Rendered and file evidence

The saved generation-2 overview was visually inspected: nine gross pattern
pieces are present with no obvious large-scale deformation in this view. Fine
marks are too small at overview scale to establish readability. Thus readable
manufacturing output remains unproven, and the overview does not override the
numeric mark failures.

All exchange files, native project, screenshots and raw analysis are under
`C:\G04-CLO-DXF-Exchange\S632-astm-import-mode-polo\`. Source copy SHA-256 is
`71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`. Outputs:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `Output/polo-astm-generation-1.dxf` | 221,643 | `E35FDF07742F5CC8EEC3FAFB9D6525BC43F9F37521682C09A87AC3B821C7643E` |
| `Output/polo-astm-generation-2.dxf` | 221,643 | `C4664A013C42404D33144E38192AE5B5195CA2FC0B0EABFBA13D28F8E1C32233` |
| `Evidence/polo-astm-generation-2-final-scene.zprj` | 2,338,578 | `EEB127A21CF4270197526B826F2634B5AF32175C00127111B1A69CCAEC81223B` |
| `Evidence/generation-2-astm-final-render.png` | 88,427 | `3AE6147FDAE7C94C7B5D26729473D9F8DDE7B1B6117FEB8570AB8A98E1CF767E` |
| `Evidence/Analysis/S632-generation-1-geometry-analysis.json` | 22,993 | `A4560033EE7001B7B16E80F5431E093B321551F9206CA686B989DF401EFF06AF` |
| `Evidence/Analysis/S632-generation-1-mark-analysis.json` | 347,876 | `479AC6EF2F5036683113F83E87DA396444986865C2FB9AC70FDDB44D03AC7CDD` |
| `Evidence/Analysis/S632-generation-2-geometry-analysis.json` | 23,521 | `724A1F28D46C30E1F38F80E3D1EB822C2359861EBF0AFB0F19757A956278608B` |
| `Evidence/Analysis/S632-generation-2-mark-analysis.json` | 348,137 | `E47B375B68B8F16E10B5CBC99E262FB027C0590975B1696F9E367158A257849D` |

The setting and notice screenshots are `import-settings-dxf-astm.png`,
`import-notice-seam-allowances.png`, `generation-1-reimport-settings.png`,
`generation-1-reimport-seam-allowance-notice.png`,
`generation-2-export-settings.png`, and
`generation-2-reimport-seam-allowance-notice.png`. The initial and
generation-1/generation-2 overviews are also retained beside the final render.
The S617 source-variant preflight remains separately pinned in
`Evidence/Analysis/source-variant-preflight.json`.

## Gate disposition and continuation

S632 clears no V03 acceptance gate. It answers the tested CLO-mode question:
ASTM-labelled import/export in this version did not fix the repeated
geometry/mark failures. Do not repeat this mode permutation on the same
fixture. Preserve all seven-recipe and supported-option coverage, named
industrial-profile and receiver/right evidence, exact geometry, piece and
revision identity, mark/layer semantics, grading/options, malformed-input
rejection, repeat-round-trip, and readable rendered-output gates. Keep G04-V02
Done and G04-V03/EPIC-17 In Progress with every existing acceptance criterion
and hold unchanged. Preserve legacy DXF behavior and protected export byte
identities. CLO remains open for remaining admitted G04 evidence work; close
it only when the Epic is complete. No physical-fit, factory-acceptance, or
production-readiness claim is made.

The prior S632 commentary misstated the failing CUT-piece count as four; the
canonical per-piece JSON reports and its `strictCutPassCount=4` show four
passes and **five failures**, listed above. This packet corrects the record.

## Verification, records, and time

- Start was `2026-10-09 18:14:10 UTC` from clean committed S631
  `b2bb1258ed98ad23f2c7654b7a3bad0453906167`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor and
  board start replay was 3668→3670. S631 was the highest prior slice; S632 is
  unique.
- Input/output/project/render files were checked in the required named C:
  folder. Both analyzer outputs were hash-pinned; CUT/SEW/mark outcomes and
  unchanged thresholds were verified directly from their per-generation
  JSON reports. Saved rendered overview was opened and reviewed. CLO remains
  open in its existing session.
- Focused script syntax checks, the validated Control Center replay and
  validation, `npm run control-center:test`, and `git diff --check` are
  recorded by the exit helper after closeout. No production code changed, so
  changed-production-code coverage is not applicable; the full repository
  100% coverage/build/export/browser gate remains for the settled Epic/PR
  candidate.
- No safe disjoint delegation was identified: the work required a single
  stateful CLO exchange and Codex-owned comparison. External-agent waits: 0m;
  maintainer decision time: 0m.
- Elapsed time through final verification: about 31m. Approximate ledger:
  CLO preparation/exchange 13m; offline contour/mark analysis 8m; rendered
  review 1m; durable closeout, report-metadata correction, and focused
  verification 9m. Categories are approximate and non-overlapping; external
  agent waits and maintainer-decision time were both 0m.

**Next:** refresh Git, slice history, and board at the new boundary; reserve
the next unique slice for the highest-impact unresolved V03 gate with
receiver/profile evidence. Reuse this practical result and do not repeat the
same ASTM mode test. Keep every V03 hold and acceptance gate intact.
