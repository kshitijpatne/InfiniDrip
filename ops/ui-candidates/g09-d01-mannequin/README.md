# D01 synthetic mannequin

Original synthetic geometry constructed from authored section profiles and indexed junctions. Both GLBs are generated from source with no imported scans, templates, textures or identifying measurements. Coordinates are metres, +Y up, +Z anterior and +X anatomical left. The standalone preview accepts the 43 reviewed configurations in evidence/controls.json. That deterministic numeric fixture is a runtime input. The stable shape targets remain available for independently validated extensions.

Run python3 -m http.server 8765 --bind 127.0.0.1 here and open /preview/ on localhost:8765. Use Open GLB and Download GLB for offline transfer. Reopen checks the frozen geometry, semantic roles, target order and signed configuration. Local browser APIs provide rendering and a measurement fallback.

Reproduce geometry with Python and NumPy 2.3.5 using python scripts/generate.py. Run Blender 4.3.2 with -b --factory-startup --python-exit-code 1 --python tests/readback.py, then likewise tests/controls.py. The verification scripts use NumPy and Pillow. Run node tests/preview-browser.cjs with Playwright and Chromium available. PLAYWRIGHT_MODULE and CHROMIUM_PATH can identify installed copies. Replays can generate receipts and screenshots locally.

Chest, waist and seat use ordered synthetic torso loops. Digital mesh transport is measured against a 0.1 mm bound. Collision checks cover sampled states. This asset provides no physical fit or population validation.
