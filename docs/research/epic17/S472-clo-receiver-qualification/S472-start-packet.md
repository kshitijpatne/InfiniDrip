# EPIC-17 / G04 V03 CLO receiver qualification — Slice 472 start

## Verified boundary

- **Start:** 2026-10-08 05:50:09 UTC.
- **Worktree/branch:** `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`, `codex/epic-17-g04`.
- **Starting commit:** `79de026ff27ec1b692f2770c5f72172a409bc087` (`Slice 471: review free CAD alternatives`); working tree clean.
- **Git:** refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Highest assigned slice across refs is 471; S472 reserved.
- **Canonical board:** revision 2907; EPIC-17 In Progress, G04-V01 Done, G04-V02 Done, G04-V03 In Progress.
- **Goal:** active and still matches full admitted EPIC-17/G04 objective through safe merge and required deployment.
- **Usage:** primary limit 1%, weekly 31%; normal work allowed.
- **Owner-provided external state:** user reports CLO downloaded, signed in, and running version `2026.1.310`. This is recorded as user-reported, not independently observed in the desktop app.

## Scope

Qualify CLO 2026.1.310 as a possible local V03 receiver using current official CLO format, operating-system, trial and license documentation. Update the local operator gate and durable state. This slice does not open or upload fixtures, accept terms, create/change an account or trial, enter payment information, cancel a subscription, contact the vendor, select a profile, alter export code, or claim compatibility.

## Evidence and boundaries to resolve

- Official CLO documentation describes import and export modes named Standard DXF, DXF-AAMA and DXF-ASTM; import exposes scale/unit and annotation choices, while export exposes size-group and grading choices. This establishes published feature claims only.
- Current published CLO requirements list Windows 11 24H2 minimum and Windows 11 25H2 recommended. The repository host is Windows 11 25H2 per S470. The owner-reported exact build is `2026.1.310`.
- CLO's standard 14-day web trial is limited to users eligible for an Individual license, requires billing/payment setup, and automatically starts the selected paid subscription after trial expiry unless canceled. Enterprise/academic trials require separate vendor contact, which G04 excludes. Current account eligibility, trial state, and renewal/cancellation state are unknown and will not be inspected by Codex.
- Vendor menu descriptions do not prove local-only fixture processing, successful geometry/metadata handling, or round-trip behavior. The exact installed menus and local/cloud behavior remain to be observed without opening a fixture.
- CLO's `DXF-ASTM` label is not, by itself, a claim of conformance to an active ASTM standard. S460 records ASTM D6673-10 as withdrawn; any profile wording must be vendor-version-specific and evidence-bounded.

## Exit gates for this slice

1. Record the official candidate evidence and license/renewal limitation without treating the trial as free perpetual software.
2. Keep the S463 synthetic fixture pack read-only and unopened until the operator gate passes.
3. Preserve V03 rights, local-processing, exact-profile, representative fixture and round-trip gates; keep V03 In Progress.
4. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and canonical board through the validated command layer; run focused Control Center tests and diff checks.
5. Record remaining owner-only observations and the single next action. No global coverage/build/export gate is due for this documentation-only slice.

## Delegation and effort

No safe independent delegation: rights, account eligibility, exact installed build, menu modes, and local handling form one receiver-qualification decision; parallel findings would not remove the owner-only gate. Codex owns the review. S471 estimated 4–9 remaining V03 slices and 3–5 final review/merge/deployment slices, excluding rights/access delays; re-estimate after actual receiver evidence.
