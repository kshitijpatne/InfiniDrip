# EPIC-17 / G04 V03 — Current gate reconciliation — Slice 589 start

## Start and verified state

- Started 2026-10-09 06:47:34 UTC from S588 `a02cee4a98a948bb831933f0630bd5b0e31ba81f` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Working tree was clean before this packet. S588 is highest assigned; reserve S589.
- Canonical board is revision 3469; EPIC-17 and G04-V03 In Progress, G04-V01/V02 Done.
- Maintainer-confirmed CLO product-development trial use and local DXF processing are settled in `docs/PROJECT-DECISIONS.md`; do not ask again.
- CLO 2026.1.310 remains open. Any later exchange files remain confined to `C:\G04-CLO-DXF-Exchange\<slice-folder>`.

## Objective

Reconcile the corrected S573 acceptance matrix and all later V03 evidence through S588 into one current gate table. Separate admitted acceptance gates from supporting diagnostics and profile claims. Identify concrete measured passes, bounded failures, unproven criteria, exhausted tests, and the shortest evidence-backed next development step. Correct stale current-status summaries so the next task does not restart closed research.

## Scope and boundaries

- Reconcile existing packets S531, S547, S557–S573, S585–S588 and the admitted V03 scope. Hash-check retained evidence only as needed; do not regenerate artifacts or re-run a CLO exchange.
- Preserve all-seven recipe coverage, source-linked fixtures, the fixed 0.001 cm geometry gate, marks/notches, size/grade/options, malformed-input behavior, rendered output, repeated round trip, documented profile identity, and actual import/round-trip evidence requirements. Distinguish profile identity from formal standards conformance and observed compatibility.
- No CLO UI action, new file exchange, broad standards/vendor/API search, code/pattern change, gate relaxation, export-baseline update, or general compatibility claim.
- Keep V02 Done and all protected export byte identities and legacy DXF behavior unchanged. No physical-fit, factory-acceptance, or production-readiness claim.

## Required exit evidence

1. A current V03 matrix with one row per admitted gate, named evidence, exact scope of any pass/failure, and next proof required.
2. Explicit reconciliation of S588's 0/56 XDATA result and its non-attributable geometry limitation.
3. A short ordered action plan naming reusable evidence, exhausted avenues, and remaining implementation/receiver work without speculative trials.
4. Roadmap, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and this admission handoff agree on current state and next action.
5. Focused documentation/board verification and validated Control Center evidence/comment replay; no full repository gate for documentation-only work.

## Verification and ownership

Codex owns this shared matrix. No safe disjoint implementation task exists in this documentation-only slice; do not manufacture delegation. At exit, verify links/status against source packets and the board, run `npm run control-center:test`, board preflight/replay, applicable script syntax checks, and `git diff --check`. Preserve contradictions as named holds rather than silently resolving them.

## Start command evidence

Canonical board start replay advances revision 3469→3471; G04-V03/EPIC-17 stay In Progress. Exact commands are adjacent to this packet.
