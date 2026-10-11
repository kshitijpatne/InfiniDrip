# EPIC-17 / G04 V03 — S705 candidate-only buttonhole cross encoding exit

## Result

S705 adds a candidate-only buttonhole point display encoding to the versioned G04 DXF package. Each source buttonhole remains one logical point at its unchanged source anchor. The candidate writes two perpendicular `LINE` entities on `MARK_BUTTONHOLE`, centered at that anchor with a 0.25 cm half-span, matching the existing point-cross display convention. Schema v5 binds the two emitted entity ordinals, count, display rule, source anchor, piece/revision identity, and exact source-to-drawing translation. The verifier checks both lines' type, layer, order, geometry, and anchor relation. Its limitation text explicitly says the glyph is not a cut or stitch path.

Only the versioned candidate package opts in. The existing `exportDxf`, `exportDxfCentimeters`, and lower-level mark writer defaults still emit their prior `POINT` representation. The byte-identity regression suite passed. Verifier compatibility for package schema v4 and legacy schemas v3/v2 is exercised; schema v5 rejects shifted/missing/wrong-layer cross entities, invalid encoding/kind/geometry, transform mismatch, and entity-count mismatch.

## Verification and output review

- Final focused normal tests: `src/export/pattern-mark.test.ts`, `src/export/dxf-interchange-package.test.ts`, `src/export/dxf-centimeters.test.ts`, `src/export/export.test.ts`, and `src/export/regression.test.ts`; 43/43 passed.
- Changed-code coverage: `pattern-mark.ts`, `dxf.ts`, and `dxf-centimeters.ts` each report 100% statements, branches, functions, and lines in the combined focused coverage run. The package module subsequently passed a focused coverage run at 100% for all four metrics after its final code and verifier tests.
- `npx tsc --noEmit`, `npm run control-center:test` (42/42), and `git diff --check` passed at closeout.
- Candidate generated from the actual package code and rendered as a close view of the named `polo:buttonholePlacket` block. The render shows three distinct red crosses, the source piece boundary, seam line and other construction marks; the crosses remain legible and separated in this representative view. It is an output visualization, not receiver evidence.
- C:-only files: `C:\G04-CAD-Interchange\S705-candidate-buttonhole-cross\polo-m-buttonhole-cross.dxf` (SHA-256 `28D28E48BFF0C2B1638684D93C7BA58754AF202EF7494495F3A99C813AE1DD6C`); corresponding manifest (SHA-256 `7A43AE6632EBBC191BC9A4411D7E1D580A7AA20568A3AA470A6E01CD01B7E7D6`); detail PNG (SHA-256 `94BFD6CB4A87170B3652628CAC48EB6295FB9DF1DDE10B25A12355066A509124`). Generator and render helpers also remain in that purpose-named C: folder, not in the repository.
- No receiver import/export was repeated in S705. No V03 gate is promoted by this source-side display change. No ANSI/AAMA/ASTM, physical fit, factory acceptance, or production-readiness claim.

## Acceptance, holds and next action

The candidate package now represents the measured buttonhole anchors in an explicit visible form and preserves the existing logical mark identity. It does not address CLO's measured curve simplification, establish a receiver profile, or clear rights/profile, receiver round-trip, all-option/all-grade return, malformed-input, repeatability, full returned-render, and other admitted V03 gates. G04-V03 remains held, EPIC-17 remains In Progress, and the goal remains active. Preserve every fixed threshold, all-seven/option/grade scope, legacy DXF behavior, and protected byte identity.

Next: S706 performs the one planned current-package import/save/reopen/render in the already installed LibreCAD 2.2.1.5 DXF 2000 route, comparing the exact hash-pinned C: source and return against the unchanged V03 thresholds. Stop that route on its first fixed-gate failure; do not switch apps or formats. Keep the cleanup inventory for the final candidate only.

## Start, board and timing ledger

- Start: 2026-10-11 00:26:51 UTC from S704 `f7e5043aceb13086ca513169c5f0acb7e04c8abb`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. S704 was the highest prior slice; S705 is unique.
- Board start and exit replay: revisions 4148→4151; G04-V03 remains Blocked, EPIC-17 In Progress.
- Closeout: 2026-10-11 00:46 UTC. Implementation/source review: approximately 8 minutes. Focused tests, coverage, render/review and diagnosis: approximately 11 minutes. Durable packet/state/board checks: approximately 2 minutes. External-agent waits: 0 minutes. Maintainer decisions: 0 minutes.
- Known untracked S700 diagnostics remain untouched and inventoried for final cleanup only.
