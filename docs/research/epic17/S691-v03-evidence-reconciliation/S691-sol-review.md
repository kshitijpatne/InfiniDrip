# S691 bounded Sol review — read-only advisory

## Review question and authority

Sol reviewed `V03-GATE-MATRIX-S691.md` and `V03-COMPLETION-PLAN-S691.md` once
at high reasoning. The assignment was limited to the shortest credible route,
overlooked current evidence, eligibility, and stop conditions. Sol made no
repository or board changes and did not pass any gate. Codex independently
verified the specific findings below.

## Findings verified by Codex

1. **Receiver eligibility must come before an identity experiment.** G04
   admission requires a documented industrial CAD profile
   (`docs/planning/EPIC-17-ADMISSION.md`, acceptance criterion 5 at line 1646).
   C04 requires a named apparel CAD receiver/profile and warns that generic
   DXF parsing does not prove apparel CAD acceptance
   (`docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`, lines
   675–725). S674's own first-party preflight describes LibreCAD as generic 2D
   CAD. S690's identity test would not clear the admitted receiver-category
   gate, so do not run it.
2. **S681's profile is not `idr-pattern-exchange/2`.** The current source code
   emits schema `infinidrip.g04.dxf-package/2` and profile label
   `generic-dxf-centimeters-with-recipe-marks` in
   `src/export/dxf-interchange-package.ts`. `idr-pattern-exchange/2` is the
   distinct DGS XDATA/grainline candidate from S668; its apparel-decoder import
   returned blank 0/0 patterns. Matrix/plan terminology was corrected to keep
   these separate.
3. **The S681 sidecar cannot simply be carried unchanged to a rewritten file.**
   S678/S681 bind the exact drawing digest; S681 additionally records
   one-based entity positions. S690 proves LibreCAD rewrites the output bytes
   and uses `LWPOLYLINE` instead of source `POLYLINE`. A future candidate needs
   a version-matched returned-artifact/sidecar association and mismatch
   rejection before any import, without using source data to reconstruct lost
   output.
4. **Piece selectability and warning classes are explicit.** C04 requires each
   piece to remain separately selectable. The next eligible receiver gate must
   check this. Stop on loss/validity warnings; documented informational
   notices may pass only if they do not affect a criterion.
5. **No current route survives eligibility plus fixed gates.** CLO and DGS
   have apparel application evidence but measured tested-route failures;
   LibreCAD/OpenCAD are generic CAD evidence. No incorrectly rejected passing
   route was found. Sol's recommendation is to stop candidate testing and
   record the concrete access dependency; it did not claim V03 passed.

## Codex disposition

Accept all five corrections. The final plan is a stop-before-import Gate 0:
identify a specifically named, permitted, local apparel/industrial receiver
and matching documented input/sidecar contract first. Only then run one
source-matched import, export/reopen after a passing import, and only later the
existing negative/repeatability and 73-option/grade breadth checks. No new
application, setting or encoding is recommended. The candidate-specific
round-trip plan remains conditional on the evidence-based entry gate.

Sol's terminal handoff: **WORK FINISHED**.
