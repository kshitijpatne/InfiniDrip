# S679 exit — explicit units in candidate package

## Result

Added a typed `units` record to each versioned candidate manifest: `length: "cm"` and `dxfInsunits: 5`. The package verifier now requires both declarations and confirms that the paired DXF contains the corresponding `$INSUNITS=5` header. Missing or conflicting unit declarations fail verification. This makes the source package self-describing under the accepted C04 contract.

This does not make LibreCAD's R12 output retain the unit declaration. S674 already proved that the receiver removes it from its saved output while retaining measured coordinates and construction marks. S679 does not rewrite that output, infer units from coordinates, or claim a round-trip pass.

## Verification

- Focused exporter/package/protected suite: **42/42 passed** across seven files.
- Changed production module coverage: **100% statements, branches, functions, and lines**.
- `npm run build` passed; Vite emitted its existing large-chunk advisory. An initial build caught a literal type widening for the new `units` field; the field was made an immutable literal and the final build passed.
- `npm run control-center:test` passed **42/42**.
- `git diff --check` passed.
- Package generation produced seven manifests. Every manifest declares `cm` / DXF code `5`; each of the seven DXF hashes matches S678 exactly. Evidence is under `C:\G04-CAD-Interchange\S679-unit-contract\`; `S679-unit-evidence.json` SHA-256 is `08ed984e2b2e24e6fe284b51a073d9acde5cfaaa4bff197929d1e4269d5cb7b9`, and the generator evidence SHA-256 is `e04c98aa44796837a80086CDD12CA4F67A5AF957143636B2EEF5A53A6E5FC0A2`.
- `tee-M.manifest.json` was inspected and pairs the explicit unit declaration with the same S678 drawing hash. Since all seven drawing bytes are unchanged, the already reviewed S677 diagnostic renders remain representative; no new receiver rendering is claimed.

## Gate disposition and next action

S679 closes the source-side explicit-unit record and consistency check. It clears no external round-trip gate. V03 remains In Progress: LibreCAD R12's saved output lacks the unit note, and receiver-side proof for all seven recipes, supported options, grades, malformed input, repeatability, readable output and industrial profile remains incomplete. Keep all acceptance criteria and thresholds unchanged.

Next use the existing receiver and output evidence only to determine whether an already-supported product-side packaging/normalization step can preserve the admitted unit contract without changing geometry or pretending the receiver kept it. No additional CAD application or general settings sweep is authorized by this slice. If no source-backed normalization is allowed by the exact profile, retain the measured receiver failure and select no replacement by assumption.

## Slice ledger

Started 2026-10-10 17:59:26 UTC from clean S678 commit `30a640c2` on `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Board revision 4029; S678 was highest and S679 unique. Validated start replay advanced board 4029→4031.

Closed 2026-10-10 18:01:18 UTC. Elapsed about 1m52s: implementation/source review ~35s; focused checks, changed-code coverage, build and Control Center ~20s measured process time; seven-package generation and output inspection ~25s; docs/board closeout ~32s; external-agent waits 0; maintainer-decision time 0. Full repository gate remains for the settled Epic candidate. No physical fit, factory, standards-conformance or production-readiness claim.
