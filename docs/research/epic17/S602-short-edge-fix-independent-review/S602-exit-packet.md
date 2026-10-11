# EPIC-17 / G04 V03 — independent review of the five Polo short-edge failures — Slice 602 exit

## Result

The independent Claude Opus 5.5 review found **no evidence-backed new
representation, documented point-preservation control, or currently qualified
free/local apparel-CAD receiver** for the five exact Polo corner losses. This
limited search is corroborating evidence, not an exhaustive proof that no
receiver exists. The reviewer did not establish CLO behavior beyond the
measured fixtures and did not claim general CLO incompatibility.

The reviewer proposed checking a combination of CLO curve-point options. Codex
checked that proposal against the durable records: S503 already tested point
optimization both ways; S519 enabled `Import Draw Curve Points` and retained
the same five losses; S522 documented that `Remove Non-Grading Points` deletes
ungraded points and that the remaining import options do not provide a safe
retention path. Repeating that combination is not justified. The official CLO
API option reference lists those import/export booleans but gives no point-
preservation semantics, threshold, or corner guarantee. Its current changelog
does not document such a fix. References are listed below.

The five short-corner facts remain those pinned by S552: incoming edges
0.04562–0.04696 cm; turns 16.28–17.39 degrees; replacement-chord deviations
0.012736–0.013970 cm, against the unchanged 0.001 cm gate. Unit variants and
previously tested entity/profile/settings variants do not clear them. S595's
source-exact periodic spline candidate is also a measured failure. No new CLO
exchange was performed in S602.

## Independent-review scope and limitation

- Exact model: Claude Opus 5.5; read-only tools only, in detached worktree at
  S601. The reviewer returned an explicit `WORK FINISHED` report and made no
  file changes or app calls.
- The first capped pass ended at its turn limit without a result. A second pass
  completed. The S602 packet itself was uncommitted when the detached worktree
  was created, so the reviewer correctly reported it missing. The complete
  technical measurements and exclusions were supplied directly in the prompt;
  nevertheless, its receiver search was limited and its option suggestion
  required Codex validation. The exact prior-run list and exclusions above
  were then checked by Codex against S519/S522/S536/S552/S555/S593/S595/S601.
- The official CLO API option page is a property list, not a behavioral
  guarantee. It lists `m_bOptimizeAllCurvePoints`,
  `m_bImportAllDrawCurvePoint`, and `m_bRemoveNonGradingPoints` under
  `ImportDxfOption`, and `m_bOptimizeCurvePoints` under `ExportDxfOption`.
  Those names alone do not establish an untested preservation behavior.
- The review did not inspect the full paywalled ASTM text, run a new receiver,
  or prove the universal absence of a suitable apparel CAD package.
- Codex re-observed the existing CLO 2026.1.310 window without input. The
  screenshot showed the same nine-piece 2D workspace; the separate
  accessibility tree showed the main CLO window, 2D Pattern Window, version
  `2026.1.310 (r58944)`, and no export modal/spinner. For this capture the
  earlier S568 modal disagreement is absent. S602 did not change the loaded
  scene or save any app file.

## Gate status

S602 clears no V03 gate. The seven-recipe, geometry, source identity, CUT/SEW
meaning, mark/notch, grade/options, malformed-input, useful rendered-detail,
and repeated-round-trip criteria are unchanged. Rights/local processing stay
settled; the narrow CLO 2026.1.310 / DXF-AAMA identity remains distinct from
format conformance and successful full compatibility. Legacy DXF behavior,
protected export byte identities, and all accepted V02 output remain intact.
No physical-fit, factory-acceptance, or production-readiness claim is made.

## Sources and evidence

- Official [CLO API Option & Type reference](https://developer.clo3d.com/optiontype.html),
  checked 2026-10-09: property names at `ImportDxfOption` and
  `ExportDxfOption`; it does not describe point-preservation behavior.
- Official [CLO API changelog](https://developer.clo3d.com/changelog.html),
  checked 2026-10-09: no documented short-edge/vertex-preservation behavior
  found in its current DXF-related entries. This is a bounded documentation
  search, not proof of absent private behavior.
- CLO help/control evidence: S519's measured failed `Import Draw Curve Points`
  trial; S522's control screen; S503 optimization comparison. See
  `docs/research/epic17/S519-clo-point-retention-control/S519-exit-packet.md`,
  `S522-clo-import-control-evidence-screen/S522-exit-packet.md`, and
  `S503` in the admission packet.
- Exact corner evidence: `docs/research/epic17/S552-polo-short-edge-loss-diagnosis/S552-exit-packet.md`.
- Other representation tests and receiver results: S536, S555, S593, S595,
  S601 packets and matrices. Candidate availability screens remain in S481,
  S527–S537 and S548; S602 does not redo those searches.
- The limited ASTM source page [D6673-10](https://store.astm.org/d6673-10.html)
  reports withdrawal; S602 did not access the paywalled standard text.

## Next action

Continue with an independent, source-backed V03 subgate that is both untested
and practically executable. S567 specifies a five-size waistband SEW-line
grading test from exact source deltas; S568 deferred it because the screenshot
and accessibility surfaces disagreed. S602's fresh capture now shows the same
main CLO workspace in both surfaces. In S603, verify the saved S565 disposable
project hash, preserve the current S601 output project, open a copy of S565 in
the still-running CLO process, and save the working copy only in
`C:\G04-CLO-DXF-Exchange\S603-waistband-sew-grading-trial\`. Apply only S567's
source-derived per-size internal-line grading values. Compare both CUT and SEW
against all five source sizes at 0.001 cm; export/re-import only if the
observed selected path and grade state are unambiguous. Preserve all unrelated
V03 holds, especially the five Polo CUT corner failures.

## Verification and timing

- Codex refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  verified it remains an ancestor of S601 `47515e72c4d3886f89a7809e1985fb5deead6a76`,
  verified a clean starting worktree before S602, and confirmed board revision
  3538 with EPIC-17/G04-V03 In Progress and G04-V02 Done. S602 is unique.
- A fresh detached S601 worktree was used for the independent read-only review;
  no agent changes were returned. The live CLO session was separately
  inspected and remains open. No DXF or project was changed.
- Start `09:52:21 UTC`; closeout `10:04:39 UTC` (12m18s). Approximate time
  allocation: evidence/prior-packet reconciliation and live-window observation
  `2m30s`; Claude Opus 5.5 runtime/wait `3m44s` (including the first capped
  attempt); Codex report/source validation `1m45s`; durable packet/state/board
  updates and focused verification `4m19s`; production implementation `0m`;
  maintainer-decision time `0m`.
- No product source or tests changed. Changed-code coverage and the full
  repository gate are not due for this evidence-only slice; Control Center
  tests, board replay, script checks, artifact/path checks, and `git diff
  --check` are the focused gates.
