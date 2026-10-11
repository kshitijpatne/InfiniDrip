# EPIC-17 / G04 V03 — CLO native button DXF probe — Slice 639 exit

## Outcome

S639 completed its one controlled CLO-native Button/Buttonhole export and
clean-reimport probe on a disposable Woven project copy. The test answered a
distinct question raised by CLO's native button and buttonhole tools: whether
those objects export as source-faithful technical marks. **They do not in this
fixture.** CLO exported a native button as a closed 24-vertex polygon with an
approximately 1.0 cm radius, rather than the source `MARK_BUTTON` circle of
0.15 cm radius. It exported the native buttonhole as a roughly 2.3 cm by
0.6 cm slot rather than the source `MARK_BUTTONHOLE` point. Both exported
object centers are displaced about 0.07616 cm (0.7616 mm) in Y from the
source-mark coordinates. The displacement is about 76 times the unchanged
0.001 cm geometry limit. These are empirical observations of CLO 2026.1.310
DXF-AAMA output; no ANSI/AAMA or ASTM conformance is claimed.

The clean import of the emitted DXF completed in a blank CLO project with 12
pieces and no DXF import error. CLO displayed its ordinary informational
message that imported seam allowances are preserved in Custom mode. The
current live 2D window is zoomed into cropped pattern pieces. Although an
overview and pre-export feature screenshot exist, no saved, detailed 1:1
reimport render is available; reimport readability therefore remains
**unverified**, not passed. This does not change the file-level negative result.

S639 clears no V03 gate, qualifies no profile, accepts no geometry or mark,
and changes no threshold, hold, status, production code, source pattern, or
stitch graph. Close this specific native-trim hypothesis; do not repeat it or
cycle CLO export settings. Keep all G04/V03 acceptance unchanged.

## Exact inputs and retained artifacts

The source DXF is the S637 fixture, SHA-256
`DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6`.
The source map was established in the S629 analyzer for that same source:

| Piece role | Source entity | Source geometry | Native CLO object |
| --- | --- | --- | --- |
| `IDR_WOVEN_WOVEN_BUTTON_PLACKET` | entity 5, `MARK_BUTTON` | circle center `(227.476, 67.877)` cm; radius `0.15` cm | button placed at the corresponding visible source station |
| `IDR_WOVEN_WOVEN_BUTTONHOLE_PLACKET` | entity 5, `MARK_BUTTONHOLE` | point `(236.476, 67.877)` cm | buttonhole placed at the corresponding visible source station |

