# Friend/family web preview deployment

_Recorded: 2026-09-21._

## Current deployment

- Provider: Cloudflare Pages Free, Direct Upload project
- Project: `infinidrip-preview`
- Canonical share URL: `https://infinidrip-preview.pages.dev/`
- Production branch label: `main`
- Deployed source commit: `ae1afe8db464b038a4b9a5b25d546ed988105189`
- Deployment ID: `9bb80a6b-41c2-4689-9e31-2efa653d1ff9`
- Immutable deployment URL:
  `https://9bb80a6b.infinidrip-preview.pages.dev`

The deployment contains only the Vite `dist/` artifact. It has no database,
login, cloud sync, email sender, analytics, feature-flag service or measurement
egress. User work remains in browser-local storage. The HTML carries
`noindex, nofollow, noarchive`; URL-only access is intentional for this
handpicked preview.

## Evidence

- `npm test`: 104 files / 1,415 tests passed.
- Strict TypeScript and `npm run build` passed.
- Deterministic web manifest and `web:proof:test` passed.
- Local HTTP smoke loaded the index and both referenced assets.
- Fresh Playwright browser capture against the live URL saw only the same-origin
  HTML, JavaScript and CSS requests, with no console/page errors.
- Fresh desktop and mobile viewport checks mounted InfiniDrip with 116 controls
  and no page errors.

## Delivery limitation and next gate

This is a Cloudflare **Direct Upload** project. Cloudflare does not allow a
Direct Upload project to be converted to Git integration. Therefore the
`main` production label is set and the current deployment is production, but
future pushes do not yet auto-deploy. The repository now contains the bounded
GitHub Actions workflow at `.github/workflows/pages-deployment.yml`; it runs
the full verification/build gates and uploads `dist/` to this project only on
`main`. It becomes active once the two GitHub Actions secrets
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are created.

Creating a separate Git-integrated Pages project is intentionally not used:
it would require another project/URL and migration work for no benefit during
this friend/family preview.

No paid service or custom domain is required for either route. Until one route
is explicitly selected and configured, this URL remains a manually deployable
preview; Codex must rebuild, reverify and upload each approved release.
