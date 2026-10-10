# S676 start — fix missing unit metadata in InfiniDrip DXF output

## Verified start and authority

- Start: 2026-10-10 17:23:45 UTC, branch `codex/epic-17-g04`, clean commit
  `336d3a2a779d3f946a97b46a1ca208921e65a5de` (S675).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. Slice 676 is unused and unique; canonical board revision is 4016.
- The maintainer directed Codex to fix code-owned file-generation gaps, avoid
  further CAD candidate shopping, and use a higher-reasoning review. A bounded
  read-only GPT-6 Sol high review finished and independently identified the
  same source-writer gap.
- Goal objective remains EPIC-17/G04 through V01→V02→V03 and safe merge. Its
  saved goal status is Blocked from S675; this task resumes investigation at
  the user's direction. No external design choice is needed for this bounded
  additive source fix.

## Evidence and correction

S674's actual source fixture already carried a centimeter declaration. The
measured LibreCAD R12 saved output omitted that declaration; that particular
loss occurred in the selected receiver save operation. It did not result from
the input missing units.

Separately, the actual product writer in `src/export/dxf.ts` emits only an
ENTITIES section and EOF. Its coordinates are centimeters, but it writes no
DXF header declaring centimeters. This is a real product-side exchange gap
already described in accepted C04. The existing legacy writer and eight
protected Tee/Fitted DXF identities must remain byte-for-byte unchanged.

## Bounded S676 scope

Implement one additive, non-default, versioned generic-DXF serialization
helper that prepends an AC1015 header declaring centimeter units to the exact
existing legacy entity body. Do not change `exportDxf` output, geometry,
precision, marks, layers, UI claims, receiver selection, or export baselines.
Do not call this an apparel standard or complete V03 profile. This slice
clears only the missing-units gap in the product-generated candidate; identity,
grades, marks/labels, receiver round-trip, malformed-input handling,
repeatability, rendered readability, and all-seven receiver proof remain
open.

## Acceptance and verification

- New helper emits a structurally valid HEADER with `ACADVER=AC1015` and
  `INSUNITS=5` (centimeters), followed by the original legacy body byte-for-
  byte.
- Existing generic `exportDxf` results and protected export hashes do not
  move.
- Focused tests cover every changed production line/branch/function; require
  100% statement, branch, function and line coverage for the new code.
- Parse the generated result and compare its ENTITIES section exactly against
  the existing writer output. No external CAD operation or format variation
  is part of this slice.
- `npm run build`, focused tests/coverage, `git diff --check`, and Control
  Center checks as relevant. The full repository suite/100% global coverage,
  integrated rendered review, legacy/protected identity gate, PR, safe merge,
  ancestry and deployment remain for the settled Epic candidate.

## Non-goals and stop conditions

No production UI button or compatibility claim is added because C04 has no
selected receiver/profile. No sidecar, importer, geometry repair, profile
selection, acceptance change, new software, or receiver test. Stop if exact
legacy body preservation cannot be maintained or if a protected byte identity
changes. Do not infer that unit metadata alone qualifies any receiver.

## Required gates and blocking facts

Preserve all V03 criteria: all seven recipes and supported options/grades;
`0.001 cm` geometry; source identity/relations; CUT/SEW and visible typed
marks; explicit units; malformed-input fail-closed behavior; repeatable
round-trip; readable saved output; legacy DXF and protected export identities.
V03 remains incomplete after S676. The next code-owned issue is to be selected
from the documented writer gaps only after this slice is closed; external
receiver acceptance remains a separate gate.
