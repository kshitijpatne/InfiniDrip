# EPIC-17 / G04 V03 free downloadable CAD candidate — Slice 466 exit

## Result

GetonAgain Garment CAD Free Version is a concrete free downloadable candidate, but not yet a selected receiver/profile. The vendor's own free-version page says account registration and login use a mobile number, lists pattern design/grading/marker functions, and explicitly lists importing `DXF (AAMA/ASTM/AutoCAD)`. The official page therefore establishes an import claim for that free offering. It does not document export support for the free build, whether imported drawings are kept local, the exact free-build version, or rights terms. The page also mentions cloud super-nesting, so local-only processing cannot be inferred from its downloadable interface.

The vendor's V2024.1 manual and product material are separate from the free-version listing. They document a garment-CAD product with ASTM/AAMA import/export options, but the free page does not establish that the same export options exist in the free build. No installer was downloaded or run, no phone number was registered, no terms accepted, no files opened or transferred, and no vendor contact occurred. Thus this candidate materially improves the available evidence for import, but no V03 round trip or rights/profile selection is proven.

## Recommendation and next action

The next concrete step is for the owner to install the free version from the official vendor page if comfortable providing a phone number. First inspect Help/About and the available DXF import/export formats. Do not load any project fixture until local file handling and the installed build's privacy/terms are understood. If export is available and local handling is established, test copies of the prepared S463 fixtures, inspect native output, and compare geometry, units, outlines, seams, marks, labels, and all documented grade data. Record receiver and exact version; do not claim ASTM/AAMA conformance solely from menu labels.

Alternatives screened: Seamly2D can export AAMA DXF but its project documentation confirms it cannot import DXF, so it cannot be the bidirectional receiver. garment.dev advertises free AAMA/ASTM import/export but is invite-only and stores patterns in its cloud; the free Hobby tier does not provide private patterns. It is not suitable for uploading InfiniDrip fixtures under the admitted no-hosted-service scope. Pixie Space remains the no-login local-first browser candidate from S465, but its live export menu's `ASTM D-6959` label does not prove apparel-pattern interchange and no fixture round-trip has been performed.

## Gates and scope

V03 remains In Progress with every admitted gate unchanged: rights-reviewed receiver/profile; representative simple, complex, multi-size and negative fixtures; actual same-version round-trip; native output inspection; measured geometry/units/marks/labels/grade comparison; evidence-backed compatibility wording. V01/V02 remain Done. No product source, output, board acceptance, legacy DXF behavior or protected export identity changed. No physical, fit, factory-acceptance or production-readiness claim is made.

## Verification and timing

- Start 2026-10-08 04:41:44 UTC from clean `cc5c869fe27cea51cbf1a634924878e3c58f4c3c`, branch `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest slice 465; S466 reserved. Board start replay 2859→2863 and exit replay 2863→2867; EPIC-17/G04-V03 remain In Progress; V01/V02 Done.
- `npm run control-center:test` and `git diff --check` are the focused checks for this documentation/board-only slice. No product test/build/render/coverage or DXF identity gate is applicable; no production code changed.
- Elapsed ~1m21s (to 04:43:05 UTC): official-source review ~35s; durable packet/state/board work ~35s; focused verification ~11s; implementation 0s; agent waits 0s; maintainer-decision time 0s.
- Next action: owner installs the candidate and reports exact version/available DXF modes. If no installation or no free-build export/local-handling proof, continue V03 receiver search without changing gates.

## Sources checked

- GetonAgain [free-version product page](https://www.raiseagaintech.com/CAD_Software/garment_CAD/509.html): free-version registration, phone login, listed AAMA/ASTM DXF import, and cloud super-nesting feature.
- GetonAgain [V2024.1 manual](https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf) and [vendor CAD catalogue](https://d.getonagain.com/en/CAD/catalogue/20250611_CAD_Catalogue.pdf): product-level import/export references; not proof of parity with free build.
- Seamly2D [official forum import statement](https://forum.seamly.io/t/import-files/8595): confirms DXF import is not supported; its AAMA export cannot satisfy receiver round-trip by itself.
- garment.dev [terms](https://garment.dev/terms), [privacy](https://garment.dev/privacy), and [pricing](https://garment.dev/pricing): invite-only alpha, cloud-held patterns, and no private patterns on the free tier.
- Pixie Space [product page](https://pixiespace.app/) and [privacy page](https://pixiespace.app/privacy/); exact live UI and D-6959 caveat are recorded in S465.