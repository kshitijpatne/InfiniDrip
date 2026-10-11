# EPIC-17 / G04 — S722 start: V03 empirical profile acceptance

- Start: 2026-10-11 04:52 UTC.
- Goal: finish admitted EPIC-17/G04 without additional software by replacing the category-based industrial receiver requirement with a versioned, evidence-only receiver compatibility profile.
- Verified branch: `codex/epic-17-g04`; HEAD `77b454cd4b54ba3433fe7be6bd0c453584913131` (`Slice 721`).
- Refreshed upstream: `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Board: revision 4216; EPIC-17/G04-V03 In Progress; V01/V02 Done. Goal record: active.
- Unique next slice: S722; highest prior slice 721.
- Dirty state: only two pre-existing untracked S700 coverage diagnostics, left untouched.

## Authority, scope, and gates

The maintainer directly instructed Codex to refine V03 acceptance, use existing
software, reject paid software and finish the Epic. Scope is limited to
reconciling the profile criterion and durable records; no receiver rerun or
source implementation occurs in this slice.

Retain: all seven recipes and 73 supported option/grade configurations;
`0.001 cm` contour tolerance; centimeters; source-bound identity and stitch
relations; CUT/SEW and construction marks/grainlines; repeated semantic
round-trip; readable rendered output; product-side fail-closed malformed-input
handling; legacy DXF behavior and protected export bytes. V01/V02 remain Done.
No ANSI/AAMA/ASTM claim, physical fit, factory acceptance, or production
readiness claim.

Candidate route based on existing evidence: LibreCAD 2.2.1.5, DXF 2000. S708
and S710 measure one Polo M round-trip; this is not a broad pass. CLO failures
and GMS/DGS/OpenCAD route limitations remain recorded and will not be retested
without a distinct measured cause. No app acquisition, vendor contact, or
spending.

## Non-goals and final exits

No changes to pattern geometry, legacy DXF, protected baselines, V02, other
Epic scope, physical sampling or supplier/factory claims. At Epic exit retain
full repository tests and 100% global coverage, build/browser/Electron,
rendered/output review, necessary-file cleanup, reviewed PR, safe merge,
refreshed upstream ancestry, required automatic deployment and production
end-to-end verification.
