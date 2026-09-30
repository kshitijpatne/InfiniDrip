# G04 V02 sewn-component assembly review — Slice 281

## Authority and start gate

- **Authority:** admitted V02 output correction and rendered review in
  `docs/planning/EPIC-17-ADMISSION.md`. S279–280 output demonstrates that source
  edge accounting and fold projection alone do not produce acceptable flats.
- **Start record:** before implementation, refresh `origin/main`, verify clean
  S280 parent and highest slice number, capture start time and board revision,
  and record the start through the validated Control Center command layer.
- **Dependencies:** S270 exact sewn-role placement, S275 subdivision/cycle
  review, S276 collar source-gap record, S279 live projection and S280 view
  metadata. Read `S280-browser/` rendered captures and
  `S280-reflection-pre-correction/` only as a rejected historical diagnostic.

## Scope

Review the emitted Tee/Fitted sleeve intersections and Skirt waistband-to-front
placement against exact drafted edges and sewn-interface ordering. Identify
whether the current rigid transform is wrong despite source-known matching
landmarks, or whether the source join is insufficient for a finished-face
placement. Correct only a rigid placement supported by exact seam endpoints,
named edge direction and explicit face mapping. If evidence does not establish
a face position, withhold that role/face with precise guidance instead of
guessing. Re-review all eight previously emitted default faces and all
previously held defaults after each accepted correction.

Polo/Woven collar exterior splits remain held until a specific construction
reference supplies exact front/back landmarks. Trouser faces remain held while
the fly/waist assembly conflicts lack a source-supported rigid solution. Do
not force joins by scaling, warping, reorienting cut geometry or suppressing a
required source edge. This slice may conclude that V02 remains blocked.

## Acceptance criteria

1. Each reviewed join is traced to the exact `Block.stitches` entry, named
   edges, ordered interface segments, face role mapping, and current option
   draft. Record accepted transforms or the exact unsupported source fact.
2. Any accepted placement remains rigid, scale-preserving, same-block/revision
   bound, and leaves all source/cut geometry unchanged. Role identity, fold
   metadata, overlays and POM anchors remain attached to represented geometry.
3. Changed production code has 100% statement, branch, function and line
   coverage. Run focused assembly/projection/live/POM tests, TypeScript/Vite
   build, protected DXF/export identity checks and `git diff --check`.
4. Render affected default and relevant option/combined cases through
   production Chromium. Manually inspect all emitted defaults for crossed
   component outlines, unreadable annotations, POM anchor mismatch, and
   overlays that imply unsupported geometry. Verify held faces keep actionable
   source guidance.
5. Review MQF-004–007, MQF-011 and MQF-012 as `To be reviewed` only at a
   relevant successful G04 output exit; do not close findings or expand scope
   from a failed/incomplete view. MQF-015 remains assigned to V03.
6. Update this packet, admission plan, architecture, context, project state and
   canonical board evidence with exact rendered findings, blockers, elapsed
   time by category and one next action. V02 stays open if any required face
   remains misleading or held.

## Non-goals and delegation

No canonical pattern/cut coordinate change, new recipe, unproven face split,
fabric drape or physical-fit claim, broad UI redesign, G09/D04 side/oblique/
inside view, G05 production tech-pack content, supplier contact, spending,
hosted service, factory-acceptance or production-readiness claim. Preserve
legacy DXF and every protected export identity. No safe disjoint low-risk
ownership is identified; Codex owns the coupled assembly/output boundary and
external-agent waits are expected to be 0m.

**Exit:** pending. Record source seam audit, exact transform/withhold decisions,
focused coverage, rendered artifacts/manual findings, protected identities,
board evidence/revision, timing breakdown, remaining collar/Trouser blockers,
and the next single gated action.
