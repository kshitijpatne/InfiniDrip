# EPIC-17 / G04 — S722 V03 acceptance refinement

## Goal and verified starting point

- Start: 2026-10-11 04:52 UTC.
- Branch: `codex/epic-17-g04`; starting HEAD `77b454cd4b54ba3433fe7be6bd0c453584913131` (`Slice 721: identify AccuMark route access gate`).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the branch.
- Canonical board revision 4216; EPIC-17 and G04-V03 are both `In Progress`; G04-V01/V02 are Done.
- Highest previously assigned slice is 721; S722 is unique. Two pre-existing untracked S700 coverage diagnostics are untouched.
- Goal record inspected: active, with the admitted EPIC-17 outcome still required.

## Decision and reason

The product owner explicitly directed Codex to correct V03 acceptance rather than install or buy more software. S721's AccuMark suggestion is withdrawn: it is paid/access-dependent and is not the route for this Epic. No software acquisition or vendor contact is authorized or needed.

The old requirement for an “industrial CAD receiver/profile” is a category label that the tested free local tools cannot satisfy, even where the actual file exchange works. It does not measure the user's practical need. V03 is therefore refined to prove a **named, version-specific empirical DXF compatibility profile** on an already installed receiver, without saying that the profile is an industry standard or that other receivers are compatible. The first candidate is LibreCAD 2.2.1.5 using its DXF 2000 save/reopen route because S708 passed a real Polo M round trip after correcting the opt-in writer. This is a candidate only; the one-fixture result is not broadened into a V03 pass.

## Refined V03 acceptance — fixed fidelity gates retained

1. Document one exact profile identity: receiver name and version, DXF profile and settings, tested workflow, local file handling, and explicit limitations. An empirical profile must not be labeled ANSI/AAMA, ASTM, industrial-apparel conformant, factory-accepted, or production-ready unless separate evidence proves that claim. Do not require every installed CAD app to pass. Publish compatibility only for each named receiver/version whose evidence passes; report the tested CLO/GMS/DGS/OpenCAD routes as limited or unsupported where their retained results fail.
2. For the selected existing local receiver, round-trip the current versioned candidate with source identity bound by the existing digest-protected sidecar. Cover all seven recipes and all 73 supported option/grade configurations. Preserve each configuration's identity, piece and stitch relations, CUT/SEW meaning, construction marks/grainlines, and declared centimeter units. Each supported row must be independently traceable to its exact source revision and output.
3. Keep the fixed maximum contour difference at `0.001 cm`; no missing or added geometry/mark can be waived by an aggregate pass. Reuse the source-bound audit and existing fixtures/matrices. Do not change source pattern geometry to compensate for a receiver's loss.
4. Prove one repeat exchange for the documented profile by semantic comparison of the source and returned outputs; incidental ordering/handle changes are allowed only where existing canonical comparison proves identical meaning and geometry.
5. Product-side malformed/unsupported input handling must continue to fail closed through the real auditor/UI with no partial acceptance. Do not claim this as receiver-side validation.
6. Visually inspect receiver-opened output for each recipe plus option/grade extremes and inspect/audit every machine-comparable configuration. Output must be readable and must not conceal missing semantics.
7. Preserve the legacy DXF bytes and every protected export identity. The new profile remains opt-in and separately named. Run the settled integrated full coverage/build/browser/Electron/output gates before merge.

### What changed and what did not

- **Changed by explicit maintainer direction:** “industrial receiver/profile” is no longer a prerequisite. Replace it with an exact, empirically demonstrated profile for an existing local receiver, and scope compatibility claims to measured app/version behavior.
- **Not changed:** all-seven recipe and 73-configuration coverage; `0.001 cm`; units; identity/relations; geometry and construction marks; repeatability; malformed-input fail-closed behavior; readable rendered output; rights/local handling; legacy DXF and protected byte identities; final verification, cleanup, PR, safe merge, ancestry, required deployment and production E2E.
- **Not a pass:** the S708 LibreCAD Polo M fixture is the strongest existing current-source receiver evidence, but cannot establish breadth, repeatability, or all-option readable output. CLO's measured loss, DGS failures, GMS route limits, and OpenCAD's unqualified generic workflow remain in their recorded dispositions.

## Bounded completion plan

1. S723: execute the existing exact LibreCAD 2.2.1.5/DXF 2000 workflow for representative current-source fixtures from each of the other recipes, using existing C:-only exchange folders and audits. **Decisive verification:** returned-file audits for geometry/units/identity/marks plus receiver reopen/render review. **Stop:** do not add another application or change the writer unless a specific source defect is demonstrated; the fixed threshold applies.
2. S724: use the existing 73-configuration matrix and return-audit harness against the selected empirical profile, then perform one semantic repeat for the same exact profile. **Decisive verification:** zero failed rows, exact report-to-revision joins, and repeat semantic equality. **Stop:** first failed row is a real compatibility limitation to diagnose against its retained input/output, not a reason to vary unrelated settings.
3. S725: close the tested receiver-opened visual review, profile documentation, malformed-input product flow, and protected identity reconciliation using captured evidence. **Decisive verification:** complete evidence checklist for every named gate. **Stop:** any unreadable or misleading rendering stays unsupported and cannot be hidden by the compatibility label.
4. Then do necessary-file cleanup only after inventory/review, one settled full repository suite with global 100% coverage, integrated build/browser/Electron and final output review, PR, safe merge, fresh `origin/main` ancestry, required Actions deployment and production end-to-end verification.

This is a forecast from verified state, not a promised date; S721's receiver-access forecast is stale. No app/API/model substitutions are planned. No physical sampling or factory acceptance is claimed.

## Slice closeout

- Scope: document and record the explicit V03 acceptance refinement; no source-code, receiver, test, geometry, export baseline, or status mutation.
- Board: validated commands recorded S722 start/evidence at revision 4217, start rationale at 4218, the revised V03 card at 4219, exit evidence at 4220, closeout at 4221, and the explicit rights/local-handling criterion at 4222. EPIC-17/G04-V03 remain In Progress; V01/V02 remain Done.
- Focused verification: `npm run control-center:test` passed 42/42 after the final board update; `git diff --check` passed. No production code changed; changed-code coverage and full repository tests were not due.
- Review: the canonical board fields/evidence were read back and checked against this packet; the S708/S710 one-fixture limit and S719/S720 failed-route evidence remain accurately labeled. `origin/main` remains an ancestor of the S722 source commit.
- Timing: start 2026-10-11 04:52:52 UTC; closeout 2026-10-11 04:55:39 UTC; 2m47s total. Implementation and record reconciliation 1m55s; focused verification and board replay/readback 0m52s; external-agent waits 0m; maintainer-decision wait 0m (the explicit direction was already given).
- Untracked files: the two pre-existing S700 coverage diagnostics remain untouched. The S722 start and exit packets are the only new untracked files and will be included in the S722 commit.
- Next action: reserve S723 for a bounded current-source LibreCAD evidence pass using the existing profile/fixtures, then reuse the existing all-seven matrix if that route remains viable. No new app, no unrelated encoding or setting variations, and no status/hold relaxation.
