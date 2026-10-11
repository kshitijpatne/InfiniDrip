# EPIC-17 / G04 V03 — S713 exit packet

## Result

The S711 return provides direct evidence that CLO retained each piece's original role/revision identity and appended the selected grade label `_M` to the block and INSERT names. The returned-file auditor now resolves a name only if it is either the exact source name or that exact source name plus the manifest-selected grade suffix. It normalizes block and INSERT references together and rejects wrong-grade suffixes, duplicates/collisions, and empty suffixes. The hashed source revision remains part of every accepted name.

The strict mapping is covered by a synthetic returned-DXF fixture with the same `_M` behavior and by wrong-suffix, collision, and empty-grade cases. This does not turn the S711 file into a passing round trip: it still lacks the centimeter declaration and has separately reported mark/layer issues; geometry in that actual return was not remeasured in S713. No acceptance gate, threshold, output bytes, or garment pattern changed. No CAD application was rerun and no standards claim is made.

## Verification

- Focused verifier coverage: **100% statements, branches, functions, and lines** for `src/export/dxf-interchange-roundtrip.ts` using `npx vitest run src/export/dxf-interchange-roundtrip.test.ts --coverage --coverage.include=src/export/dxf-interchange-roundtrip.ts --coverage.reporter=text`.
- Focused round-trip, package, and protected byte-identity regressions: **27 passed**.
- `npx tsc --noEmit`: passed. An initial check caught use of `String.replaceAll`, unsupported by this repo's TypeScript target; the test helper was changed to `split/join` and then passed.
- The first coverage pass was 99.56% branch coverage due to the empty-grade guard; an empty-grade signed-manifest fixture was added and the final run reached 100% across all four measures.
- `npm run control-center:test`: **42/42 passed** after board start and exit replay.
- `git diff --check`: passed. No full repository gate was run; it remains reserved for the settled integrated candidate.
- No rendered CAD result was generated. The existing S711 rendered/return limitations are unchanged.

## Timing and repository state

- Start: 2026-10-11 02:55 UTC at S712 `30dea626aa7d363227596f789cade012796bc1bc`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Close: 2026-10-11 03:02:32 UTC; elapsed 7m32s: implementation 2m, focused verification 3m30s, durable state/board closeout 2m, external-agent waits 0m, maintainer-decision time 0m.
- Board start replay advanced 4179→4181; exit evidence/comment are recorded through the validated command layer.
- The two pre-existing untracked S700 diagnostic files remain untouched and must be reviewed in the final cleanup inventory. No local CAD files or machine-specific paths were committed.

## Next action

Use the saved S711 receiver file and its exact source package to isolate the remaining measurable unit, outline, and mark/layer differences with one source-side comparison. Do not rerun the receiver or weaken gates. A passing suffix identity check clears only the identity-name mapping, not receiver eligibility, geometry, units, semantic marks/layers, repeatability, seven-recipe/options/grades coverage, malformed-input UI, or readable-output requirements. Preserve the final global coverage/build/browser/Electron/output-review, necessary-file cleanup, PR, merge, ancestry, deployment, and production E2E gates. No physical-fit or factory-acceptance claim.
