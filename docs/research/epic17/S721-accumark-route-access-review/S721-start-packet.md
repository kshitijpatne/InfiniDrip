# EPIC-17 / G04 — S721 AccuMark route and local-access review

## Goal and boundary

Determine whether the already researched professional apparel CAD route
Gerber AccuMark has an official, bidirectional ASTM/AAMA DXF profile, and
whether this device already has the exact receiver available. This is a
read-only eligibility check; it does not authorize installation, supplier
contact, spending, a DXF transfer, or any change to V03 acceptance.

## Starting state

- Start: 2026-10-11 04:39:48 UTC.
- Branch: `codex/epic-17-g04`.
- Starting commit: `0d09b4969e24a9f1e9bbcc5ce1be21e921edcadd` (`Slice 720: record CLO curve-point comparison`).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the branch.
- Highest assigned slice: 720; S721 is unique.
- Board revision: 4211; G04-V03 and EPIC-17 are In Progress; V01/V02 are Done.
- Two pre-existing untracked S700 coverage diagnostics remain untouched.

## Decision question this slice can answer

Is there a specifically documented apparel CAD receiver/profile among the
existing evidence that is more suitable than the already failed CLO/DGS and
generic LibreCAD/OpenCAD routes, and is it available on this device without
new acquisition?

## Required evidence and stop conditions

- Use first-party AccuMark documents for bidirectional ASTM/AAMA DXF support
  and software-download eligibility.
- Check only local install registrations and the expected Gerber/Lectra
  install directories. Do not inspect personal account data.
- Stop before any install, account, supplier, or file-transfer action.
- Do not re-run CLO, DGS, LibreCAD, or OpenCAD tests or change any criterion.
- Preserve all-seven recipes/options/grades, fixed 0.001 cm geometry,
  malformed-input, repeatability, identity, marks/layers, units, readable
  output, legacy DXF, and protected byte-identity gates.

## Delegation

No safe independent work: this is a small, read-only first-party-document and
local-install check. Codex owns the review.
