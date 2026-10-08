# EPIC-17 / G04 V03 — local CAD trial-access screen — Slice 489 exit

## Result

The focused StyleCAD and Optitex access screen did not identify a documented,
rights-cleared, no-cost Windows-local receiver. StyleCAD's product demo is
not documented as a local install/evaluation license; its quote-based desktop
PDS advertises generic DXF import/export, but the reviewed sources do not
establish a no-cost license or the exact AAMA/ASTM export profile. Optitex's
explicit free trial applies to OPTINEDCloud, a hosted service that processes
submitted apparel files. The local PDS installer is license-key gated; the
pages reviewed do not document a free local PDS trial. Unknown private grants
remain unknown, not disproved.

Primary Codex matrix, OpenCode independent report, and Codex cross-review are
in this folder. Neither candidate was selected. No software or account was
accessed; there was no installation, trial acceptance, vendor contact,
payment, fixture, file handling, or upload. The one additional web finding
does not alter V03 scope or gates.

## Gate and status

- No-cost/local rights: **not cleared for either candidate** on reviewed
  public evidence.
- Exact apparel-profile directionality: **not established for a no-cost
  receiver**; StyleCAD and Optitex import evidence must not be inflated into
  AAMA/ASTM export proof.
- Same-receiver round-trip, graded fixture, malformed-input behavior: **not
  tested** because no qualifying receiver is available.
- G04-V03 and EPIC-17 remain In Progress. V01/V02 remain Done. Preserve every
  rights, local-only, exact-build/profile, round-trip, grading, and
  negative-input gate; preserve legacy DXF behavior and all protected export
  identities.
- CLO inventory at exit: installed app exists but was not running and had no
  windows. Its browser tab remained open and untouched. CLO was unnecessary
  for this source-only screen.

## Verification and next action

Validated board replay advanced `3041→3047` using
`applyBoardCommand`/`executeBoardCommand`. It links the exit packet, Codex
matrix, OpenCode report, and Codex cross-review to G04-V03; links the exit to
EPIC-17; and records the hold without changing status. The first replay
encountered a Windows `EPERM` while renaming the third evidence update; the
first two updates persisted, the board remained valid at revision 3043, and no
lock or temporary file remained. The replay script was made state-aware: it
verifies already-persisted command effects, then continues only at the current
revision. The remaining commands completed; details are in
`S489-replay-diagnostic.md`.

`npm run control-center:test` passes `42/42` against the settled revision
3047. All four S489 command scripts pass `node --check`; `git diff --check`
passes. No production code changed, so changed-code coverage and rendered
output are not applicable; the full repository gate remains for the
integrated Epic/PR candidate.

**Next:** resume V03 only when a rights-cleared local apparel-CAD receiver and
exact build are available. Before fixtures, document rights and local file
handling; then qualify one exact profile and test representative base/graded
fixtures through import and export, including invalid input. If the owner
continues to prohibit paid software, the open requirement is affirmative
access to a no-cost local license that passes those gates. Keep V03 open until
that evidence exists; do not weaken acceptance or claim compatibility.

## Timing

Elapsed `8m58s` (`08:59:44–09:08:42 UTC`; category estimates): primary-source
research `1m45s`; independent OpenCode wait and review `3m15s`; Codex
cross-review and app-state check `2m`; focused verification and replay
diagnosis `1m`; durable records and board closeout `0m58s`; implementation
`0m`; rendered/output review `0m` (no fixture/receiver qualified); maintainer
decision time `0m`.
