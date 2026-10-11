## EPIC-17 / G04 — S703 closed; CLO DXF-ASTM return fails fixed checks

The single bounded CLO 2026.1.310 DXF-ASTM test used the exact S700 Polo M
package. CLO retained all nine named piece blocks, but the actual return
misses the fixed 0.001 cm contour limit on five CUT outlines (back, both
stands, both collars) and all three checked buttonhole POINT anchors. The
source/return layer names and explicit units declarations are also absent.
The saved-file contour report is one-sided: its lower bounds prove these five
failures but do not prove the other four CUT paths pass. No returned-render
acceptance was claimed after the predeclared stop condition. Exact hashes,
measurements and limitations are in
`docs/research/epic17/S703-clo-astm-apparel-pilot/S703-exit-packet.md`; CAD
files remain in `C:\G04-CAD-Interchange\S703-clo-astm-pilot\`.

No product code or acceptance changed. No further CLO variation or new CAD
app is queued for these same failures. V01/V02 remain Done, V03 remains held,
EPIC-17 remains In Progress, and the goal remains active. Next: reconcile the
fixed V03 matrix against the exact returns and current DXF writer, then define
only evidence-supported code changes and decisive verification. All-seven
recipes/options/grades, identity/layers/marks, malformed-input, repeatability,
readability, rights/profile, protected legacy output identities, cleanup,
integrated full gates, final output review, PR/merge, ancestry and production
verification remain required. No conformance, physical-fit, factory-acceptance
or production-readiness claim.

Board closeout revision 4144 preserves G04-V03 Blocked / EPIC-17 In Progress. Focused Control Center tests pass 42/42 and `git diff --check` passes. No full repository gate ran.\n\nS703 started 2026-10-11 00:04:51 UTC from S702 `f06e9691b8ccb5c7ea8b3e0fb3c0e9a21e4dd61a`;
refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
ancestor. Board start revision 4141; S702 was highest and S703 is unique.
Implementation 0m; CLO interaction/output comparison about 9m; external-agent
wait 0m; maintainer-decision time 0m. Focused board verification and closeout
followed the pilot; no full repository gate applies to this evidence-only
slice.
