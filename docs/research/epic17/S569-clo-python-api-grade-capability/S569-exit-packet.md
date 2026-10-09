# EPIC-17 / G04 V03 — CLO Python API grading capability screen — Slice 569 exit

- Closed: 2026-10-09 03:33:24 UTC.
- Started from clean S568 `f0e1254` on `codex/epic-17-g04`; refreshed
  `origin/main` `a5af5e1` was an ancestor. Highest assigned slice was 568;
  S569 is unique. Start board revision 3389, start commands 3389→3391.
- CLO 2026.1.310 remains open. No click, key, script, project edit, import,
  export, or C: file operation was performed.

## Findings

1. **Built-in Python entry point is documented, but exact-build behavior is
   unverified.** CLO's official Python API page describes running Python
   scripts inside CLO. Its Help Center's “How to use Python Script in CLO?”
   page (updated May 28, 2026) describes the editor and opening/running a saved
   script. The current visible `CLO 2026.1.310` UI also shows the script-file
   entry. These establish a documented scripting surface, not that the
   published API methods are implemented compatibly in installed build
   `.310`.
2. **The published grading setter is explicitly for pattern-outline points.**
   `SetPatternPointsGradingPositionOffsets` and its getter address outline
   points returned by `GetPatternOutlinePoints`; the docs exclude curve control
   points. `GetPatternInternalShapePoints` reads internal-shape points, but no
   public setter for internal-shape-point grading is documented in the API
   index. A targeted search for such a setter found no entry. This is a limit
   of the public documentation, not proof that no undocumented capability
   exists in CLO's installed binary.
3. **A nearby baseline API does not establish a safe substitute.**
   `TraceBaselineAsInternalShape` creates an internal shape from a baseline and
   says the result inherits that baseline's per-size grading. It does not
   document grading an already-existing internal sew path, nor prove the
   S566 base-shaped candidate is a baseline. Applying it without confirming
   object identity would change the experiment and could misrepresent the
   source path.
4. **The SDK version still does not match.** The official downloads page lists
   SDK 11.0.0 for CLO 2026.1.224; the installed product is 2026.1.310. S515
   already established that the public DXF export-format integer is unmapped
   and a path-only export call opens the dialog. No mismatched SDK was
   downloaded, installed, or run.
5. **The desktop surface still disagrees.** A new screenshot-backed capture of
   the unique returned CLO window shows the workspace and a waistband on the
   2D canvas, with no visible Export DXF dialog. Its accessibility tree still
   reports that child dialog. No input followed. This blocks safe execution of
   a Python/editor or grading action through the current UI surface; it is not
   evidence of a CLO format failure.

## Decision and gate status

The documented Python route is **not a supported, version-qualified way to
grade the specific internal sew path in this installed build**. It cannot
replace the S568 practical test without guessing that the `.224` API matches
`.310`, using a setter for a different geometry class, or changing the
experiment. The next CLO interaction remains conditional on a screenshot and
accessibility view that agree, or on independently verified version-matched
support. Do not repeat a Standard/AAMA/ASTM exchange already in the evidence.

The user-confirmed authorization for product-development trial use and local
DXF processing is settled and is not reopened by this result. CLO's trial
authorization is not a V03 format/rights pass. All existing requirements remain
held: rights-reviewed receiver/profile, seven-recipe coverage, exact geometry
and identity, CUT/SEW semantics, marks/layers, supported options, malformed
input behavior, grading/size fidelity, and round-trip/rendered evidence.
No acceptance, tolerance, legacy behavior, protected export identity, or
compatibility claim changed.

## Verification and next action

- Official sources reviewed: CLO Python API, API List, API/SDK Download,
  API Changelog, and CLO Help Center Python Script instructions. URLs are
  retained below.
- Fresh CLO window capture is an observation only; no app state was changed.
- Start/exit commands use the validated Control Center command layer.
- Focused Control Center test suite and `git diff --check` are required after
  the exit replay. This is documentation/evidence only; no full product gate is
  due.
- Timing: total 2m02s (03:31:22–03:33:24 UTC): official API/build research
  ~50s; live-window observation ~10s; durable records, board and focused
  verification ~62s; external-agent wait 0m; maintainer-decision time 0m.
- Next: continue a distinct, offline V03 evidence item from the existing
  candidate/profile matrix; do not repeat the CLO exchange or API screen. Keep
  the practical grade trial ready for execution only when the live capture is
  trustworthy. CLO remains open until G04 completes.

Sources:

- CLO, [Python API](https://developer.clo3d.com/python.html).
- CLO, [API List](https://developer.clo3d.com/list.html).
- CLO, [API/SDK Download](https://developer.clo3d.com/download.html).
- CLO, [API Changelog](https://developer.clo3d.com/changelog.html).
- CLO Help Center, [How to use Python Script in CLO?](https://support.clo3d.com/hc/en-us/articles/115014409267-How-to-use-Python-Script-in-CLO).

Board start/exit revisions: 3389→3391→3393.
