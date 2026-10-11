# EPIC-17 / G04 V03 — primary profile-contract search — Slice 660 exit

## Result

The bounded search of GetonAgain's first-party product pages and manual, the
public ASTM catalogue, and primary historical NIST material found **no
receiver-specific DXF entity/layer/grade/identity/sidecar contract** that
maps GetonAgain's actual menu mode to a G04 source-exact fixture. ASTM
D6673-01's public historical summary identifies AutoCAD R13 and a separate
ASCII grade-rule table, but explicitly excludes inter-piece relationships;
ASTM lists D6673-10 as withdrawn in 2019. Neither establishes what the
installed DGS build implements. No standard-conformance claim is supported.

The user reported completing sign-in. At 07:38 UTC, direct visual inspection
found DGS open at a blank CAD workspace (`noname.DGS`, status `0/0`) and GMS
open as `Untitled`, with no sign-in dialog in either window. This records the
workspace as past sign-in, not account identity or DXF evidence. No pattern is
loaded and no import/export has happened.

The two bounded read-only Sol high reviews returned WORK FINISHED. Their
corrections are incorporated below: choose only a falsifiable, vendor/build/
mode/settings-specific empirical hypothesis using the observed `AUTOCAD`
import mode for the generic AC1014 S648 fixture; do not call it a matched
apparel profile or infer compatibility. The exact C:-only fixture path/hash,
`dxf-parser@1.1.2` read-back feasibility, frozen settings, C04 sidecar gap,
and manual RUL export limitation are now explicit in the matrix and plan.
No standards conformance claim is supported. S660 made no receiver import,
export, product-code change, pattern change, geometry change, or acceptance
change. It clears no V03 technical gate. V01/V02 remain Done; G04-V03 is now
In Progress to reflect that the bounded empirical pilot can proceed, while all
technical V03 acceptance remains unpassed; EPIC-17 stays In Progress.

## Gate reconciliation and next plan

The full gate-by-gate current statuses, strongest evidence, shared causes,
remaining proof, and planned stop conditions are in
`V03-GATE-RECONCILIATION-S660.md`. The shortest evidence-led route and
conditional re-estimate are in `V03-COMPLETION-PLAN-S660.md`. They supersede
the older S649 estimate while preserving its accepted thresholds, recipe/
option/grade breadth, sidecar contract, holds and completion gates.

Next action: after this reviewed S660 documentation closeout, reserve one
unique slice for the exact S648 copy/hash preflight and one DGS AutoCAD-mode
pilot. Compare the imported/exported artifact end to end with the independent
DXF parser and actual DGS whole/detail output. Keep all technical gates
unproven until evidence meets them; stop only on a measured route failure or
an explicit inability to obtain the numeric/native evidence required.

## Start, evidence, verification, and elapsed time

- Start: 2026-10-10 07:22 UTC from clean S659 commit
  `bb4fc7f60e0705137462a72c6785b4fe2335b016`, branch
  `codex/epic-17-g04`. Refreshed `origin/main` at start was
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S659 was highest;
  S660 is unique. Board `3817→3820` for start records. Goal was active and
  ordinary usage allowed (primary 9%, weekly 7%).
- Source evidence and limits are recorded in `S660-primary-source-findings.md`.
  The verified live UI state and public primary source pages are identified
  there. C:-only import/export custody is unchanged; S660 created none.
- Acceptance reconciliation: rights/local evaluation **passed**; exact
  profile and standards status **unproven**; DGS units, geometry, marks,
  identity/grades, warnings, negative-input behavior, repeatability, exchange
  and output readability **unproven**; CLO S640 geometry failure remains
  specific to that receiver/fixture; legacy behavior/protected bytes remain
  untouched; V02 prerequisite **passed**. No technical V03 gate cleared.
- Validated board start records were replayed at `3817→3820`; exit matrix,
  plan, source and packet evidence plus comments replayed at `3820→3828`.
  Canonical Control Center suite passes **42/42** after the final board write;
  `git diff --check` passes. No production code changed, so changed-code
  coverage is not applicable. Full repository tests/100% global coverage
  remain for the settled Epic/PR candidate.
- Two bounded read-only GPT-6.1 Sol high reviews (`/root/s649_plan_review`
  and `/root/s660_plan_review`) returned explicit WORK FINISHED. Codex
  incorporated the route, source-path, sidecar, warning/negative-control,
  export-setting, and measurement corrections. Neither reviewer had gate-
  clearing authority.
- Read-only fixture/parser preflight verified the actual 153,647-byte S648
  input at `C:\G04-CLO-DXF-Exchange\S648-getonagain-fixture-preflight\Input\polo-m-idr-profile-r14-first.dxf`,
  SHA-256 `ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461`.
  `dxf-parser@1.1.2` recovered nine piece INSERTs, 11 blocks and 56 nested
  entities. This establishes a read-back path, not DGS behavior.
- Validated board corrections changed the V03 description, reconciled both
  Epic summaries, and moved G04-V03 from Blocked to In Progress with S660 exit
  evidence; no technical V03 gate or criterion changed. The command layer
  advanced board revision `3828→3838`. The first canonical Control Center
  rerun found one stale S361 regression assertion because the summary edit had
  dropped the S406 approved collar-order statement; the validated `editItem`
  command restored that existing fact at revision 3838. The final focused
  Control Center suite passes **42/42**, and `git diff --check` passes. No
  production code changed, so changed-code coverage is not
  applicable. Full repository tests/100% coverage remain for the settled
  Epic/PR candidate.
- Elapsed time from start at 07:22 UTC to the S660 correction closeout is
  about 18 minutes. Implementation: 0m. Focused checks and fixture/parser
  read-back: about 5m. Source research, review reconciliation, and durable
  records/board: about 13m. Maintainer decision time: 0m. The reviewers had
  returned before this correction pass, so additional agent wait in this
  closeout: 0m (prior asynchronous wait not separately captured).

## Final gates still required

Keep the all-seven recipes, supported options and grades, `0.001 cm` limit,
C04 sidecar constraints, legacy DXF behavior, protected export byte
identities, actual rendered-output checks, full repository coverage/build,
PR review, safe merge, `origin/main` ancestry and required automatic
deployment. No physical-fit, factory-acceptance or production-readiness claim.
