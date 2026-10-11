# EPIC-17 / G04 V03 — Independent local AAMA receiver screen — Slice 524 exit

## Decision

S524 closes Pixie Space as an **import-only observation**, not as a V03
receiver. Its no-sign-in browser accepted and rendered all seven pinned,
base-M InfiniDrip DXF fixtures from the named C: directory without a format
error. No fixture was exported, so no Pixie round trip, geometry pass, or
profile qualification is claimed.

The specific stop is the output path. The visible File menu offers
`DXF — AAMA (ASTM D-6959)` as an export action but shows no destination picker
or C:-path confirmation. The available browser control exposes no way to set
the download destination before that action. Clicking it would risk saving a
pattern outside the user's required folder
`C:\G04-CLO-DXF-Exchange\S524-independent-local-aama-receiver\`; therefore
the export was not clicked. This is an observed tooling/path-control limit,
not an export error from Pixie and not evidence that the Pixie writer fails.

## Exact test and observations

The test was limited to one current-source default-M fixture per supported
recipe. Fixtures were generated from commit `c3b3ee43ba7e0db834cee9a4e0ce5f51414f58a4`
by `generate-fixtures.mjs`, with inputs and manifest confined to
`C:\G04-CLO-DXF-Exchange\S524-independent-local-aama-receiver\`.
Pixie Space 0.2.0 preview was unsigned. Each file was opened through its local
File → Open flow. The application displayed an import receipt and rendered
the drawing:

| Recipe | Pixie receipt | Observed layers |
|---|---|---|
| Tee | 6 entities; 0 blocks; 0 inserts flattened | CUT, SEW |
| Fitted | 6 entities; 0 blocks; 0 inserts flattened | CUT, SEW |
| Polo | 56 entities; 0 blocks; 0 inserts flattened | CUT, SEW, MARK_BUTTON, MARK_BUTTONHOLE, MARK_CUTLINE, MARK_FOLDLINE, MARK_PLACEMENTLINE, MARK_PLACEMENTPOINT |
| Woven shirt | 55 entities; 0 blocks; 0 inserts flattened | CUT, SEW, MARK_BUTTON, MARK_BUTTONHOLE, MARK_PLACEMENTLINE, MARK_PLACEMENTPOINT |
| Tank | 4 entities; 0 blocks; 0 inserts flattened | CUT, SEW |
| Trouser | 49 entities; 0 blocks; 0 inserts flattened | CUT, SEW, MARK_BUTTON, MARK_BUTTONHOLE, MARK_CUTLINE, MARK_FOLDLINE, MARK_PLACEMENTLINE, MARK_PLACEMENTPOINT |
| Skirt | 6 entities; 0 blocks; 0 inserts flattened | CUT, SEW |

The app remained unsigned; no upload, sign-in, share, or external account
workflow was used. The import inputs are InfiniDrip's generic legacy R12-style
DXF, not an AAMA-profile fixture. Pixie's receipts report zero blocks and
inserts, so this screen also does not establish distinct, selectable piece
identity. The app rendered the imported drawings; no independent source to
output geometry analysis was possible without output files.

Pixie's public [product page](https://pixiespace.app/) describes local-first
DXF/AAMA read/write, and its [privacy page](https://pixiespace.app/privacy/)
states drawings remain local. These are vendor claims, not independent
telemetry or a conformance certificate. The site also identifies the product
as a preview/under construction. Its menu's `ASTM D-6959` label alone does not
establish an industrial apparel exchange profile.

## Acceptance and limits

- **Observed:** seven of seven generic current-source base-M DXF inputs opened
  and rendered in Pixie Space 0.2.0 without a displayed format error.
- **Not tested:** any Pixie export, re-import generation, geometry delta,
  negative-input response, AAMA-profile structure, marks/units/grade semantics,
  or independently controlled piece identity. The malformed Tee control was
  generated but not imported.
- **Not cleared:** V03's rights/profile, local-handling, clean-import warning,
  geometry, semantic, native grade, negative-control, and independent receiver
  gates. No existing CLO result or V03 criterion is changed by this screen.
- **Unchanged:** all-seven V02 acceptance, `0.001 cm` tolerance, legacy DXF
  behavior, protected export byte identities, and all claim boundaries. No
  physical-fit, factory-acceptance, or production-readiness claim.

No pattern, app, browser preference, account, or receiver data was modified.
No output file was created. All S524 fixture inputs and the manifest remain
under the named C: directory. CLO was not touched and remains open for G04;
the Pixie browser tab was a temporary test tab.

## Verification and closeout

S524 started `2026-10-08 19:34:18 UTC` from clean S523 `c3b3ee4` on
`codex/epic-17-g04`; refreshed `origin/main` at start remained an ancestor.
The validated start board replay advanced revision `3207→3209`. The exit
evidence/comment were applied through the validated command layer at
`3209→3211`. The goal record was checked at this safe boundary: status is
**active**, and its objective still matches the admitted Epic through review,
gates, safe merge, and deployment. Keep it active; no wording/status
reconciliation is needed. There were no production-code changes; changed-code
coverage and the full repository gate do not apply to this evidence-only
screen.

Focused verification: generator and preflight syntax pass; fixture manifest
recipe set, piece/outline counts, and all seven C:-file hashes pass; preflight
replays the start and exit board commands at revision 3211 and confirms the
output directory is empty. Canonical board validation passes at revision 3211;
`npm run control-center:test` passes 42/42; `git diff --check` passes. The
seven actual browser import receipts and rendered drawings were inspected;
the export was not clicked because no C:-only save destination could be
verified before the operation.

Elapsed time: 14m12s (`19:34:18–19:48:30 UTC`): implementation 0m; candidate
source/rights review and fixture preparation ~2m; focused browser import and
render review ~5m; fixture/board/test and durable closeout ~7m12s; external
agent waits 0m; maintainer-decision time 0m.

**Next action:** advance the V03 gate matrix using existing evidence and one
decision-bearing, authorized path. Do not repeat these seven Pixie imports or
the completed CLO base-M trials. A future receiver trial must first provide a
verifiable C:-only export target and must test a distinct, sourced profile or
mechanism; otherwise keep the receiver gate held. EPIC-17/G04-V03 remains In
Progress.

## Evidence inventory

- Start/scope: `S524-start-packet.md`.
- Reproducible input fixtures and hashes: `generate-fixtures.mjs` and
  `C:\G04-CLO-DXF-Exchange\S524-independent-local-aama-receiver\Evidence\fixture-manifest.json`.
- Source fixture files: `C:\G04-CLO-DXF-Exchange\S524-independent-local-aama-receiver\Input\`.
- No export outputs were produced; the `Output` directory remains empty.
