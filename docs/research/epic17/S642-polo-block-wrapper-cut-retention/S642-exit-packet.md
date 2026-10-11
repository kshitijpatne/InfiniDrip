# EPIC-17 / G04 V03 — Polo named-block import trial — Slice 642 exit

## Result

The source-exact named `BLOCK` / identity `INSERT` wrapper preserved Polo's
nine piece-role identities in CLO, but it did **not** preserve all five short
CUT outlines that failed in previous flat-entity imports. The pre-export gate
therefore failed and S642 stopped before export. This is a distinct, bounded
negative result: piece grouping fixed identity mapping, not the shallow CUT
geometry. It clears no V03 criterion and authorizes no source repair, altered
encoding, acceptance change, or compatibility claim.

CLO 2026.1.310 imported nine patterns with names exactly matching the nine
source block roles. A read-only native API query returned no errors. The
source-bound comparison checked all nine source CUT and nine SEW contours at
the unchanged `0.001 cm` threshold:

| Result | Contours |
| --- | --- |
| Pass | 13/18 total: all 9 SEW, plus CUT for front, sleeve, button placket, and buttonhole placket |
| Fail | 5/9 CUT: back, both collar stands, and both pointed collars |

The back still has 33 native points but its closest cyclic CUT match differs
by `22.360652 mm` (`2.236065 cm`). Each collar stand has 58 native points for a
54-point source CUT contour, so the exact-count comparison fails. Each pointed
collar has 44 points but its closest cyclic match differs by `93.108496 mm`
(`9.310850 cm`). These are measured on the imported project before export;
the analyzer allows no alignment, geometry repair, or threshold relaxation.
S640's flat Standard-DXF trial had the same five-piece failure set and
substantially matching errors. S642 adds evidence that named grouping does
not resolve that failure in DXF-AAMA.

The actual CLO 2D overview shows nine imported patterns without obvious gross
fragmentation at overview scale. The numerical contour failure prevents the
authorized export/reimport step; no output readability or round-trip claim is
made. All existing V03 holds, seven-recipe scope, gates, rights/profile caveat,
legacy DXF behavior, and protected export identities remain unchanged. V01
and V02 remain Done; V03 and EPIC-17 remain In Progress. There is no physical
fit, factory acceptance, or production-readiness claim.

## Inputs and retained evidence

