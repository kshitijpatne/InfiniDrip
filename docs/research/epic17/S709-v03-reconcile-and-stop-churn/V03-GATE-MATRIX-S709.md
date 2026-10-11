# G04 V03 fixed gate matrix — S709

Snapshot: current branch at S708 `17ffedd2`; exact S640 CLO Standard import
result; S700 source package; S704 reconciled matrix; S708 LibreCAD R2000
round trip. Acceptance and thresholds are unchanged.

| Gate | Status | Strongest evidence | Shared cause / remaining proof |
|---|---|---|---|
| Rights and local handling | **Passed for bounded local evaluation** | Maintainer confirmations in `docs/PROJECT-DECISIONS.md`; tested artifacts stayed on C:. | Does not establish receiver qualification or commercial deployment rights. |
| Named industrial apparel receiver/profile | **Unproven** | Board explicitly requires a rights-reviewed industrial CAD receiver/profile. CLO 2026.1.310 has an apparel DXF-ASTM route but measured failures; GetonAgain/DGS routes S667–S670 lose usable identity/geometry; LibreCAD 2.2.1.5 DXF 2000 is generic CAD. | This is an independent eligibility gate. No menu label, generic pass, or number of options can make a generic tool an industrial apparel profile. Need a qualifying documented profile among authorized tools, supported by source/manual and actual output. No new application or repeated failed mode. |
| Source package: geometry, marks, units, identity, grade and options | **Passed at source** | S700/S705/S708 package tests cover seven registered recipes, all 73 canonical option rows and grade rows; source manifest binds revision, pieces, marks, stitch relations and centimeter unit declaration. | This is generator evidence, not returned-file proof. |
| Returned CUT/SEW geometry | **Passed for one S708 LibreCAD Polo M fixture; failed on tested CLO fixtures; breadth unproven** | S708: 18 paths with identical ordered nonredundant coordinates (0 cm residual). S640: 4/9 CLO CUT contours pass, 5 fail before export; S703 independently measures five CUT misses in DXF-ASTM. | Receiver/source-serialization behavior is separate from source geometry. No remaining all-seven receiver evidence. |
| Returned units | **Passed for one S708 LibreCAD fixture; failed on S703 CLO return; breadth unproven** | LibreCAD retains `$INSUNITS=5`; CLO AC1009 return lacks the declaration. | Same-route breadth and agreement between declared units and actual dimensions remain to prove. |
| Returned CUT/SEW layers and typed marks | **Passed for one S708 LibreCAD fixture; failed in tested CLO/DGS routes; breadth unproven** | S708: 9/9 CUT remain on CUT, 9/9 SEW on SEW; 111/111 marks preserve type/layer/coordinate or radius. CLO S703 loses checked point marks and numeric layers; DGS S667 loses semantic layers/marks. | One exact source-side R2000 structure correction improved LibreCAD. Broader proof needs the selected profile. |
| Piece identity after return | **Passed for nine LibreCAD block names on one fixture; full relation unproven** | S708 returned all nine source block names and INSERTs. | Names alone do not bind the returned drawing to the sidecar or prove source role/revision/grade/stitch relations across options. `verifyDxfInterchangePackage` hashes the original DXF bytes, so receiver-rewritten bytes need a separate returned-file comparator against the unchanged source manifest. |
| Seven recipes, 73 supported options and grades after return | **Unproven** | S700 verifies source-side breadth; S708 is one Polo M receiver fixture. | Run breadth only after profile eligibility and a current-source representative pilot pass. |
| Malformed/unsupported input handling | **Partially passed in package verifier; unproven as complete exchange behavior** | S700 tests reject malformed DXF/manifest/schema tampering; existing C04 contract accepts a visible error or blocked status for unsupported content. OpenCAD accepted non-finite data; CLO S531 silently dropped content. | Need explicitly replay the existing negative fixture set through the product's fail-closed package/import path and verify visible error/blocked status with no misleading successful output. Do not rely on the CAD application to reject every invalid file. |
| Repeatability | **Unproven for S708/current package** | S708 is one save/reopen. Other repeatability evidence belongs to nonqualifying OpenCAD R14. | Once eligible route and representative fixture pass, perform one repeated exchange and normalized comparison. |
| Readable output | **Passed only for a visibly reopened S708 Polo M drawing; acceptance breadth unproven** | S708 packet records clean reopen and visible complete nine-piece/layer-tree review. | Need inspection of returned overview/detail/marks and supported option/grade cohort on the qualifying route. |
| Legacy DXF and protected byte identities | **Passed in S708 focused regressions; final integrated gate pending** | S708 focused 29/29 included regression identity checks; writer is opt-in. | Repeat unchanged identity tests at settled candidate/full gate. |
| Final repository acceptance and release | **Pending** | No merged PR or deployment is recorded for EPIC-17. | Full 100% repository coverage, integrated build/browser/Electron, rendered review, necessary-file cleanup, reviewed PR, safe merge, refreshed ancestry, required Actions deployment, production end-to-end check. |

## Codex verification of bounded Sol review

The reviewer identified two important ordering facts, checked against the
code and contract: (1) a 73-option LibreCAD run cannot clear the independent
industrial-profile gate; do not spend that effort before eligibility is
resolved; (2) the current package verifier's exact source-DXF hash is not a
round-trip verifier for a receiver-rewritten DXF, so returned entity/block
identity must be compared to the original manifest separately. C04 row
`Negative/unsupported content` permits visible error or blocked status; the
product fail-closed check can therefore be tested without treating LibreCAD's
own parser as the only gate. Codex confirmed these points against
`src/export/dxf-interchange-package.ts`, the G04 board contract and
`docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`.

The review did not pass any gate or authorize a profile/acceptance change.
