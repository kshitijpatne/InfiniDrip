# Slice 1342 Classic set-in Tee assembly

This directory contains the isolated pattern-to-3D engine and verification screen for the Classic crew-neck set-in Tee. The screen draws the app's sewing lines and allowance-derived cut lines next to the assembled shell. The output describes digital construction geometry. Fit, avatar placement, materials, drape, and production application wiring have separate gates.

## Run locally

From the InfiniDrip repository root with Node and npm available:

```sh
npm --prefix ops/ui-candidates/uiq12-tee ci
npm --prefix ops/ui-candidates/uiq12-tee run build
npm --prefix ops/ui-candidates/uiq12-tee run preview -- --port 4175
```

Open `http://127.0.0.1:4175/`. Use the default and unequal-armhole reference drafts or enter Classic measurements, choose XS–XL or custom one size, and open 3D. Pick a visible seam with the pointer or use the seam selector with the keyboard. The selection identifies both exact 2D source edges. The draft log explains rejected inputs and saved edits needing rebase. Saved drafts are isolated to this preview's browser storage.

## Reuse the assembly engine

`tee-source.ts` is the adapter to the existing typed draft and reviewed semantic edit APIs. It resolves a single size, freezes the source Block and separate cut line, and produces a versioned revision envelope for the two views. Generic relative size steps reuse the existing grade rules. The supported Classic base profile retains the app's field bounds, **59–74 cm** body length and **7–12 cm** effective torso ease. Optional torso ease drives the body while shared ease continues to drive sleeve width. Catalog-backed working copies use the registry controls on edit and save. Load a starterless app save with `loadGenericClassicTee` to use the generic Classic ranges and fractional measurements. The machine-readable adapter issue distinguishes source rejection from a placement exception.

The isolated adapter accepts an active, unarchived custom one-size Tee style with its owning project record. It uses the app's record parsers and step-zero draft resolver. The focused fixture goes through the real guided capture, materialization and project workflow before reaching the preview. The preview verifies a project working copy against the originating style, revision head and saved parent design digest. The working revision identifies the saved inputs, including neckband settings. The shell revision identifies the assembly and seam receipt. Project previews saved before this binding can be recreated from their source project snapshot. The production editor's live project selection and grade-plan wiring are later integration work.

The adapter retains the saved export-only neckband ratio (75–90%, 1% increments) and finished width (1.5–3 cm, 0.1 cm increments). Those settings belong to the app's separate neckband template output. The shell has a free neckline and excludes the template from its geometry and shell revision.

`assembly-contract.ts` defines the renderer-independent output. `tee-topology.ts` contains the single garment's seam roles, fold and instance rules, and placement. `seam-correspondence.ts` retains ordered source arc stations. `assembly-mesh.ts` builds indexed panels and exact seam references; `assembly-validation.ts` verifies source and world geometry. Extend through a separate validated garment definition. `topology-fixture.ts` exercises the shared contract with a different topology.

`main.ts` coordinates source and assembly generations. Direct Three is lazy and demand-rendered. The current source remains inspectable when a mesh, WebGL context or renderer chunk is unavailable. The 3D camera stays in place across valid edits within an open view. The renderer and its picking logic never author or approve a draft.

## Replay verification

```sh
npm --prefix ops/ui-candidates/uiq12-tee test
npm --prefix ops/ui-candidates/uiq12-tee run coverage
UIQ12_CHROMIUM=/usr/bin/chromium npm --prefix ops/ui-candidates/uiq12-tee run verify:browser
```

The browser verifier selects the installed Chromium with `UIQ12_CHROMIUM`, starts a loopback production preview, and records the actual unmasked WebGL backend. It writes its receipt and captures under `docs/research/uiq12/`. Cloud SwiftShader timings and process memory describe the named cloud workload. Target-device and post-redesign acceptance use a separately named device and the accepted app.

To replay only the active project fixture from this directory, with the repository's development dependencies installed:

```sh
work=$(mktemp -d)
UIQ12_PROJECT_SNAPSHOT="$work/project.json" npm test -- src/tee-source.candidate-check.ts -t 'app-created active project'
npm run build -- --outDir "$work/dist"
UIQ12_BUILD="$work/dist" UIQ12_PROJECT_SNAPSHOT="$work/project.json" npm run verify:browser -- project-smoke
```
