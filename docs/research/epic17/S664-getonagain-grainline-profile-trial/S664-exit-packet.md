# EPIC-17 / G04 V03 — DGS grainline profile trial — Slice 664 exit

## Result

The one predeclared `idr-pattern-exchange/2` candidate import **failed** the
pilot's warning-free acceptance check. GetonAgain DGS `VID:20250610`, in
`AUTOCAD` mode with the frozen S661 settings, imported and displayed all nine
Polo M pieces, then reported `grainline is outside the border` for all nine
pieces. The warning panel had Error Box, Border, Gainline, and Notch checks
enabled. No export, repeat import, alternate format/mode, alternate entity, or
setting trial was performed.

The exact hash-pinned S648 source was 153,647 bytes with SHA-256
`ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461`; its
C:-only copy is byte-identical. The candidate was 155,176 bytes with SHA-256
`DFC15003F11AFEC33C4AADB3286D3354A808D834DCD1979B7CB2EE0BC94F07F2`. Its
structural verifier found only the approved layer/table-count, nine LINE, and
handseed changes; all 11,255 source raw pairs and existing block entity
payloads were preserved, as were nine INSERTs, centimeter units, CUT/SEW,
marks, and identities. For all nine added source-derived grainline segments,
501/501 sampled points per segment (4,509/4,509 total) are inside the
corresponding source CUT polygon. This validates candidate geometry, not the
receiver's grainline semantics.

Actual receiver result and rendered workspace capture are saved only under
`C:\G04-CLO-DXF-Exchange\S664-getonagain-grainline-profile-trial\Evidence\`.
`S664-import-result.jpg` SHA-256 is
`B4CE4D0931C048203E7A8CA0FBA53CEEE9C596690F2A6FA69ADBA87952E72CEC`.
The structured actual receiver result,
`S664-receiver-result.json`, SHA-256 is
`22197D863DF4CD690161440162369835767CBC929006053500DD351BD5E230BA`.
The screenshot shows the open Error Box with the nine-piece layout; the
accessibility capture enumerates all nine warning rows. The warning panel
obscures part of the canvas and the compact native display is not independent
proof of output readability. No receiver export exists because the import
failed its declared stop condition.

## Gate effect and interpretation

- **Passed narrowly:** candidate structure/preservation preflight; DGS loaded
  9/9 pieces. Source coordinates are demonstrably inside their matching CUT
  contours.
- **Failed:** warning-free grainline import for this exact receiver build,
  input, mode, and setting profile. The failure is 9/9 native
  `grainline is outside the border` warnings.
- **Unproven:** the cause within DGS interpretation (for example layer/entity
  recognition versus transformed piece-boundary association), receiver
  rendering without warnings, and every broader V03 geometry/marks/units/
  identity/grade/malformed/repeatability/export/round-trip/readability/profile
  gate. No cause is selected from inference alone.

The source-line-inside-CUT check and DGS warning conflict is now the decisive
observed blocker for this candidate. Because no import passed, stopping before
export followed the predeclared plan. S664 does not qualify
`idr-pattern-exchange/2`, DGS, or an industrial profile; it makes no ANSI/AAMA
or ASTM conformance claim and clears no V03 acceptance gate. Existing V03
criteria, all-seven/options/grades, fixed thresholds, legacy DXF behavior, and
protected export byte identities are unchanged.

## Verification and boundary

- Started `2026-10-10 08:18:00 UTC` from S663
  `360f73f0d141bfa2013447618bf55f8a8af4f67b`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S663 was highest; S664 is unique. Start replay reached board revision 3879.
- Candidate builder rerun and structural verification passed; `node --check`
  passed; `npm run control-center:test` passed 42/42; `git diff --check`
  passed. No production source, tests, export baseline, or protected identity
  changed; changed-production-code coverage is not applicable.
- DGS observation: one candidate import, 9/9 pieces present, 9/9 warning
  rows. Saved actual receiver screenshot hash above. GMS/DGS sessions were not
  closed or restarted.
- Elapsed time through closeout: 25m30s (`08:18:00–08:43:30 UTC`). Candidate
  build and structural verification: 2m; DGS interaction/import/render
  observation: 13m; focused verification: 3m; durable packet/state/board
  closeout: 7m30s; external-agent waits: 0m; maintainer-decision time: 0m.
- Validated exit commands add the S664 packet to EPIC-17 and G04-V03 without
  changing their statuses. Board exit revision: 3884. Control Center tests
  and `git diff --check` pass after replay.

## Next action

Before reserving another test, perform one updated V03 gate reconciliation
against the S649 matrix plus S650–S664 actual source, receiver, and rendered
evidence. Group gates by shared cause, record passed/failed/unproven, and write
one short stop-first route plan. The specific candidate failure does not
authorize a format/mode/setting permutation. Keep V03 and EPIC-17 open and
retain every acceptance gate and hold pending actual evidence. The full
repository 100% coverage gate, integrated build/browser/output review, PR,
safe merge, `origin/main` ancestry verification, and any required deployment
remain final completion gates. No physical fit, factory acceptance, or
production-readiness claim.
