# D02 synthetic body measurements

D02 uses the original mannequin and WebGL view from D01 commit af99b069fa4f17a22e86bd8f3d72adc360ef4c67. The pinned control asset SHA-256 is 9609f5f444c79eff36cb3ccc4901aa287fc13687d209681329e9b57bd33d2d08.

Serve the parent candidate directory locally with `python3 -m http.server 8765 --bind 127.0.0.1 --directory ..` and open `http://127.0.0.1:8765/g09-d02-measurements/`. D01 is independently available at `/g09-d01-mannequin/preview/`.

Enter horizontal torso circumference at the D01 chest section, 1.222430944 m above ground in the reference pose and about 54 mm below the axilla landmark. The seat section is at 0.940462708 m. Use whole centimetres, chest 78–91 and seat 81–95. Garment ease belongs to garment dimensions. A 100 cm body plus 10 cm ease requires 110 cm garment circumference. Both 100 cm and 110 cm are outside this model's chest range. The Tee axilla-level protocol has a different measurement plane. Torso length and shoulder breadth are held neutral.

The solver uses a bounded bisection against actual surface loops, evaluating the resulting float32 mesh before applying the state. Requested and achieved values refer to the last accepted shape. A request or import rejection preserves that shape, its measurements and GLB download. D02 GLBs store the exact pinned D01 binary chunk, signed target weights and the D02 measurement protocol and body targets. Reopen re-solves the provenance and requires exact weight correspondence before changing state.

## Focused verification

From this folder, use Node with Web Crypto, Blender 4.3.2 with NumPy, and a locally installed Playwright and Chromium for the browser checks.

```sh
out="$(mktemp -d)"
node tests/export-poses.mjs "$out/poses.bin" "$out/states.json" "$out/reopen.glb"
OPENBLAS_NUM_THREADS=1 blender -b --factory-startup --python-exit-code 1 --python tests/geometry.py -- "$out/poses.bin" "$out/states.json" "$out/reopen.glb"
node tests/browser.cjs
```

The browser script accepts PLAYWRIGHT_MODULE and CHROMIUM_PATH overrides. It serves the preview assets over loopback and disconnects the browser after load.

The geometry verifier calculates the horizontal section independently from triangle-plane intersections. Since vertical positions are invariant, section connectivity and interpolation parameters are derived once and actual contours measured over all 210 float32 meshes. The collision proof checks the neutral mesh, each of 14 chest and 15 seat states against the full otherwise-neutral mesh, and a mixed extreme. Every actual combined pose must equal the certified support composition. Changed triangles occupy disjoint invariant vertical slabs and do not share normal fans. Checks include contact extending beyond shared vertices or edges. The numeric measurement agreement ceiling is 0.01 mm. The separate GLB transport ceiling is 0.1 mm. These tolerances describe numerical model behavior. Windows Intel verification and independent review precede any shipping decision. This candidate models synthetic horizontal circumferences and makes no physical fit claim.
