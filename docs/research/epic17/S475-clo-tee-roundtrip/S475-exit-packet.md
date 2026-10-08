# EPIC-17 / G04 V03 local CLO Tee trial — Slice 475 exit

## Result

S475 completes a local import → native save/reopen → DXF-ASTM export →
matching DXF-ASTM reimport trial in CLO `2026.1.310 (r58944)` using the
hash-identified S463 standard-M Tee. The maintainer's C-drive restriction was
followed: source copy, native `.zprj`, receiver DXF, screenshots, and numeric
analysis all remain in `C:\G04-CLO-DXF-Exchange`. The repository holds only the
runbook correction, parser, packets, settings/measurements, and file hashes.
No receiver output or screenshot was copied into the repository.

### Geometry and behavior

- Input: 6,750 bytes, SHA-256
  `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`, still
  identical to the S463 fixture and S474 oracle.
- CLO exported 67,176 bytes, SHA-256
  `3cdc91123c55d1548c890117f1ed301f151814df1418ba68571a58824ff49dc0`.
  The DXF declares `AC1009` and has no units variable. Centimeters, 100% scale,
  and no rotation were observed in the CLO import/export dialogs; centimeters
  therefore remain an explicit exchange instruction, not embedded file
  metadata.
- The output has three unrotated, unit-scale block inserts at the origin
  (`0_M`, `1_M`, `2_M`) associated by coordinate extents and order with the
  source front, back, and sleeve. It contains 24 closed `POLYLINE` entities,
  760 output vertices, and nine model-space text records in addition to the
  three inserts. Each piece block contains eight closed polylines.
- All six expected source contours match same-piece output contours with the
  same vertex count and cyclic ordering, allowing either traversal direction.
  The maximum best-match per-coordinate delta is
  `0.0000160001 cm`, below C04's unchanged `0.001 cm` gate. Per-outline detail
  and complete DXF section/layer counts are in
  `C:\G04-CLO-DXF-Exchange\Evidence\roundtrip-analysis.json`.
- The export contains coincident representations: each source CUT outline
  matches six closed output polylines across numeric layers (`1`, `84`, `14`,
  `87`, `8`, `85`), while each source SEW outline matches two (`8`, `85`).
  Numeric layers alone do not uniquely carry the
  source CUT/SEW distinction in this sample. The ASTM reimport visually shows
  three separate pieces with outer and inner contours; coincident output
  duplicates do not appear as additional visible strokes. CLO presented its
  seam-allowance notice and imported those shapes in Custom mode. The source
  import, native reopen, export, and reimport were visually inspected; details
  and captures are listed below. This one trial records observed CLO behavior;
  it does not establish a product-independent numeric-layer interpretation or
  full semantic fidelity.

## Captures and C: file inventory

All items below are inside `C:\G04-CLO-DXF-Exchange`; hashes are SHA-256.

