# InfiniDrip context index

This repository is the durable source of project context shared by Codex,
Claude Code, and future development sessions. Chat history and external Project
Knowledge may add evidence, but must not silently override the documents below.

## Authority and reading order

Read these before any implementation work, in order:

1. `AGENTS.md` — standing workflow and verification rules.
2. `PROJECT-STATE.md` — authoritative current status, completed slices, active
   directive, exact test count, and immediate next work.
3. `docs/PROJECT-DECISIONS.md` — maintainer decisions and resolved ambiguities.
4. `ARCHITECTURE.md` — current system structure, invariants, and architectural
   boundaries.
5. The task-relevant planning and research documents listed below.

When documents conflict, prefer the newest evidence in this order:

1. Current code and Git state
2. `PROJECT-STATE.md`
3. `docs/PROJECT-DECISIONS.md`
4. `ARCHITECTURE.md`
5. `docs/planning/MVP-PLAN.md`
6. `docs/planning/ROADMAP.md`
7. Historical briefs and archived handoffs

Older test counts, recipe counts, and "next slice" statements remain historical
snapshots; they are not current status.

## Current status documents

- `PROJECT-STATE.md` — engineering status log and immediate roadmap.
- `ARCHITECTURE.md` — implemented architecture and standing principles.
- `README.md` — user-facing project overview; useful but less authoritative than
  the two files above.
- `docs/PROJECT-DECISIONS.md` — decisions confirmed directly by the maintainer.
- `docs/OPENCODE-WORKFLOW.md` — required delegation, branch, PR, review, and
  feedback policy for using OpenCode alongside Codex.

## Planning documents

- `docs/planning/MVP-PLAN.md` — operative six-month launch plan. Its old
  "immediate next actions" are a historical baseline; use `PROJECT-STATE.md` for
  today's next slice.
- `docs/planning/ROADMAP.md` — strategic competitive analysis, prioritization,
  long-term scope, and cut list.
- `docs/planning/COMPONENT-ARCHITECTURE.md` — design rationale and migration plan.
  Use `PROJECT-STATE.md` for which phases are actually complete.
- `docs/planning/SLICES-BRIEF.md` — reusable slice-planning brief. It is a
  template, not a live status source.

## Research documents

- `docs/research/ASSET-RESOURCES.md` — refined, analyzed resource catalogue and
  successor to the legacy `apparel_design_resources.md` link list.
- `docs/research/TOOLS-RESEARCH.md` — tools, techniques, and feasibility research.
- `docs/research/MARKETPLACE-GOALS.md` — separate vendor-layer research track;
  not active product-development scope unless the maintainer explicitly starts a
  research chunk.
- `docs/research/garments/TANK-RESEARCH.md` — durable tank construction research.
  Every future garment must receive an equivalent research document in this
  directory before implementation.
- `docs/research/garments/TEMPLATE.md` — required starting structure for each
  future garment's research record.

## Historical archive

- `docs/archive/2026-09-10-INFINIDRIP-HANDOFF.md` — Claude-to-Codex handoff
  snapshot through Slice 63. It is evidence, not a maintained source of truth.
- `docs/archive/FABLE-BRIEF.md` — completed Fable F1/F2 epic specification.
- `docs/archive/RESUME-LOG.md` — personal proof/resume staging record, not project
  status or implementation instructions.

## Superseded material

- `apparel_design_resources.md` is retained for provenance only and is
  superseded by `docs/research/ASSET-RESOURCES.md`.

## External research references routed to future slices

The following product-owner-supplied references are durable research inputs,
not implementation instructions. Consult them automatically when a slice
concerns the listed subject, distinguishing source guidance from estimates,
product decisions, and unresolved questions:

- `F:\tank-sketches\scribd - garment-design - files\226112995-Pattern-Making.pdf` — measurement taxonomy, block/working/master pattern lifecycle, grain/layout, seam allowance, hem, and future trouser coverage.
- `F:\tank-sketches\scribd - garment-design - files\aqm1_spec_sheet_detailed_reference.docx` — POM/spec-sheet structure, relaxed versus extended measurements, pocket placement, operation sequencing, and technical-pack vocabulary.
- `F:\tank-sketches\scribd - garment-design - files\garment_measurement_quick_reference.docx` — finished-garment measurement definitions and collar, sleeve, waistband, rise, inseam, outseam, pocket, and stretch-state terminology.
- `F:\tank-sketches\scribd - garment-design - files\pattern_drafting_quick_reference.docx` — drafting workflow, ease, landmarks, truing, markings, reusable blocks, grading, and quality checks.
- `F:\tank-sketches\scribd - garment-design - files\pattern_making_body_measurements_reference.docx` — standardized body measurements, trouser dimensions, grading, balance, fitting diagnostics, grain, and layout.
- `F:\tank-sketches\scribd - garment-design - files\stitches_seams_detailed_reference.docx` — stitch/seam terminology and construction metadata by operation and fabric; not proof of sewability or a source for hardcoded machine settings.
- `F:\tank-sketches\scribd - garment-design - files\types_of_fullness_detailed_reference.docx` — deferred fullness techniques; consult only if a future garment explicitly introduces darts, gathers, pleats, or tucks.
- `F:\tank-sketches\290184313-T-shirt-Poloshirt-Cad-Drawing.pdf` — Polo V2 research input for collar/stand, placket, longer-back/side-vent, sleeve-rib, and Polo-specific grading questions; its assignment-specific values are not universal formulas.

These references do not authorize physical sampling. Physical validation is on
hold until the maintainer explicitly reopens it.
