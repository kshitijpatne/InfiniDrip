# G04 V02 source-backed view metadata — Slice 280

## Authority and admission

- **Authority:** explicit maintainer decision on 2026-09-30, recorded in
  `docs/PROJECT-DECISIONS.md`: G04 may add view-only fold-axis reflection for
  source-declared `onFold` roles when the axis is explicit in construction
  evidence, and face-specific landmarks/multiplicity rules where that evidence
  supports them. No canonical pattern/cut geometry may change.
- **Start record:** complete before implementation. Refresh `origin/main`,
  verify clean S279 parent and slice history, capture the start time and
  Control Center revision, and record S280 start through the validated command
  layer.
- **Dependencies:** admitted V01 construction/source-to-view contract;
  S276–279 projection decisions and renderer; especially
  `G04-V01-SOURCE-INVENTORY.md`, `G04-V02-FACE-PROJECTION-S276.md`,
  `G04-V02-PROJECTION-MAPPING-S277.md`,
  `G04-V02-PROJECTION-GEOMETRY-S278.md`, and
  `G04-V02-LIVE-PROJECTION-S279.md`.

## Scope

Audit the repository's construction records and actual drafted source objects
for explicit fold axes, face-specific split landmarks, and role-instance or
multiplicity evidence. Add only metadata that directly points to those facts
and changes view projection only; preserve authored source geometry and all
cut/export behavior. Keep a source-to-view evidence table with exact role,
recipe, source field/reference, transform or partition rule, and verification
result. If source facts do not establish an axis or face rule, retain the hold
and name the missing fact.

Polo/Woven-shirt exterior collar splits remain held until a specific
construction reference supplies front/back landmarks. Do not substitute an
appearance-based guess, whole-role mirror, stitch endpoint, or general
`onFold` inference. This slice does not promise a V02 exit; S281 remains the
integrated rendered review boundary.

## Acceptance criteria

1. The source audit distinguishes authored construction facts from estimates
   and records exact references for every enabled view rule. `onFold` alone
   never supplies an inferred axis.
2. Any implementation is isolated to G04 view metadata/projection. Source
   `Block`/`Piece`/edge coordinates, drafting, seam allowances, DXF behavior,
   and protected export identities remain unchanged.
3. Reflection uses a documented, explicit source axis and preserves dimensions
   and exact source IDs. Face-specific runs/instances resolve to actual edges
   and landmarks in the same drafted block and revision; unsupported options
   or stale maps fail closed with actionable guidance.
4. Focused tests cover supported and unsupported rules, exact geometry
   preservation, options/revisions and face visibility; every changed
   production module meets 100% statement, branch, function and line coverage.
5. Render production Chromium output for affected cases and manually inspect
   before/after geometry, layers, overlays and POM anchors. A green unit suite
   alone is not visual acceptance. Preserve the S279 rejected outputs.
6. Run focused tests, build, Control Center regression tests if fixtures/state
   change, and protected export identity tests. Do not run the full repository
   coverage gate before the settled integrated Epic/PR candidate unless this
   slice becomes independently mergeable.
7. Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, context, this packet and
   validated board with pass/fail status, evidence, timing breakdown, blockers
   and the next single gated action.

## Non-goals and holds

- No canonical pattern or cut-coordinate changes, new recipe, general
  reflection heuristic, or unreferenced component multiplicity.
- No Polo/Woven collar split without a specific source-backed construction
  reference and explicit front/back landmarks; those faces remain held.
- No V02 completion claim until all required output is coherent and readable.
- No broad UI redesign, G09/D04 assembled side/oblique/inside views, G05
  production tech-pack content, physical sampling, supplier contact, launch
  spending, hosted service, physical-fit, factory-acceptance, or production
  readiness claim.
- Preserve legacy DXF behavior and every protected export byte identity.

## Execution and exit evidence

No safe disjoint low-risk ownership is identified: projection metadata,
geometry generation and visual acceptance share the same behavior boundary.
Codex owns integration; external-agent waits expected 0m. Record implementation,
focused verification, rendered/output review, board/docs closeout, agent waits,
and maintainer-decision time separately. Recheck usage before expensive gates.

**Exit:** pending. Record exact starting refs/time/board revision; source audit;
changed files; exact supporting source facts; tests and coverage; rendered
artifacts/manual outcome; legacy/export evidence; board revision and evidence
ID; elapsed-time breakdown; unresolved collar and other holds; and the next
single action. Failed visual evidence is diagnostic, not acceptance.
