# EPIC-17 / G04 V03 — Source-to-return unit mismatch diagnosis — S685 start

## Verified start

- Started 2026-10-10 18:49:15 UTC from clean S684 commit `6f238139fcc976692c30e11717f10001134162c9` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S684 is the highest closed slice; S685 is the next unique number. Control Center board revision 4053 keeps EPIC-17/G04-V03 In Progress and V01/V02 Done.
- S684's hash-pinned input has `$INSUNITS=5` (cm); the single CLO Standard DXF output has `$INSUNITS=4` (mm) and front-cut bounds matching the input numerically. CLO remains open. No user decision is pending.
- Relevant records: S684 exit packet; S682 current V03 matrix and its stop-on-first-failure rule; S676 source-unit change; S679 manifest/unit verifier; S681 source-bound mark identity; accepted C04 contract and maintainer CLO local-trial permission.

## Slice objective

Trace the exact centimeter source writer, package verifier and the S684 returned drawing. Determine whether this is a repository-owned source defect or a receiver-output unit-label mismatch, and whether a deterministic, fail-closed product-boundary correction can repair only the label without hiding any geometry, mark, identity or scale change.

Inspect all source and returned entities in the hash-pinned Polo M fixture. Account for units, full CUT/SEW contours, all marks, block/piece correspondence, layers and identities. Quantify source-to-returned geometry with the existing `0.001 cm` limit. Do not infer full geometry preservation from matching extents. Preserve the original CLO output unchanged.

If every represented geometry/mark check proves that only the header differs, implement a narrowly scoped return-file normalizer that changes `$INSUNITS` from 4 to 5 only for an exact digest-bound centimeter package and only after the full comparison passes; update its input/output evidence and test it against malformed, incomplete, wrong-scale, wrong-piece and changed-mark cases. Otherwise make no production behavior change and record the exact reason. Do not silently modify numeric coordinates or claim that numeric layer names preserve semantic identity.

## Acceptance and boundaries

- The original source bytes, legacy DXF path and protected export identities stay unchanged.
- No user-facing UI changes, additional CAD application, receiver/profile/format/mode/option variation, trial re-import, CAD output rewrite in place, threshold adjustment, or acceptance change.
- Any new adapter is opt-in, content-addressed to the source package, deterministic, rejects unrecognized or changed returned drawings, and never converts a failed geometry/mark comparison into a pass.
- This slice may clear only the unit-label mismatch for this fixture if evidence supports the exact correction. It cannot qualify CLO or V03, pass the seven-recipe/options/grade matrix, grade exchange, malformed-input/repeatability, full readability, rights/profile, or standards-conformance gates.
- Focused behavior tests and 100% statement/branch/function/line coverage for changed production code, build if production code changes, protected export identity check, rendered/output review, Control Center command-layer evidence, and `git diff --check` are required. No full repository gate at this slice unless it becomes independently mergeable.

## Stop conditions

Stop without modifying production code if source/output correspondence cannot be established within the fixed tolerance; if piece correspondence is ambiguous; if any required mark is missing, altered or cannot be safely identified; or if the returned geometry contains transformations beyond the single unit label. Preserve all measured evidence and make the next step explicit. No alternate app or encoding experiment is authorized.

## Exit evidence required

Record source/output hashes; parser method and coverage; per-piece geometry/mark discrepancies; units and layer semantics; changed behavior (or why no safe fix exists); focused test/coverage/build/output results; board revisions; elapsed implementation, focused verification, external-agent wait and maintainer-decision times separately; all remaining V03 gates; and the next action.
