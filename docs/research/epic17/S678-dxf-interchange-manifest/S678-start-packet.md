# EPIC-17 / G04 V03 — C04-bounded DXF package manifest — S678 start

## Verified boundary

- Started 2026-10-10 17:51:58 UTC from clean S677 commit `280580ad0a940cb7b7819f2ac1d21bc804c783ad` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 677; S678 is unique.
- Canonical Control Center board revision 4025 has EPIC-17 and G04-V03 In Progress; V01/V02 are Done. The goal record is active and its objective matches the admitted Epic.
- S677 proves source-derived notch/grainline geometry now exists in the opt-in candidate but proves no receiving-app behavior. Do not reopen prior software/mode comparisons.

## Scope

Implement one deterministic, versioned JSON sidecar package for an exact centimeter-declared DXF candidate. Bind the sidecar to the DXF SHA-256 and bind a package revision digest to the canonical manifest content. Derive recipe/piece identity from `GarmentRecipe.name` and `Block.roles`, selected size/grade rule from `GradedSize` and recipe size data, current options from the same draft request, and seam relationships from `Block.stitches`. Include explicit limitations and serialization schema/version.

Add a verifier that checks both digests and rejects a changed DXF or changed manifest. Use stable key ordering for options/metadata. Do not claim the digest is a source-control commit ID: it identifies the exact package content. Sidecar metadata supplements the DXF and may never substitute for CUT/SEW geometry or visible construction marks. Keep the manifest restricted to C04's permitted piece identity, grade, and seam relationships, plus binding/recipe/option provenance needed to interpret those records.

## Acceptance and verification

- Test package generation against all seven recipe definitions and their size/grade rows using existing grade fixtures.
- Verify deterministic output for an identical revision; changed geometry/size/options/seam relation changes the appropriate digest; DXF/manifest tampering fails verification.
- Keep `exportDxf` and default UI output byte-identical; preserve all protected exports.
- Require 100% statement/branch/function/line coverage for changed production code, focused package/DXF/protected checks, build, `git diff --check`, board validation and validated closeout.
- Record representative serialized manifest output, hashes, and rendered evidence. No receiver/profile, all-options round trip, importer, malformed-file, or V03 pass is claimed by a source-only slice.

## Non-goals and next gate

No UI route, external receiver operation, new software, format variation, compatibility claim, standards claim, acceptance relaxation, source-pattern geometry/stitch change, physical/factory claim, or legacy export change. The verifier only validates the local exact-package association; it does not prove a receiving application preserves or interprets the sidecar. After S678, use the already selected authorized receiver once with the exact S677/S678 artifact only if the available desktop interaction path is usable. Stop that exact candidate on a measured acceptance failure; do not shop another application/mode.

## Exit ledger

Record implementation, focused verification, output/render inspection, board/docs, external-agent waits, and maintainer-decision time separately at the boundary. No safe independent ownership split is identified; Codex owns the package contract and integration.
