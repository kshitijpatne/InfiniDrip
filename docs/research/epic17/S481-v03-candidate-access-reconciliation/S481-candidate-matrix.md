# S481 — G04 V03 candidate status matrix

Checked against the unchanged C04 CAD acceptance boundary and the durable
S465–S480 evidence on 2026-10-08. A free label, format-menu name, or vendor
claim is not a verified local round trip.

| Candidate | Rights and local handling | Exchange evidence | Current disposition |
| --- | --- | --- | --- |
| CLO 2026.1.310 | Trial terms do not establish permission for this product-development purpose or local-only handling; S479 prohibits further fixture trials pending rights evidence. CLO is closed now. | S475–S478 contain bounded technical trials, with Woven M passing one contour gate and Polo M failing it; neither establishes permitted profile-wide behavior. | Not selectable under current rights evidence. |
| Richpeace Garment CAD V8.0 Free Version-English | Vendor calls it a full-function evaluation copy but accessible evaluation terms/local-processing commitment were not found. Product page lists Windows XP/7/8/10, not this Windows 11 25H2 host. No install is present. | The V8 manual linked from the free product entry documents apparel AAMA/ASTM import and ASTM export; no local fixture round trip was witnessed. | Strongest documented local lead, but pre-fixture rights, host, and exact-build gates remain open. Official page still calls it an evaluation copy and lists XP/7/8/10. |
| Pixie Space 0.2.0 | Browser product/privacy text says drawings stay in the tab/local file and are not uploaded; no explicit EULA/software license was found. The app is under construction. | Observed menu offered `DXF — generic` and `DXF — AAMA (ASTM D-6959)`. D-6959 is not an apparel-pattern interchange basis; POM grading was described as future work. No round trip occurred. | Cannot satisfy the current industrial profile and grade gates on existing evidence. |
| GetonAgain Garment CAD Free | Phone registration/sign-in and cloud SuperNest are documented; local-only handling and exact free-build rights are not. | English free page documents apparel-DXF import; separate Chinese free page claims DXF import/export. Product manual evidence is not proven to match the free build; exact profile behavior is untested. | Insufficient free-build, rights, and locality evidence. |
| Richpeace V10 demo Free | Official page lists Windows XP/7/8/10; no applicable terms/locality evidence. | DXF/AAMA/ASTM import is described; apparel export is not established on that free page. | Does not improve on V8 for this host or round trip. |
| Seamly2D | Local Windows option; GPLv3+ project licensing is documented. | Project states DXF import is not supported; export alone cannot round trip. | Disqualified as receiving application. |
| OpenMarker | Apache-2.0, local/offline-first project. | Current official README says the import path exists, the app is not production-ready, and the export flow remains planned. | Disqualified as a receiver. |
| garment.dev | Invite-only hosted library; free tier does not provide private patterns. | Vendor claims AAMA/ASTM import/export. | Out of G04's local/no-hosted scope. |
| Open Patterns parser | ISC parser package; all three S463 generic fixtures fail at missing `dxf.blocks`; no DXF writer. See S480. | No parse or round-trip output. | Disqualified for the current fixtures and V03 round trip. |

## Gate result and next step

No candidate currently satisfies all of: an exact locally accessible receiver
and version, rights for this evaluation, local fixture handling, documented
apparel interchange, actual source-to-receiver round trips, grade/size
semantics, and malformed-input behavior. V03 remains In Progress with its
acceptance unchanged.

The only evidence-backed next trial lead is Richpeace V8 Free English, and it
is conditional. Before a fixture is selected, an authorized user must approve
a standard installation attempt on the Windows 11 host (the vendor does not
list that OS) or provide a supported host, then Codex must inspect the exact
displayed evaluation terms and import/export modes and establish local-only
handling. Stop if the app is unstable, terms are unclear, cloud processing is
required, or the needed modes are absent. No compatibility-mode workaround.
If that preflight passes, proceed with copies of the existing S463 fixtures
under `C:\G04-CLO-DXF-Exchange`, and retain the native output and negative
case checks. The current XS/M/XL files are separate generic DXFs and do not by
themselves prove native grade-rule exchange.

If no such receiver/access is approved and available, the exact blocker is the
absence of a rights-reviewed, local, industrial apparel-CAD receiver/profile
that can be exercised with the prepared fixtures. No amount of internal DXF
testing can replace its receiving-app evidence. Keep all V03 gates and do not
reopen CLO under the current rights finding.
