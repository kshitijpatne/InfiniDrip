# S329 integrated production Chromium review

The production-built app was replayed through its browser UI for all 73 supported recipe-option configurations and 146 requested front/back faces (32 option fields). The replay had zero console, page, request, SVG parser, or layout assertion errors. Comparing every `caseId/face` and issue string with S328 produced no changed outcomes: 52 accepted, 94 held.

The four Tee/Fitted default faces remain held by the exact S328 side-edge overlap guidance. Their baseline screenshots show the app's explicit hold state and no partial SVG. Tank, Skirt, and all 24 Trouser configurations retain their accepted output. Polo's 34 faces and Woven's 56 faces retain their established full-face holds. No previously accepted face regressed and no new face was accepted.

S329 also generated a production candidate with four emitted Tee/Fitted SVGs in `../S329-orientation-candidate/`. Automatic SVG, label, and browser checks passed, but manual geometry review failed it: in the front candidate, the selected side path begins at the shoulder/crown station and runs inward across the bodice instead of joining the mapped underarm. See that folder's review. The separate unpaired back source-reflection experiment in `../S329-tee-fitted-browser/` displaces the sleeve away from the body; see its review. These images are explicitly diagnostic failures, not accepted output. The S321 view convention remains approved; these candidates do not satisfy it in rendered geometry.

The default source sleeve cap has 1.5 cm total ease over the two armholes, within the source rule's `[-1, 4] cm` allowance. The existing rigid solver reports a 0.48 cm endpoint residual; it is surfaced and never clamped. The separate S322 changed-measurement draft has a 6.402469 cm difference against the 4 cm maximum and remains held.

The complete baseline matrix is `matrix.json`; default held screenshots and SVG are alongside it. This replay does not claim physical fit, factory acceptance, or a valid Tee/Fitted sleeve transform.
