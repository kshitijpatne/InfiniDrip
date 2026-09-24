# C05 — Measurement-driven avatar and garment-simulation dossier

**Research snapshot:** 2026-09-24<br>
**Status:** reviewed and accepted 2026-09-24; Slice 218<br>
**Future destination:** EPIC-22 / G09 (measurement-driven mannequin and 3D)<br>
**Boundary:** this is a research and admission dossier, not 3D implementation. Physical sampling remains held. The product remains user-led and deterministic; no prompt-to-design agent is proposed.

## Decision summary

**Blender is viable for authoring a controllable body mesh and exporting it for an in-app renderer. It is not, by itself, a solution for converting sparse measurements into a unique human body, assembling InfiniDrip's current 2D patterns into garments, simulating fabric, or proving fit.** A Blender-authored GLB/glTF avatar can be displayed in a browser using a renderer such as Three.js; mesh shape controls can be transported as morph targets. The mapping from a user's measurements to shape controls must be specified and validated separately.

The best fit for InfiniDrip is an incremental deterministic pipeline:

1. define the body-measurement and avatar-control contract;
2. build or license a rights-cleared, editable, stable-topology avatar and make its displayed measurements consistent with declared user inputs;
3. preserve garment patterns as semantic panels with paired sewing edges, not just SVG drawings;
4. assemble those panels on the avatar and show a basic 3D construction view;
5. prototype an interactive XPBD drape preview with named material assumptions;
6. only later add measured fabric properties and calibrated simulation;
7. keep physical fit validation as a separate future gate, currently held.

This path can achieve an honest, useful 3D representation that updates from measured inputs and exposes unknowns. The reviewed sources do **not** support promising an exact reconstruction of a person or an accurate physical fit from a few measurements before suitable data and physical validation exist.

## What current evidence establishes

