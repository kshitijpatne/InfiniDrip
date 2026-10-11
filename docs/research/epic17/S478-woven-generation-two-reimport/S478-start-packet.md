# EPIC-17 / G04 V03 — Woven generation-two DXF reimport — Slice 478 start

## Verified start

- Start time: `2026-10-08 07:15:28 UTC`.
- Branch/worktree: `codex/epic-17-g04`, `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- Starting commit: `68cc8f35423463fbc6dc54165c97816776fde105` (S477).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor.
- S477 is the highest and unique assigned slice; S478 is reserved. The worktree was clean before this packet.
- Canonical board revision 2951: EPIC-17 and G04-V03 In Progress; V01/V02 Done. V03 exit evidence is still open.
- Goal record is active and matches the admitted EPIC-17 objective. Ordinary usage is allowed (18% primary / 33% weekly at the last check).

## Scope and question

Use the already authorized local CLO 2026.1.310 (r58944) desktop to reimport the Woven M DXF exported from the first CLO-reimported Woven project in S477. This answers a bounded receiver question: does a second DXF-ASTM export/import cycle keep the twelve-piece layout and geometry representation stable, and can the import be saved/reopened in CLO? Inspect the resulting actual 2D pattern output and compare the C:-only first-generation export, second-generation export, and input fixture where matching is possible.

Input is `C:\G04-CLO-DXF-Exchange\Output\woven-shirt-standard-m-clo-reexport-from-reimport.dxf`, 140,107 bytes, SHA-256 `44f3580f1175b84342f1d21ef847214cbbe5bc883c0795fdc4e69c09e2e21579`. The prior Woven input/output hashes and receiver settings are recorded in S476. Import with the same observed C: workflow: DXF-AAMA, centimeters, 100%, no rotation, original grain, and prior notch handling. Save any native project or rendered evidence only beneath `C:\G04-CLO-DXF-Exchange\Output` or `...\Evidence`.

## Acceptance for this slice

1. Record the actual dialog options, import outcome, CLO version, file hashes/sizes, and saved native project/output evidence under C:.
2. Inspect the actual CLO 2D result for all expected distinct Woven pieces and visible CUT/SEW contours; record missing/duplicated pieces, import notices, and visible entity limitations.
3. Compare the hash-bound second-generation DXF to the first-generation Woven export and source where a bounded geometry association supports it. Preserve numeric-layer ambiguity and resampling as explicit limits; do not equate visual presence with standard/profile conformance.
4. Keep legacy DXF behavior, all protected export identities, V02 acceptance, V03 rights/profile/round-trip gates, and compatibility-claim limits unchanged. This sample does not prove all recipes, grades, options, industrial interoperability, or factory acceptance.

## Non-goals and risks

No product/source code or pattern geometry changes, no DXF writer changes, no receiver/profile selection change, no standards conformance claim, no layer-semantic inference, no garment option matrix, no production-readiness or physical-fit claim. No additional trial, payment, account change, vendor contact, or upload. Leave CLO open when the observation is complete. If the import requires a changed setting or overwrites an existing receiver file, stop and preserve the exact outcome without claiming a passing round trip.

## Verification and handoff

This is an evidence-only receiver trial. Use a focused hash-bound comparison and actual rendered/UI review. No full repository suite or coverage gate is due; run only focused checks for new evidence tooling and the validated board-command suite. OpenCode delegation is not needed because the independent review has no disjoint receiver UI access and no safe isolated ownership.

At the S478 boundary, update the exit packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and canonical board through validated commands. Record implementation, focused verification, UI/output review, external waits, and maintainer-decision time separately. Recheck branch, origin ancestry, unique next slice, and dirty state before commit.
