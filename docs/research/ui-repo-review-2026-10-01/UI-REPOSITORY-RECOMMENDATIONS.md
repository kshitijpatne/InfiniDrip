# InfiniDrip: four-repository UI review

Research date: 2026-10-01. Research only, not an implementation admission.

## Decision in brief

Do not migrate InfiniDrip to React for decoration. Prefer original native CSS for restrained glass, gradients and a brand accent; retain SVG for production artwork, patterns and technical views. Consider React Three Fiber only as a bounded renderer candidate within the already-planned G09 / Epic 22 3D work. ShaderGradient is an optional aesthetic experiment, not a prerequisite for welcome/onboarding. Do not copy the Liquid Logo application into InfiniDrip without resolving its restricted license.

None of these repositories improves garment equations, grading correctness, nesting quality, physical fit, measurement validity or export precision. A better render can explain existing information, but cannot supply missing construction data or a cloth solver. Every physical-fit claim remains held.

This review covers four exact repositories, not similarly named libraries. There are 42 screen/state mappings below and 34 browser screenshots in the separate visual atlas. Recommendations include reasons to decline a repo, not just opportunities to use it.

## 1. Is each free to use?

| Exact repository | Verified license and version | May we directly use it? | Costs and limits | Verdict for this app |
|---|---|---|---|---|
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | MIT; source `13e5e0e152562a9cb64c31dee1d10a2af7aa39c4`; proof uses npm 9.8.1 | Yes, subject to preserving copyright/license notices and checking included dependencies/assets. Commercial use and modifications permitted. | No mandatory license fee or hosted service. React, React DOM, Three and rendering lifecycle are integration/maintenance costs. Renderer, not solver. | Eligible for a future isolated spatial viewer, not a whole-app replacement. [License](https://github.com/pmndrs/react-three-fiber/blob/13e5e0e152562a9cb64c31dee1d10a2af7aa39c4/LICENSE). |
| [Liquid Glass JS](https://github.com/dashersw/liquid-glass-js) | MIT; source `78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a` | Yes under MIT. Preserve notices; independently check html2canvas and its transitive notices if used. | No mandatory fee. Upstream sample uses a CDN and remote photo. It captures the page to a texture, with GPU, memory, accessibility and disposal overhead. | Legally reusable, but direct workspace use is not recommended. Prefer original CSS inspiration. [License](https://github.com/dashersw/liquid-glass-js/blob/78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a/LICENSE). |
| [ShaderGradient](https://github.com/ruucm/shadergradient) | README declares MIT and package metadata says MIT. Source pin `68bdd740037a11c639f8b91fd775949c71d718d0` says 2.4.24; published/proof package is 2.4.20. | Package is declared MIT, but a complete license/notice file is absent from the inspected root and installed distribution. Before shipping copied/bundled code, resolve the full notice and included-code/asset audit. Do not assume every plugin, image or HDR is cleared by metadata. | No mandatory library fee. React/Three-based rendering and default external HDR fetches add costs. Vue support in current source would introduce another framework, not remove integration work. | Conditional optional welcome experiment; native CSS is the preferred default. [README](https://github.com/ruucm/shadergradient/blob/68bdd740037a11c639f8b91fd775949c71d718d0/README.md), [package declaration](https://github.com/ruucm/shadergradient/blob/68bdd740037a11c639f8b91fd775949c71d718d0/packages/shadergradient/package.json). |
| [Liquid Logo](https://github.com/paper-design/liquid-logo) | PolyForm Shield 1.0.0; source `689bb38a1e0d5a6a8baf2d34847635eefde19994` | Not blanket free/open-source clearance. Shield restricts competing products, including free ones and different interfaces. InfiniDrip is design software; competition status is unresolved, not automatically prohibited or automatically allowed. Require permission/legal review before copying this app or its protected implementation. | Its wrapper includes Next.js, public Vercel Blob upload, analytics and a remote font. These are unnecessary for our local brand effect and cannot be silently introduced. | Reject whole-app integration. An independently authored CSS wordmark is sufficient. [Exact license](https://github.com/paper-design/liquid-logo/blob/689bb38a1e0d5a6a8baf2d34847635eefde19994/LICENSE). |

Liquid Logo separately depends on `@paper-design/shaders-react@0.0.21` and `@paper-design/shaders@0.0.19`, whose npm metadata declares MIT. That is a different licensing boundary, not permission to copy the Shield wrapper or its custom shader. An exact-version notice/asset audit would still be required before adopting either package. No Shield code was used in our proof.

Free code does not mean free implementation effort or guaranteed support. The recommendations require no new paid service or account; existing hosting allowances still apply. This is an engineering licensing assessment, not a legal opinion.

## 2. Source and current-product baseline

Local `50afb32` and fetched `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` had identical trees at review start. Latest landed slice: 260. Board revision: 370. Epic 16 is closed; Epic 17 remains Backlog. This review neither admits Epic 17 nor changes that sequence.

The current UI uses plain TypeScript DOM rendering and SVG, local storage/revisions, no React dependency. It exposes Tee, Darted tee, Tank, Polo, Woven shirt, Skirt and Trouser. Browser review used synthetic starting values at the configured hosted preview and the repository-local Control Center. No private user measurements were required. Hosted release identity was not independently attested against a commit; current implementation conclusions are grounded in the fetched source, with hosted screenshots as visual observations.

Source inventory included `src/ui/view.ts`, `src/ui/app.ts`, the guided capture, grade-plan, project-manager, semantic-edit and persistence modules; current architecture, manual-quality findings, decisions, bug ledger, board and capability roadmap. An independent Claude Code inventory was produced in a disjoint worktree and reviewed after its explicit WORK FINISHED signal. Its blanket suggestion that React necessarily requires rewriting the app was rejected: the isolated proof demonstrates coexistence. Its current-3D exclusion must also be distinguished from the explicitly planned future G09 work.

## 3. Comprehensive feature mapping

Legend: **native** means an original implementation using existing CSS/SVG/TypeScript; it is not claimed to use the named library. **Keep** means these four repos do not justify changing the feature. Effort is relative, not an approved slice estimate. E = enhancement, A = addition, R = redesign, N = new feature. Each recommendation retains existing data, validation and export contracts.

| # | Current screen / state | Best fit among the four, or native alternative | Concrete proposal and user benefit | Disposition / effort / category |
|---|---|---|---|---|
| 01 | Header, brand, local workspace, Save/Load, Undo/Redo | Liquid Logo visual idea → native CSS only | Small static wordmark accent; keep save state and controls solid. No upload, tracking, shader or Next.js wrapper. | Optional; low; E. Shield app declined. |
| 02 | First-use welcome and tour | ShaderGradient optional; native CSS preferred | Quiet static backdrop, strong primary action, plain fallback. Animated background is opt-in, not behind instructions. No new login flow. | Optional; low native / medium shader; E. |
| 03 | Five-stage journey and coach | Liquid Glass visual idea → native CSS | Clear current/completed/blocked states and next action. Restrained panel border/translucency only; decoration must not obscure disabled export. | Native candidate; low; E. |
| 04 | Seven garment cards | Native SVG and CSS; no R3F requirement | Accurate per-recipe thumbnail, selected state, essential construction summary. Generic 3D thumbnails would imply capabilities we lack. | Native candidate; medium; E. |
| 05 | Standard measurement groups, steppers, range rails | Keep native inputs | Improve spacing, unit clarity and boundaries. Do not replace semantic inputs with glass DIV buttons or put animation under values. | Keep controls; targeted native E. |
| 06 | Guided capture: raw values, units, readings and source details | Keep native inputs and SVG explanations | Preserve raw invalid/ambiguous readings, source caveats and correction actions. No sampled page texture around sensitive body data. | Keep; high-sensitivity exclusion. |
| 07 | Preset acceptance / one-size creation | Native CSS and existing data contract | Distinguish a digital starting preset from a measured wearer; static explanation card is useful, an avatar is not evidence. | Native candidate; low; E. |
| 08 | Provenance and field-history dialog | Keep native dialog | Legible raw/canonical value, date, method, confirmation status, pagination and keyboard focus. Metal/glass adds no information. | Keep; no repo integration. |
| 09 | Fit-intent cards and delta report | Native CSS/SVG | Separate selected intent from valid/on-target verdict. Deltas remain textual and numerical; avoid animated color-based confirmation. | Native candidate; low; E. |
| 10 | Material/stretch selection and advice | Native CSS swatches, not ShaderGradient | Visually separate behavior from appearance; show preset limits and construction meaning. Shading cannot establish stretch or drape. | Recommended native direction; medium; E. Demo. |
| 11 | Color swatches, color wheel, hex and lightness | Keep native color tools; CSS finish cue | Retain exact chosen color and accessible numeric controls. Gradient effect must not change stored color or represent color accuracy. | Keep + optional native E. |
| 12 | Texture and shine appearance controls | Native CSS/SVG first; future Three material renderer | Small illustrative appearance cue with honest label. Physical roughness, grain and reflectance require a future material contract. | Native E now; R3F A deferred. Demo. |
| 13 | Guidance disclosure, material advice, warnings | Native CSS | Make actionable warnings discoverable; preserve severity text/glyph, review-field and set-aside/restore. Blur never sits behind warning copy. | High-value native E; none of four solves information placement. |
| 14 | Artwork library search and filters | Native CSS/SVG | Larger previews, clear rights/suitability/resolution badges and no-match explanation. Imported artwork stays local. | Native E; no GPU need. |
| 15 | Artwork upload, replace and missing-file state | Keep current validated import | Preserve file checks and local lifecycle. Liquid Logo's public upload is incompatible with this contract; metallic conversion alters source artwork. | Keep; Liquid Logo path rejected. |
| 16 | Placement role/identity, scale, size, rotation, opacity, stacking | Native SVG; future R3F display adapter only | Make placement visibly traceable to piece/revision; coordinate controls remain authoritative. Three needs UV/piece mapping, not a generic decal. | Native A within artwork scope; medium. Demo is uncalibrated concept. |
| 17 | Pattern canvas, cut/stitch contours and marks | Keep SVG | Improve contrast and visual hierarchy without deforming contours. Three can show read-only flat meshes later, never replace the authoritative pattern. | Keep; optional G09 renderer proof. |
| 18 | Pattern key, piece identity and linked measurements | Native SVG/DOM | Keep labels outside cut shapes, stable IDs and keyboard actions. Liquid Glass refraction risks label/geometry distortion. | Native E; prioritize correctness over effects. |
| 19 | Zoom, pan, fit and inspection toolbar | Liquid Glass inspiration → native CSS | Bounded frosted container, native solid buttons and opaque fallback; no page capture. Needs keyboard and dense-background checks. | Optional; low; E. Demo. |
| 20 | Body front/back views | Native SVG now; R3F only under G09 | Improve schematic legibility now. Measurement-driven avatar requires D01/D02 research, residuals and limits before any 3D promise. | Keep schematic; future R3F R. |
| 21 | Body side view | Keep explicit schematic label | No repo fixes missing pattern-linked side geometry. Future side/oblique/inside views belong to G09/D04, not a background shader. | Keep; future gated R. |
| 22 | Assembled garment preview | R3F strongest future match | Pattern-derived, read-only spatial viewer with optional seam/piece layers. Today's flat-mesh demo is not sewing, cloth or fitting. | Deferred G09 A/R; high, proof first. Demo. |
| 23 | Size-run overlay | Keep SVG | Clear size legend, active-size distinction and collision handling. 3D multi-size rendering costs more while making comparison less precise. | Native E; R3F not justified here. |
| 24 | Spec / POM / technical view | Native SVG and semantic tables | Precise callouts and measured construction; future G04 front/back flats must derive from the same pattern. Shader/metal cannot repair absent closures or seams. | Native R belongs to held G04 / Epic 17. |
| 25 | Grade plan: base, labels, deltas, N/A reasons, review/approval | Keep native form and approval contract | Improve grouping and error navigation without implying that nice colors validate grading. Retain stale-base checks and reviewer state. | Native E; no repo integration. |
| 26 | Grade-run output and raw POM reconciliation | Keep SVG / tables | Show actual deltas/residuals and blocked targets. A shader heatmap is not accurate without a defined metric and legend. | Keep; native E only if admitted. |
| 27 | Nesting: single-size / graded-marker geometry | Keep SVG and nestPieces | Maintain exact dimensions, orientation and cuts; 3D adds occlusion and no packing intelligence. Refracting outlines would be harmful. | Keep; all four rejected for engine/render replacement. |
| 28 | Waste, will-fit, direction, cutting buffer, available length | Native CSS readouts | Clear numeric verdicts, validation and uncertainty. No animated gradient for success/failure or unsupported efficiency claims. | Native E; existing math untouched. |
| 29 | Check view and issue table | Native table / SVG links | Contrast, severity, sorting and direct correction actions; never replace text with glow/metal alone. | Native E; no repo needed. |
| 30 | Freeform and semantic Edit, drag/numeric/keyboard inputs | Keep SVG/editor contract | Maintain preview-only boundary, valid/blocked/rebase state, precise handles and source revision. R3F is not a semantic pattern editor. | Keep; native E only. |
| 31 | Selected-size SVG / DXF / PDF / A0 | Keep existing deterministic exporters | No WebGL screenshots as calibrated print/cut output; preserve 100% coverage and byte-identity gates. | Keep; all four excluded from export writers. |
| 32 | Whole-run Tech Pack / Projector | Keep contract; native technical flats in future G04 | Ensure scope, approval, units and collisions are correct. Render stills may later be a clearly noncalibrated attachment, not replacement. | Keep; future G04 R / G09 A. |
| 33 | Artwork print sheet | Keep existing source artwork and export | Metal effects, shader sampling and logos must not silently change printable colors, edge detail or rights. | Keep; all four excluded from production art conversion. |
| 34 | Project/style picker, create/duplicate/rename/archive/restore | Native CSS | Better hierarchy and clear destructive-action explanation. Glass is optional shell styling, never a new storage model. | Native E; no package necessary. |
| 35 | Immutable history, compare, restore-as-child, freeze/hash | Keep native lists/tables | Show provenance, revision identity and consequences. A future 3D compare requires identical source snapshots, not decorative interpolation. | Keep; future G09 display A only. |
| 36 | ZIP backup/import progress, cancel and failure | Keep native status/progress | Honest counts, actionable errors and accessible cancel. No animated GPU work while import consumes CPU/memory. | Keep; native E. |
| 37 | Recovery, dirty-load choice, storage failure, cross-tab conflict | Keep dialogs and existing persistence | Strong contrast and focus; never obscure pending/unsaved state with blur or false success motion. Source-reviewed states; not all forced in browser. | Keep; critical-state exclusion. |
| 38 | Pending draft, stale/rebase, blocked export | Native text and status cues | Display the actual blocker and next action; do not hide behind polished fallback that appears current. | Native E; all four offer no correctness logic. |
| 39 | Download success / small celebration | Native CSS, reduced-motion-aware | Brief optional success cue after actual success; no continuous shader or extra renderer just for celebration. | Optional; low; E. |
| 40 | Electron Save As, native menu and failure dialogs | Keep native platform behavior | Shared view code can receive CSS; a browser-only effect must not disturb menu, local assets or save lifecycle. Not re-tested on Electron in this research. | Keep; cross-platform gate before adoption. |
| 41 | Local Control Center: queue, filters, work-item form, dependencies, review, evidence/comments, velocity | Native CSS/table visualization | Information density, accurate state and review proofs matter. No consumer-themed liquid GPU effect or changed board workflow. | Keep; all four declined for operational UI. |
| 42 | Future login/welcome/profile/cloud and future garment queue | No present implementation | A future authenticated welcome may share a static brand treatment only after launch admission. No package justifies reopening launch-cost holds or starting new garments. | Deferred; no new scope admission. |

Seven-garment cross-check: Tee and Darted tee include sleeves (and the latter darts); Tank is sleeveless; Polo has separate collar/placket/vent/hem concerns; Woven shirt has yoke/placket/pocket construction; Skirt has waist/hem geometry; Trouser has rise/legs/pockets. Browser snapshots confirm their different piece inventories. A generic shaded mesh is not a faithful sewn preview of any of them. Any future G09 viewer must cover each supported option/size, not just reproduce the Tee proof.

## 4. React compatibility: how much hassle?

It is feasible without rewriting the app. The proof mounts a separate React root and renders both libraries alongside ordinary HTML/CSS. That proves renderer feasibility, **not** integrated project synchronization or production readiness.

Proposed boundary if later admitted:

`existing drafting/revision state → immutable display snapshot → lazy optional viewer → disposable React root`

`existing SVG / forms / exports remain authoritative and available as fallback`

The host must have a stable DOM container. Current view rendering replaces parts of the DOM with `innerHTML`; a root placed inside a replaced subtree must be explicitly unmounted first or moved to a stable host. Repeated view switching must dispose geometry, textures, events and loops. React must not create a second drafting/store/export system.

Snapshot fields should include project/style/revision identity, garment, size, units, piece contours, semantic seams/marks and optional artwork references. Stale render results must be rejected by snapshot identity. Use read-only updates initially; no editor writes until a separate command contract exists.

Current proof pins React/React DOM 19.2.0, R3F 9.8.1 and Three 0.169.0. This exact combination installed and built. Other versions require compatibility checks; source ShaderGradient 2.4.24 is not the tested npm 2.4.20. No Expo, native package or Drei dependency is required for this proof.

| Approach | Integration hassle | When sensible | Preliminary bounded effort, not a scheduled plan |
|---|---|---|---|
| Original CSS gradient / glass shell / wordmark | Low | Cosmetic shell without geometry or data changes | Roughly 1–3 slices for a small grouped treatment and focused QA, once admitted. |
| Native SVG placement/annotation improvements | Medium | Precise 2D information tied to existing piece IDs | Scope dependent; coordinate/clip/revision work is not just CSS. Must plan separately. |
| Read-only React Three Fiber island | Medium–high | A real spatial-inspection problem under G09 | Roughly 3–5 slices for a bounded integration proof; 6–10 for a robust simple viewer. Not the full G09 program. |
| ShaderGradient island | Medium | A proven user benefit from optional hero motion | Roughly 2–4 slices for notice audit, isolated host, assets, motion/fallback and device evidence. Native backdrop may provide equivalent value. |
| Whole-app React migration | Very high; unnecessary here | Only an independently justified architecture redesign | No estimate or recommendation; not admitted. |
| Vanilla Three.js renderer | Medium–high | Avoiding React is valuable and spatial need exists | Removes React/reconciler, not Three, GPU work, lifecycle, state bridge or 3D geometry requirements. |

These are engineering order-of-magnitude bounds after a working isolated build, not comprehensive planning, dates or preassigned slice numbers. G09 remains the much larger pattern/measurement/material/solver program already recorded in the roadmap.

### Measured bundle cost

Separate minimal production builds, same proof lockfile and repository Vite 5.4.21, decimal kB:

| Minimal entry | Minified JS | Gzip JS | Difference from React-only baseline |
|---|---:|---:|---:|
| React root + paragraph | 192.84 kB | 60.31 kB | Baseline |
| React Three Fiber Canvas + box | 1,058.00 kB | 294.20 kB | +233.89 kB gzip |
| ShaderGradient Canvas + gradient | 1,291.51 kB | 338.79 kB | +278.48 kB gzip |

The combined visual prototype separately produced a 242.52 kB / 46.05 kB gzip initial JS chunk and a 1,094.79 kB / 307.16 kB gzip lazy chunk, plus 5.87 kB / 2.05 kB gzip CSS. Bundling interactions differ; do not add these figures or treat them as an app-wide production delta. They exclude runtime GPU memory, assets, thermal load and CPU parse work. Builds issued the expected large-chunk warning.

Lazy loading, visibility gating, capped DPR, demand rendering when appropriate, and plain fallback are required if a GPU effect is admitted. Stopping animation uniforms alone does not prove the renderer stops drawing. Reduced motion, background-tab behavior and context loss need explicit gates, not reliance on package marketing.

## 5. Native code inspired by the effects

| Visual idea | Native implementation | Benefits and tradeoffs | License boundary |
|---|---|---|---|
| Liquid glass | Original CSS background transparency, border/highlight, optional bounded `backdrop-filter`; native buttons and opaque fallback | No html2canvas page snapshot, new JS framework or data-copy path. Browser blur still costs paint work; changing backgrounds can affect contrast. Not identical optical refraction. | Common high-level visual treatment can be independently implemented. If upstream MIT code is copied, retain notices. |
| Shader gradient | Original layered CSS radial gradients, static SVG gradients, optional tiny original WebGL shader only if uniquely useful | CSS avoids GPU canvas/dependency stack and can look good at zero motion. Custom WebGL needs shader/program disposal, resize/DPR, motion, context-loss and accessibility handling. | Do not assume a close rewrite removes copyright obligations. Prefer independent CSS or properly licensed MIT code with notices. |
| Liquid metal logo | Original CSS multi-stop text gradient and static SVG highlight | Cheap brand accent; not the same animated metal/refraction. Maintain solid-color fallback and contrast. | Proof uses original CSS, not Shield GLSL, parser, wrapper or copyrighted logo assets. Separate MIT library use is a distinct audit. |
| Spatial piece preview | Existing SVG for 2D; direct Three.js for 3D if a renderer is truly needed | Three avoids React-specific ownership but retains renderer/geometry/state costs. SVG is best for exact 2D marks and exports. | Three is MIT; inspect exact dependency notices and any imported models/textures. R3F is optional, not an entitlement to copy other assets. |

We should not reimplement a mature renderer merely to avoid a permissive dependency. Equally, we should not add a mature renderer to obtain a background that CSS can express. Pick the smallest implementation that solves a verified user problem.

## 6. Pressure-test results and hidden dependencies

| Test / inspection | Evidence | Consequence |
|---|---|---|
| Unmodified Liquid Glass constructors/methods in mocked DOM | Eight assertions passed: DIV button has click-only listener; screenshot target is document.body; removed child remains in static instances; detached nested render still schedules RAF; zero radius becomes 48. Script retained beside report. | Requires accessibility/lifecycle redesign before reuse; cheaper native alternative preferred. Not a real GPU benchmark. |
| Liquid Glass source vs README | Source requests WebGL1 (`webgl`), despite a WebGL2 badge. Shared snapshot is cached; page sampling is not automatically a live draft renderer. | Do not infer capability from badges. Snapshot memory/CORS/tainted canvas and stale updates need tests. Page capture alone is not proof of network exfiltration. |
| ShaderGradient environment and materials | Source defaults fetch HDR maps from an external host; materials use frame updates and mutate global Three shader chunks. React source differs from published package; upstream browser tests inspected are Vue-focused. | Proof selects `lightType="3d"` rather than environment HDR. Shared Three coexistence, asset rights, hidden network, idle loop and actual React tests remain adoption gates. |
| Liquid Logo upload pipeline | File processing feeds POST /api/user-logo, with public Vercel Blob storage and share URL; layout includes analytics/remote font. Image parser changes white/transparent regions and rescales image. | Reject wrapper/import path for sensitive/local artwork. Metallic output is not original production art or calibrated material appearance. |
| Actual browser render | ShaderGradient rendered one canvas; R3F rendered flat meshes parsed from captured Tee SVG. Improved scene framing was visually checked. | Coexistence is possible. Flat tilting is not garment assembly, avatar fitting, construction fidelity or cloth. |
| Motion and fallback controls | Welcome motion toggled Enable → Pause → Enable; plain fallback removed the canvas. R3F fallback showed original SVG with zero canvas. | UI controls work in the proof. This is not an FPS/energy benchmark or forced GPU-failure test. |
| Narrow layout | Native fallback rendered in a 320px iframe and was screenshot/DOM reviewed. | Evidence of narrow responsive layout only; not a real phone, mobile GPU or full accessibility audit. |
| Existing product | Seven garments, seven inspection view families, entry/style/export/project and provenance inspected; operational board rendered read-only at revision370. | No feature dependency on any of these repos. Error/recovery/approval/native-platform states additionally source-reviewed, not all triggered in browser. |
| Final proof build | Vite build passed after visual corrections; minimal React/R3F/shader builds passed independently. | No production package/config/source changes. Full application coverage gate was not rerun for this research-only task. |

Adoption must additionally test actual target phones/laptops and Electron, keyboard-only/screen-reader operation, zoom/high contrast, reduced motion, hidden/offscreen behavior, repeated mount/unmount and context exhaustion, lost/restored WebGL, slow/missing assets, offline loading, texture/cross-origin failures, many pieces and many placements, rapid size/revision switches, export-byte identity and all supported garment options. These are pending production gates, not tests this report claims passed.

## 7. Best order if the maintainer later approves UI work

1. Existing correctness/information issues first: actionable guidance, pattern identity/callouts, construction fidelity, material-versus-appearance clarity and honest states. Effects do not fix them.
2. Small original native CSS treatments where they demonstrably improve clarity; include reduced-motion/opaque fallback. No stack migration.
3. Revision-bound native SVG artwork and technical views within their approved scopes. G04 / Epic 17 remains held until expressly admitted.
4. Only within admitted G09 / Epic 22, pressure-test the renderer boundary and choose R3F versus direct Three based on evidence. Preserve SVG/default exports and no-fit limitations.
5. ShaderGradient hero only if its aesthetic value outweighs measured download/runtime cost. Liquid Logo wrapper stays excluded unless rights and scope are resolved.

No roadmap dates, slice assignments, canonical board status, feature flags, production dependencies or deployments were changed by this review. Local research files are not yet committed or published to GitHub. The next action is maintainer selection of bounded proposals, followed by the required admission packet and normal full gates for actual implementation.

## 8. Visual evidence, reproduction and sources

Open **UI-VISUAL-ATLAS.html** beside this report. It contains all 34 screenshots inline: seven proposed before/after comparisons plus fallback/narrow evidence and the full baseline gallery, including all seven garment screens. Actual library renders and original design concepts are distinctly labeled. Most mock interface buttons are visual placeholders, not implemented app features.

Proof source and exact lockfile are in `prototype/`. To reproduce from the repository root: `npm --prefix docs/research/ui-repo-review-2026-10-01/prototype install --ignore-scripts --no-audit --no-fund`, then run the repository's Vite against that directory. Use `?mode=welcome`, `pieces`, `glass`, `materials`, `surface` or `brand`; add `&fallback` for a plain rendering. Use `narrow.html` for the 320px iframe. Cost entries are `cost-base`, `cost-r3f`, `cost-shader`; the retained configuration points at its own directory. Installation creates only the isolated proof dependencies, not app dependencies. The pressure script expects the pinned upstream clone at `tmp/ui-repo-sources/liquid-glass-js`; its mocked-DOM limitations are explicit.

Primary source anchors beyond the license links:

- [R3F Canvas implementation](https://github.com/pmndrs/react-three-fiber/blob/13e5e0e152562a9cb64c31dee1d10a2af7aa39c4/packages/fiber/src/web/Canvas.tsx) and [performance guidance](https://github.com/pmndrs/react-three-fiber/blob/13e5e0e152562a9cb64c31dee1d10a2af7aa39c4/docs/advanced/scaling-performance.mdx).
- [Liquid Glass Container](https://github.com/dashersw/liquid-glass-js/blob/78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a/container.js), [Button](https://github.com/dashersw/liquid-glass-js/blob/78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a/button.js), [html2canvas limitations](https://html2canvas.hertzen.com/documentation).
- ShaderGradient source pin above: Canvas, material and environment implementations were inspected locally; complete package/asset notices still need an adoption audit.
- [Liquid Logo public upload route](https://github.com/paper-design/liquid-logo/blob/689bb38a1e0d5a6a8baf2d34847635eefde19994/src/app/api/user-logo/route.ts); repository hero parsing/rendering and layout source were also inspected.
- Repository sources: `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`, `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md`, `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`, canonical `ops/control-center/data/board.json` and current `src/ui/` implementations.
