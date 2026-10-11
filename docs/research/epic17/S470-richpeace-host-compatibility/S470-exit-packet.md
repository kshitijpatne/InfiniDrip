# EPIC-17 / G04 V03 Richpeace host compatibility — Slice 470 exit

## Finding

The current local host reports Windows 11 Pro, version 10.0, build 26200 via
`Win32_OperatingSystem`. Microsoft's Windows release table identifies build
26200 as Windows 11 version 25H2. `Get-ComputerInfo.WindowsProductName` also
returned a stale/conflicting "Windows 10 Pro" label; the OS caption/build and
Microsoft's build mapping are stronger evidence, but this provider discrepancy
is retained here.

Richpeace's official **V8 Free Version-English** product page lists Windows
XP/7/8/10 and not Windows 11. It remains the strongest V03 candidate because
the free English V8 listing links the V8 manual documenting AAMA/ASTM import
and ASTM export. This does not establish Windows 11 compatibility.

The official **V10 demo Free** page also lists Windows XP/7/8/10 and documents
DXF/AAMA/ASTM import; the page does not document an apparel-format export. It
does not resolve either the host-OS gap or the V03 round-trip evidence gap, so
it is not a better documented receiver candidate. The V8 manual remains the
best available exchange lead, subject to owner-confirmed build, terms, menus,
and local operation.

## Disposition

An owner may attempt the ordinary official V8 installer if they choose, with
the understanding that the vendor does not list Windows 11 as supported. Do
not change Windows compatibility settings or troubleshoot around a failed or
unstable install. If it opens normally, first capture exact About/version,
evaluation terms, and import/export menus; confirm ordinary exchange is local.
Only after those checks pass may the S469 synthetic-fixture trial begin. Do
not install V10 instead on the assumption that it supports this host or has the
needed export path. No browser-based service found so far provides stronger
verified V03 evidence without a file-handling/privacy uncertainty.

No installer was downloaded/run, no software or account was changed, no file
was opened or transferred, and no receiver/profile/compatibility claim was
selected. V01/V02 remain Done; V03 and EPIC-17 remain In Progress.

## Sources and verification

- Host query: `Win32_OperatingSystem` returned `Microsoft Windows 11 Pro`,
  version `10.0.26200`, 64-bit. The separate `Get-ComputerInfo` product label
  conflict is recorded above.
- Microsoft [Windows 11 release information](https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information)
  maps OS build 26200 to Windows 11 version 25H2.
- Richpeace [V8.0 Free Version-English](https://www.richpeace.com/garment_cad-show-443.html)
  lists XP/7/8/10 and links its V8 manual. The V8 candidate and exchange
  evidence are detailed in S468.
- Richpeace [V10.0 demo Free](https://www.richpeace.com/garment_cad-show-442.html)
  lists XP/7/8/10 and says it imports DXF, AAMA/ASTM and AutoCAD formats; it
  does not document AAMA/ASTM export on that product page.
- Focused verification: `npm run control-center:test` 42/42;
  `git diff --check` passes. Board start revision 2891; validated start and
  exit replays 2891→2895→2899; V01/V02 Done and V03 In Progress. No production
  code or output gate applies.

## Next action and timing

Next: owner may make a standard install attempt and return the exact About
version/build. If it runs normally, record terms and local import/export menu
choices before opening any S463 fixture. Preserve every V03 evidence gate and
the exact compatibility wording.

Elapsed approximately 1m13s (04:55:39–04:56:52 UTC): host/build and official
candidate review ~45s; durable records and board replay ~25s; focused checks
and diff validation ~3s; implementation 0m; external-agent waits 0m;
maintainer-decision time 0m.
