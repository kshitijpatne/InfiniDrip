# EPIC-17 / G04 V03 — Exact-path Polo CUT preflight — Slice 671 boundary

## Verified outcome

S671 starts from S670 commit `43008d3d` on `codex/epic-17-g04`. Refreshed
`origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
The canonical board's validated start was revision 3970; current progress
evidence is at 3981. Slice 671 is unique.

The C:-only source-path derivative is complete. Its source is the exact
S617 Polo M file (24,326 bytes, SHA-256
`71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`). The
derivative is 66,206 bytes, SHA-256
`487FAD7533BDA83306D3F4FA2DFEF523E469E62F3D808EFF0A9C98A7E38B77F8`.
It retains all 2,724 original group/value pairs, all 56 entity records, all
nine CUT contours and every original vertex. Only five CUT polylines receive
776 inserted collinear points. Maximum floating numerical deviation from
their source segment is `5.68e-13 cm`; the represented mathematical path
residual is 0.000 cm. Exact values and the independent verifier are in
`S671-preflight-checkpoint.json` and `verify-exact-path-density.mjs`.

The five local source neighborhoods are rendered in
`C:\G04-CLO-DXF-Exchange\S671-polo-cut-source-path-density\Evidence\source-path-density-overlays.png`
(SHA-256 `243BE119D3C243D2088621E5B2D4F92696F376A563B2DC1793649D1402A07E73`).
This is explicitly a source-only render, not receiver evidence.

## Receiver operation not executed

Windows reports CLO 2026.1.310 running as PID 62304. The current
computer-use connector reports an empty native-app inventory and exposes only
browser APIs; no CLO window can be bound through the permitted UI-control
surface in this task. Thus no import, receiver query, export, or reimport was
performed. S671 has **no receiver pass or failure result**, and it clears no
V03 gate. The exact derivative is ready for one Standard-DXF import when
native desktop control is exposed. Do not regenerate it or reopen a settled
mode/entity permutation.

## Goal and V03 status

At this safe checkpoint, `get_goal` returns `active` and the saved objective
still matches EPIC-17/G04 through the required final gates and safe merge. The
visible “stalled” label is stale. No goal wording/status change or manual
resume is needed. The approved `/2` grainline convention and all other design
decisions are settled; no approval is pending. V01/V02 remain Done; V03 and
EPIC-17 remain In Progress, and all remaining V03 gates/holds are unchanged.

Current full gate reconciliation and ranked route are
`V03-GATE-RECONCILIATION-S671.md` and `V03-COMPLETION-PLAN-S671.md`.

## Focused verification and time ledger

- `prepare-exact-path-density.mjs`: passed; emits only the five specified
  collinear CUT subdivisions.
- `verify-exact-path-density.mjs`: passed independently; all original
  group/value pairs and points preserved, 0.000 cm path residual.
- `render-source-path-overlays.mjs`: passed; actual source-only visual proof
  was opened and inspected. It does not substitute for a CLO render.
- Node syntax checks for all three scripts: passed.
- `npm run control-center:test`: 42/42 passed.
- `git diff --check`: passed.
- No production source, renderer, recipe, baseline, acceptance or protected
  export identity changed; changed-production-code coverage is not applicable.
- Implementation: approximately 5 min (fixture builder and verifier).
  Focused verification and source-render inspection: approximately 3 min.
  Durable packet/state/board closeout: approximately 2 min. External-agent
  wait: 0 min. Maintainer-decision time: 0 min. The actual CLO operation is
  unperformed because no native-app binding is exposed.

## Next action

Expose native desktop-app controls for this task. Then perform only the
prepared CLO import, source-bound CUT/SEW/mark/layer query at `0.001 cm`, and
actual overview/detail inspection. Export/reimport only after every
representative gate passes. The DGS receiver is retired, but its window and
the existing CLO window remain open because this task has no native-app close
or interaction API. No physical-fit, factory-acceptance or
production-readiness claim is made.
