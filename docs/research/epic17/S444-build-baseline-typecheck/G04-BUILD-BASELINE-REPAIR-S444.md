# G04 integrated build baseline repair — Slice 444

## Start boundary

- Started 2026-10-07 22:34:49 UTC from clean S443 commit `1b49797f93ec09a913c9ff1aac7460e562002580` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 443; S444 is reserved.
- Canonical board revision 2663: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; tally 56 accepted / 90 held across 73 options / 146 faces. S443 goal check is active and still matches the full admitted objective; no manual resume is needed.
- Usage at start: primary 43%, weekly 21%; ordinary work allowed.
- Validated start commands will add S444 evidence/comment only and preserve all statuses, tallies and acceptance criteria.

## Scope and authority

Diagnose and repair the pre-existing `npm run build` TypeScript failure recorded in `docs/research/epic17/S441-woven-hold-boundary/S441-build-baseline-failure.md`. The failure was reproduced on exact S440 production source and blocks the final integrated PR build gate. Current G04 work leaves pattern/view production code at that baseline. Correct only errors that prevent the repository's configured `tsc && vite build` from completing; preserve runtime behavior, all tests and export identities.

The same closeout will correct an outdated final paragraph in S443's packet that says the scheduled Claude attempt had no result. The final authenticated run and `WORK FINISHED` are already recorded earlier in that packet and on the board. Preserve both earlier CLI failure diagnostics; this is a documentation erratum only.

## Acceptance and verification

- Record each exact TypeScript diagnostic and its root cause before editing.
- Fix only the diagnosed union narrowing/test fixture typing defects. Do not change view mappings, generated pattern geometry, stitch/POM semantics, acceptance, face status, protected export identities or V02/V03 gates.
- Run focused tests for `technical-flat-live` and `technical-flat-svg`; achieve 100% statement, branch, function and line coverage for any changed production module. Run `npm run build` because this slice directly addresses that gate. Verify legacy export identities with focused export regression checks if production code changes.
- Preserve actual current renderer behavior; inspect existing rendered/output assertions and confirm no renderer snapshot/output changes are expected or produced. Full repository tests/global coverage remain for the settled integrated Epic/PR candidate, unless this isolated fix becomes independently mergeable.
- Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, this packet and the canonical board through preflighted validated commands. Run `git diff --check` and record all gate results.

## Non-goals and blockers

- No Woven or Polo semantic mapping, cut geometry, source stitch graph, face acceptance or hold change. S443's Woven constraints remain unresolved; all-seven V02 and V02-before-V03 remain.
- No V03 receiver/profile selection or import/round-trip work, no scope/gate relaxation, no broad UI, G05, G09/D04, physical fit/sampling, supplier contact, launch spending, hosted service, or factory/production-readiness claim.
- No delegation is safe: this type repair touches shared renderer discriminants and associated integration tests. Codex owns the change and review.
- No product decision blocks this independent build repair. Main risk is accidentally changing behavior while making the union handling exhaustive; focused branch coverage and existing output assertions are required.

## Exit boundary

Exit with one uniquely numbered commit `Slice 444: ...`. Record exact diagnostics, root cause, changed files, focused test and changed-code coverage, build result, export identity result (if applicable), board revision/status/tally, S443 packet erratum, elapsed implementation/verification/wait/decision time and the single next action. Do not run the global Epic gate until the all-seven candidate is settled.

## Diagnosis and implementation

The saved S441 diagnostics reproduced from current source after S443. They came from TypeScript failing to retain the discriminated union after compound `.filter()` predicates and from tests spreading an optional callout presentation without restoring its required discriminator. These were static typing errors; the runtime predicates and output conditions were already correct.

- `src/render/technical-flat-svg.ts`: explicitly narrow source-matched circles and marks to `FlatCirclePrimitive` and `FlatPointMarkPrimitive`. The filter predicates keep the exact existing `kind`, revision and source-id checks; their emitted JavaScript behavior is unchanged.
- `src/render/technical-flat-live.test.ts`: keep the test helper's narrow inferred array type for closure assertions; create a separately widened `TechnicalFlatPrimitive[]` view for the `FlatPathPrimitive` predicate. Add an explicit non-undefined check before reading keyed `presentation` fields.
- `src/render/technical-flat-svg.test.ts`: set the required `keyed-marker-schedule` discriminator when building the unreadable-marker test fixture from the optional presentation.
- Corrected the obsolete final paragraph in the S443 packet: it now records the successful authenticated research run and links the output/status files.

During diagnosis, the first repair attempt produced additional type errors: a path predicate was too broad for a helper-inferred subtype; widening the entire test fixture then correctly exposed unguarded access in another filter; the mark/circle filtering also needed explicit type predicates. These failures were retained in the slice reasoning and corrected without changing assertions or runtime behavior.

## Verification and exit evidence

- `npx vitest run src/render/technical-flat-live.test.ts src/render/technical-flat-svg.test.ts`: **87/87 passed** after the final changes.
- `npm run coverage -- src/render/technical-flat-live.test.ts src/render/technical-flat-svg.test.ts --coverage.include=src/render/technical-flat-svg.ts`: **100% statements, branches, functions and lines** for `technical-flat-svg.ts` after its final production-code change.
- `npm run build`: **passed** (`tsc` and Vite); only the existing advisory for chunks over 500 kB remains.
- `npx vitest run src/quality/export-identity.test.ts src/export/regression.test.ts`: **17/17 passed**, including protected legacy identities and DXF regressions.
- The runtime filter conditions are unchanged; TypeScript predicates erase from output. The focused renderer suites pass and no rendered SVG/PNG or pattern output changed. No geometry, mapping, accepted/held face, or view source was touched.
- The corrected S443 status paragraph matches its attempt status and exact-model output. The obsolete “no result available before reset” text is removed.
- No full repository tests/global coverage or browser/Electron gate was run: this slice is an isolated type-only renderer repair, and the full integrated gate remains reserved for the settled Epic/PR candidate.

All G04 statuses and acceptance counts remain unchanged: validated start/exit board replays 2663→2665→2667; V02 remains In Progress, V03 Backlog; 56 accepted / 90 held. The build blocker is cleared for the eventual final PR gate. The Woven mapping constraints reported in S443 still prevent all-seven V02 exit; this slice does not authorize a semantic or acceptance change.

Elapsed 2026-10-07 22:34:49–22:39:33 UTC (4m44s): diagnosis/source and test edits about 1m20s; focused tests, changed-module coverage, build and export checks about 2m20s; packet/state/board closeout about 1m; agent wait 0m; maintainer-decision time 0m. Times are approximate because commands were run sequentially and rounded.
