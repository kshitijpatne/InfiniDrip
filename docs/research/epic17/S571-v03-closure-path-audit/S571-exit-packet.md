# EPIC-17 / G04 V03 — Closure-path evidence audit — Slice 571 exit

## Result

S571 reconciled the retained product-source, CLO round-trip, standards, and
receiver evidence. The repeated Polo contour discrepancy belongs to the
observed source-to-CLO-to-DXF path; current evidence cannot attribute it to the
product writer, CLO import, or CLO export individually. No new exchange or
setting trial was justified because the same source fixture and CLO mode have
already been repeated and the available public controls do not identify a
verified corrective path.

The current product writer in `src/export/dxf.ts` emits a minimal R12 DXF
`ENTITIES` section. It flattens the `Piece[]` supplied by its caller, writes
closed CUT and SEW polylines plus pattern marks, lays pieces out, flips Y, and
rounds coordinates to 0.001 cm. The UI supplies the currently selected size;
the writer receives no grade table, multi-size group, or source point identity.
This describes current product behavior directly; it does not establish an
exporter defect in the CLO contour discrepancy.

The S544 CLO input `polo-standard-m.dxf` is byte-identical to the S559
source-generated `polo-M.dxf` (24,261 bytes; SHA-256
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`). It is
not a stale or different-size fixture. The accepted S545 symmetric
vertex-to-path analyzer reports five CUT contours over the unchanged 0.001 cm
gate in both CLO generations. Source ordinals 2, 10, 12, 14, and 16 each lose
one vertex (33→32, 54→53, 54→53, 44→43, and 44→43). Gen1 residuals are
0.012741–0.013974 cm; gen2 residuals are 0.012746–0.013988 cm. Input/output
hashes and the complete measurement report are pinned below. This proves a
repeatable defect in this tested local path; it does not isolate which stage
first changes geometry.

The current official CLO help describes Standard DXF, DXF-AAMA and DXF-ASTM
menus, one selected size group per export, and graded DXF or separate Rule
File output. It does not identify a normative edition, complete semantic map,
or receiver-specific conformance profile. ASTM's current textile catalog lists
D6673-10 as withdrawn in 2019. These sources do not establish a current
edition-backed industrial profile for the tested CLO mode. No exact format
compatibility claim is warranted.

The independent Claude Opus 5.5 / xhigh review returned `WORK FINISHED` from
the separate read-only worktree. Its source-fetch tools were declined, so its
standards conclusions were treated as research leads and checked against the
durable primary-source record rather than accepted as fresh citations. It
identified no evidence-backed exact profile or safe setting that resolves the
observed failures. This agrees with, but does not replace, the local evidence
and official-source checks above.

## Gate disposition

| V03 gate | S571 disposition |
| --- | --- |
| Rights and local processing | Settled by the maintainer's written confirmation for this bounded product-development evaluation. No further decision is needed. |
| Exact industrial receiver/profile | Held. Current CLO materials expose menu modes but no normative edition, full semantics, or receiver-specific conformance. ASTM D6673-10 is withdrawn. |
| Geometry and piece identity | Held. The tested three-recipe route preserves major pieces, but the five Polo CUT contours exceed 0.001 cm. Stage attribution remains unresolved. |
| CUT/SEW and marks | Held. S557/S539 show mixed semantic assignments and incomplete direct mark attribution; numeric layers alone do not prove the full meanings. |
| Sizes, grades, and options | Held. The current writer exports one selected size and no grade relationship; source-point maps exist, but the tested CLO grading paths do not demonstrate a source-linked grade round trip. |
| Malformed-input handling | Failed for the tested malformed control in S531: CLO silently accepted it while an inset SEW contour disappeared. This is not a general claim about all malformed files. |
| All-seven representative round trip | Incomplete as an accepted profile proof. Existing tests cover all seven M/default recipes, but other gate failures prevent V03 acceptance. |

All admitted criteria remain unchanged, including all-seven recipe coverage,
the 0.001 cm geometry tolerance, exact evidence before format claims, generic
legacy DXF behavior, and protected export byte identities. No product source,
test, baseline, or CLO file changed in S571. No physical-fit, factory-
acceptance, or production-readiness claim is made.

## Evidence and source links

- `src/export/dxf.ts`: direct product writer implementation.
- S559 source-backed fixture record: `docs/research/epic17/S559-source-backed-grade-fixture/S559-exit-packet.md`.
- S545 accepted round-trip measurements and limitations:
  `docs/research/epic17/S545-clo-target-recovery/S545-exit-packet.md`.
- S557 semantic/mark and grade findings:
  `docs/research/epic17/S557-mark-and-grade-evidence-audit/S557-exit-packet.md`.
- S562 source-side grade point map:
  `docs/research/epic17/S562-grade-point-topology-map/S562-exit-packet.md`.
- CLO official help, updated 2026-09-28:
  https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export
- ASTM current textile catalog, listing D6673-10 as withdrawn in 2019:
  https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html
- C:-only evidence under
  `C:\G04-CLO-DXF-Exchange\S544-aama-three-recipe-roundtrip`:
  - input SHA-256 `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
  - gen1 output SHA-256 `CAC8D2D90A7B72BFEBCF9BEDBEF7C1C91E3558C3386423F833E080C283BB0470`.
  - gen2 output SHA-256 `AE3731633A396CC94911DFE7EE53CD0DC85E847A04420A0C6E985B8CF57C1241`.
  - measurement JSON SHA-256 `B3A3A54E719C2E42A47C5AD10F7314D4B4405F8F4D8BA9BB0DCA8E703D72D7FC`.

## Verification, board, and timing

- Started 2026-10-09 03:45:19 UTC from S570 `6af2c4abd3b1b2cb5aff77fd0d3d4bd9a48230f9`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
- Highest prior slice was 570; S571 is unique. Start board revision 3397; G04-V03 remains In Progress.
- The hash-pinned accepted analyzer report was read and its five over-gate results were reconciled against source/generated hashes. No source/test code changed, so changed-code coverage and the full repository gate are not due.
- Exit board evidence/comment are preflighted and replayed through the validated Control Center command layer. `npm run control-center:test` passes 42/42; `git diff --check` passes.
- Elapsed 03:45:19–03:52:20 UTC (7m01s): implementation 0m; focused evidence/source verification 3m10s; external-agent wait 1m31s; maintainer-decision time 0m; durable records, board replay and focused checks 2m20s.

## Next action

Start S572 with one fresh, supported observation of the already-running CLO
session. If the visible UI and accessible state agree, use the approved
C:-confined fixture route for a narrowly scoped pre-export geometry
observation of the five source-mapped Polo CUT corners, then compare it with
the saved gen1/gen2 output. The purpose is to distinguish import-side from
export-side change before proposing any exporter or profile work. Do not repeat
the same import/export cycle unless this observation demonstrates a changed
test condition. If CLO's surfaces still disagree, send no UI input and record
the control limitation; continue independent profile and semantics evidence.
Preserve every V03 gate, legacy behavior, protected identity, and all-seven
scope.
