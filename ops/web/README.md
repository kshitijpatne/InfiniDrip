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