All CLO and exchange files are retained only at
`C:\G04-CLO-DXF-Exchange\S639-clo-native-button-dxf-probe\`:

| Artifact | Bytes | SHA-256 | Disposition |
| --- | ---: | --- | --- |
| `S639-woven-native-button-probe.zprj` | 2,314,885 | `723F6CDDEC96172CFD322E496D937820A84893B866CA1ED164F738099880D698` | pristine copied project before feature additions |
| `S639-woven-native-button-probe-actual.zprj` | 3,091,165 | `CA31EE19843FD2FFB0FDEC3E2DE66DC71E5BF5B830988E4033C70130543AE5C2` | disposable CLO project after native Button/Buttonhole placement and save |
| `S639-woven-native-button-dxf-export.dxf` | 96,438 | `5698277E3D314E831ADA272530C83E60FEFDE69FBA8C9C85A69C429A1A5CCCF8` | actual CLO DXF-AAMA export; native feature geometry inspected in its named pattern blocks |
| `S639-native-features-before-export.png` | 125,728 | `D6C8E9740341611EF851372CC286A32BA74ACF1707456E2CBDFD15851692282E` | retained live screenshot showing the placed native features before export |

Two additional `.zprj` files in the C: folder are retained as intermediate UI
copies, not used for the export or measured result: `...-open-ui.zprj`
(2,315,536 bytes; SHA-256
`CCAA674B8961BDF14DAA1B4619A137173E81E9CA7BE63C9C0B71F60E11B86CAE`) and
`...-calibration.zprj` (2,640,586 bytes; SHA-256
`F350A4EE4D9D4776C3322D1C80D98A632624486676F0C3D193A25C41B47B173B`). The
calibration project was excluded; its objects did not enter the actual
project or export.

## Procedure and observations

- CLO 2026.1.310 (r58944) was already open. The source project was preserved
  and copied under the S639 C: folder before editing. No application relaunch
  or close occurred.
- One native CLO button and one native CLO buttonhole were placed on the
  matching placket pieces in the disposable project. The resulting project
  was saved before export.
- One export used the documented `DXF-AAMA` menu option, centimeters, 100%
  scale, and no rotation. The resulting DXF was parsed by named pattern
  blocks. In `BUTTON_PLACKET_M`, the button geometry is a closed polygon
  approximating a circle of 1.0 cm radius, centered approximately at
  `(227.475983, 67.953163)` cm. In `BUTTONHOLE_PLACKET_M`, the native
  buttonhole is slot-like geometry spanning approximately X `235.325989`
  through `237.625977` cm and Y `67.653152` through `68.253159` cm, centered
  approximately at `(236.475983, 67.953156)` cm. The button and buttonhole
  center Y residuals against the exact source target are respectively
  `+0.076163 cm` and `+0.076156 cm`.
- The output DXF was imported once into a blank CLO project with DXF-AAMA,
  centimeters, 100% scale and no rotation. CLO reported 12 imported pieces
  and no import error. The imported content remains in the current open CLO
  session. The live window shows cropped pieces because the view is zoomed;
  detailed, readable 1:1 reimport rendering was not captured.
- This is a controlled observed difference between technical source-mark
  entities and CLO-native trim objects. It does not establish that every CLO
  mode behaves identically, nor does it identify a source encoding that
  preserves these mark semantics.

## Gate disposition

| Gate | S639 result |
| --- | --- |
| Receiver/profile rights and conformance | unchanged; CLO DXF-AAMA remains a vendor-specific empirical target only |
| Units/coordinates | export selected centimeters at 100%; broader profile contract remains open |
| CUT/SEW source geometry | not requalified by this mark-only probe; existing Polo losses remain open |
| Seven recipes/options/grades and stable identities | untested by this single Woven size-M probe; remain open |
| Manufacturing marks/layers | **failed for these two mapped marks**: native trim geometry and position do not match source-mark representation |
| Malformed/invalid inputs | untested; remains open |
| Repeated exchange | untested; remains open |
| Readable reimport rendering | incomplete; current view is cropped, so remains open |
| Legacy DXF and protected identities | no production writer or baselines changed; final integrated gate still required |
| V02 prerequisite | remains Done for all seven recipes; no V02 acceptance changed |

## Verification and boundary

- Start: `2026-10-09 21:06 UTC`, clean S638 commit
  `5ce4942845899d8d8dac23c36925fb6bfda3fd14`. Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S638 was
  highest and S639 was the unique reservation. The current branch and board
  still preserve V01/V02 Done and V03/EPIC-17 In Progress.
- At the normal verified boundary (`2026-10-09 21:50 UTC`), the durable goal
  was re-read. Its status is `active`, and its objective still matches the
  admitted EPIC-17 scope through V03, final gates and safe merge. The goal
  remains needed and unchanged.
- Focused evidence checks: source target against S629's same-source report;
  actual export hash and native geometry parsed from its named pattern blocks;
  disposable project/output hashes; CLO import count and error state; current
  CLO version/window. The Computer Use helper timed out twice, recovered after
  a kernel reset, and a fresh observation then confirmed the existing CLO
  window and current imported project. No further UI action was taken.
- `npm run control-center:test` and `git diff --check` are the focused
  repository checks for this documentation/board slice. No production code
  changed; changed-production-code coverage does not apply. Full repository
  tests/100% coverage, build, browser and integrated output gates remain for
  the settled Epic/PR candidate.
- Time ledger (approximate): native CLO UI/project/export work 32 minutes
  (21:06–21:38 UTC); file/hash/render and focused repository verification
  16 minutes (21:38–21:54 UTC); external-agent wait 0; maintainer-decision
  time 0. No external agent was delegated this coupled live-UI experiment.
- Board replay: start `3696→3698`; an earlier UI-stop note advanced the board
  to `3699`; validated exit `3699→3701`. The exit adds verified evidence and a
  factual comment only, preserving all G04 statuses, criteria, thresholds and
  holds.

## Next action

Stop using native CLO Button/Buttonhole trims as a candidate representation
for technical `MARK_BUTTON` / `MARK_BUTTONHOLE` entities. Continue from the
current V03 gate matrix and select a new, non-repeating hypothesis only where
it can address a known failed acceptance gate with source-bound evidence.
Keep CLO open in its existing session while G04 work remains active; do not
claim physical fit, factory acceptance or production readiness.
