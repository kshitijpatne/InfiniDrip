# EPIC-17 / G04 — S728 integrated-gate corrections

## Start and verified state

- Started: 2026-10-11 08:05:03 UTC.
- Branch: `codex/epic-17-g04`; starting commit: `5450972a3b0710b421a85d5fabfb4ddb1b1e5f54` (S727 exit).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it remains an ancestor.
- Highest assigned slice: S727; reserve S728. Canonical board revision: 4257.
- Goal and Epic remain In Progress. V03 technical acceptance remains complete under S726; this slice repairs the failed integrated repository gate only.
- Existing S700 untracked diagnostics and the test-generated S349 crosswalk are preserved and excluded pending final review.
- Usage preflight: ordinary usage allowed; primary 56% used, weekly 9% used.

## Scope

1. Separate six Node-native historical research tests from Vitest discovery and run them through Node's test runner without dropping assertions.
2. Make the Woven vent projection fail closed when an authored open-vent edge no longer meets its source neighbors; correct closed-vent tests to match the actual recipe, which removes the vent edge at depth zero.
3. Add the Trouser fly-underlap to the pattern measurement inventory as option-only, because closure options control it.
4. Replace pre-S459 UI test expectations that require holds on now-accepted Woven/Polo faces with checks for the current approved rendering and source identity.
5. Reconcile the S348 band test with S370/S459: source stitch identity stays exact, while back-view bands are labeled detached details and are not represented as joined at their display location. Update downstream S349 evidence assertions to use this accepted view contract.
6. Give the unchanged S425 17-option rendered replay a 30-second test timeout; preserve its assertions and browser checks.

## Acceptance and non-goals

No change to V01/V02/V03 technical acceptance, seven recipes, 73 options, five sizes, 365 source packages, 0.001 cm selected-return limit, exact-11 empirical receiver claim, source identity/units/marks, repeat/malformed-input gates, legacy DXF behavior, protected byte identities, or release gates. No CAD software, format, purchase, install, or trial; no garment geometry/stitch change, new recipe, physical fit, factory, standards, or production-readiness claim.

## Verification gates

- Focused changed-area tests for projection, geometry, measurement inventory, technical-flat panel, S348/S349 crosswalk, and S425 browser replay.
- Changed production code: 100% statement, branch, function and line coverage; add precise negative fixtures for vent discontinuities as needed.
- Explicit Node-runner execution of all six historical `.test.mjs` files.
- Once focused repairs are complete, one integrated full repository gate with 100% global coverage; then build, Control Center, browser/Electron and final rendered/output review.
- Preserve every failure log and inspect generated-file diffs. No full-gate repetition after a small fix; rerun affected checks first, then the settled full gate once.

## Independent ownership and risk

No disjoint, low-risk contribution is appropriate: these test contracts touch shared renderer behavior and the exact S459 accepted output. Codex owns implementation, review and integration. The main risk is confusing source seam identity with view placement; tests will assert those as separate facts.

## Exit condition and next action

Close S728 with a durable packet that records each corrected failure and focused evidence. If changed checks and the full coverage gate pass, complete the remaining release gates from the same settled candidate. If the full gate exposes another concrete failure, classify it from its stack and current acceptance evidence, assign one next unique repair slice, and continue with the goal active.
