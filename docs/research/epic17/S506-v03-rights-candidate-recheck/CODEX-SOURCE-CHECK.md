# S506 Codex primary-source check

Checked 2026-10-08. This is Codex's source inventory for the final S506
reconciliation; it is not legal advice and is not a compatibility finding.

## Richpeace V8 Free Version-English

| Question | Official-source observation | Classification |
| --- | --- | --- |
| Exact free build | Richpeace's CAD software list identifies “Richpeace Garment CAD V8.0 Free Version-English Free” and calls it a “full function evaluation copy.” The vendor download page names the same build, lists 64 MB, and shows update date 2021-10-13. | Evaluation copy availability is established. |
| Use rights | The checked product/download pages call it an evaluation copy, but do not expose a specific evaluation agreement or state whether this product-development test is permitted. Prior targeted official-site searches for software terms, license agreement, privacy policy, and V8 evaluation terms surfaced no applicable terms document. | Unresolved; the evaluation label is not affirmative permission for this use. |
| Local handling | The linked V8 manual illustrates file chooser/open and ASTM export workflows. Those UI steps do not promise that processing is exclusively on-device. The product pages do not describe local-only processing. | Unresolved; neither local-only handling nor cloud transfer is established for the exact build. |
| Host | The V8 product listing (the language variants use the same listed host generation in the vendor's product material) reports Windows XP/7/8/10. This host is Windows 11 Pro 25H2. | Windows 11 support is not documented; this is not proof of incompatibility. |
| Apparel profile | The manual linked from the free English V8 listing documents AAMA/ASTM import and ASTM export workflows. It does not establish standards certification, the exact exchange dialect/layer semantics, V8 Free build parity at runtime, or round-trip behavior. | Documentary menu/workflow evidence only; profile/round-trip gates remain open. |

Sources:

- Richpeace, [CAD Software Download, page 3](https://www.richpeace.com/list-cad_software-3.html), exact free V8 English listing and evaluation-copy wording.
- Richpeace, [V8 Free Version-English download page](https://downsoft.richpeace.com/s/rpoxq2), exact download name, size, and update date.
- Richpeace, [V8 Free Version-English product page](https://www.richpeace.com/garment_cad-show-443.html), product description and listed host OS (direct open timed out during this check; the same V8 listing and host statement are retained in S468/S481).
- Richpeace, [V8 user manual](https://www.richpeace.com/uploadfile/202210/5085cf1486261f.pdf), linked from the free V8 product entry; exchange procedure, not a rights or locality grant.

## Richpeace V10 Demo Free

| Question | Official-source observation | Classification |
| --- | --- | --- |
| Exact free build | The Garment CAD list identifies “Richpeace Garment CAD V10.0 (demo) Free”; the vendor download page uses that exact name, size 29 MB, update date 2021-05-15. | Demo availability is established. |
| Use rights/local handling | The exact free download description contains no applicable evaluation agreement or local-only processing commitment. The targeted official-site terms/privacy searches found no applicable document. | Both remain unresolved. |
| Host | The exact V10 demo-free product page reports `System System：Windows XP/7/8/10`. | Windows 11 support is undocumented; not proof of incompatibility. |
| Apparel profile | The exact V10 demo-free product page says `Import other formats such as DXF, AAMA/ASTM/AUTOCAD.` It establishes import wording only, not export. | Import claim only; export and round trip remain unestablished. |

The exact product page's Download link resolves to a portal record titled only
`Richpeace Garment CAD V10.0`, whose binary filename is
`20220919RPCAD_Enterprise_V10.rar`; that portal record does not prove that its
binary is the product page's demo-free edition. A separate vendor download
record at `https://downsoft.richpeace.com/s/eAEBr3` is titled
`Richpeace Garment CAD V10.0 (demo) Free` (29 MB; update 2021-05-15) and also
describes import, but the package identity/build has not been verified. This
product/download identity ambiguity is part of the exact-build gate.

Sources:

- Richpeace, [Garment CAD list, page 2](https://www.richpeace.com/list-garment_cad-2.html), exact V10 demo-free entry.
- Richpeace, [V10 demo-free download page](https://downsoft.richpeace.com/s/eAEBr3), exact build, date, size, and import description.
- Richpeace, [V10.0 demo Free product page](https://www.richpeace.com/garment_cad-show-442.html), lists Windows XP/7/8/10 and DXF/AAMA/ASTM/AutoCAD import; it documents no export.
- Richpeace, [linked V10 download portal record](https://downsoft.richpeace.com/s/qbOav3), title `Richpeace Garment CAD V10.0`, binary name `20220919RPCAD_Enterprise_V10.rar`; the exact edition relationship to the demo-free product page is unproven.
- Richpeace, [V10 demo-free download record](https://downsoft.richpeace.com/s/eAEBr3), identifies a 29 MB demo-free item updated 2021-05-15 and documents import only; exact package/build identity is unverified.
- Richpeace, [V10 system manual](https://soft.richpeace.com/EN/manual/RichpeaceGarmentCADV10.0SystemManual.pdf), general V10 documentation only; not evidence of the V10 demo-free build's export behavior.

## Search boundary and disposition

The specific official Richpeace pages and downloads above, the linked V8 manual,
and a targeted official-site search for software terms, a license agreement,
privacy/data handling, and evaluation rights were checked. No applicable
rights/local-handling document was located in this check. That bounded search
does not prove no such document exists; it leaves the relevant facts
unestablished. No candidate can proceed to a fixture on this evidence alone.
No download, installation, account/terms acceptance, vendor contact, or file
transfer occurred. The V03 acceptance and the S481 conditional V8 preflight
remain unchanged.
