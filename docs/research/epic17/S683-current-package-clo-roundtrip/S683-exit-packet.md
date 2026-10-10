# S683 exit — current package CLO attempt stopped before import

## Result

S683 prepared the exact current S681 Polo M candidate for one test through the
existing CLO 2026.1.310 Standard DXF route. The C:-only copy is byte-identical
to its verified source and paired manifest. The native app launched, but the
Windows computer-use bridge could not activate the uniquely identified CLO
window. It returned `failed to activate captured window` twice, including once
after refreshing the app/window list as required by the computer-use recovery
procedure. No file dialog, import, export, save, or CLO output was produced.

This is a tooling-access failure before any receiver operation. It does not
show a CLO defect, an exporter defect, or a pass/fail result for the S681 DXF.
No V03 gate is promoted. CLO is left open; no repeated launch occurred.

## Exact fixture and custody

- Source: `C:\G04-CAD-Interchange\S681-mark-identity\polo-default-M.dxf`
- S683 copy: `C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\polo-default-M.dxf`
- Both DXFs SHA-256: `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`
- Paired manifest schema `infinidrip.g04.dxf-package/2`, revision
  `90dcd184ff28920dafa3e986dcf4e6fe92cb0a678d4092ed0b17fe172afb25f3`, SHA-256
  `aa0a186287e8960559677252524e2e0c1643968524aa297af627d6ee8fd57f2c`.
- Package records Polo M, eight resolved options, nine pattern pieces, 38 named
  visible marks, and centimeter DXF units. It is a generic package label, not a
  standards or receiver-compatibility claim.

## Verification and gate disposition

- Verified Git start: clean S682 commit `4b3ddd1154e10bee4117e6aa0d6baaea22535973`;
  refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Slice 683 is unique.
- Board start replay: revision `4045→4047`; EPIC-17/G04-V03 In Progress and
  V01/V02 Done.
- Exact-file C: copy hashes match source. No production/test source changed;
  changed-code coverage, build and full repository gates do not apply to this
  evidence-only attempt.
- Native UI bridge: CLO app was returned by `list_apps`; its unique window was
  returned by `list_windows`. `activate_window` failed twice. No further UI
  input was attempted after the prescribed retry failed.
- CLO import/export, exact geometry/units/marks, all-seven/options/grades,
  malformed-input rejection, round-trip repeatability, profile qualification
  and receiver rendered readability remain unproven or retain their prior
  measured dispositions. All V03 acceptance and thresholds remain unchanged.
- `npm run control-center:test` and `git diff --check` are required at closeout.

## Next action

Continue from this packet. Use only a supported way to acquire a targetable CLO
workspace window or another in-scope route already authorized and supported by
evidence. Once targetable, retry this same hash-pinned S681 Polo M file exactly
once, then apply the S683 entry checks before any export. Do not substitute a
new app, mode, encoding, or weaker gate. All-seven V03, final full coverage,
rendered/output review, PR, safe merge, ancestry and deployment remain pending.

No fit, factory, production-readiness or standards-conformance claim is made.

## Slice ledger

- Started 2026-10-10 18:27:51 UTC; closed 2026-10-10 18:29:42 UTC from clean
  S682. Refreshed `origin/main` remained an ancestor; board start/exit replays
  are `4045→4047` and `4047→4049`.
- Elapsed 1m51s: packet/preflight/custody checks ~35s; focused verification
  ~10s; actual UI launch/observation/recovery ~25s; docs and board closeout ~40s;
  external-agent waits 0; maintainer-decision time 0.
