# EPIC-17 / G04 V03 — Source-bound adapter feasibility — Slice 673

## Verified boundary and goal

- Start: 2026-10-10 11:24:57 UTC, from S672 commit `c00f656c` on
  `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S672 is the highest assigned slice; 673 is unique. Board revision
  at start is 3990; G04 V03 remains In Progress. Worktree was clean.
- V01/V02 are Done. V03 remains open. User confirms all required approvals,
  including the `idr-pattern-exchange/2` grainline convention; no approval is
  pending and none is reopened by this slice.

## Scope

Perform one bounded feasibility proof of whether a source-bound adapter can
make the tested CLO route lossless without misrepresenting CAD edits. Reuse
only pinned S617/S671 source DXFs, S672 CLO output and existing measured
parsers. Determine whether each returned pattern binds uniquely to its frozen
source through preserved data, and whether the actual DXF/receiver path carries
the exact source CUT/SEW, units, typed marks and semantic layers. C04 permits a
version-matched sidecar for piece/revision identity, grades and seam relations
only; a sidecar cannot replace missing/altered geometry or visible marks.
Explicitly distinguish unchanged data from receiver simplification or user
edits; never silently restore over changed receiver geometry.

The slice may add a read-only analyzer or isolated proof fixture only. Do not
modify the production exporter/importer, change legacy DXF bytes, launch
another CLO/DGS/OpenCAD operation, vary format/settings/encoding, or claim an
industrial profile. Do not relax all-seven/73-option/grade coverage,
`0.001 cm`, malformed-input rejection, repeatability, rendered-output, rights,
or protected byte-identity gates.

## Decisive checks and stop condition

1. Inspect current `src/export/dxf.ts`, pattern-piece/mark identity types,
   existing DXF parsers, S672's exact block/path comparison, and the pinned
   source semantics.
2. Prove all nine S672 receiver blocks bind uniquely to source piece/revision
   records using exact unchanged source data. Identify whether marks can be
   attributed unambiguously per piece and whether receiver edits can be
   distinguished from simplification loss using existing persisted data.
3. Verify whether an adapter can emit a fully semantic DXF while preserving
   source geometry/marks in the DXF itself and binding only C04-permitted
   metadata in a sidecar. Verify that malformed, mismatched or ambiguous
   inputs fail closed. Keep diagnostic files under
   `C:\G04-CLO-DXF-Exchange\S673-lossless-adapter-feasibility\`.

**Go** only if the receiver path preserves or deterministically translates
every required geometry/mark entity in the DXF itself, C04 metadata binds
correctly, and user-edited geometry is never silently overwritten. If CLO
loses CUT/marks and the DXF cannot distinguish that loss from a user edit,
**stop**: this route is not a safe round trip. Do not begin production changes
from an unchanged-fixture-only proof. Record the smallest exact product
data/contract needed for an implementable route and continue independent gate
reconciliation without asking the maintainer to restate settled approvals.

## Ownership, checks and boundary

The input, export evidence and analysis are coupled, so no safe disjoint
delegation exists. Codex owns the analysis and integration. Focused checks are
hash-pinned parser/analyzer execution, independent source/output comparison,
fail-closed cases, and rendered/drafted output inspection. No production code
means changed-code coverage does not apply. The full repository 100% coverage,
build, browser/Electron, final output review, legacy DXF, protected identity,
PR, safe merge, `origin/main` ancestry and any required deployment remain
reserved for the settled candidate. All evidence files must stay under the
named C: folder. No physical fit, factory-acceptance or production-readiness
claim.

## Time ledger

- Implementation / analysis: record at slice exit.
- Focused verification: record at slice exit.
- External-agent waits: 0 minutes unless ownership changes.
- Maintainer-decision time: 0 minutes; approvals are settled.
- Current primary usage after S672 boundary check: 1% used; weekly 15% used.
