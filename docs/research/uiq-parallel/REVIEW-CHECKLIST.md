# Codex candidate review matrix

Admission: docs/planning/UIQ-PARALLEL-ADMISSION.md. Start protected-file digest: BASELINE-IDENTITY.json. The expectations below remain the complete acceptance plan; the current evidence ledger follows it. No physical/app-release claim.

| Area | Expectation / counterexample | Evidence to retain |
|---|---|---|
| Ownership | Only exact assigned new files; original tracked product/assets/config digests unchanged; no active G04 writes | Actual branch diff/untracked inventory and digest comparison |
| API | Foundation exports exact literal-text functions; artwork mount/setSelection/dispose preserves supplied data and host siblings | Focused tests, actual code review |
| Cleanup | Multiple mounts independent; repeated dispose safe; detached event controls cannot notify parent; no global listeners | Unit branches and browser dispose/remount |
| Catalog identity |12 known assets and source metadata unchanged; explicit button callback returns existing ID only | Catalog record IDs, local preview loads and callback display |
| Search/filters | Literal/unicode, intersections and clear; no-match distinct from empty; input focus not lost | Browser DOM/state snapshots and focused tests |
| Guidance | All severities visibly labeled, raw assessment caveats preserved; selectable does not assert rights or print certification | Actual rendered cards and hostile/scale fixtures |
| Selection | Browse/filter never applies; explicit action only; hidden/unknown ID remains explicit; controlled clear has no callback | Callback count before/after user actions |
| Safety | Malicious titles/descriptions remain text; remote/data/javascript/credentialed image URLs never loaded; broken local image fallback stays selectable | Unit matrix, DOM text/image src and observed resource entries |
| Local assets | Default catalog loads actual local images; no external image/font/HDR/upload requests | Browser resource URLs, dev errors and asset load counts |
| Native semantics | Labels associate per-instance unique IDs; buttons keyboard-operable with visible focus; status versus alert appropriate | DOM/a11y audit and keyboard interaction |
| Readability |320/390/1440 widths and zoom-equivalent layout: no unwanted document overflow or overlapping text; long tokens wrap | Viewport metrics, screenshots, measured bounding boxes |
| Contrast/targets |Normal text4.5:1, focus3:1 adjacent background, controls44px; disabled state not mistaken for action | Actual computed styles/rectangles and contrast calculation |
| CSS isolation | Root-scoped selectors/custom properties; outside sibling stays browser-native; opaque fallback is readable | CSS review plus sentinel computed styles |
| Accessibility modes | Reduced-motion and forced-colors preserve semantics, focus and visibility | CSS checks and actual browser/media capabilities where available; limitations explicit |
| Candidate integration | Accepted foundation tokens decorate artwork without changing its API/state logic | Combined unshipped review preview |
| Regression | Changed production100% four metrics; settled full repository100% and protected export bytes; TS/build/board | Captured gate outputs, no relaxed exclusions/baselines |

Browser controls in ops/ui-candidates/index.html exercise actual components without touching a live garment. Accessibility audit uses the existing dev-only axe dependency, records violations honestly and performs no telemetry. A local missing-image404 is an expected negative fixture, not an unexplained app failure. Any screenshot or audit that predates a source correction is superseded, not reused as acceptance.

If browser does not support native media emulation, record CSS contract and unit evidence separately rather than calling that a real forced-colors/reduced-motion browser pass. App integration, runtime flags and public release remain pending UIQ-GATE.

## Verified evidence ledger — 2026-10-02 06:26 UTC

Final superseding result: both candidates accepted at06:26 UTC; immutable proof
is CANDIDATE-EXIT.json. Full2056 exit0,135/135 suites and2091/2091 tests,
100% statements/branches/functions/lines and9/9 export identities. Inventory,
279 protected hashes and five rendered-source hashes independently rechecked.
Child cards reviewer-closed at board421; parents remain unshipped. All matrix
requirements for this isolated scope are satisfied. Integration holds remain
outside this goal.

- Ownership/API/data isolation: Codex reviewed the delivered and corrected root files;279 protected-file SHA256 values rechecked with zero differences. Existing catalog, app, draft/export, package/configuration and baseline files remain unchanged. Both CLI deliveries returned WORK FINISHED before inspection; no contributor commit/push. Root-only follow-up Luna audit found no remaining bounded remediation defect.
- Changed production: focused61/61 tests passed. Current coverage-final.json independently aggregates509/509 statements and lines,30/30 functions,110/110 branches. All four required metrics100%, no skipped covered items. Lifecycle, controlled selection, default/custom/deep-frozen catalogs, literal text, search/filter intersections, advisories, image allowlisting/failure and sibling preservation have actual unit assertions.
- Rendered rows: `evidence/browser-pressure-test.json` contains18 passing asserted cases, zero failures. All five recorded source hashes still match current source/CSS/review fixture. It verifies all12 assets, explicit mouse/Enter/Space callbacks and focus/provenance retention, search/four filters/reset/selection, empty/hostile/rejected previews, genuine trusted-image failure, independent mounts and unique IDs, dispose/remount, scoped outside sentinel, target/contrast metrics,320/390/480/960/1440 reflow, native disclosure and forced-colors/reduced-motion in both previews. It observes zero external requests/sockets. Screenshots and additional in-app review are linked in CODEX-REVIEW.md. Zoom-equivalent widths are not an actual browser zoom-setting claim.
- Type/build/operations: root TypeScript plus standalone preview checks passed; final settled build69198 exit0. All49 operational tests passed, including34 board tests. No warning, threshold, assertion or timeout was relaxed.
- Regression/global acceptance: **passed**, full terminal2056 exit0. All135 own application suites and2091 tests passed with100% global statements/branches/functions/lines and protected9-test export byte identity. Discovered-suite inventory exactly matches current source tests. Previous default-worker timeout and focused/scheduling diagnostics remain in CODEX-REVIEW.md and retained logs; they are not substitutes for the successful full run. Both children independently reviewer-closed; final post-closure49 operational tests also pass.
- Integration holds: local-web candidates only. Packaged file-origin assets, runtime flags/default/fallback, shared app wiring, current-main integration, fresh numbered landing and public release await separately admitted UIQ-GATE after settled merged Epic17. Parents remain Backlog/unshipped; this is not a new dependency on G04 closure.
