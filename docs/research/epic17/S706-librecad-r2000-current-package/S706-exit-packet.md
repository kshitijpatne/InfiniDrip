# EPIC-17 / G04 V03 — S706 LibreCAD R2000 current-package result

## Result

S706 ran exactly the hash-pinned S705 Polo M candidate through the already
installed LibreCAD 2.2.1.5 **Save As → Drawing Exchange DXF 2000** route, then
closed and reopened the saved output from its C: path. LibreCAD displayed the
returned nine-piece pattern without a warning. No source code, pattern
geometry, threshold, or acceptance criterion changed.

This round trip gives useful, specific positive evidence: all nine named
piece/revision identities were recovered; all 18 CUT/SEW outlines matched
with 0.000 cm XY residual under a symmetric vertex-to-segment comparison;
the returned outlines remained closed and had no nonzero bulges; all 111
typed marks matched their expected types, layers, and coordinates within
0.001 cm; and `$INSUNITS=5` remained present. The three candidate buttonhole
crosses are present in the returned file and the reopened drawing is visibly
rendered.

It also found a concrete failure in this exact route: every source semantic
layer was retained except `CUT`; the reopened output contains layer `0` in its
place. This is a receiver-side change observed by comparing the hash-pinned
input and saved output. It means this route does not preserve the admitted
semantic-layer contract for this current package. It is not evidence that the
source omitted `CUT`, and it does not justify disguising the loss by changing
the expected layer in product code.

LibreCAD is generic CAD, not an industrial apparel-CAD profile. This one-file
success on geometry, marks, identity, and units therefore cannot qualify the
route for G04 V03, and the semantic CUT-layer failure independently stops this
route. Do not repeat LibreCAD R2000 for this package or try a different format
or setting. CLO's separately recorded DXF-ASTM return still fails measured
CUT contours and point marks (S703); GMS/DGS and OpenCAD remain retired based
on their recorded failures. No existing receiver has passed the full admitted
V03 profile and round-trip acceptance.

## S706 gate ledger

| Gate | S706 result | Evidence / remaining proof |
|---|---|---|
| Rights/local handling | Passed for this bounded local test | Maintainer-confirmed evaluation permission; input, output, report, and render are on C: under named purpose folders. |
| Piece/revision identity | Passed for this one Polo M file | All 9 source block names and inserts matched the 9 returned named blocks. Other recipes/options/grades remain unproven. |
| CUT/SEW geometry | Passed for this one Polo M file | 18/18 paths; symmetric XY residual 0.000 cm; all closed; no nonzero bulges. All-seven/options/grades remain unproven. |
| Units | Passed for this one file | Source and returned headers both declare `$INSUNITS=5` (cm). |
| Typed marks | Passed for this one Polo M file | 111/111 marks match entity type, semantic mark layer, and coordinates within 0.001 cm; includes all candidate buttonhole crosses. Other recipes/options/grades remain unproven. |
| Semantic layer preservation | **Failed** | `CUT` is absent from the returned block entities/layer table and replaced by `0`; other listed semantic layers remain. |
| Clean reopen/render | Passed, limited | Exact output was reopened in LibreCAD with no warning and the nine-piece drawing was visible. See the C:-only screenshot. This is not the full readability matrix. |
| Industrial apparel profile | **Not qualified** | LibreCAD 2.2.1.5 / Drawing Exchange DXF 2000 is an empirical generic-CAD route; no ANSI/AAMA/ASTM claim. |
| All seven recipes, supported options, grades | Unproven | S706 covers Polo M only. |
| Malformed-input rejection | Unproven | No malformed files were submitted in this bounded valid-file test. |
| Repeatability | Unproven | One save/reopen only. |
| Full returned-output readability | Unproven | One visible Polo M result only; no complete option/grade output review. |
| Protected legacy export identities | Preserved so far; final integrated gate pending | S706 changed no source. Re-run the protected export suite on the settled candidate before merge. |

### Exact files and hashes

- Source DXF: `C:\G04-CAD-Interchange\S705-candidate-buttonhole-cross\polo-m-buttonhole-cross.dxf`; SHA-256 `28D28E48BFF0C2B1638684D93C7BA58754AF202EF7494495F3A99C813AE1DD6C`.
- Returned DXF: `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\polo-m-roundtrip-r2000.dxf`; SHA-256 `FC9A332DFEC3C2D9095509F3100003B1EC77532F02D1FBDA16F02C51CA5D8EFF`.
- Independent parser comparison: `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\S706-r2000-analysis.json`.
- Reopened whole-view capture: `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\Evidence\reopened-whole-view.png`.
- No CAD files, generated images, or ad hoc diagnostic scripts from this pilot are stored in the repository.

## Scope and next action

G04 V03 remains unaccepted and EPIC-17 remains In Progress. All-seven recipe
coverage, supported option/grade exchange, malformed-input rejection,
repeatability, readable output, qualifying receiver/profile, full gates, final
diff cleanup, PR, safe merge, refreshed `origin/main` ancestry, required
deployment, and production end-to-end verification remain due. No physical fit
or factory acceptance is claimed.

The next step is a single source-side audit of the existing candidate writer
against the already-recorded CLO DXF-ASTM and LibreCAD returns. It must decide
from those exact entity differences whether a bounded writer change can
preserve both curve precision and the `CUT` role through an existing route.
It must not start another application/format/setting trial. Implement only if
the DXF source semantics and prior output evidence support a specific change;
otherwise record why no current installed route can satisfy the profile gate
and identify the smallest concrete remedy. V03 acceptance and its thresholds
remain unchanged.

## Verification and timing ledger

- Implementation/source changes: none; this was a bounded receiver check.
- Receiver interaction, independent parsing, and rendered review: about 12
  minutes; no external-agent wait or maintainer decision time.
- Focused closeout verification: `npm run control-center:test` passed 42/42;
  `git diff --check` passed. No production code changed, so changed-code
  coverage is not applicable. Full repository coverage remains reserved for
  the settled Epic candidate.
- Start: 2026-10-11 00:48 UTC at S705 commit `d0dfa6da306766d05bce6333c8d1fb5f7602d742`.
- Exit: 2026-10-11 00:59 UTC, after receiver review and validated board replay;
  focused closeout checks are being run now.
- Start board revision 4151; S706 start evidence replay advanced it to 4152.
  S706 exit evidence/comment are replayed through the validated command layer
  below. The unique landed subject is `Slice 706: record LibreCAD R2000 package result`.
