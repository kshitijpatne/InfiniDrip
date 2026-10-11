# EPIC-17 / G04 V03 — Independent ASTM/AAMA parser assessment — Slice 480 start

## Verified start

- Start time: `2026-10-08 07:45:46 UTC`.
- Branch/worktree: `codex/epic-17-g04`, `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- Starting commit: `aa6cf64` (`Slice 479: review CLO rights and DXF profile`).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor.
- S479 is the highest unique slice; S480 reserved. Main worktree clean.
- Canonical board revision 2967; EPIC-17 and G04-V03 remain In Progress.
- Goal remains active and aligned to admitted G04 completion and safe merge.
- Ordinary usage remains available (23% primary / 34% weekly at last check).

## Scope and question

Use the previously identified [Open Patterns ASTM/AAMA parser](https://github.com/ksons/astm-parser) as a possible *independent parser* only. Verify the exact source revision, project/package license declarations, documented read/write capabilities, and whether its documented layer mapping could add independent evidence to G04 V03. If the source/package and dependency terms permit a bounded local trial, run the pinned parser against the already prepared representative Tee, Polo, and Woven M fixtures and compare its parsed structure/render output to the hash-bound source/round-trip evidence. Store the parser checkout, imported DXFs, derived JSON/SVG/renders, and logs only under `C:\G04-CLO-DXF-Exchange`.

The task is to determine whether this free, local parser can contribute receiver/profile evidence without CLO or whether its limits disqualify it. It is not itself assumed to be a receiving CAD application. No project dependency, product export, pattern source, DXF byte, protected baseline, UI, account, or rights gate may change. No external upload or other service receives any fixture.

## Acceptance for this slice

1. Verify exact upstream commit and package versions, top-level and per-package license fields, and runtime dependency license/source; preserve the relevant source/hash and document any ambiguous licensing.
2. Confirm the parser's advertised direction (DXF→OPF/JSON/SVG), available layer/grade/mark handling, and absence/presence of a DXF writer using source code and official README/package manifests, not README claims alone.
3. If permissible and technically supported, invoke the parser locally on hash-pinned existing representative fixtures for Tee, Polo and Woven M. Keep all exchange/derived files in the named C: folder. Capture parse diagnostics, piece/size counts, outlines, marks, units, and exact geometry associations; inspect rendered output for loss, duplication, or misleading mappings.
4. Distinguish direct source facts, parser project claims, observed behavior, and independent evidence. Do not treat the parser's layer table as normative ASTM/AAMA proof; detailed normative provisions remain unverified.
5. State whether this can satisfy any part of V03's independent-parser round-trip path. Do not declare V03 complete if there is no DXF writer/round-trip or if legal/profile/representative coverage gates remain.
6. Update the exit packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and board through the validated command layer. Run only focused analyzer/parser checks, Control Center tests and `git diff --check`; the full repository gate remains for the settled Epic/PR candidate.

## Non-goals and risks

No integration of external code/package into InfiniDrip, no DXF writer implementation, no ASTM/AAMA conformance claim, no change to the accepted V02 scope, no further CLO trial, no paid purchase, license inquiry, vendor contact, hosted upload, factory test, or physical claim. The parser's README presently identifies a DXF parser and JSON/SVG/PNG outputs, not a DXF writer; if inspection confirms that, it can only be an independent read-back oracle and cannot by itself prove a complete external DXF round trip.

## Verification and handoff

This is a bounded local parser assessment. No delegation is used: source capability, license review, parsing, and render comparison share one fixture/provenance chain, so splitting those owners would create avoidable mismatches. Codex owns all downloaded code and fixture trial work; no contribution or file leaves the C: evidence folder. If any license/provenance or processing uncertainty cannot be established from the exact source, stop before running a fixture and record the precise unresolved gate.

At the S480 boundary, record research/implementation, focused verification, external waits, and maintainer-decision time separately. Recheck Git, board, and the next unique slice before commit.
