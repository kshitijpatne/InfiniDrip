# S683 start — test current source-fixed package in existing CLO route

## Objective

Test whether the exporter fixes already landed in S676–S681 change the measured
CLO outcome. Use exactly one hash-pinned, current S681 Polo default-M package in
the existing CLO 2026.1.310 Standard DXF route. This is a targeted test of the
current product output, not a new software, format, or settings trial.

## Verified start

- Started 2026-10-10 18:27:51 UTC from clean `4b3ddd1154e10bee4117e6aa0d6baaea22535973`
  on `codex/epic-17-g04`.
- `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Highest assigned slice was 682; S683 is the next unique slice.
- Canonical board revision 4045: EPIC-17 and G04-V03 In Progress; V01/V02
  Done. Start evidence is linked before touching CLO.
- Usage at start: primary window 27%; weekly window 21%.

## Exact input and route

- Source DXF: `C:\G04-CAD-Interchange\S681-mark-identity\polo-default-M.dxf`
- SHA-256: `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`
- Paired source manifest is package schema v2; revision
  `90dcd184ff28920dafa3e986dcf4e6fe92cb0a678d4092ed0b17fe172afb25f3`.
  It declares centimeters, Polo M, eight resolved options, nine pieces, and 38
  named visible marks. The manifest is evidence/custody metadata; CLO receives
  only the exact DXF.
- Receiver route: installed CLO 2026.1.310, Standard DXF import. Use the
  existing app authorization and preserve the current user session.
- All copied input, saved exchange files, screenshots and reports go only in
  `C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\`.

## Bounded procedure and pass/stop gates

1. Copy and hash-verify the exact source DXF and manifest in the S683 C: folder.
2. Import once in CLO Standard DXF. Inspect warnings, all nine pieces, visible
   geometry, centimeter scale, all CUT/SEW contours, layer/mark semantics and
   useful-scale readability. Compare the actual imported view/output against
   the paired source. Preserve the existing 0.001 cm geometric gate.
3. Only if import clears every applicable entry check, export once through the
   same documented route, parse and compare the saved file to the pinned source,
   reopen that exact saved file once, and inspect a second-generation output.
4. Stop immediately on a concrete miss. Do not try another CLO mode, DXF
   encoding/entity variation, or a second receiver in this slice.

The one Polo M fixture can diagnose the known critical CUT/mark/unit failures;
it cannot pass the required seven-recipe, all-supported-option, grade, malformed
input, full repeatability, receiver-profile or complete rendered-output gates.
No ANSI/AAMA/ASTM, physical-fit, factory-acceptance or production-readiness
claim is available from this trial. No source geometry, acceptance threshold,
export baseline, scope, or hold changes are authorized by S683.

## Exit evidence and next gate

Save hashes, exact CLO route labels, measured source-to-receiver comparisons,
observed warnings, clean-reopen result, and native rendered evidence in the C:
folder and this slice directory. Keep every V03 criterion unchanged. If CLO
still misses an unchanged gate, record the exact defect and whether evidence
locates it in the emitted source or only the CLO-transformed output; do not
claim an internal CLO or exporter cause without isolation. If this fixture
passes, continue using this exact route and current exporter for the remaining
fixtures; only the complete acceptance matrix can qualify V03.

Full repository coverage, integrated build/output/legacy/protected identity
review, final rendered review, PR, safe merge, origin/main ancestry and any
required GitHub Actions deployment remain Epic completion gates.
