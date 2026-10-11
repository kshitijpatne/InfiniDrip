# EPIC-17 / G04 V03 — S708 source-bound CUT layer audit

## Verified starting boundary

- Started 2026-10-11 01:26 UTC from S707 commit
  `913a2b718c218e541a657c9ac4d684f30e88db05` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an
  ancestor of HEAD. S707 is the highest assigned slice; S708 is reserved
  once. No S708 commit exists.
- Board revision 4158. EPIC-17 is In Progress; G04-V01/V02 are Done and
  G04-V03 remains Blocked. The goal remains active.
- Worktree has only the two pre-existing untracked S700 coverage diagnostics;
  leave both for the final cleanup inventory. The S707 slice is committed.
- Interchange inputs/outputs/render captures remain under named folders on
  `C:\G04-CAD-Interchange\`; no CAD artifacts belong in the repo.

## Objective

Use only already-saved candidate/input/return evidence and source code to
identify exactly why CUT outlines change to layer `0` in named-block returns,
even after S707 added a complete layer table. Compare entity types, layer
codes, block membership, and entity data on both sides; compare against S703
CLO and S706/S707 LibreCAD records where the files permit. Decide whether the
cause is a source-writer defect and whether an evidence-backed correction can
be implemented without changing pattern geometry, protected legacy exports,
acceptance thresholds, identity contract, or receiver settings.

The audit found that the opt-in AC1015/R2000 writer labels its output R2000 but
omits the associated BLOCK_RECORD table, block-record ownership links and
handles, default model/paper-space records, and the referenced CONTINUOUS
linetype table. Autodesk's R2000 DXF reference and the already-saved LibreCAD
return both show those records. This is a demonstrated source-format
completeness defect; evidence does **not** establish that it caused LibreCAD to
rewrite CUT entities to layer 0. Update this packet additively before coding.

One coherent, candidate-only R2000 object-structure normalization is now
permitted in this slice: add deterministic handles and owner links, the
BLOCK_RECORD entries/space records and definitions, the CONTINUOUS LTYPE
record, and a matching HANDSEED. Preserve all coordinates, entity types,
group-8 layer values, piece names and manifest identity. Then run exactly one
same-profile LibreCAD 2.2.1.5 DXF 2000 save/reopen on the same Polo M fixture
to test whether the normalized source preserves CUT; no new receiver, format,
settings, encoding variation, or candidate app is permitted. This is a
distinct test because the writer's source object structure changes. A pass
would be empirical evidence for that fixture only, not proof of formal R2000
conformance, an industrial-apparel profile, or V03 completion. A failure ends
this LibreCAD hypothesis; do not try another structural variation here.

## Fixed acceptance and gates

No acceptance change: all seven recipes and supported options/grades, exact
piece/revision identity, CUT/SEW geometry within `0.001 cm`, centimeter units,
semantic construction marks/layers, malformed-input rejection,
repeatability, readable rendered outputs, documented empirical profile and
rights review, and protected legacy export byte identities remain required.
S707's same-fixture exact values and gate status are in its exit packet and
`C:\G04-CAD-Interchange\S707-candidate-layer-table\S707-r2000-analysis.json`.

## Evidence to inspect

- Candidate writer and source records: `src/export/named-dxf-blocks.ts`,
  `src/export/dxf-interchange-package.ts`, tests, and committed S700/S707
  packets.
- Exact candidate and LibreCAD return in
  `C:\G04-CAD-Interchange\S707-candidate-layer-table\`.
- Exact S706 return and analysis in
  `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\`.
- Exact S703 CLO-ASTM return and analysis in
  `C:\G04-CAD-Interchange\S703-clo-astm-pilot\`.
- Fixed V03 matrix and completion plan:
  `docs/research/epic17/S704-v03-source-and-gate-reconciliation/`.

Do not infer from screenshots alone when DXF group codes can settle the
question. Identify precisely which entities carry layer names in the candidate
and return. Keep every existing failure and unproven gate visible.

## Exit gates and deliverables

1. A concise source-to-return matrix for the existing files states, for each
   observed entity class, the input type/layer, output type/layer, geometry
   consequence, and certainty/limitation.
2. State whether `CUT` was correctly attached to input outline entities and
   whether the receiver's saved entities are on `0`, rather than merely
   relying on a layer-table declaration.
3. Implement and test the bounded source-format normalization above, with 100%
   changed-code statement/branch/function/line coverage and unchanged
   protected DXF hashes. Inspect candidate and returned rendered output.
4. Run the one same-profile check only after the source change; record whether
   CUT layers are preserved. Do not describe causal proof beyond this
   before/after result.
5. Identify every V03 gate still unmet; this narrow check cannot close the
   profile, all-recipe/configuration, malformed-input, repeatability, rights,
   or complete-readability gates by itself.
5. Update this packet with results, `PROJECT-STATE.md`, `ARCHITECTURE.md` if
   source behavior changes, and board evidence/comment using validated
   commands. Run focused verification and `git diff --check`; no full repo
   gate until the settled integrated Epic/PR candidate.

## Boundaries and ownership

- Codex owns the coupled serializer and source/return interpretation. There
  is no safe disjoint implementation/review assignment for this packet.
- No geometry or stitch-graph change, new app/search/install, app profile or
  settings variation, threshold relaxation, new garment recipe, broad UI
  work, physical sampling, supplier contact, launch spending, hosted service,
  or production-readiness claim.
- Do not delete the S700 diagnostics or perform final repo cleanup in this
  slice. Preserve all protected export identities.

## Timing and next action

Record implementation/audit, focused verification, external waits, and
maintainer-decision time separately. Start board revision 4158; reserve only
after refreshed Git history. No V03 gate is assumed passed. Close with one
commit: `Slice 708: audit candidate CUT layer reassignment`.
