# EPIC-17 / G04 V03 — CLO authorization and control-state recheck — Slice 538 exit

## Result

The maintainer confirmed in chat that written confirmation covers CLO trial
use for product-development evaluation and local DXF processing. This resolves
the trial-use/local-handling question for the bounded CLO evaluation; the
confirmation is reported by the maintainer and is not independently reviewed
legal evidence. It does not prove an industrial profile, receiver acceptance,
semantic fidelity, or a passing round trip. Do not ask for this confirmation
again.

The existing test matrix was reconciled rather than replayed:

- S525 maps 41/41 source pieces to receiver blocks across the seven saved
  CLO outputs, but numeric output layer 8 mixes CUT and SEW in all seven;
  78 source marks have no direct geometric match (not a finding that they were
  lost).
- S536's geometry-identical R2000 `LWPOLYLINE` Polo M trial passes 4/9 CUT
  contours and fails the same five at `0.012741–0.013974 cm` against the
  unchanged `0.001 cm` gate.
- S531's tested malformed input is silently accepted while an inset SEW
  contour is omitted. S493 still records the exact profile edition,
  independent receiver, and grading/semantic gates as unproven.

The running CLO 2026.1.310 window is present. A screenshot-backed state showed
the pattern workspace with no Export DXF dialog, while the
accessibility snapshot for the same returned window reported an Export DXF
dialog set to DXF-AAMA, Graded Nest, centimeters, 100% scale, and Do Not Rotate.
`list_windows()` exposed no separately targetable owned dialog. Repeated fresh
snapshots continued to disagree. No import/export button was clicked, no DXF
file was read or written in this slice, and no new format result is claimed.
This is a concrete desktop-control state mismatch, not a license issue or a
CLO interoperability finding. CLO remains open.

## Gate disposition

- **Resolved:** maintainer-confirmed written trial-use and local-processing
  basis for the bounded CLO evaluation.
- **Still open:** Polo's five CUT contours outside tolerance; ambiguous CUT/SEW
  layer semantics; marks without direct geometric matches; malformed-input
  acceptance; exact industrial profile/version evidence; applicable grade and
  independent receiver/round-trip requirements. These are separate gates.
- **Unchanged:** all V03 criteria and G04/V01/V02/V03 statuses; V01/V02 Done,
  V03 and EPIC-17 In Progress. No acceptance, threshold, legacy DXF behavior,
  protected export identity, or claim boundary changed.

## Verification and closeout

- Refreshed Git state: S537 HEAD `69d14d52670f0219890fb8cfa6168169801b321e`;
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor;
  worktree was clean at entry. S538 is unique after S537.
- Board started at revision 3263; validated start and exit replay revisions
  are recorded with the commands below. G04-V03 remains In Progress.
- No source, test, exchange, or protected baseline files changed. Therefore
  changed-code coverage and the full repository gate are not applicable.
- Focused Control Center tests and `git diff --check` are recorded after replay.
- Elapsed 21:40:07–21:43:33 UTC (about 3m26s): evidence/state reconciliation
  0m55s; desktop-window observation and mismatch confirmation 1m25s; durable
  closeout and focused verification 1m06s;
  external-agent waits 0m; maintainer-decision time 0m.

**Next action:** continue with static inspection of the already saved,
hash-pinned CLO outputs and protocol mapping while preserving the exact gates.
Retry a practical CLO exchange only after one fresh observation consistently
identifies the visible dialog and its target; do not repeat S493/S525/S536
cases. No user action is needed for rights or local handling.
