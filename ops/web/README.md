# Provider-independent web delivery proof

This directory contains the deterministic artifact-manifest tool and
provider-neutral local delivery instructions. It does not deploy or contact a
hosting provider.

## Rehearse locally

```text
npm run build
node ops/web/create-artifact-manifest.mjs dist ops/web/artifact-manifest.json
npx vite preview --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/` in a browser. The Vite build keeps `base: "./"`
so the same artifact remains usable by Electron's `file://` loader. Verify the
HTML, stylesheet and JavaScript asset responses, then stop the local server.

The manifest is sorted by relative path and records only stable content facts:
schema version, relative base, byte count and SHA-256. It contains no timestamp,
machine path, secret, deployment URL or mutable provider state. Re-running it
against the same `dist/` tree must produce byte-identical JSON. Vite preview is
used so the rehearsal uses the repository-managed Node toolchain on Windows,
macOS and Linux.

## Slice 179 candidate rehearsal

`release-rehearsal.mjs` adds the repository-local candidate contract around that
manifest. `manifestDigest()` produces one stable SHA-256 for the complete
manifest; `createCandidate()` binds it to a commit/ref identity, four explicit
gate results (`tests`, `build`, `manifest`, `smoke`) and a reviewer/timestamp;
`rehearseRelease()` returns only `promotable`, `rejected` or `rolled-back`
descriptive results. It performs no deployment, alias, account or provider
operation. Missing, malformed or false gates cannot be promoted, and a
smoke-only failure can select a fully validated `previousKnownGood` record.

Run the focused local proof with:

```text
npm run web:release:test
```

The helper deliberately does not run a server or manufacture a smoke result.
The caller records the observed local preview result as an explicit boolean;
the versioned freeze, smoke, incident and migration-defer rules are recorded
in `docs/release/SLICE-179-LOCAL-DELIVERY-REHEARSAL.md`.
