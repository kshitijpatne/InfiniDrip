# EPIC-17 / G04 V03 — S701 exact return-geometry diagnosis

## Conclusion

The saved S700 file proves two different things. The named-piece change works:
all nine piece names survived CLO, with its `_M` suffix. The round trip itself
does not meet the fixed shape/mark checks. Comparing more encodings or another
CAD program would repeat the same question rather than fix an evidenced source
defect.

### CUT geometry: real return loss, not source serialization

The S700 flat input has exactly the same bytes as S698's flat input
(`f239a72f…fbd`). Source six-decimal rounding was already below the threshold,
and this input preserved it. The saved CLO return reduced the contour
vertices: back 448→341, outer/inner stand 751→413 each, and upper/under collar
763→422 each. Those five resulting contours miss the original at
0.00257650 cm, 0.03292953/0.03292965 cm, and 0.01084325/0.01084324 cm,
respectively, against the unchanged 0.001 cm limit. Front, sleeve and both
plackets pass. SEW paths all pass for this Polo M fixture.

This is a real change between the exact source drawing and receiver return;
it is not a changed source pattern or coordinate-rounding defect. Existing
S635/S636/S640/S672 trials already covered different curve entity and path
density forms without finding a source-side fix. Adding geometry or changing
the threshold to conceal these five misses would falsify the drawing. No such
change is safe or supported by the current evidence.

### Buttonhole points: still absent

The source contains three POINT entities at `(124.791237, 71.290826)`,
`(124.791237, 67.790826)`, and `(124.791237, 64.290826)` cm. The returned
buttonhole-placket block contains no matching POINT, LINE, or circle mark at
those stations. The comparison's nearest geometry is a continuous placket
boundary at `x=126.2912354` cm, exactly 1.4999984 cm to the right; the same
boundary is nearest at all three station heights. This is not a distinctive
buttonhole glyph and cannot identify or replace the three separate marks.
Thus the misses are real; interpreting the midpoint of unrelated continuous
placket edges as each mark would create a false pass. Enabling CLO's curve
point import option did not make these points round-trip.

### V03 and decision

S700's deterministic BLOCK/INSERT writer closes the source-side piece naming
gap, and its version-4 manifest ties names and mark records to the source
revision. It does not fix CLO's five curve losses or the three missing marks.
Its profile remains vendor-specific and unqualified. Other V03 gates—rights
and receiver-profile evidence, all-seven/options/grades, selectable identity,
malformed-input rejection, repeatability, and fully readable output—are not
cleared by a single Polo M exchange. The accepted limits and scope do not
change.

No production change is made in S701: current evidence shows the candidate
writer serialized its exact source geometry; an exporter workaround would
need new evidence and must not distort pattern geometry. No additional CLO
operation, setting/format variation, application installation, or trial was
performed. The shortest valid forward path is now to identify, using existing
records and first-party profile documentation only, whether any already
installed apparel CAD workflow can satisfy the fixed exchange contract. Do
not operate it unless the exact documented profile addresses the known CUT
and mark failures and can clear a distinct gate. If no such installed profile
exists, record that candidate inventory as exhausted; do not relabel a generic
CAD result as industrial compatibility or weaken G04 acceptance.

## Verification and closeout

- Read-only entity parsing used the exact S700 source, return and normalized
  comparison copy under `C:\G04-CAD-Interchange\S700-named-piece-package\`.
- Focused calculations reproduce the three 1.4999984 cm center-to-boundary
  distances and the five stored CUT residuals; no project code changed, so
  changed-code coverage is not applicable.
- `git diff --check` passed. The canonical Control Center suite passed 42/42
  after the validated board closeout.
- No full repository gate ran; reserve it for the settled integrated Epic/PR
  candidate.
- Start: 2026-10-11 00:02:05 UTC from S700 `c05c1a363fb6fe6316cbe3064a36e94e3f416585`;
  refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S700 was highest; S701 is unique.
- Board replay: S701 start revision 4136; exit evidence/comment revisions
  4137–4138. Focused Control Center suite passed 42/42.
- Approximate elapsed time: 2 minutes; implementation 0m; static entity and
  source review 1m; focused verification and board closeout 1m; external wait
  0m; maintainer decision 0m.

V01/V02 remain Done, V03 remains held, EPIC-17 remains In Progress, and the
goal remains active. Cleanup, integrated gates, final output review, PR, safe
merge, ancestry and required production end-to-end verification remain due.
