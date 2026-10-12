# UIQ-08 integration — Slice 760 deployment closeout

Status: deployment and live verification passed; independently accepted and
closed Done at canonical board revision 4512.

## Deployment identity

- PR #40 merged at `2026-10-12T18:25:11Z` to
  `origin/main` commit `bb0bfd220a89f9b6beaecfcc06f1e08338d0ae8f`.
- GitHub Actions deployment workflow
  [38290776264](https://github.com/kshitijpatne/InfiniDrip/actions/runs/38290776264)
  passed end-to-end: full test suite, production build, deterministic artifact
  check, and Cloudflare Pages deploy.
- Stable user URL: <https://infinidrip-preview.pages.dev>.
- Immutable deployment URL: <https://ae2896e6.infinidrip-preview.pages.dev>.

## Fresh live-browser acceptance

The verifier opened both URLs in fresh Chromium contexts and confirmed the
actual fetched JS and CSS bytes match the accepted local production build:

- JS `index-BG_MF5be.js`: SHA-256
  `c0f4c5075bd3ffe3042bef566a222938dd4cafd5262822c142b346dafdf87da2`.
- CSS `index-D4OY9zfR.css`: SHA-256
  `c3ac8683810f5be0e982868baf66d41305a3f820fd603c962116ffb282473bb2`.
- Both URLs render the exact solid, opaque toolbar grouping with its three
  controls. Zoom-out and Fit returned the expected 75% and 100% states.
- At 320, 390, 768 and 1440 CSS px, the document and toolbar have no horizontal
  overflow. Each target had zero external requests, page errors and console
  errors. Stable and immutable result records and screenshots are in
  `docs/research/uiq08-integration/evidence/S760-live/`.

## Risk note and closeout

The deployment action installed transient `wrangler@4.149.0` on its runner and
its npm audit output reported 22 package vulnerabilities (11 moderate, 8 high,
3 critical). This was runner-side deployment tooling after the app tests/build,
not an application dependency or deployed asset. Deployment succeeded; the
tooling advisory is recorded for separate security triage and was not changed
as part of UIQ-08.

No application source changed after PR #40, no export baseline moved, and the
existing dirty shared checkout and unrelated worktrees remain untouched. Slice
759 and Slice 760, as well as parent UIQ-08, are Done through the validated
board command layer. The live deployment remains available at the stable URL;
future changes require their own admitted work and release process.
