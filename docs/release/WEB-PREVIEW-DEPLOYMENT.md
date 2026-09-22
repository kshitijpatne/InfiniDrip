# Friend/family web preview deployment

_Updated: 2026-09-21 (America/New_York)._

## Current deployment

- Provider: Cloudflare Pages Free, Direct Upload project
- Project: `infinidrip-preview`
- Canonical share URL: `https://infinidrip-preview.pages.dev/`
- Production branch label: `main`
- Verified source commit: `6ac4eddf83d8fa9c21860f4e21326dcd17b79d7f`
- Successful workflow run: [GitHub Actions run #6](https://github.com/kshitijpatne/InfiniDrip/actions/runs/35680723851)
- Immutable deployment URL:
  `https://9160f7f6.infinidrip-preview.pages.dev`

The deployment contains only the Vite `dist/` artifact. It has no database,
login, cloud sync, email sender, analytics, feature-flag service or measurement
egress. User work remains in browser-local storage. The HTML carries
`noindex, nofollow, noarchive`; URL-only access is intentional for this
handpicked preview.

## Evidence

- `npm test`: 104 files / 1,415 tests passed in the deployment workflow.
- Strict TypeScript and `npm run build` passed.
- Deterministic web manifest and `web:proof:test` passed.
- Local HTTP smoke loaded the index and both referenced assets.
- Fresh Playwright browser capture against the live URL saw only the same-origin
  HTML, JavaScript and CSS requests, with no console/page errors.
- Fresh desktop and mobile viewport checks mounted InfiniDrip with 116 controls
  and no page errors.
- The maintainer opened the canonical URL from a phone and confirmed the app
  loaded successfully.

## Delivery and operational guardrails

This is a Cloudflare **Direct Upload** project. Cloudflare does not allow a
Direct Upload project to be converted to Git integration. The repository's
bounded GitHub Actions workflow at `.github/workflows/pages-deployment.yml` is
the active delivery path: a push to `main` or an explicit `workflow_dispatch`
runs the full verification/build/deterministic-artifact gates, then uploads
`dist/` to this project only after they pass. Pull requests and other branches
do not replace production. If a gate fails, the previous healthy production
artifact remains live and the workflow must be fixed and rerun.

The workflow reads only the protected GitHub secrets
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; neither value is written
to the repository or shipped in the app. The current user-owned Pages token is
scheduled to expire on 2027-03-20 and must be rotated before that date. No
paid service or custom domain is required for this preview.

Creating a separate Git-integrated Pages project is intentionally not used:
it would require another project/URL and migration work for no benefit during
this friend/family preview. The canonical URL is stable across successful
deployments; immutable `*.pages.dev` URLs are retained as deployment evidence
and can be used to compare or identify a specific artifact.
