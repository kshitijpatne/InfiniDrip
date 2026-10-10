# EPIC-17 / G04 V03 — S697 exit: candidate coordinate precision

## Outcome

S697 corrects a measured source-side precision defect in the opt-in DXF
centimeter candidate. The candidate serializer previously rounded each
coordinate to `0.001 cm`, equal to the entire fixed receiver-contour tolerance.
The candidate's adaptive cut sampler computes curves with `0.0001 cm` chord
error, so serialization discarded much of that precision. Candidate CUT, SEW,
construction marks, notch ticks and grainlines now retain six decimal places.
The protected legacy `exportDxf` still defaults to three decimals and its
recorded output identities are unchanged.

For the exact Polo STANDARD_M/M/default-options fixture, the measured maximum
two-coordinate serialization displacement is `0.000701218851 cm` at three
decimals and `0.000000702921 cm` at six decimals. The six-decimal generated
candidate SHA-256 is
`f239a72f37fc7b5f333e6474cd5b70a375f9ebb3bb49ac427106fd63cf441fbd`;
its package revision is
`088c91bcee7b308b0b19f7f68a2c4d43e6d9ae37a6f42504f642961a93d937b5`.
The new source package passes the focused all-seven recipe/grade and 73-option
matrix tests. These are source-level results only.

The exact candidate was rendered at whole-pattern and neckline-cusp detail.
All nine CUT paths remain closed; the sewn paths, pattern geometry, options,
allowances, stitch graph and POMs are unchanged. The output is visually
consistent with the previously reviewed adaptive geometry; the higher numeric
precision does not change the design. PNG and report hashes are recorded below.

## V03 disposition

S697 ran no receiver operation. This deliberately avoids repeating CLO
Standard, which S696 retired after six of nine CUT contours and three button
stations failed, and avoids generic CAD routes that cannot satisfy the
apparel/industrial profile gate. Higher source precision may reduce some
receiver residual, but cannot by itself repair CLO's large collar misses,
misplaced button stations, lost entity/layer semantics, or the absent qualified
profile. All V03 acceptance and holds remain unchanged; V03 is still
unaccepted/Blocked, EPIC-17 remains In Progress, and the goal remains active.
The per-gate status is in `S697-v03-gate-delta.md`.

## Evidence and verification

All generated CAD, rendered output and helper scripts remain outside Git under
`C:\G04-CAD-Interchange\S697-candidate-precision\`:

| File | SHA-256 |
|---|---|
| `candidate.dxf` | `F239A72F37FC7B5F333E6474CD5B70A375F9EBB3BB49AC427106FD63CF441FBD` |
| `full-pattern.png` | `AEC64D029B9ECC0A1E71390491D48A0B953FEF4096C961521AAB958D7D3094E8` |
| `back-neckline-detail.png` | `BCDCB6D200C900CED60312764FDA0FE6B71F46FB68915DD4085D312F1B03518B` |
| `render-report.json` | `5FB478171D305FCA8A7ADC634915A4735D2838C4219CA35C75F05E01270480DA` |

- Focused normal tests: DXF centimeter candidate, pattern marks, interchange
  package, protected export regression — **26/26 passed**. This includes the
  seven-recipe/grade and 73-option source package matrices.
- Changed production modules `dxf.ts`, `dxf-centimeters.ts`, and
  `pattern-mark.ts`: **100% statements, branches, functions and lines** with
  the focused coverage run (18 tests).
- TypeScript `npx tsc --noEmit`: passed.
- Control Center tests: **42/42 passed**.
- `git diff --check`: passed.
- No full repository gate was run; it remains reserved for the settled
  integrated Epic/PR candidate.

## Start, board and timing

- Started 2026-10-10 23:07:54 UTC from S696 `7ae407cce73caa76fff3cb08bc47ab67a28d43d5`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S696 was the highest previous number; S697 is unique.
- Validated board start/exit replay: revision 4124→4125→4126. V03 remains
  Blocked and EPIC-17 remains In Progress; the goal remains active.
- Approximate elapsed time from 23:07:54 to 23:13:37 UTC: implementation and
  focused code review 1m40s; focused tests, coverage and typecheck 1m45s;
  rendered output generation/review 1m; durable packet/state/board closeout
  1m18s; external wait 0m; maintainer-decision time 0m. Categories are
  approximate and non-overlapping.
- No independent low-risk handoff was safe: one precision change spans the
  candidate DXF writer, mark writer, legacy identity regression and rendered
  source review. Codex owns the change and final review.

**Next action:** continue with the existing V03 route decision. No further
receiver trial is scheduled without evidence that a specific already
available, rights-cleared apparel/industrial profile can satisfy the fixed
contract. Once V03 does pass, run the full repository gate, necessary-file
cleanup review, PR, safe merge, refreshed `origin/main` ancestry and required
production end-to-end verification before closing the Epic and goal. No
physical-fit or factory-acceptance claim.
