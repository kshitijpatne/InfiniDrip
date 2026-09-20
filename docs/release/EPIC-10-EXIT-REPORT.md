# EPIC 10 — Quality and Adversarial Hardening Exit Report

Date: 2026-09-20
Owner: Codex
Contributor: Claude Code CLI, headless `sonnet` model (`claude-sonnet-5`)
Contributor branch: `claude/epic-10-adversarial-hardening`
Integrated baseline: Slice 130 `241732e`; EPIC 9 integration `516fd5a`

Status: integrated and locally verified; Codex remains the sole actor allowed
to push the final result to `origin/main`.

## Scope and review

The contribution stayed within the durable packet in
`docs/planning/EPIC-10-EXECUTION.md`. Claude added five test-only quality
files and the two approved dev-only dependencies:

- `fast-check` `4.10.2` for bounded, replayable property generation;
- `@flatten-js/core` `1.6.14` for an independent test-only oracle over
  already-flattened loops.

Codex inspected the actual isolated diff and rejected no required coverage.
Neither dependency is imported by production code. Claude did not edit
Electron/release behavior, production geometry, export baselines, or `main`.

The fixed property seeds and run bounds are recorded in the source tests:

| Area | Seeds and run bounds |
|---|---|
| Geometry finiteness / determinism / stitch references | `1401420/30`, `1401421/20`, `1401422/20` |
| Persistence / hostile state | `1411410/40`, `1411411/60`, `1411412/80` |
| Invalid guidance | `1411510/60`, `1411511/60`, `1411512/30`, `1411513/40`, `1411514/15`, `1411515/40` |
| Surface invariants | `1431610/40`, `1431611/40`, `1431612/50`, `1431613/30`, `1431614/30`, `1431615/30`, `1431616/20` |
| Flattened-loop oracle | `1431620/15` per registered recipe |
| Empty-placement export identity | `1441710/15` |

The seven exercised recipe identifiers are `tee`, `fitted`, `tank`, `polo`,
`woven-shirt`, `skirt`, and `trouser`. Permanent save fixtures cover v1–v4
compatibility and truthful rejection of a truncated current v5 payload.
Permanent geometry fixtures cover concave, collinear, tiny-edge, self-crossing,
touching, and tolerance-boundary oracle cases.

## Codex repair from an independent finding

The oracle found that the existing line-offset construction could create a
self-intersecting CUT loop at the default trouser back crotch and for one
extreme-but-declared woven-shirt input. Codex reproduced the finding and added
a local proper-segment-crossing trim in `src/render/allowance.ts`, plus a
focused regression test in `src/render/allowance.test.ts`. The trim removes
only the inward loop produced by that concave offset; it does not replace the
drafting engine, alter the geometry source of truth, change tolerances, or
weaken the oracle. The two discovered cases are ordinary permanent assertions
in `src/quality/surface-invariants.test.ts`.

Focused proof passed:

```text
npx vitest run src/render/allowance.test.ts src/export/regression.test.ts --maxWorkers=1 --minWorkers=1
2 files / 21 tests passed; all 8 legacy hashes passed

npx vitest run src/quality --maxWorkers=1 --minWorkers=1
5 files / 74 tests passed
```

## Final verification evidence

The integrated checkout passed the complete serial repository gate:

```text
npm test -- --maxWorkers=1 --minWorkers=1
99 files / 1,330 tests passed

npm run coverage -- --maxWorkers=1 --minWorkers=1
100% statements / branches / functions / lines

npx tsc --noEmit
npm run build
npm run electron:build-main
npm run electron:verify
npm run electron:verify-packaged
npm run electron:verify-menu
npm run electron:verify-menu-packaged
npm run electron:verify-release
git diff --check
```

The Electron commands are the EPIC 9 developer harness and current-host
packaged gate. They cover offline launch, fresh and malformed local state,
native-save cancel/success/write failures, close/relaunch/window recovery,
menu-versus-button export parity for all six paths, parsed output structure,
and packaged output integrity. Rendered evidence remains at
`tmp/epic9-release/outputs/packaged-fresh-profile.png` and
`tmp/epic9-release/outputs/packaged-output-stage.png`; the machine-readable
record is `tmp/epic9-release/verification.json`.

Two consecutive `npm run electron:pack` runs produced the same current-host
artifact evidence: 72 inventory files, inventory/app.asar SHA-256
`274b1803a6b6d764c548ad4b351fd12cfc29aa24b3d995b6d21fb256f70e37cf`, and a
245,289,984-byte executable. `Get-AuthenticodeSignature` reports
`NotSigned`; the repeatability result does not imply signing or release
readiness beyond this Windows x64 unpacked developer package.

## Legacy identity and boundaries

The eight protected legacy hashes remain byte-identical:

| Output | SHA-256 |
|---|---|
| `tee.svg` | `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d` |
| `tee.dxf` | `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9` |
| `tee.pdf` | `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523` |
| `tee.techpack` | `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1` |
| `fitted.svg` | `cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c` |
| `fitted.dxf` | `e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6` |
| `fitted.pdf` | `184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff` |
| `fitted.techpack` | `8e89320bfa235c44ebb481b01012a43c7c1614ce27608ccbb49df31369bca8d2` |

This is digital evidence only. It does not establish physical fit, drape,
sewability, manufacturing readiness, or production readiness. The package is
unsigned; signing procurement, an updater feed, installer claims, and
unsupported cross-OS guarantees remain separate maintainer decisions.
