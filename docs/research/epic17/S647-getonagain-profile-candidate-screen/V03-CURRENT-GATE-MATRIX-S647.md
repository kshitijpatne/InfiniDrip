# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 647

## Candidate decision

GetonAgain Garment CAD V2024.1 is a credible new *candidate for a bounded trial*, not a selected receiver/profile. Its first-party manual documents garment DXF import with ASTM/AAMA and AutoCAD paths, and DXF export with ASTM/AAMA and AutoCAD choices. The import dialog includes source units, text, base-size, seam recognition and nesting controls; export includes base-size and RUL/no-RUL choices. This is materially more apparel-specific than OpenCAD Studio's generic R14 route.

The manufacturer advertises both a free version (200 minutes) and a 15-day trial. Its current Chinese product page says the free trial requires registration with a mobile phone number. The manual and catalog describe file-path import/export workflows, but neither establishes that DXF processing is local-only. The catalog also advertises a cloud-converter feature for other CAD formats. Public first-party evidence found in this screen does not establish trial license rights for InfiniDrip product-development evaluation, file-handling locality, or what data is sent for activation. Therefore the candidate is **conditionally eligible for screening only** and not yet rights/locality qualified.

## V03 gates

| Gate | Latest evidence through S647 | Disposition |
|---|---|---|
| Rights-reviewed industrial receiver/profile | GetonAgain identifies itself as professional garment CAD and documents ASTM/AAMA import/export. Trial rights and exact profile semantics are not established. | **Open / blocking.** Candidate only. |
| Local file handling | Manual shows file path dialogs for DXF import/export; no first-party statement that drawing data stays local. Cloud-converter functionality exists for other formats. | **Open / blocking.** Do not open G04 fixtures until verified/authorized. |
| Units and coordinate contract | GetonAgain manual exposes “Unit of file” and a millimeter scale control, but no InfiniDrip fixture was tested. | **Open / blocking.** |
| Source validity and CUT/SEW geometry | S646 exact generic R14 input retains geometry in OpenCAD but fails five Polo CUT contours in CLO at `0.001 cm`. GetonAgain has no test result. | **Open / blocking.** |
| Seven recipes, options, grades | No recipe/option/grade fixture has been exchanged through GetonAgain. Manual describes grading and a RUL option but no qualifying test. | **Open / blocking.** |
| Piece, garment, revision identity and relationships | No source identity or relationship round trip tested. | **Open / blocking.** |
| Manufacturing marks and layer/entity semantics | Manual exposes seam recognition and notch/drill/buttonhole construction features, but no source-linked mark semantics are proven. | **Open / blocking.** |
| Malformed/invalid input | Not tested. | **Open / blocking.** |
| Repeat round trip | Not tested. | **Open / blocking.** |
| Rendered output/readability | No InfiniDrip pattern has been rendered in this candidate. | **Open / blocking.** |
| Legacy DXF/protected identities | No production code, pattern, baseline, or source export changed. | **Preserved.** |
| V02/all-seven prerequisite | V01/V02 remain Done; current board retains V03 and Epic In Progress. | **Unchanged.** |

## Sources and limits

- Vendor manual, GetonAgain Garment CAD System Manual V2024.1: <https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf>. The DXF import section distinguishes ASTM/AAMA from TIIP and AutoCAD; the export section describes ASTM/AAMA output and RUL/base-size choices. It documents user-selected file paths, not a no-upload guarantee.
- Vendor catalog, GetonAgain Garment CAD: <https://d.getonagain.com/en/CAD/catalogue/Garment_CAD_V2024.1.pdf>. It claims DXF input/output and separately mentions a cloud converter for other CAD formats.
- Vendor trial catalog, GetonAgain Garment CAD V2024.1: <https://d.getonagain.com/en/CAD/catalogue/20250801_GetonAgain_Garment_CAD_V2024.1.pdf>. It advertises a free 200-minute version and a 15-day trial. No trial terms were found in the catalog.
- Vendor free-version page: <https://www.raiseagaintech.cn/cad_software/Clothing_CAD/448.html>. It describes phone-number registration for the free version. The exact trial registration/data terms were not available from the fetched source.
- The official download detail page timed out during source retrieval. No installer was downloaded; no software was installed or run; no vendor contact or account action occurred.

## Next action

Keep every V03 gate and hold. Before a GetonAgain fixture test, obtain explicit maintainer authorization for acquiring/installing/running this new candidate, and verify in its official trial conditions or at first run that product-development interoperability evaluation is permitted and that the exact ASTM/AAMA DXF operation can be performed without transmitting the G04 files. If trial activation requires an unapproved account or rights remain unclear, stop before opening fixtures. If qualified, use one hash-pinned representative fixture and source-bound geometry checks first; only proceed to export/reimport after the pre-export gate passes.
