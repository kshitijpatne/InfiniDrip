# EPIC-17 / G04 V03 — Open CAD Studio R14 receiver preflight — Slice 623 exit

## Result

Open CAD Studio's official browser app opened and rendered a disposable, locally created DXF containing a closed `CUT` rectangle and a diagonal `SEW` line. The exact input is `C:\G04-CLO-DXF-Exchange\S623-opencadstudio-r14-receiver\synthetic-rectangle-r12.dxf` (208 bytes; SHA-256 `689CEBC66EB150C5BE8AF203076477CA725735D0D57AEBE60DAF041FC2087992`). The visible canvas showed the rectangular outline and diagonal. This confirms the browser app can open and render this synthetic DXF; it does not establish fidelity on product patterns.

The receiver's Save Drawing As dialog visibly offers `DXF R14`, but exposes only a file-name field and format selector. It does not expose a destination-folder field or picker. The official project README says browser drawings are saved as local downloads. The browser session did not expose a way to guarantee the user's required destination `C:\G04-CLO-DXF-Exchange\S623-opencadstudio-r14-receiver\`. The Save Drawing As dialog was cancelled; **no R14 output was generated**. The ordinary Save control displayed “Saved: synthetic-rectangle-r12.dxf,” but no additional file appeared in the designated evidence folder or the standard Downloads directory, so that status was not treated as proof of a durable export.

Because the required C:-only output path could not be guaranteed, no InfiniDrip DXF or pattern geometry was opened in this web receiver. This is a **candidate workflow preflight hold**, not an import, geometry, format, or data-rights failure. S623 does not determine whether the receiver sends an opened drawing to a server; no product drawing was supplied and no local-only claim is made for this service. The maintainer's written authorization for CLO product-development evaluation and local processing remains settled and is not broadened to this third-party web app.

The official project describes the web build as a browser app, says files are selected through the browser and saved as local downloads, lists DXF R14–2018 save targets, and publishes the project under GPL-3.0. Those statements establish the advertised workflow and software license only; they do not establish apparel-CAD profile semantics, industrial compatibility, product-data processing locality, or conformance to an industrial interchange standard. Sources checked: [Open CAD Studio project README](https://github.com/HakanSeven12/OpenCADStudio) and [official web app](https://www.opencadstudio.com/app/).

## Acceptance and V03 disposition

- **Pass, candidate-only:** official application loaded; synthetic R12 DXF opened and rendered; a DXF R14 save target is present in the UI.
- **Fail, candidate preflight:** no verifiable way in this browser session to save R14 output directly into the required named C: folder.
- **Not run:** all seven recipe fixtures, Tee sizes, actual product import, R14 export, reopen, geometry/layer comparison, malformed-product input, repeatability, or rendered product-output review.
- **No V03 gate clears.** Receiver/profile rights and industrial scope, seven-recipe and option coverage, source-bound geometry and piece identity, CUT/SEW/mark semantics, grade behavior, malformed-input handling, round-trip stability, and readable production output remain open. Exact compatibility is not claimed.
- No source, recipe, pattern geometry, stitch graph, DXF writer, baseline, or acceptance criterion changed. Legacy DXF behavior and protected export identities are preserved. G04-V02 remains Done; G04-V03 and EPIC-17 remain In Progress. No physical-fit, factory-acceptance, or production-readiness claim follows.

## Files and rendered evidence

The named C: folder contains only the 208-byte synthetic input. No receiver output was produced. The visible app canvas was inspected during the session; a durable screenshot was not captured because the browser's screenshot buffer could not be written to the named folder with the available UI/API. There is therefore no receiver-output render to review or claim.

## Verification and next action

The start and exit records and Control Center replay are validated through the canonical command layer. This evidence-only slice changes no production code and needs no changed-code coverage or full repository gate. Full repository coverage/build/output review remains required once on the settled integrated Epic/PR candidate.

**Next:** use a technically distinct receiver workflow whose input/output file selection can be kept under the required named C: directory and whose product-data handling can be evidenced before sharing product fixtures. Do not repeat Open CAD Studio's browser save path trial or CLO profile permutations on the S574 fixture. A general-purpose CAD result alone cannot close the industrial apparel-profile or full V03 acceptance criteria.

S623 ran from 2026-10-09 14:26:19 UTC to 14:35:48 UTC (9m29s): receiver research and UI inspection about 4m; focused validation and durable closeout about 5m29s; external-agent waits 0; maintainer-decision time 0. No coding agent was delegated because the bounded browser/file workflow was a single-owner investigation.
