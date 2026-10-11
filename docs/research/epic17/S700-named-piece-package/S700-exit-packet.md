# EPIC-17 / G04 V03 — S700 named-piece interchange package

## Result

S700 adds deterministic, source-revision-bound named DXF `BLOCK`/`INSERT`
groups to the opt-in G04 package. The block entity payload expands exactly to
the prior flat drawing. The manifest binds each block, recipe role, source
revision, and piece-scoped mark records. Existing package versions 2 and 3
remain verifiable; the current package is version 4. The protected legacy DXF
writer is unchanged.

Source validation covers every registered recipe and grade row plus all 73
supported option configurations. The generated Polo M file contains nine
named blocks and 38 source mark records. Its flat-source DXF SHA-256 is
`f239a72f37fc7b5f333e6474cd5b70a375f9ebb3bb49ac427106fd63cf441fbd`, exactly
matching the historical S698 flat-source bytes. The named package drawing is
209,536 bytes with SHA-256
`142e6d8aaf79e15eb703ca339023e35192b458128328a7e18c93a7e6f2579634`.

## CLO pilot result

The one authorized CLO 2026.1.310 Standard DXF pilot used the same local
import/export route as S698, with **Import Draw Curve Points enabled**. The
actual exported return retained all nine names, with CLO suffixing `_M`.
Coordinates were converted from mm to cm only in a separate comparison copy;
the original return was not altered. The actual nine-piece screen output and
hash-pinned SVG-derived return overlay/detail were inspected. No reopen or
second route was attempted because the pre-export gates failed.

Fixed `0.001 cm` results for Polo M:

| Gate | Result | Measured evidence |
|---|---|---|
| CUT geometry | **Failed** | Front 0.00014176 cm, back 0.00257650 cm, sleeve 0.00076250 cm, button placket 0.00000165 cm, buttonhole placket 0.00001061 cm, outer stand 0.03292953 cm, inner stand 0.03292965 cm, upper collar 0.01084325 cm, under collar 0.01084324 cm. Back, both stands, and both collar leaves exceed the unchanged threshold. |
| SEW geometry | Passed for this fixture | All nine paths are within 0.000011 cm. This is not all-recipe/option proof. |
| Construction marks | **Failed** | 105/108 source entities match; three buttonhole POINTs remain absent by 1.4999984 cm even with Draw Curve Points enabled. |
| Named piece identity | Partial | All nine block names return with `_M`; comparison can recover the role names. Receiver layer names become numeric, and piece/revision binding through a changed receiver name is not yet an accepted, general round-trip identity contract. |
| Units | Passed for this fixture | CLO return is mm; a separate normalized comparison copy recovers cm. Broader option/grade proof remains due. |
| Readability / profile / other gates | Unproven | A visible nine-piece output is not enough to establish complete readable construction marks, malformed-input rejection, repeatability, a qualifying documented industrial/apparel profile, or rights/profile scope. |

The return comparison and visual hashes are in
`C:\G04-CAD-Interchange\S700-named-piece-package\S700-roundtrip-comparison.json`
and `S700-render-report.json`. The actual CLO DXF files and all derived CAD
artifacts remain only under that C: folder.

## V03 gate disposition and next action

S700 fixes a real source-package identity gap and proves the named blocks
survive this CLO import/export. It **does not qualify CLO or pass V03**. The
same candidate's cut-contour and buttonhole-point losses remain measured after
the enabled point-import setting, so the planned stop condition is met. Do not
repeat CLO, switch formats/settings, or try another CAD application for these
same misses. Keep all accepted thresholds, gates, seven-recipe/options/grades
requirements, legacy behavior, and protected byte identities unchanged.

The next useful work is a single source/output diagnosis of the two still
failing output groups using the exact S700 return and existing comparison
harness: (1) isolate which returned cut segments account for each of the five
curve-family misses, especially the mirrored 0.03293 cm stand/collar traces;
(2) trace whether CLO discards the three typed buttonhole points at import or
export with evidence already present in the saved return/UI record. Do not
alter garment geometry or the receiver acceptance threshold. Make a source
change only if that diagnosis demonstrates a concrete writer defect; otherwise
retain the evidence and move to the already-installed product route that can
be directly shown to import/export DXF under the admitted profile/rights
contract, without installing more applications or repeating known trials.

V01/V02 remain Done; V03 remains held; EPIC-17 remains In Progress and its goal
remains active. No conformance, physical-fit, factory-acceptance, or production
readiness claim is made. Final integrated tests/coverage/build/browser/output
review, necessary-file cleanup, PR, safe merge, refreshed ancestry, and
required production end-to-end verification remain explicit completion gates.

## Verification and closeout

- Focused tests: 13/13 passed.
- Changed-code coverage: statements 100%, branches 100%, functions 100%, lines
  100%; see `S700-changed-coverage-final.txt`.
- Typecheck: `npx tsc --noEmit` passed.
- Protected legacy output: exact source DXF hash remains identical to S698.
- Render review: generated and returned overlays plus the inner-stand detail
  were inspected; output hashes are pinned in the C: render report.
- Full repository gate: intentionally deferred to the settled integrated
  Epic/PR candidate.
- No safe disjoint delegation existed: package writer, verifier, source
  entity grouping and shared byte-identity tests are coupled. External-agent
  wait 0m; maintainer-decision time 0m.
- Start: 2026-10-10 23:31:57 UTC from S699 `27676a6079053d76d941fc8f02acfa6874729973`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S699 was highest; S700 is unique.
- Approximate elapsed time to exit: 27m. Implementation 8m; focused
  verification and package matrix 2m; CLO operation and rendered/output
  review 10m; durable closeout 7m; external waits 0m; maintainer decisions 0m.

**Next slice boundary:** S701 closes the V03 evidence matrix against this
measured result and the admitted receiver/profile contract, then states the
shortest remaining proof/fix route. No new receiver or software trial is
authorized by this packet.
