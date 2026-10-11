# EPIC-17 / G04 V03 — CLO native-stage isolation — Slice 518 exit

## Goal and decision

S518 tested one specific question: did CLO already remove the five measured
Polo M CUT vertices in its imported/native workspace, or only during DXF
export? The experiment reused the existing CLO 2026.1.310 session and the
same hash-pinned AAMA source used in S516. It stopped at the native-project
inspection boundary because the saved project did not expose exact contour
records to the available safe parser. No second DXF cycle or format matrix
was run.

## Practical result

- Source fixture:
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Input\polo-standard-m.dxf`
  — 24,261 bytes, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- CLO stayed open in the existing 2026.1.310 (r58944) window; it was not
  closed or relaunched. The visible import options were DXF-AAMA, centimeters,
  100%, Do Not Rotate, Maintain Original grain, Import Notch to Both with
  Ratio placement; other import options were unchecked. CLO imported and
  displayed the nine pieces. Its seam-allowance/Custom-mode notice was
  informational; no format error appeared.
- Before any export, CLO saved
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Projects\polo-aama-pre-export.zprj`
  — 2,335,872 bytes, SHA-256
  `2ca9169c472ec8201ddd43284b4ff5a900a740ecfeb21c5009b08a51ff896547`.
  The pre-export imported-pattern view is
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Evidence\01-imported-pattern-native-project.jpg`.
- The reproducible parser is
  `inspect-clo-native-project.mjs`; its C:-confined report is
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Evidence\Analysis\s518-native-project-inspection.json`.
  It verifies the source hash and native-project embedded archive structure,
  decompresses supported ZIP members, and checks sizes and CRCs. The project
  has a CLO-prefixed header and an embedded 15-entry ZIP index. Nested
  `.zpac`, `.vmp`, `.vlp`, and `.vrp` archives were indexed. The primary
  garment `.pac` payload is 3,815,032 bytes of proprietary binary data. The
  safe parser found no directly usable contour records. The five known source
  coordinate values were absent as ASCII/UTF-16 and little-endian float32/
  float64 signatures in that payload. This bounded search does not prove the
  proprietary payload contains no geometry; it establishes that this local
  analysis cannot measure the saved outlines without a decoder.
- Therefore S518 does **not** attribute the S516 point loss to import or
  export. No DXF export was run: without pre-export measurements it would
  repeat a combined transform already shown to fail and could not resolve the
  question. The native save and import operation succeeded, but the strict
  geometry-fidelity gate remains failed for the tested CLO AAMA round trip.

## Verification and gates

- Native archive inspector replay: passed; all outer/nested archive entries
  decompressed and passed size/CRC checks. Report hash-bound source and saved
  project.
- Rendered evidence reviewed: all nine imported pieces are visible in CLO;
  this confirms render/import operation only, not exact geometry fidelity.
- `npm run control-center:test`: 42/42 passed.
- Start board replay `3183→3185`; exit board replay `3185→3187` through the
  validated Control Center command layer. `preflight-exit.mjs` and
  `git diff --check` pass. EPIC-17 and G04-V03 remain In Progress; V01/V02
  remain Done.
- No production code, source pattern, sewing graph, acceptance threshold,
  protected export identity, format claim, rights decision, or V03 gate
  changed. No full repository coverage/build gate applies to this
  evidence-only diagnostic.
- CLO is left open and idle for the ongoing Epic, per maintainer direction.
  All DXF, native-project, screenshot, and analysis files are within the
  named S518 folder on C:.

## Remaining V03 work and next action

S516/S517 establish that the CLO AAMA round trip fails the 0.001 cm cut
outline gate at five vertices; S518 cannot isolate which CLO stage changes
them. Do not rerun this Polo fixture in CLO without a new mechanism that
provides exact pre-export contour measurements or a specific evidence-backed
profile change. V03 still needs a rights-reviewed industrial receiver/profile,
representative fixtures, exact round-trip evidence, grading/marks/layers and
all-seven recipe coverage. The next slice should focus on identifying and
qualifying a receiver/profile from primary rights and capability evidence,
and on a concrete geometry-preserving alternative; it should not repeat the
same CLO import/export trial or claim exact compatibility from the successful
UI operation alone.

## Slice closeout

Started `2026-10-08 18:23:45 UTC` from S517 commit
`28f55942fc0315167e6ab5ea37441e74b3723776` on `codex/epic-17-g04`;
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
S518 is the next unique slice after S517. Total elapsed was about 13m18s:
UI import/native save and evidence `~6m`; container inspection and focused
analysis `~3m`; durable packet/state/board verification and closeout `~4m18s`;
external-agent waits `0m`; maintainer-decision time `0m`. Primary usage at
closeout was 61%; ordinary usage remained available.

No safe independent ownership split existed for this single native-project
inspection. Codex retained ownership. Next action: reserve a fresh slice after
refreshing branch/ref and board state, then qualify a concrete receiver/profile
candidate against rights and exchange evidence before any further CLO fixture
work.
