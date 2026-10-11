# EPIC-17 / G04 V03 — S712 exit packet

## Result

The existing source-side returned-DXF audit already rejects malformed and unsupported cases without reporting partial success. S712 makes that behavior a shared test invariant: every failed result in the round-trip audit fixture suite must provide a nonempty reason and zero piece, outline, mark-entity, and geometry-delta counts. No production or export behavior changed.

The existing fixtures cover malformed/empty input, missing units and piece identity, package tampering, translated or duplicate inserts, altered layers and marks, non-finite coordinates, invalid/changed outline closure, extra entities, shortened contours, and shifted notches. Valid unchanged, neutral-Z, equivalent-outline, and in-tolerance return cases remain covered and pass.

This proves only the InfiniDrip audit API's fail-closed result contract. It does not prove that a receiving CAD application visibly rejects malformed input: InfiniDrip has no DXF-return import screen. That receiver-visible gate, profile eligibility/rights, returned geometry/marks/units/identity, breadth across seven recipes/options/grades, repeatability, and rendered-return readability remain open. No receiver or format experiment was repeated, and no V03 criterion or threshold changed.

## Verification

- `npx vitest run src/export/dxf-interchange-roundtrip.test.ts src/export/dxf-interchange-package.test.ts`: **18 passed**.
- `npx vitest run src/export/regression.test.ts src/export/dxf-interchange-roundtrip.test.ts src/export/dxf-interchange-package.test.ts`: **26 passed**, including protected legacy DXF/PDF/SVG/tech-pack byte identities.
- `npx tsc --noEmit`: passed.
- `npm run control-center:test`: **42/42 passed** after the board start update.
- `git diff --check`: passed after removing trailing blank lines newly introduced in the three handoff documents.
- Test-only change; no changed production code requires a coverage delta. Full global coverage remains reserved for the settled integrated Epic candidate.
- No rendered CAD output was produced in this source-contract slice; S711's receiver-return evidence and its failures remain unchanged.

## Timing and repository state

- Start: 2026-10-11 02:49 UTC at S711 `6b3020a56b0ce9e1cfb1b0dd4c17f15b814144c3`; `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- End: 2026-10-11 02:54 UTC. Approximate elapsed 5m: implementation 1m; focused verification and diagnosis 2m; durable packet/state/board closeout 2m; external-agent waits 0m; maintainer-decision time 0m.
- Board start commands advanced revision 4175→4177; exit evidence/comment are recorded in the validated command layer.
- Pre-existing untracked S700 diagnostic files remain untouched and reserved for the final cleanup inventory. No generated CAD files or machine-specific paths were added to the repository.

## Next action

Continue with source-side work tied to measured return failures in S703/S711. Do not install or retry another receiver. Preserve the fixed 0.001 cm geometry/mark limits, profile/rights review, all-seven/options/grades scope, protected export identities, V01/V02 acceptance, and all V03 gates. Final work still requires an eligible evidence-backed profile, settled full repository coverage/build/browser/Electron/output review, final necessary-file cleanup, PR, safe merge, refreshed `origin/main` ancestry, required deployment, and production end-to-end verification. No physical-fit or factory-acceptance claim.
