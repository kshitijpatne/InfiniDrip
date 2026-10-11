# EPIC-17 / G04 V03 GetonAgain Free exchange-claim review — Slice 467 exit

## Findings

The vendor's Chinese official page for **GetonAgain Garment CAD Free Version** explicitly says it supports PLT and DXF file import/export. The English official page for the same named free version explicitly lists importing `DXF (AAMA/ASTM/AutoCAD)` and phone-number registration/login. Together these statements support a vendor claim of free-build DXF import/export and an AAMA/ASTM import capability. They do not establish that the free build exports AAMA/ASTM, nor the content/layer/grade semantics of its generic DXF export. The V2024.1 manual/catalog are product-level references and are not shown to apply to the free build.

The vendor page explicitly advertises cloud SuperNest connectivity. Its available public product page does not establish whether drafting and DXF file operations stay on-device, what the phone-linked account does with patterns, the free build's terms/license, or whether the cloud function is optional. Because G04 excludes hosted services and V03 needs a rights-reviewed receiver, no pattern fixture may be opened in this software until the owner confirms installation, the exact build/modes and local processing/terms. No phone number, account, installer, or pattern data was used here.

## Disposition

GetonAgain remains a promising **owner-installed candidate**, not a selected V03 receiver/profile. The free-build round-trip gate remains open. The next step is to inspect the installed app's About/version and exact export-format list without opening a fixture; then establish whether import/export is local and licensed and whether cloud sign-in/sync/nesting can be avoided. If those facts are acceptable, run the prepared S463 fixtures through that exact build and compare receiver-native outputs. If not, reject this candidate and continue searching. Do not infer conformance from “DXF,” AAMA/ASTM import, or a product-level manual.

No changes to V03 criteria, V01/V02 acceptance, production code, generic DXF behavior, or protected byte identities. No compatibility, physical fit, factory acceptance, or production-readiness claim.

## Checks and timing

- Started from clean S466 `ae1b0243bfd63e0429b09fb414ded270cbec77a1`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Board start replay 2867→2871; exit replay 2871→2875. EPIC-17/V03 remain In Progress; V01/V02 Done.
- `npm run control-center:test` and `git diff --check` are the focused documentation/board gates. No source, output, build, renderer, or export-baseline change.
- Elapsed ~59s (04:45:20 UTC to 04:46:19 UTC); official-source review ~17s, packet/board/state updates ~20s, focused checks ~8s; implementation 0s; external-agent waits 0s; maintainer-decision time 0s.

## Sources checked

- Official [English free-version page](https://www.raiseagaintech.com/CAD_Software/garment_CAD/509.html): AAMA/ASTM DXF import, mobile-number account, cloud SuperNest connection.
- Official [Chinese free-version page](https://www.raiseagaintech.cn/cad_software/Clothing_CAD/448.html): PLT and DXF import/export; phone registration/login; cloud SuperNest connection.
- Official [V2024.1 manual](https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf) and [CAD catalogue](https://d.getonagain.com/en/CAD/catalogue/20250611_CAD_Catalogue.pdf): product-level information, not verified parity with free build.