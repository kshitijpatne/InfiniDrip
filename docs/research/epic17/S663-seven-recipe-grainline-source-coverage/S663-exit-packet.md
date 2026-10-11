# EPIC-17 / G04 V03 — seven-recipe grainline source coverage — Slice 663 exit

## Result

S663 replays the accepted S330/S459 matrix against current product source at
`81e53b6686e7371ff08518a61366de1ec8300ff0`. All 73 canonical M
configurations across all seven recipes draft through the current recipe API.
Each of 716 emitted piece instances has exactly one rule-resolved grainline
and stable recipe-role/piece/rule contract. At the existing 0.001 cm DXF
rounding, 501 sampled points per line (358,716 total) all remain inside that
piece's flattened CUT polygon; no missing rules, orphan rules or outside
samples occurred. Forty-one recipe/role contracts remain identical across
their supported option configurations.

| Recipe | Configurations | Piece instances | Rule-resolved points inside CUT |
| --- | ---: | ---: | ---: |
| Tee | 1 | 3 | 1,503/1,503 |
| Fitted | 1 | 3 | 1,503/1,503 |
| Tank | 1 | 2 | 1,002/1,002 |
| Polo | 17 | 153 | 76,653/76,653 |
| Woven | 28 | 336 | 168,336/168,336 |
| Skirt | 1 | 3 | 1,503/1,503 |
| Trouser | 24 | 216 | 108,216/108,216 |

The reproducible analyzer and full 716-row coordinate/role report are
`analyze-seven-recipe-grainlines.mts` and `S663-grainline-coverage.json` in
this folder. Matrix SHA-256 is
`69627E68F8D8E1C724C91D23FB885CBBC6B9FBCCC42512D1D4C3E19EF14D8739`; analyzer
SHA-256 is `02923991FE75C80890DE6400760CD3954114EE587CAD2B12EC71E97AAB4D37DF`;
result SHA-256 is
`9730C03EFA8C6471B42EFE4A7FD2342AECA22E9C075672C39B324857B370D455`.

## Evidence limits and decision

- **Directly encoded:** current recipe drafts, piece roles/names, grainline
  edge/fraction rules, flattened CUT geometry, option matrix and layout/DXF
  Y-axis/0.001 cm rounding. All 73 cases use `STANDARD_M`; the matrix covers
  supported design options, not the 35-size grade matrix.
- **Demonstrated by source computation:** for each recipe/option/piece the
  proposed source rule resolves to a line wholly within its own current CUT
  polygon. This generalizes the S662 source premise beyond Polo.
- **Still a design proposal:** representing the source rule by one DXF `LINE`
  on `GRAINLINE` inside each piece block in a new versioned empirical profile.
  GetonAgain does not document that entity/layer convention. S661's nine
  warnings prove the existing fixture fails DGS AutoCAD mode; S663 does not
  prove that adding the proposed lines clears those warnings.

Therefore the existing source makes the coordinates derivable for all seven
recipes/73 options. On 2026-10-10 the maintainer approved the bounded
`idr-pattern-exchange/2` trial: add one source-derived `LINE` on `GRAINLINE`
inside each same-identity piece block, without changing existing geometry or
the legacy DXF writer. The next slice will generate the Polo M candidate and
re-import it once through the frozen DGS build/mode/settings; require all nine
warnings cleared, readable rendering, and CUT/SEW/marks/units preserved at
`0.001 cm`. This approval authorizes that empirical trial, not a standards
claim or gate pass. Even a narrow pass does not clear all-seven grades,
marks/identity/sidecar, malformed-input, repeatability, export, round-trip, or
final receiver/profile qualification.

## Slice boundary and verification

- Started at 2026-10-10 08:06:58 UTC from S662 commit
  `81e53b6686e7371ff08518a61366de1ec8300ff0`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S662 was highest; S663 is unique. Board revision 3865 at start, 3869 after
  validated start replay; EPIC-17/V03 remain In Progress, V01/V02 Done.
- Focused analyzer run passed: 7/7 recipes, 73/73 configurations, 716/716
  piece instances, 41 stable role contracts, 358,716/358,716 sampled points
  inside their corresponding CUTs. JSON integrity assertions and `git diff
  --check` passed. `npm run control-center:test` passes 42/42 after start
  replay. No production source, DXF, exchange baseline or DGS state changed.
- Current process inspection confirms GMS is open to `Untitled` after sign-in;
  DGS remains open with the S661 Polo M file title. No new UI or file action
  occurred.
- Elapsed: implementation 0m; source-analysis/tooling and review about 3m;
  focused verification about 2m; durable closeout about 2m; external-agent
  waits 0m; maintainer-decision time approximately 5m (decision arrived after
  the report draft). Total approximately 12m from 08:06:58 UTC to closeout.
- Validated board exit revision is 3874. `npm run control-center:test` passes
  42/42 after exit replay; `git diff --check` passes. S663 changed no production
  code, so no changed-code coverage requirement applies.

**Next:** S664 generates the approved, bounded Polo M `idr-pattern-exchange/2`
candidate and re-imports it once in the existing DGS session. No V03 gate is
passed by S663; all acceptance, holds, thresholds, legacy DXF behavior and
protected export byte identities remain unchanged.