| File | Bytes | SHA-256 |
|---|---:|---|
| `Input\tee-standard-m.dxf` | 6,750 | `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9` |
| `Output\tee-standard-m-clo.zprj` | 2,233,733 | `31dd733a3ca89ad23253474021e13bc9bf4806501c487e5b402786fe80b75803` |
| `Output\tee-standard-m-clo-export.dxf` | 67,176 | `3cdc91123c55d1548c890117f1ed301f151814df1418ba68571a58824ff49dc0` |
| `Evidence\imported-pattern.jpg` | 103,294 | `c51441e9d27101a9044f1552f282c3701bd1347a1d88b149094b3a1eaa3bcff5` |
| `Evidence\native-project-open.jpg` | 103,697 | `bf45b51cb8e74e8002968159cb8189d346711ad639867bfd323cb2fcff0d185a` |
| `Evidence\native-project-reopened.jpg` | 103,914 | `f58e74b92be1ffb19abf0d8f53e552cbbb2b4da7de06c2242a3f6606c57c83d1` |
| `Evidence\export-profile-before-confirm.jpg` | 114,489 | `2cc2dbd85b6275443770affbac28c3314242389fa2715e26010f19d786d9d596` |
| `Evidence\export-completed-pattern.jpg` | 103,875 | `500fc39f74128b5f88cde4c613d08c5a8a0a3e523b9a214d5ef662e219f09598` |
| `Evidence\reimport-profile-before-confirm.jpg` | 115,578 | `93bb3ccbe97af77c6d1e16739cafb5857ebb677c35b34de309516527b7c9a52a` |
| `Evidence\reimport-seam-allowance-information.jpg` | 115,032 | `662e497d47ff937b6882941281327760520e6ebaffdab16b9703eb978b8eb8cc` |
| `Evidence\reimported-output-pattern.jpg` | 103,810 | `a6299d92865b9f0349ed3569fd3a1056127ec02115b49e7c1b101b2874ec680b` |
| `Evidence\roundtrip-analysis.json` | 15,719 | `fca0ddd2a38a37fd45509061c8935a52a378b8b386fea30763dca0b1511557d7` |

## Gate disposition

- **Passed for this fixture:** input identity, import/native reopen/export/
  reimport, three-piece layout, closed contour presence, all six source
  geometries within C04's coordinate threshold, and visual reimport check.
- **Still open for G04 V03:** the receiver/profile rights and scope review;
  semantic meaning and deduplication of coincident numeric-layer curves;
  representative Polo/Woven and graded-size fixtures; all applicable marks,
  options, and round-trip behavior; and the roadmap's other V03 exit evidence.
  No ASTM conformance or general CLO compatibility is claimed.
- **Unchanged:** V01/V02 Done; G04 V03 and EPIC-17 In Progress; all-seven V02
  acceptance, protected export byte identities, generic/legacy DXF behavior,
  and all V03 rights/round-trip gates. No source geometry, production code,
  test baseline, or export baseline changed. No physical fit, factory
  acceptance, or production-readiness claim is made.

## Verification and timing

- Focused analysis script `inspect-dxf.mjs` re-reads the actual C: input and
  output, checks byte identity, parses every DXF group pair and closed outline,
  performs cyclic point correspondence without resampling or coordinate
  normalization, and fails if any source outline exceeds 0.001 cm. Result:
  six of six pass; max delta `0.0000160001 cm`.
- Actual CLO input, native reopen, export configuration, and ASTM reimport
  views were inspected. CLO's notice about seam allowances in Custom mode was
  captured and retained; no import or export error dialog appeared.
- Start board revision 2927 advanced to 2931 with validated command replay;
  exit replay advances it to 2935 with this packet linked to G04-V03 and
  EPIC-17. EPIC-17 and V03 stay In Progress.
- Start commit: `d34f6f32dd75b5043ca52faf6414273e54f36d86`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor;
  S474 was highest when S475 was reserved. No concurrent branch history
  changed during this packet.
- Timing, 06:07:20–06:19:31 UTC to completed output review (12m11s): CLO
  interaction and evidence creation 7m13s through the retrospectively written
  start packet; focused parsing/coordinate verification 3m30s; rendered review
  and reconciliation 1m28s. Durable packet/state/board closeout is recorded
  from 06:19:31–06:22:11 UTC (2m40s, including the focused 42-test Control
  Center gate, board preflight/replay, and final diff review). External-agent wait 0m;
  maintainer-decision time 0m. The start packet discloses that initial
  receiver operations began before that packet was written; no time is
  backdated as contemporaneous documentation.

## Next action

Reserve S476 after confirming S475 is the unique latest slice. Continue the V03
receiver/profile evidence by documenting the duplicate-layer semantics and
reviewing rights for the exact free-trial use, then run the next bounded
representative fixture in the same C: folder. Keep output analyses and files
in `C:\G04-CLO-DXF-Exchange`; do not infer Polo/Woven or grade support from the
Tee result.
