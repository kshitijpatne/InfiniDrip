# EPIC-17 / G04 V03 — Slice 499 CLO Polo import-option diagnosis

## Verified start

Started `2026-10-08 14:53:34 UTC` from S498
`01de6ccde1432de48ced567e0823a8f3c1075fe2` on `codex/epic-17-g04`;
refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
ancestor. S498 is the highest assigned slice; S499 is reserved. The working
tree was clean. Board revision 3101 records EPIC-17 and G04-V03 In Progress;
V01/V02 Done. Goal is active and still names the admitted objective. Primary
usage was 14% used; weekly 39%.

## Scope and test design

Use the responsive local CLO UI to isolate the five Polo M CUT contour vertex
losses measured in S498. Import the exact same hash-pinned source in a 2×2
matrix: DXF-AAMA versus DXF-ASTM import mode, each with “Optimize All Curve
Points” off and on. Hold centimeters, 100% scale, no rotation, original grain,
notches-to-both and ratio position constant; export each candidate as
DXF-ASTM. Compare output against the exact source and S498 outputs with the
existing 0.001 cm threshold and same-block matching. Record warnings, rendered
workspace and menu profiles. This tests whether the observed setting/mode
selection explains the loss; it does not prove a standard profile.

All imported/exported files, candidate projects and screenshots must be under
`C:\G04-CLO-DXF-Exchange\S499-clo-polo-import-options`. The source fixture is
copied there unchanged and its hash checked. Do not save outside this folder.
Close CLO after the last experiment.

No production code, pattern geometry, source fixture, test threshold,
acceptance criterion, rights/local-handling state, or claim changes. No
cloud/CLO-SET/CONNECT upload. No physical-fit, factory-acceptance or
production-readiness claim. No parallel delegation for the stateful UI trial.

## Gates and decision boundary

1. Inspect the already installed CLO UI and use only the visible local import
   and export controls. Stop if login, terms, cloud-transfer, access or error
   prompts arise.
2. Run the four bounded profiles with all other settings held fixed; preserve
   every result, including notices and errors. Capture the actual settings and
   rendered pieces per candidate.
3. Hash-pin every source/output and compare every affected contour; do not
   accept a visual match in place of the existing numeric tolerance.
4. If an option combination materially changes results, report it as a
   receiver-specific observation and retain the profile/rights/semantics/
   native-grading/negative/independent-receiver holds. If neither option
   explains it, stop this hypothesis and preserve the failure.

## Board and closeout

Start replay will attach `E-G04-S499-START` and record this bounded matrix at
revision 3101 onward. Exit must link the measured result without changing V03
status or gates. Focused verification is the four-candidate geometry replay,
board validation, and `git diff --check`; no full repository gate is due until
the settled Epic candidate.

**First action:** copy and hash-pin Polo M under the dedicated C: folder, then
inspect CLO's current window before selecting any import setting.
