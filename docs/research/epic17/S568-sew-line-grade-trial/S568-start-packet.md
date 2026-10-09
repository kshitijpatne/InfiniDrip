# EPIC-17 / G04 V03 — source-derived CLO sew-line grade trial — Slice 568 start

- Started: 2026-10-09 03:26:20 UTC.
- Start commit: S567 `04a8e0a` on `codex/epic-17-g04`.
- Refreshed `origin/main`: `a5af5e1`, ancestor of start commit. Working tree
  clean; highest assigned slice is 567, so 568 is reserved. Board revision
  3385; G04-V03 is In Progress.
- Usage: ordinary work allowed (primary 52%, weekly 65% used).
- CLO 2026.1.310 remains running. All input/output artifacts for this trial
  must stay under `C:\G04-CLO-DXF-Exchange\S568-sew-line-grade-trial`.

## Scope and procedure

Validate the source-supported CLO internal-line grading procedure from S567
against the S565 disposable corrected project, without editing product source
or pattern geometry. First call the documented window inventory and inspect
the returned CLO primary/modal windows. If a modal exists, capture that exact
returned window. Continue only when screenshot and accessibility observations
describe the same visible state. Never infer the target control from stale
indexes.

When the surface is trustworthy, create a fresh S568 copy of
`s565-corrected-grade-trial.zprj` in the named C: folder. Select the internal
sew-shaped path whose XS outline matches S562/S559. Using CLO Edit Grading,
inspect and grade its four segment points per S567's source-derived step
deltas (upper-left, upper-right, lower-right, lower-left):
`(+2,+1.5)`, `(+4,+1.5)`, `(+4,+1.5)`, `(+2,+1.5)` cm for each adjacent size
step XS→S→M→L→XL. Preserve the S565 CUT grading values unchanged. If the
candidate is not an editable internal line, stop and record its actual
classification; do not substitute a line swap or source change.

If point selection and values are directly verified, export one
DXF-ASTM / Graded Nest / centimeter / 100% / Do Not Rotate output, retaining
grade and base-size data, into the S568 folder. Compare all five waistband
CUT and SEW contours against the pinned S562/S559 fixtures under the
unchanged 0.001 cm gate. Re-import once in the same CLO session, capture the
actual rendered output, and inspect grade identity, line semantics and
readability. Close no V03 criterion unless every relevant check passes.

If the window surfaces continue to disagree, perform no app input or file
operation and close this slice with the specific observation. The bounded
slice is still useful if it establishes the next action cannot safely be
carried out via the current helper.

## Acceptance, non-goals and gates

- Record the exact CLO surface observation, selected line/points, per-size
  values, export/import settings, C:-only file hashes, contour residuals and
  rendered evidence, or document why no input was safe.
- Preserve every G04/V03 rights/profile, seven-recipe, geometry/semantics,
  marks, malformed-input, grade/options and round-trip gate. A passing
  waistband diagnostic alone does not clear the seven-recipe or full V03
  criterion.
- No source pattern or product code, user-interface change, standards
  representation, acceptance threshold, legacy DXF behavior, protected
  export identity, CLO-SET/CONNECT/cloud upload, external contact, paid access,
  fit/factory/physical or production-readiness claim.
- Run focused comparison/syntax checks and the Control Center tests if the
  board changes. No full repository gate unless production source/tests are
  added, which is outside this slice.

## Delegation and timing

The live CLO window, project copy and export form one coupled experiment; no
safe disjoint delegation. Codex owns execution, verification and closeout.
Record execution, focused verification, external-agent waits and maintainer
decision time separately at exit. V03 remains In Progress unless actual
evidence satisfies its complete acceptance.
