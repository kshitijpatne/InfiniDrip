# EPIC-17 / G04 V03 — CLO saved-project geometry audit — Slice 576 exit

## Result

The two existing CLO projects are intact and their hashes match S574's records:

- After importing the source-derived DXF: 2,288,959 bytes; SHA-256
  `43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25`.
- After re-importing generation one: 2,291,962 bytes; SHA-256
  `0DCCD455D1FB2F45DB66129F8355E015F80BFDDBC174B3AA2C454DED78F9FD04`.

Both outer files have CLO-specific `ZPRJ` headers and embed a valid standard
ZIP archive, which was opened read-only with .NET's standard ZIP reader. Each
archive contains 15 files. Its transparent XML member is an `Environment`
document containing scene lighting, wind, and background settings; the JSON
members contain UI/fit-map/snapshot settings and a file manifest. They expose
no garment piece or 2D contour coordinates.

The geometry-bearing-looking members have CLO-specific binary signatures:
`.zpac`, `.vmp`, `.vlp`, and `.vrp`. Their payloads were neither decoded nor
reverse engineered. Seven of the 15 corresponding members differ between the
post-import and re-import projects, including those custom binary members, but
their opaque content prevents interpreting that difference as a CUT-path
change. Eight members are byte-identical. The read-only ZIP inventory and
member hashes are recorded in the JSON report.

**Therefore this artifact audit cannot determine whether the imported CLO
project retained source CUT geometry before export.** S575 still proves that
the saved generation-one DXF lacks any qualifying CUT path, but the
source-versus-import/export stage remains unresolved. No CLO UI action, DXF
exchange, project save, proprietary parsing, production change, geometry
change, tolerance/acceptance change, or compatibility claim occurred. All
V03/V02 gates and holds remain. Rights and local-only processing are settled;
the CLO session remains open.

## Reproducible evidence

- Read-only inspector:
  `docs/research/epic17/S576-clo-project-geometry-audit/inspect-projects.ps1`.
  It verifies both expected project SHA-256 values, finds and opens the
  embedded standard ZIP in memory, inventories entry signatures and hashes,
  parses only transparent XML/JSON, and withholds values from the local-path
  manifest.
- C:-only report:
  `C:\G04-CLO-DXF-Exchange\S576-clo-project-geometry-audit\Evidence\project-container-inspection.json`.
  SHA-256:
  `9BD8F825173BC8EA77DA05C6EC9529899447B21A4545E1C1CEC93C062555770A`.
- First ZIP local-header offsets are 19,955 and 19,956 bytes respectively;
  both standard readers enumerate 15 members and reach a valid central
  directory. No extracted file was written.
- The transparent XML member in both projects has root `Environment` and 32
  element names limited to scene environment controls. The custom `.zpac`,
  `.vmp`, `.vlp`, `.vrp`, and `.smp` members have non-XML/non-JSON/non-ZIP
  signatures; no geometry payload reader was attempted.
- The inspector leaves source projects unchanged; output is only written under
  the named S576 folder on C:.

## Verification and durable state

- S576 start commands were applied through the validated Control Center CLI:
  board revisions 3417→3419. Exit commands add the evidence and decision at
  3419→3421; G04-V03 remains In Progress.
- PowerShell parser validation passed. The inspector reproduced the project
  hashes, valid ZIP manifests, member inventory, transparent XML/JSON, and
  per-member comparison; the C:-only report SHA is
  `9BD8F825173BC8EA77DA05C6EC9529899447B21A4545E1C1CEC93C062555770A`.
  Preflights simulated both validated exit commands without changing status;
  replay wrote both through the CLI. `npm run control-center:test` passes
  42/42 and `git diff --check` passes. No production source/tests changed, so
  the global repository coverage/build gate is not due.
- No safe independent delegation existed for the paired binary-container
  audit; external-agent waits 0 minutes.

## Slice timing and next gate

- Started 2026-10-09 04:45:56 UTC from clean S575 commit `4177940a`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Unique slice number: 576; highest assigned at start was 575.
- Elapsed slice time: 2026-10-09 04:45:56–04:51:00 UTC (5m04s): project
  container inspection approximately 3m20s; focused verification and durable
  exit approximately 1m44s; external-agent waits 0m; maintainer-decision time
  0m.
- **Next:** check only the official CLO 2026.1.310 scripting/API surface for a
  documented read-only method that returns exact 2D pattern curves from the
  imported project. Do not decode custom members or repeat a receiver test.
  If the supported API has no such method, record that fact and then choose
  the next V03 route from concrete evidence without changing its gates.
