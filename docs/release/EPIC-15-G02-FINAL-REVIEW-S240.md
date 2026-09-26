# EPIC-15 / G02 — Slice 240 final review

- **Review date:** 2026-09-26 UTC
- **Review candidate:** `codex/epic15-g02`
- **State:** All digital exit checks passed. The Epic remains open until this reviewed branch is merged and its ancestry is verified on `origin/main`.

## Review decision

The F01 → F02 → F03 sequence meets the admitted local-first digital scope. The final review found and corrected two verification defects and one rendered-control defect, then reran the complete coverage gate, strict build, package/restart proof, revision/output replay, responsive/accessibility review, and protected export checks. The candidate is ready for merge review. This report does not mark EPIC-15 closed before the merge gate.

No new garment recipe, user-facing AI designer, supplier contact, paid or hosted service, physical sample, fit claim, or production-readiness claim was introduced.

## Acceptance-criteria reconciliation

| Area | Disposition | Evidence and limits |
| --- | --- | --- |
| F01 — local projects and styles | Pass | S230–S234 define and implement the versioned local record contract, non-destructive SaveFile v1–v5 migration, transactional IndexedDB repository, per-style recovery, and portable project package. The fresh S240 browser/Electron package replay imported three styles, one recovery, and a 114-byte SVG with matching artwork SHA-256; both runtimes survived a normal close/restart. See [package verification](../research/epic15/evidence/S240-project-package-verification.json). |
| F02 — provenance and dependency invalidation | Pass | S235–S236 record C03-aligned field kinds, provenance and value history plus the complete 85-input dependency matrix for seven supported recipes. Changed and unaffected outputs were checked in the recipe matrix and rendered save/reload evidence. See [S235](../research/epic15/F02-FIELD-PROVENANCE-S235.md) and [S236](../research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md). |
| F03 — constrained edits and immutable revisions | Pass | S237–S239 record recipe-owned semantic anchors and constraints, durable edit propagation, undo/redo and rebase behavior, immutable parent-linked revisions, frozen manifests and replayed dependent outputs. The S240 fresh Chromium/Electron replay covered a Tee and Woven shirt, seven outputs each, successor revisions, unchanged historical hashes and exact historical SVG retrieval after relaunch. See [S237](../research/epic15/F03-CONSTRAINED-EDIT-S237.md), [S238](../research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md), and [S239 rendered evidence](../research/epic15/evidence/S239-rendered-verification.json). |
| Whole-repository coverage | Pass | Full Vitest coverage command exited 0. The generated report records 20,287/20,287 statements, 8,679/8,679 branches, 1,283/1,283 functions, and 20,287/20,287 lines across 110 instrumented source files. See [coverage evidence](../research/epic15/evidence/S240-coverage-verification.json). |
| Production and Electron builds | Pass | `npm run build` and the package verifier's `npm run electron:build-main` precheck passed. Vite retains its existing advisory that the main JavaScript chunk is 545.65 kB (over its 500 kB warning threshold); it is not a build failure. |
| Protected legacy exports | Pass | `src/export/regression.test.ts` passed all 8 protected legacy identity tests; `src/quality/export-identity.test.ts` passed all 9 additional identity tests. No baseline or expected hash file changed. |
| Control Center integrity | Pass | `npm run control-center:test` passed 33/33. A stale assertion was corrected to expect F03 Done and the active S240 final review. The validated command layer retains evidence-gated completion and Epic closure. |
| Browser/Electron package, backup and restart | Pass | Chromium 151 and Electron 44.1.0 / Chromium 152 both restored the exported package in isolated profiles, preserved three styles, a recovery, and the artwork bytes, and passed normal restart. Browser package: 27,666 bytes, SHA-256 `c4a6b53f70d7cdf93dc3777713fdb7e7b061b77dc0042aaa98bb67887048ef76`. Electron package: 27,666 bytes, SHA-256 `988aa3cbee9559c220fbef91dce9d700c93820b8d4887b5d9d3c63252682b8d7`. Independent packages have different archive hashes because their records use independent IDs; the image bytes match at 114 bytes, SHA-256 `d5f71bac55b2f07fb249542aabff0c77cef853dda86523fe18996440484621c9`. |
| Revision and frozen-output replay | Pass | Production-built Chromium and Electron replayed Tee and Woven-shirt histories, captured seven current outputs per style, saved a successor, checked immutable prior revision/manifests/artifact hashes, relaunched profiles, and downloaded the exact historical SVG bytes. Tee SVG: 5,997 bytes, SHA-256 `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d`. Woven-shirt SVG: 23,930 bytes, SHA-256 `03a41cee01fcb57934cc2f4342a89dc62bda827a69fb275dc569f37b561ae2de`. The machine-readable evidence contains every frozen-output digest. |
| Responsive and automated accessibility checks | Pass | Production browser at 320×800, 390×844 and 1440×900 had no horizontal overflow, zero Axe WCAG 2.1 A/AA violations, and zero console warnings/errors, page errors or failed requests. See [responsive evidence](../research/epic15/evidence/S240-responsive-verification.json) and captured [320 px](../research/epic15/evidence/S240-responsive-320.png) / [1440 px](../research/epic15/evidence/S240-responsive-1440.png) views. |

## Findings corrected during final review

1. The original package verifier inserted an artwork placement by editing IndexedDB directly, bypassing the immutable revision append contract. Startup correctly rejected the inconsistent fixture. The verifier now creates and saves that placement through the same user-facing controls as a user, then asserts that the current style equals its latest immutable revision. The package replay passes in both runtimes, and its exact result is saved as machine-readable evidence.
2. A blank optional numeric control could render a non-finite source value as `value="NaN"`, which the browser rejected and logged. The UI now renders non-finite values as an empty input and keeps the explicit `empty` range state. A regression assertion verifies the blank value, and the production responsive run logged no browser messages.
3. The Control Center test had stale expectations for F03 and final-review status. Its assertions now match the canonical G02 sequence.

## Residual limits and truthful claims

- The restart traces cover normal profile close/relaunch, not sudden power loss, operating-system crash, storage quota exhaustion, or browser-profile eviction. Browser persistence remains origin/profile scoped; portable backups remain the recovery mechanism.
- Chromium verification used HeadlessChrome 151.0.7922.34; the packaged desktop verification used Electron 44.1.0 / Chromium 152.0.7977.65. This is not a cross-platform browser or installer matrix.
- Axe covers automated WCAG 2.1 A/AA rules. The responsive run does not claim complete usability, manual color review, or every keyboard/screen-reader journey.
- Frozen digests prove local digital byte identity for the captured revision. They are not signatures, approvals, independent factory acceptance, physical fit/drape evidence, or a claim that an external CAD receiver accepts every export.
- No garment was physically sewn or validated. Sampling, supplier work, paid sources, hosted features, and production-readiness claims remain held.

## Board and merge boundary

F01, F02 and F03 are already Done with their linked evidence. The final-review item is moved to Review with this report and machine evidence linked. EPIC-15 remains In Progress, and G03–G17 remain Backlog. After merge, verify that the reviewed commit is an ancestor of `origin/main`; only then mark the final-review item Done and close EPIC-15 through the validated Control Center command layer. Reforecast downstream dates without treating them as admission or permission.
