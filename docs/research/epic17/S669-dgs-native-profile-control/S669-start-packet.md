# EPIC-17 / G04 V03 — DGS native apparel-profile positive control — Slice 669 start

## Verified boundary and scope

- Started 2026-10-10 10:13 UTC from clean S668 commit `7aacc2d9c9a4a7499c88203bb680b560b11c6928`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S668 is highest; S669 is unique. Control Center revision 3936; EPIC-17/G04-V03 In Progress, V01/V02 Done.
- The S668 C:-only source preflight and exact actual import result are final evidence: approved `/2` input differs by only nine version bytes; DGS ASTM/AAMA Pattern import produced blank canvas, 0/0 patterns, no warning dialog. That product fixture candidate is retired; do not repeat it or test another setting/encoding.
- The existing DGS and CLO sessions remain open. No external approval is pending.

## Bounded test

First inspect the installed DGS package's local manuals, example DXF/RUL files, and any included apparel-layout sample; no online upload or product-file exchange. If no usable vendor sample is included, make one minimal positive control natively in DGS: a 10×10 cm closed rectangle named `G04_DGS_CONTROL`, with one explicit center grainline if the native tool allows it. Export exactly once through DGS's ASTM/AAMA mode to `C:\G04-CLO-DXF-Exchange\S669-dgs-native-profile-control\Output\`. Independent parse will record ACAD version, units, entities, layers, identity tags/sidecars and numeric geometry. Import that exact exported file once through the same ASTM/AAMA / Pattern / Unit-of-file route in a fresh DGS document. Record registered-pattern count, warning state, and actual render. This positive control distinguishes receiver availability from the product fixture's dialect mismatch and can expose DGS's own export contract. The DGS menu label will not be treated as conformance evidence.

Stop after this one positive-control round trip. If drawing/export is not supported by the native UI, record the exact observed limitation and stop; do not substitute another format or make a synthetic app look pass. All DXFs, native control docs, screenshots, parsed evidence stay in the named C:-only folder.

## Acceptance unchanged

This experiment does not qualify the product profile or pass any all-seven/grade/option/mark/malformed/repeatability/0.001 cm product gate. It changes no product code, source pattern, legacy DXF writer, protected export bytes, acceptance criterion, tolerance or hold. Continue V03 only on direct evidence; no normative standard, physical-fit, factory-acceptance or production-readiness claim. After one positive control, use its actual schema to plan at most one source-preserving candidate adaptation if the dialect is representable without violating admitted criteria. Otherwise retire DGS and compare the already measured CLO/OpenCAD candidates; acceptance cannot be weakened.

Delegation: none; native UI control creation/export is serial and stateful. Focused checks: sample inventory and export parser. Control Center 42/42 and `git diff --check` at boundary. Full repository coverage/build/render/output replay only on settled Epic/PR candidate. Record implementation, focused verification, external-agent waits and maintainer-decision time separately. Next action: inspect local installed example files, then perform the one bounded positive-control route.
