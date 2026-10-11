# EPIC-17 / G04 V03 — Existing ASTM-labeled output mark audit — Slice 631 exit

## Result

S631 audited the already completed, hash-pinned S617 Standard-DXF import →
CLO DXF-ASTM-labeled export → Standard-DXF reimport. No CLO operation or new
conversion occurred. The result is empirical evidence about this single Polo
M fixture and CLO build, not an ASTM import test or a D6673 conformance claim.

The source has 38 mark entities: 18 `MARK_PLACEMENTPOINT` POINTs, 3
`MARK_CUTLINE` LINEs, 7 `MARK_PLACEMENTLINE` LINEs, 4 `MARK_FOLDLINE` LINEs,
3 `MARK_BUTTON` CIRCLEs, and 3 `MARK_BUTTONHOLE` POINTs. All marks bind to one
source CUT polygon and one of the nine corresponding output blocks; no
nearest-contour fallback was used. The existing source, output, prior contour
report, saved CLO render and native scene all match their S617 SHA-256 pins.

| Source primitive | Exact output comparison at 0.001 cm | Disposition |
|---|---|---|
| 21 POINTs | 12 have one direct output POINT candidate; 6 have multiple candidates; 3 buttonhole POINTs have no distinct output POINT. No output POINT entity is shared between distinct source POINTs. | Geometric proximity is not enough to identify mark role; the six ambiguous cases and three unmatched buttonhole points do not pass semantic preservation. |
| 14 LINEs | 11 have a unique separate output path match. Source entities 5 (front `MARK_CUTLINE`), 46 (upper pointed collar `MARK_PLACEMENTLINE`) and 52 (under pointed collar `MARK_PLACEMENTLINE`) lie exactly on both source CUT and SEW contours. Their close output path candidates are much longer shared contours, not distinct mark segments. | 3 marks cannot be distinguished from coincident outlines. This is an observed shared-path ambiguity, not proof that every CLO route loses line marks. |
| 3 CIRCLEs | Each 0.15 cm-radius button circle has two coincident closed 12-vertex POLYLINE candidates on numeric layers 8 and 85. Radial error is 0.0000121301 cm, but maximum chord sagitta is 0.005112224–0.0051128873 cm. | No whole-circle candidate meets the unchanged 0.001 cm curve gate. The radial fit alone does not pass the full-curve criterion. |

No output mark entity retains a source semantic layer name; observed output
layers are numeric and are not assigned meaning by this audit. The machine
report records each source mark, candidate entity, block, layer, transformed
geometry, residual and disposition. Two complete runs produced identical
report SHA-256 `8FFA8DCBDB72F25173EABFA5C6B63206AD8A014B7FD7CF93EA0A99EEF63E2767`.

## Render review

The saved S617 CLO reimport render was inspected at overview and through four
detail crops generated solely from that saved image. The overview shows the
nine expected gross pieces. The body, sleeve and placket crops show small
dotted/internal marks but do not resolve buttonhole identity or prove that
all marks are readable. The collar crop shows dashed paths close to and
overlapping outlines; the image alone does not establish their manufacturing
meaning. None of the crops upgrades ambiguous or failed geometric matches.

Crop SHA-256 values (all under the named C: evidence folder):

- `body-pieces-detail.png`: `86B4AE9CDA7A69595CB967170A7D68F57C971AF373C0A5A4A1DBF7665739804D`
- `sleeve-detail.png`: `4EEAAA64FF1187E4DEB61CEB36604DD3D2DB5A646FAE3B7D05B988B677F009C8`
- `plackets-detail.png`: `BC4B193AC6747E2E4F82B8C611A79C2E424AB7C159C55C81063EC9DEBB1E1288`
- `collar-pieces-detail.png`: `FFD62860118B6FAD43751998C3137B58D9DA223C9D81EC7732C486E0A44AF748`

The raw report and crops are stored in
`C:\G04-CLO-DXF-Exchange\S631-s617-astm-mark-audit\Evidence\`. The report
SHA is listed above. The reusable analyzer is
`analyze-s617-marks.mjs`.

## Gate disposition and next action

This audit clears no V03 gate. It confirms that the tested ASTM-labeled
output does not meet exact button-circle preservation, does not retain three
buttonhole points as distinct points, has six ambiguous point mappings and
three line marks coincident with CUT/SEW paths, and does not provide
source-named semantic output layers. These findings apply only to this
existing Polo M exchange. Preserve all seven recipes, all applicable
options/grades, exact profile and rights evidence, `0.001 cm` geometry,
piece/revision identity, semantic marks, negative-input rejection, repeated
round trip, rendered readability, and independent receiver gates. V02 stays
Done; V03 and EPIC-17 stay In Progress. Legacy DXF behavior, protected output
byte identities, physical/factory claims and all acceptance criteria remain
unchanged. CLO product-development use and local processing are confirmed in
writing; CLO stays open while the Epic is active.

**Next:** S632 will run one controlled CLO path on the unchanged, hash-pinned
S617 centimeter-header Polo source: import using the documented DXF-ASTM
import mode, export using the same DXF-ASTM mode, then reimport that output in
DXF-ASTM mode. The specific variable from S617 is the import/reimport mode;
hold the existing unit, scale, rotation, grain, grading, curve, notch and
seam-allowance settings fixed where the dialog exposes them. Compare source
CUT/SEW and all 38 source marks against gen1 and the saved gen2 output at the
unchanged `0.001 cm` threshold, and inspect the rendered pieces and mark
detail. This is a practical mode-specific hypothesis prompted by S631's
observed ambiguity; it does not assert that DXF-ASTM is normative or guarantee
a pass. Do not change source geometry, create a mapping, relax acceptance, or
close any hold based on a successful UI operation alone. Save evidence only
under the fresh named S632 C: folder; stop and record a concrete dialog/error
or measured gate failure without retrying alternate settings.

## Verification and time accounting

- Start: `2026-10-09 17:59:27 UTC`, clean S630 commit
  `4b5be3619c3b3398197a03044b6feefa464e962e`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor; board revision
  3664. Start replay: 3664→3666. Slice 630 was highest; S631 was unique.
- Both analyzer runs completed with identical JSON hashes and revalidated
  every pinned S617 artifact. Source mark count was 38; all assignments were
  unambiguous by source CUT containment; all output metrics were finite.
- The four crops were opened and visually inspected. They derive from the
  existing render; no CLO window action or new exchange occurred.
- `node --check`, `npm run control-center:test`, board validation, exit
  preflight/replay/verification, and `git diff --check` are recorded with the
  final result after closeout. No production code changed, so changed-code
  coverage is not applicable. Full repository tests and global 100% coverage
  remain for the settled integrated Epic/PR candidate.
- The first exit-preflight attempt exposed unescaped literal Markdown asterisks
  in its own regular expression. The matcher was corrected and the same
  preflight passed against board revision 3668. Report hashes, source counts,
  status assertions and board validation were not changed to make it pass.
- Time ledger: `17:59:27–18:11:12 UTC` (11m45s elapsed); offline analysis and
  two deterministic report runs about 6m; saved-render inspection about 1m;
  durable packet/state/board closeout about 3m; focused verification and
  diagnosis about 1m45s; external-agent waits 0m; maintainer-decision time 0m.
