# EPIC-17 / G04 V03 — S698 one source-corrected CLO round trip

## Verified start and reserved slice

- Start: 2026-10-10 23:16:37 UTC.
- Branch: `codex/epic-17-g04`; S697 commit
  `97a03014da88ccd29d220c95b8b23550a7f6c41a`; clean at start.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S697 is the highest assigned slice; S698 is unique.
- Canonical board revision 4126: EPIC-17 In Progress, V01/V02 Done,
  G04-V03 Blocked. The goal record is active and remains active.
- CLO 2026.1.310, the already-installed route, has prior rights/local handling
  approval. Do not install or open another receiver.

## Why one repeat is evidence-led

S697 changed the exact candidate file in a way the prior receiver test did not
exercise: source coordinate rounding fell from a measured maximum of
`0.000701218851 cm` to `0.000000702921 cm`. That is a source correction tied
directly to the measured contour gate, not a new format/setting sweep. S696's
receiver output is still the prior strongest evidence; S698 checks only whether
the corrected file changes that route's actual result.

The named candidate route is **CLO 2026.1.310 / Standard DXF**, an empirical
vendor/version/mode profile under evaluation. Do not claim ANSI/AAMA/ASTM
conformance. Retain the exact same CLO import/export settings as S696,
including `Import Draw Curve Points` off, mm, 100% scale and no rotation. Use
the deterministic centimeter-to-millimeter source transformation already
reviewed in S694; change no source coordinates except the documented x10 unit
conversion and the matching `$INSUNITS` value. Preserve and hash-pin the
centimeter candidate.

## Single operation and fixed gates

Use the existing open CLO session for one import, one export and one reopen.
Compare the actual returned file against the exact S697 source at the existing
`0.001 cm` contour and mark gates. Check units, all nine CUT and SEW outlines,
every visible mark and its meaning, layers, piece count/selectability,
identity association, overview/detail readability, joins and crossings. Save
the imported file, return, project backup, screenshots, comparisons and renders
only under `C:\G04-CAD-Interchange\S698-clo-precision-recheck\`.

- Stop the CLO Standard route on the first measured fixed-gate failure or
  receiver error; do not try another setting, encoding or format.
- A clean representative pass would allow the existing seven-recipe/73-option/
  grade, malformed-input, repeatability and full rendered-output checks on
  this same exact profile. It would not by itself pass V03.
- Any miss leaves all V03 acceptance and holds unchanged. Do not alter pattern
  geometry, seam graph, tolerance, marks, legacy DXF behavior, protected byte
  identities or scope.
- No physical-fit, factory-acceptance or production-readiness claim.

Autodesk's DXF reference explains that entity layer names can be used without
an explicit LAYER table entry and will be automatically created on import; no
speculative layer-table change is included in this test. This supports only the
generic DXF layer behavior, not apparel-CAD or industrial-profile conformance.

## Handoff and exit gates

Codex owns the single stateful CLO operation, exact file comparison, rendered
review, durable packet/state/board update and integration. No safe disjoint
work exists in this narrow desktop operation. At exit, record the exact hashes,
per-piece/mark outcomes, actual rendered inspection, focused Control Center
result, Git ancestry, board revisions and separate implementation,
verification, external wait and maintainer-decision time. Do not run the full
repository gate until the integrated Epic/PR candidate is settled.

**Next action:** prepare the exact S697 source's mm input copy in the named C:
folder and perform this one controlled CLO round trip.