Every S642 exchange artifact, project, query, and capture is under
`C:\G04-CLO-DXF-Exchange\S642-polo-block-wrapper-cut-retention\`.

| Artifact | Bytes | SHA-256 | Evidence |
| --- | ---: | --- | --- |
| Pinned S617 Polo M source | 24,326 | `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5` | source hash and current `exportDxf` byte-body equivalence |
| S642 named-block candidate | 25,911 | `3632740C8AB672915424D66E2FED996154B457DBA78F02BF05359BDDE3F86CC0` | nine named identity wrappers; expansion returns all 56 source entities in source order and exact payload |
| Wrapper preflight | 2,606 | `925B034BAC110706CB2BA878EACC145DD95829C60F691799789356F9F018A211` | 9 BLOCKs / 9 INSERTs; identity transforms; entity inventory preserved |
| Saved CLO native project | 2,345,516 | `57E2EF77A62D970E590C8D3971A89234B921315BD6711AEA4D724DF286388E64` | actual import, DXF-AAMA, cm, 100%, no rotation |
| Native API query | 846,799 | `E3865C76DA12E6FD30F0A5BB166F667B09581A06D75A6811F7B174474006EA5C` | 9 source-role names, 9 patterns, no API errors |
| Native contour comparison | 18,561 | `8337BF764354060036739E1BB48928CC9AA3BB19182EFAC1405FE073CE1AE37E` | source-bound CUT/SEW comparison, `13/18`, fail-closed pre-export verdict |
| CLO import overview | 108,241 | `C44724B2CE736B13ED670D3F20C9775E996C6D40C27E5A19322DBD314F6341F2` | actual saved CLO 2D scene with all nine patterns |
| Native query script | 2,156 | `41125582AAE0E0651D3D7F998DB34C958E6DDEB45D0DB54B067F2CECB6709C12` | read-only `pattern_api` getters; writes only the local JSON result |

The detailed per-contour results are in
`C:\G04-CLO-DXF-Exchange\S642-polo-block-wrapper-cut-retention\Evidence\native-contour-comparison.json`.
The import overview is
`C:\G04-CLO-DXF-Exchange\S642-polo-block-wrapper-cut-retention\Evidence\CLO-import-overview.jpg`.
The CLO application remains open with the saved S642 import project.

## Gate disposition

| Gate | S642 disposition |
| --- | --- |
| Source/candidate preflight | Pass: only BLOCK/INSERT grouping changed; internal source entity payload/order and all non-entity sections are preserved |
| Piece identity | Pass for one M/default Polo fixture: 9/9 native pattern names match the source role names exactly |
| CUT geometry before export | **Fail:** 4/9 pass and 5/9 fail `0.001 cm` |
| SEW geometry before export | Pass: 9/9 in this fixture |
| Rendered overview | Pass for nine-piece presence and no obvious gross fragmentation only; not a detailed readability or reimport review |
| Export / reimport | Not attempted by the fail-closed procedure |
| Marks, grades/options, malformed input, repeated round trip, industrial profile/rights, seven-recipe coverage | Still open; this experiment cannot satisfy them |

## Verification and durable closeout

- Started `2026-10-09 22:29:57 UTC` from clean S641
  `f0386ce665e1b2dabe8e27a1764500e529ecc370`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor. The start
  packet and validated board replay reserve S642 at revision `3710→3712`.
- `create-polo-block-wrapper.mjs` source regeneration and fixture preflight
  pass. `node --check` passes for `analyze-native-import.mjs`; the native
  analyzer verifies source, candidate, project and query hashes, piece-name
  bijection, and all 18 contour results at the unchanged threshold.
- The saved rendered overview was inspected. The five CUT failures prevented
  export, so no unqualified downstream output was produced.
- `node --check` passed for the wrapper generator, native analyzer and exit
  replay. The analyzer confirmed the pinned source/candidate/project/query
  hashes, 9/9 named identities, and all 18 contour comparisons. `npm run
  control-center:test` passed **42/42**. The validated exit replay advanced
  board revision `3712→3714` with G04-V01/V02 Done and G04-V03/EPIC-17 In
  Progress. `git diff --check` passed (Git reported only its usual LF-to-CRLF
  working-copy notices). No production source or tests changed;
  changed-production-code coverage is not applicable. The full repository
  coverage/build gate remains reserved for the settled integrated Epic/PR
  candidate.
- Elapsed: approximately 16 minutes from `22:29:57` to the durable S642
  boundary. Split: implementation/tooling and CLO evidence 9 minutes; focused
  verification and rendered/data review 3 minutes; packet/state/board and
  repository closeout 4 minutes; external-agent wait 0 minutes;
  maintainer-decision time 0 minutes.
- Refreshed branch history and origin ancestry, verified S641 was the highest
  prior slice and S642 is unique. The canonical exit evidence/comment use the
  validated Control Center command layer; G04 statuses remain unchanged.
- One commit is reserved for the verified S642 result, with subject
  `Slice 642: test Polo named-block cut retention`; its exact ID is verified
  from branch history at the next boundary.

## Next action

Carry the S642 result into the current V03 gate matrix and select the next
distinct, still-unresolved acceptance gate using existing evidence. Do not
repeat flat-versus-block grouping, CLO profile/setting, or previously tested
entity-encoding permutations. If no in-scope receiver/evidence route remains,
consolidate the exact residual gates and required maintainer decision; do not
weaken V03 or call generic DXF interchange industrial compatibility.
