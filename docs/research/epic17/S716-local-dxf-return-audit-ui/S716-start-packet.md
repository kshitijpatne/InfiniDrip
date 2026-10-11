# EPIC-17 / G04 V03 — S716 local DXF exchange and return audit

## Verified start

- Start: 2026-10-11 03:17 UTC from S715 commit fcad996e66aae07339d5b11a481a6d0881a1f073 on codex/epic-17-g04.
- Refreshed origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0 remains an ancestor. S715 is the highest assigned slice; S716 is reserved once.
- Canonical board revision 4191; EPIC-17 and G04-V03 remain In Progress. Only pre-existing untracked S700 diagnostic files remain outside the staged source.
- Usage checked: ordinary usage allowed; primary 7%, weekly 42% informational.
- S712 proves API fail-closed results but explicitly records that no product-visible DXF-return import screen exists. C04 requires visible error or blocked status for missing units/unsupported content; the API already returns reasons and zero partial counts.

## Objective

Expose the existing source-bound DXF package and return auditor through a small local-only product panel. Let the user save a selected-size source DXF and its integrity-bound source-package JSON (which contains that exact DXF), then select the JSON and returned DXF for a local audit. Reuse createDxfInterchangePackage, verifyDxfInterchangePackage and auditDxfInterchangeRoundTrip; do not alter their acceptance logic or thresholds. Display a clear accessible pass/fail state with no partial counts on failure.

## Acceptance and boundaries

- Local file reads only; do not upload, sync or persist CAD files. Fail closed on missing/malformed manifest, missing/corrupt source DXF, empty/malformed return or every negative case in the existing auditor fixtures.
- A passing example reports the auditor's exact piece/outline/mark counts and maximum delta; a failing result displays its specific reason and zero partial summary. Include browser rendered review of the panel plus one valid synthetic and one invalid file flow.
- Keep the legacy DXF button/output byte-identical and separately labeled; the new package output must use the opt-in G04 schema-v5 writer. Do not label the package an industrial profile or standards-compliant. The panel cannot mark a receiver route qualified or clear S711's unit/geometry/mark/layer failures.
- Preserve all-seven recipes and supported options/grades, fixed 0.001 cm, protected export identities, every V03 gate and remaining hold. No broad UI redesign, receiver test, format/setting/encoding variation, pattern change or standards claim.
- Focused UI/export/audit tests; 100% statement/branch/function/line coverage for changed production code; protected legacy-export regressions; TypeScript/build as relevant; Control Center tests and git diff --check. Full repository coverage/build/browser/Electron/output gate remains the settled Epic/PR boundary.
- Final necessary-file cleanup, PR, safe merge, refreshed origin/main ancestry, required deployment and production E2E remain explicit gates. No physical-fit/factory claim.

## Ownership

The audited API contract and app wiring are coupled through one small panel; no safe independent ownership exists. Codex owns implementation and reviews actual browser rendering and all report/status behavior. The existing application file save and local file chooser are the only I/O mechanisms.
