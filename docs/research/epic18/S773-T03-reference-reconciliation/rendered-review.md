# S773 rendered T03 reference review

**Recorded:** 2026-10-13. **Origin:** isolated local app at
`http://127.0.0.1:5175/`. **Scope:** saved in-app recipe drafts and the rendered
read-only T03 reference panel. No production, supplier, or physical-fit
conclusion is drawn.

## Results

The existing style manager was used to render each saved recipe in the T03
editor. The panel showed the lowercase component IDs, exact `Block.roles` keys,
derived seam IDs and their complete ordered edge/mark topology, the T01/T03 ID
rule, and the disclaimer that these are not source/manufacturing data and do
not establish sewability, physical fit, or production validity. All seven
saved samples had no BOM component links and no T03 operations, so their
“All recorded T01 and T03 references match” status means that there were no
recorded links to reject; it does not mean construction was validated.

| Recipe | Components | Stitch declarations |
| --- | ---: | ---: |
| tee | 3 | 4 |
| fitted | 3 | 5 |
| tank | 2 | 2 |
| polo | 9 | 10 |
| woven-shirt | 12 | 12 |
| skirt | 3 | 2 |
| trouser | 9 | 11 |

The rendered IDs were deterministic across repeated drafts in focused tests.
The browser review also confirmed the additional guidance that T03 references
use the lowercase IDs shown, while T01 BOM references may use an exact pattern
role key.

## Rendered reference IDs

- **tee** — components: `front`, `back`, `sleeve`; seams:
  `seam-shoulder-seam-front-back-44fd20a9`,
  `seam-side-seam-front-back-8e5a6bcb`,
  `seam-sleeve-underarm-left-right-3eff9bea`,
  `seam-sleeve-cap-ease-1d45e30a`.
- **fitted** — components: `front`, `back`, `sleeve`; seams:
  `seam-shoulder-seam-front-back-44fd20a9`,
  `seam-side-seam-front-back-14b6fe2a`,
  `seam-sleeve-underarm-left-right-3eff9bea`,
  `seam-sleeve-cap-ease-1d45e30a`,
  `seam-dart-legs-equal-169eb188`.
- **tank** — components: `front`, `back`; seams:
  `seam-shoulder-seam-front-back-44fd20a9`,
  `seam-side-seam-front-back-8e5a6bcb`.
- **polo** — components: `front`, `back`, `sleeve`, `button-placket`,
  `buttonhole-placket`, `outer-stand`, `inner-stand`, `upper-collar`,
  `under-collar`; seams:
  `seam-shoulder-seam-front-back-44fd20a9`,
  `seam-side-seam-front-back-8e5a6bcb`,
  `seam-sleeve-underarm-left-right-3eff9bea`,
  `seam-sleeve-cap-ease-1d45e30a`,
  `seam-button-placket-left-front-slit-4e67d4ad`,
  `seam-buttonhole-placket-right-front-slit-a1b7ef51`,
  `seam-outer-stand-polo-neckline-4c309065`,
  `seam-under-collar-outer-stand-c1e164dd`,
  `seam-upper-collar-inner-stand-af2371b7`,
  `seam-collar-outer-seam-upper-under-a9838e67`.
- **woven-shirt** — components: `front`, `back`, `yoke`, `pocket`,
  `outer-stand`, `inner-stand`, `upper-collar`, `under-collar`,
  `button-placket`, `buttonhole-placket`, `sleeve`, `sleeve-band`; seams:
  `seam-shoulder-seam-front-yoke-a4b9d118`,
  `seam-side-seam-front-back-4d7f95dd`,
  `seam-yoke-seam-yoke-back-lower-62f20c84`,
  `seam-patch-pocket-front-placement-de7e1c0e`,
  `seam-outer-stand-woven-neckline-9c36a6ae`,
  `seam-under-collar-outer-stand-33f7024a`,
  `seam-upper-collar-inner-stand-fe57f093`,
  `seam-collar-outer-seam-upper-under-a9838e67`,
  `seam-button-placket-right-front-centre-front-ba18b885`,
  `seam-buttonhole-placket-left-front-centre-front-25cc2aff`,
  `seam-woven-sleeve-cap-ease-7b1670a5`,
  `seam-folded-sleeve-band-sleeve-hem-6dbf3083`.
- **skirt** — components: `front`, `back`, `waistband`; seams:
  `seam-side-seam-front-back-7a005059`,
  `seam-waistband-front-back-waistband-14c147f7`.
- **trouser** — components: `front-left`, `front-right`, `back-left`,
  `back-right`, `waistband`, `fly-shield`, `fly-underlap`,
  `pocket-bag-left`, `pocket-bag-right`; seams:
  `seam-left-side-seam-front-back-7f5218bd`,
  `seam-right-side-seam-front-back-cf4fd70d`,
  `seam-left-inseam-front-back-7d32ba6b`,
  `seam-right-inseam-front-back-358627f7`,
  `seam-center-back-seam-left-right-fdc35610`,
  `seam-fly-underlap-shield-23c88883`,
  `seam-waistband-four-legs-separate-waistband-c9515e81`,
  `seam-left-front-fly-shield-6dc52cfa`,
  `seam-right-front-fly-underlap-233a9a3f`,
  `seam-left-pocket-opening-bag-e3604c7e`,
  `seam-right-pocket-opening-bag-79183975`.

## Test data and limits

The isolated origin began with a blank `Untitled tee` style. Six synthetic
style copies were created there to make the six other saved recipe drafts
available to the style manager. They contained inherited design measurements
but no T01 BOM component links or T03 operation records. No construction
values, sources, user files, provider data, or records in the shared
`F:\\designApp` checkout were changed. This review reports the in-app pattern
model only; the component/seam names are not garment research or construction
evidence.

Synthetic link fixtures exercise matched, missing, unresolved, conflicting,
invalid, unknown, duplicate, malformed, unsupported, and draft-error cases in
the focused reconciliation/renderer tests. The browser review above verifies
the actual saved-style pattern inventories and empty-reference state; it does
not claim that those synthetic links were entered into a saved style.
