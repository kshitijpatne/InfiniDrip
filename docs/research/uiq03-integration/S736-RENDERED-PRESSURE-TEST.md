# Slice 736 — rendered integration pressure test

Status: rendered review, settled full-repository coverage, production build and
packaged Electron lifecycle/output gates passed. Final review/PR/merge and
post-merge deployment checks remain pending; the integrated component is not
yet deployed.

## Browser scenarios

The built UI was inspected with Playwright/Chromium against loopback on
2026-10-11. The UIQ-03 candidate remained mounted only inside the existing
Design readiness disclosure; the five-stage journey bar and correction routes
remained available. No request left loopback and no page error occurred.

| Scenario | Result |
| --- | --- |
| Desktop, 1440 CSS px | Panel 309 px wide; internal scroll width 307 px. |
| 200%-equivalent, 720 CSS px | Panel 269 px wide; internal scroll width 267 px. |
| Narrow, 320 CSS px | Panel 263 px wide; internal scroll width 261 px; no document horizontal overflow. |
| Invalid chest input (`0`) | Existing blocker text remains authoritative; `Review correction` returns to Measure, focuses the chest input, and preserves the raw invalid value. Target measured 254×44 px. |
| Local flag-off fallback | UIQ panel absent; the original checklist, wording, progress and stage navigation render. |
| Forced colors + reduced motion | System palette takes over; transitions compute to `0s`. |
| Axe accessibility scan | Zero whole-page violations in the rendered invalid-input scenario. |
| Network/error check | Loopback-only requests; zero page errors. |

The first invalid-input render showed the same warning in the stage banner,
panel blocker and panel note list. Slice 736 now omits only the exact note that
duplicates the active blocker from the panel's ordinary note list. The panel
still marks the blocked stage and exposes its correction action; the stage
banner retains its existing warning and `Review in Measure` route. The
post-correction render showed the blocker only once inside the panel and no
duplicate warning note. A later pressure test found that editor-field keys
such as `chest` differ from guided-capture IDs such as `body.chest-girth`; the
correction route now resolves the active recipe definition before focusing the
capture field. Focused integration tests cover the match and stale-target
no-op. No validation or engine state is changed by these presentation fixes.

## Screenshots

- `evidence/S736-guidance-desktop.png`
- `evidence/S736-guidance-zoom200.png`
- `evidence/S736-guidance-mobile320.png`
- `evidence/S736-guidance-blocked-correction.png`
- `evidence/S736-guidance-legacy-fallback.png`

The production build was rendered and pressure-tested separately through
`vite preview`; the saved screenshot set was captured from the Vite development
server using the same application source. The explicit local-only flag override
for fallback uses the `MountAppOptions` path exercised by tests. No production
flag or saved preference was changed to produce the fallback image.

After the final recipe-field resolver change, a fresh Playwright session against
the production `vite preview` confirmed that the guidance panel is visible in
the expanded readiness disclosure at the Refine stage (309 CSS px panel width),
the legacy checklist is absent while the flag is on, and existing journey Next
navigation remains available. The default unreviewed-fit state reads “No fit
preference supplied”. The session observed zero requests outside loopback and
zero page errors. The mapper is additionally covered by mounted-app tests that
focus the actual `body.chest-girth` capture input while preserving invalid raw
input.

## Identity and baseline boundary

The three protected UIQ-03 source/test/CSS Git blobs match the SHA-256 values
in `docs/research/uiq-clarity/CANDIDATE-EXIT.json`; those accepted candidate
files were not modified. An attempted run of
`ops/ui-candidates/clarity-identities.mjs` failed against its 293-entry October
2 historical whole-repository snapshot. Its expected source hashes are stale
relative to the later commits already present in current `main`; this is not
the app's current export-baseline suite. Do not refresh or move that historical
manifest as part of UIQ-03. The current export byte-identity regression remains
in the required settled repository gate and its results will be recorded in the
Slice 736 exit report.

The first global run passed all 164 files / 2,644 tests and all nine
export-byte-identity cases, but returned 99.98% global statement/branch/line
coverage because the guided-capture and fieldless-blocker actions had not been
exercised. The second run passed 2,646 tests but returned 99.99%, isolating the
unmapped-field fallback branch. Both failed attempts are retained in the active
goal log. After extracting the field resolver and adding direct mapped and
unmapped-key tests, the settled third run passed all 164 files / 2,647 tests
with 100% statements, branches, functions, and lines. Final rerun duration was
1,263.47s on one worker; an earlier settled 100% pass took 1,702.41s. Machine
summary: `evidence/S736-full-coverage.json`. All nine
export-byte-identity tests passed. The packaged Windows x64 Electron release
gate also passed offline reload, first-run welcome, malformed-state handling,
all six button/menu output parity families, write/cancel failure handling and
window lifecycle/recovery; its 72-file inventory contains no absolute
development path. Summary: `evidence/S736-electron-packaged-verification.json`.
No baseline was modified.