| Claim | Evidence | Status for InfiniDrip |
| --- | --- | --- |
| A parametric, component-oriented sewing-pattern representation is a plausible way to preserve editable garment structure. | GarmentCode presents a domain-specific language for hierarchical, component-oriented parametric sewing patterns and design parameters, with geometry generation handled by garment programs. It is a research prototype, not an apparel production suite. ([paper](https://arxiv.org/abs/2306.03642), SIGGRAPH Asia 2023) | Strong architectural precedent for future semantic pattern data. InfiniDrip already has deterministic recipes and named piece roles, but needs richer shared seam/panel/material semantics before 3D. |
| Research systems can create large pattern-linked garment datasets and run a fast XPBD draping pipeline. | GarmentCodeData reports 115,000 synthetic garment data points and an open-source fast XPBD draping pipeline, including collision-resolution/correctness methods. Its paper describes generated data and its own statistical body model; this does not mean its data or every asset can be embedded commercially without rights review. ([paper](https://arxiv.org/abs/2405.17609), ECCV 2024) | A useful reference/test-data candidate after rights audit; not an InfiniDrip-ready production garment library or fit proof. |
| Differentiable physics can jointly refit 2D patterns and 3D drape to a selected body. | Dress Anyone describes refitting a known garment and its 2D panels to another 3D body using differentiable simulation. ([paper](https://arxiv.org/abs/2405.19148), 2024 preprint) | It supports the technical possibility but assumes a source garment pattern and specific research pipeline. It does not make arbitrary text-to-pattern fit a solved task. |
| Few body circumferences do not specify a unique complete surface. | Wuhrer and Shu reconstruct 3D shape from anthropometric measurements with statistical shape priors and nonlinear fitting. The prior model space and available measurements matter. ([paper](https://arxiv.org/abs/1109.1175), *Machine Vision and Applications*, 2013) | A measurement vector should drive named constraints on an editable shape model. Expose fit residuals and unresolved shape axes; do not present the result as a unique body scan. |
| Fabric simulation needs material properties and solver-specific calibration. | The systematic review on fabric mechanical parameters reports variation in physical parameterization and simulation precision in apparel CAD. ([review](https://doi.org/10.1016/j.cad.2023.103638), *Computer-Aided Design*, 2024) | “Cotton,” GSM, or a texture image cannot substitute for mechanical parameters. Generic material values must remain labeled as assumptions. |
| Blender-authored geometry can be delivered in standard 3D formats. | Blender documents glTF export/import; glTF 2.0 supports mesh morph targets and skinning. ([Blender glTF documentation](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html), [Khronos glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)) | Blender can author/export assets. GLB/glTF carries geometry and controls; it does not include InfiniDrip's measurement-fit algorithm or garment solver. |
| Research body-model rights are not automatically commercial rights. | The SMPL-X model license limits the non-commercial research grant and directs commercial licensing elsewhere. The separately available SMPL-Body CC BY subset excludes the parametric shape blendshapes/tools. ([SMPL-X model license](https://smpl-x.is.tue.mpg.de/modellicense.html), [body license](https://smpl-x.is.tue.mpg.de/bodylicense.html)) | Audit mesh, shape basis, weights, code, data, diagrams, and add-ons separately. Prefer original/commissioned assets with explicit commercial rights unless the required commercial license is obtained. |

## How this maps to the current product

C01 observes a 2D SVG drafting application with seven deterministic recipes. Its “Body” view is a schematic measurement illustration. Its “Assembled” view explicitly says it is schematic and not a fit simulation. No 3D runtime dependency or pattern-to-cloth pipeline is present in the current product. `package.json` does not include Three.js or another 3D renderer, and `src/` renders SVG geometry. The user can change recipe fields/options and see dependent 2D output update; this is a useful source for future geometry but not a 3D fabric model.

This means the work divides into distinct engineering problems; building the mannequin in Blender solves only the asset-authorship and transport portion:

| Layer | Required input/output | Why separate |
| --- | --- | --- |
| Body measurement contract | Named body measurements, path/landmarks, units, posture, capture instructions, date/source, uncertainty and body preset/prior. | ISO measurement definitions improve vocabulary and procedure; values still vary by method/person, and body surface shape is underdetermined. |
| Avatar geometry | Stable-topology mesh, landmarks, semantic shape controls, neutral pose, optional starting presets. | Renderer needs rig/mesh semantics; fitting logic needs measurable surface locations and predictable controls. |
| Measurement fitting | Deterministic optimization maps target measurement vector to avatar control weights, subject to bounds and a selected prior. | A mesh renderer does not infer body shape. The fit must expose residuals and underconstrained dimensions. |
| Semantic pattern model | Pattern panels with design boundary, sewline, cutline/allowance, grain, fold/notches, internal marks, and explicit seam-pair constraints. | SVG rendering loses important construction meaning if the future system tries to reverse-engineer pieces and sewing relationships from pixels/paths. |
| 2D-to-3D assembly | Pattern panel tessellation, placement around avatar, paired-edge correspondence and sewing/registration. | A flat pattern does not identify 3D placement or seam correspondence without recipe data. |
| Drape solver | Mesh constraints, seam constraints, body/self collision, gravity, timestep/iteration controls, and material parameters. | Three.js is a renderer; XPBD or another solver must solve cloth behavior and failure conditions separately. |
| Calibration and claims | Physical material tests and version-matched physical samples, if/when the maintainer reopens them. | Attractive digital drape is not proof of real garment fit, production quality, or fit across a population. |

Keep this distinct from image-based virtual try-on. A 2D try-on image may help the user judge styling, but it does not supply a metric body surface or pattern geometry. This workstream is specifically a measurement-constrained editable body mesh and, later, a garment mesh generated from the product's semantic 2D patterns. Its claims must follow the stage gates below.

## Recommended avatar and renderer design

### Asset authoring and delivery

Use Blender to author or inspect a low-complexity base body with consistent topology, semantic landmark definitions, a neutral pose, and bounded controls such as torso girth, torso length, shoulder breadth, limb dimensions and shape distribution. Male/female-like presets may be optional initial priors, as the maintainer specified, but measurements should remain the actual controls and presets should not replace them. “Male/female” should be defined as an optional starting configuration rather than a restrictive body taxonomy.

Export a GLB/glTF asset containing meshes, skinning only where needed, and morph targets or an explicit control scheme. Load it in a browser renderer. The asset pipeline should test coordinate axes, scale/units, origin, normals, winding, morph target names/order, minimum/maximum weights, bounds and round-trip consistency. Authoring software ownership does not resolve rights to an imported base mesh, human scan, shape basis, texture, or add-on.

### Measurement-to-shape mapping

Treat each entered measurement as a constraint on a declared curve or landmark path on the current mesh. An initial deterministic fitter can minimize a weighted measurement residual plus a regularization term that keeps the solution near a selected prior and within approved shape-control bounds. Keep the original entered measurements immutable in the record; calculate the mesh-derived measurements and show the per-field residual, tolerance policy and any unsupported/unmatched fields.

Because multiple 3D shapes can share the same chest/waist/hip circumferences, the UI should let users refine important unspecified contour controls directly (for example front/back distribution, posture/shoulder slope, torso length, and leg shape). If two fields conflict or cannot be simultaneously satisfied, show the conflict and ask the user to correct values or edit controls. Never silently clamp or claim accuracy on a hidden region.

### Semantic pattern before drape

Do not make the 3D work read pattern meaning back out of the exported PDF/SVG. Add to the canonical drafting record stable panel identity, outline and sewline geometry, allowances, grain/fold/cut instructions, notches/marks and explicit seam relationships. A seam pair must define start/end orientation, registration points, allowed length mismatch/easing, and its operation. This model should continue to generate the existing 2D pattern and export views so the 2D and 3D outputs cannot quietly diverge.

For each supported garment, a deterministic assembly map must define how panels lie on the avatar before sewing, what body region they occupy, the initial offsets, and which edges pair. The solver must detect bad topology, unmatched seams, penetrations, inverted/degenerate triangles, and nonconvergence, then report actionable errors instead of hiding them.

## Solver and material direction

**Recommended first solver candidate: XPBD for interactive digital preview.** The original XPBD paper addresses timestep/iteration dependence of stiffness in position-based dynamics ([Macklin et al., 2016](https://doi.org/10.1145/2994258.2994272)); GarmentCodeData uses an XPBD-based pipeline for high-throughput garment draping. This makes XPBD a practical candidate for a stable interactive prototype, not an accuracy guarantee. Dress Anyone’s differentiable simulation is a later research option if optimization of garment pattern parameters against body/drape goals becomes a requirement. It is not the smallest route for an editable user-led first pass.

Simulation inputs should ultimately distinguish warp/weft tensile response, shear, bending in relevant directions, mass/areal density, thickness, friction, seam stiffness, stretch limits, damping, and contact behavior. The schema must record method, source, unit, material/article, test date, conversion into solver values, and confidence. A commercial “cotton” preset can be an explicitly generic visual default, but not a measured cotton material. Avoid overclaiming from a fabric texture or GSM alone.

An avatar can be displayed and measured before there is any cloth solver. Likewise, a visually assembled garment can be shown before measured materials. Those stages need distinct labels and UI status so users understand whether an output is: (a) measurement-consistent body shape, (b) pattern-assembled 3D view, (c) digital drape under stated assumptions, (d) calibrated material simulation, or (e) physically compared result.

## Staged implementation acceptance matrix

Numeric thresholds below are not copied from a universal clothing standard. The literature supports the need for measurement residuals, solver checks, repeatable fixtures, and material calibration; it does not prescribe product-specific acceptance numbers. The values in the next table are provisional engineering candidates to make the later decision concrete, not established facts or claims. The product owner and technical reviewer must approve or replace them, and the exact target device must be named, before the corresponding implementation stage starts. Physical fit acceptance cannot be approved while sampling is held.

### Provisional measurable gates for later stages

| Dimension | Candidate gate | Evidence and rationale | What it proves / does not prove |
| --- | --- | --- | --- |
| Measurement-to-mesh residual (Stage B) | For every supported entered measurement, mesh-derived result is within **±5 mm** of the requested digital constraint on the declared measuring path; show residual and unsupported fields. A conflicting/unattainable vector must produce a visible blocked state rather than a silently clamped body. | This is an internal transform-fidelity target, not a standard tolerance. It is deliberately much smaller than the 3.34–4.10 cm mean absolute errors reported in one older, narrowly scoped self-measurement study; those human capture errors remain separate and must be shown as uncertainty, not hidden by the fitter. ([Yoon & Radwin](https://journals.sagepub.com/doi/10.1177/001872089403600311)) | It proves the app encodes a supplied value into its own declared mesh measurement. It does not prove the user's tape measurement is correct or reconstruct unmeasured contours. |
| Repeatability / solver stability (Stages B–D) | With a fixed build, device, asset, solver settings and seed, repeated fixtures must return the same topology and pass/fail classification and remain inside empirically approved numeric/visual repeatability bounds. Record device/runtime, seed and solver settings. Require **zero inverted/degenerate triangles** and no unreported seam mismatch in accepted fixtures. Do not require bitwise-identical floating-point results across different devices or GPU drivers. | Repeatable input/output and explicit failure handling are necessary to test constraint solvers. XPBD addresses stiffness dependence on timestep/iteration settings, but does not prescribe InfiniDrip's acceptance thresholds. ([XPBD](https://doi.org/10.1145/2994258.2994272); [GarmentCodeData](https://arxiv.org/abs/2405.17609)) | It proves repeatable software behavior and solver state on named fixtures, not physical drape or fit. |
| Visual regression (Stages B–D) | Fixed-camera, fixed-light, fixed-renderer reference captures at **1024 px**: body/garment silhouette boundary 95th-percentile deviation ≤**2 px** and no changed semantic landmark beyond **2 px**, plus human review of every supported garment class. | These are proposed regression limits for detecting accidental view changes; no cited paper supplies a universal visual-error threshold for this product. Golden images must be generated from reviewed geometry and cannot be used as ground truth for body identity. | It proves stable presentation against approved digital references, not that the reference is anatomically or physically correct. |
| GLB/glTF round-trip fidelity (Stages B–C) | Preserve all required mesh parts, named morph controls, landmarks, units, orientation and scale; bounding-box and named-landmark displacement after export/import ≤**0.1 mm** in the controlled test fixture. Missing or renamed controls fail the export. | Khronos glTF defines asset transport structures; Blender documents export. A numerical round-trip tolerance is an InfiniDrip engineering choice and must be measured against the chosen renderer/runtime. ([Khronos glTF](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html); [Blender glTF export](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html)) | It proves data survives transport to the tested runtime, not that body or fabric measurements correspond to a person or garment. |
| Interactive response and frame rate (Stages B–D) | On the declared minimum device at **1920×1080**, avatar-only measurement edits complete within **100 ms at p95**; during a 60-second scripted interaction, the interactive view's **p95 frame time is ≤33.3 ms** (30 frames/second equivalent). If drape cannot sustain this, it must pause/step visibly rather than make the editor unresponsive. | The current product is desktop-first, but no minimum hardware has yet been declared. These are proposed usability budgets, not values established by apparel-simulation literature. Re-measure on a named OS/CPU/GPU/driver/browser build before approval. | It proves an interaction budget for the declared build/device, not solver accuracy. |
| Memory / asset budget (Stages B–D) | Initial avatar GLB ≤**15 MiB** and added working-set memory for the avatar plus one garment preview ≤**256 MiB** on the same minimum-device fixture; record GPU and process memory separately. | These are proposed local-desktop resource budgets. They require a representative pattern/mesh fixture and profiler measurement; no cited standard sets them. | It bounds app resource use on the declared fixture, not support for every garment or device. |
| Pattern seam / collision (Stages C–D) | For seams designated equal-length (no intentional easing), paired sewing-edge length delta ≤**1 mm** after units/transform; for declared eased seams, exact designed ease is recorded and checked. Accepted frames report no body/self penetration deeper than **2 mm**; larger intersections block approval. | These are candidate geometric tolerances for InfiniDrip fixtures. The product must distinguish intentional ease from an invalid mismatch. Fabric simulation research documents sensitivity to physical parameters; it does not make a geometric tolerance a physical standard. ([fabric-parameter review](https://doi.org/10.1016/j.cad.2023.103638)) | It proves geometric assembly/contact bounds under solver settings, not sewn seam success or real material behavior. |

**Device-class proposal:** use the lowest desktop configuration InfiniDrip will officially support as the performance gate; provisionally benchmark Windows 11, 8 GB RAM, WebGL 2, integrated graphics, and a 1920×1080 viewport, recording exact CPU/GPU/driver/browser versions. This class is a planning assumption, not a discovered requirement. If that target is rejected, revise the budgets before Stage B. Keep one higher-spec reference machine for diagnosing quality/performance trade-offs.

| Stage | Scope | Exit evidence | Claim allowed at exit |
| --- | --- | --- | --- |
| **A — measurement/body model contract** | Canonical named body-measurement schema, exact capture protocol, avatar shape controls, landmarks, units, priors, rights plan, uncertainty and conflict UI. | Source/standard license and scope audited; every field has a definition and method; sparse-measurement ambiguity displayed; intended population and product thresholds explicitly chosen. | Researched implementation contract only. |
| **B — interactive measurement-driven avatar** | Blender-authored or commissioned rights-cleared body asset exported to GLB; app renders it and user measurements update a visible body shape. | GLB asset checks; mesh-derived measurement functions compared with targets; repeatability tests across edge/representative vectors; residuals/unconstrained controls shown; presets only set the starting prior; target-device performance threshold passed. | “The displayed avatar is adjusted to match these listed measurements within the stated digital residuals.” Not “exact scan” or fit proof. |
| **C — pattern-linked 3D assembly** | Semantic panel geometry and seam map create a 3D garment on the avatar without fabric drape claims. | Each panel traces to a 2D pattern piece; seam pairs/lengths/notches/registration validate; transformed pattern geometry round-trips; representative simple and complex styles pass visual and geometric review. | “3D construction view derived from the pattern.” Not “physically fitting” or drape-accurate. |
| **D — interactive digital drape** | XPBD (or reviewed equivalent) with explicit solver version/settings and generic, named material assumptions. | Test fixtures cover loose/close fits, sleeves, collars, crotch, vents, unmatched seams, body/self collision, failure/recovery; deterministic or bounded output; device performance and simulation state visible. | “Digital drape preview under these stated assumptions.” |
| **E — material-calibrated simulation** | Store measured fabric properties and conversion to solver-specific parameters. | Repeatable documented test method, units, material lot/source and calibration; sensitivity checks; simulation output compared across controlled cases. | Only that the digital solver used recorded/calibrated input data. Real fit correspondence remains unproven. |
| **F — physical fit validation** | Version-matched physical sample/garment tests, material data and body/sample measurements. | Requires a separate explicit maintainer decision to reopen physical sampling; compare patterns, fabric, avatar, garment POMs and observed results; record errors and limitations. | Claims only supported by actual recorded evidence. This stage is held. |

## Validation details and blockers

1. **Measurement consistency is not identity reconstruction.** Tests can prove mesh-derived named measurements match the values they are specified to match. They cannot prove that all other body contours match the person.
2. **Population coverage needs a source.** A shape model trained on a restricted scan population may systematically fail outside it. Dataset size does not equal population representation or rights for commercial use.
3. **Garment topology is the central bridge.** The current per-recipe functions and SVGs need semantic panels, paired seam IDs, folds, cutlines/allowances, and explicit placement. The 3D solver will not repair missing design intent.
4. **Collision and initial conditions are failure sources.** Pattern orientation, starting intersections, seam correspondence, and mesh quality need explicit fixtures and repair/error states. GarmentCodeData discusses collision resolution as part of its method, which is evidence that simply adding a solver library is not sufficient.
5. **Material data must be owned.** A generic material can support visualization. For stronger mechanical claims, acquire measured properties with a defined method, map to the solver, retain provenance, and measure sensitivity.
6. **Rights are a real blocker.** Before choosing a body asset or data set, inspect the license of model, blend shapes, code, data, textures, dependencies and Blender add-ons. SMPL-X’s standard model/software license is noncommercial; its separate CC BY 4.0 SMPL-X Body page says that subset excludes the parametric shape blendshapes/tools, and it also identifies patent rights underlying the model specification. The registration page separately describes both model and body downloads as available only for noncommercial research, which is in tension with the body page's CC BY grant. Treat commercial access/redistribution rights for that body subset as unresolved until the licensor confirms the exact asset and use in writing. Do not assume either an academic download or the separate body subset clears every asset, patent, or commercial-use question. Prefer an original/commissioned model with explicit rights or obtain a written legal clearance for the exact asset and use.
7. **Sampling hold limits the top claim.** No digital-only stage can validate drape/fit against an actual sewn garment. The physical validation stage must remain pending, not auto-pass after avatar or solver work.
8. **Target runtime is not fixed.** The target browser/device, mesh budget, solver frame budget, accessibility requirements and offline/local data lifecycle must be selected before setting performance thresholds. There is no source-backed universal FPS or millimeter target for this product.

## Dependencies and future work ownership

| Prerequisite/workstream | Must precede | Main dependency / exit |
| --- | --- | --- |
| C01/C02 accepted baseline | G01/C03/C04 scope integration | Use actual recipe structure and professional/standard definitions; do not duplicate or contradict measurement/POM semantics. |
| C03 canonical measurement and size contract | Avatar body fitter (stage B), custom single-size flow and future grades | Separate body, garment POM, pattern and grading values; one-size first; explicit grade approval. |
| C04 shared panel/seam/view contract | Stage C; tech-pack/CAD alignment | Stable semantic pieces, paired seams, callouts, units and current export expectations. |
| Rights-cleared body assets and population/measurement data | Stage B | Commission original, use properly licensed data, or obtain written commercial license. |
| Renderer/runtime decision | Stage B and later C/D | Browser 3D rendering integration plus target-device benchmark; glTF is the transport, not the solver. |
| Material testing/source system | Stage E | Exact mechanical property definitions and supplier/source rights/provenance. |
| Maintainer reopens physical sampling | Stage F only | Version-matched sample and recorded POM/fabric/fit evidence. No date or automatic authorization. |

## Sources

### Research papers

- Korosteleva & Sorkine-Hornung, [GarmentCode: Programming Parametric Sewing Patterns](https://arxiv.org/abs/2306.03642), ACM TOG / SIGGRAPH Asia 2023.
- Korosteleva et al., [GarmentCodeData: A Dataset of 3D Made-to-Measure Garments With Sewing Patterns](https://arxiv.org/abs/2405.17609), ECCV 2024.
- Chen et al., [Dress Anyone: Automatic Physically-Based Garment Pattern Refitting](https://arxiv.org/abs/2405.19148), 2024 preprint; later proceedings DOI [10.1145/3747858](https://doi.org/10.1145/3747858).
- Wuhrer & Shu, [Estimating 3D Human Shapes from Measurements](https://arxiv.org/abs/1109.1175), *Machine Vision and Applications* 24(6), 2013.
- Macklin, Müller & Chentanez, [XPBD: Position-Based Simulation of Compliant Constrained Dynamics](https://doi.org/10.1145/2994258.2994272), MIG 2016.
- Dai & Hong, [Fabric mechanical parameters for 3D cloth simulation in apparel CAD: a systematic review](https://doi.org/10.1016/j.cad.2023.103638), *Computer-Aided Design*, 2024.
- [Inverse Garment and Pattern Modeling with a Differentiable Simulator](https://doi.org/10.1111/cgf.15249), *Computer Graphics Forum*, 2024.

### Official technical and licensing documents

- [ISO 8559-1](https://www.iso.org/standard/61686.html), [ISO 8559-2:2025](https://www.iso.org/standard/85590.html), and [ISO 8559-3](https://www.iso.org/standard/67334.html): body measurement/size-designation scope; detailed material is licensed.
- [Blender license](https://www.blender.org/about/license/) and [Blender glTF exporter](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html).
- Khronos, [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html); Three.js [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) and [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).
- Max Planck, [SMPL-X model license](https://smpl-x.is.tue.mpg.de/modellicense.html) and [body subset license](https://smpl-x.is.tue.mpg.de/bodylicense.html).
- The [SMPL-X registration/download page](https://smpl-x.is.tue.mpg.de/register.php) labels both model and body downloads noncommercial; resolve this wording against the Body CC BY page before any commercial reuse.
- [GarmentCode repository](https://github.com/maria-korosteleva/GarmentCode) and [GarmentCodeData paper](https://arxiv.org/abs/2405.17609); review repository and dataset-specific licenses before reuse.

## Exit decision

C05 is reviewed and accepted (Slice 218). The paper and licensing statements, current product boundary, staged claims, provisional—not sourced—thresholds, and explicit blockers were checked. Commercial use of the SMPL-X body subset remains unresolved because its body-license page and download registration wording differ; a written rights decision or an original/commissioned asset is required before asset selection. The dossier supports a technically plausible implementation path; it does not approve a 3D product build or override the physical-sampling hold. Its exact measurement, visual, solver, device, and material thresholds remain proposals requiring maintainer and technical-reviewer approval before the relevant G09 implementation stage.
