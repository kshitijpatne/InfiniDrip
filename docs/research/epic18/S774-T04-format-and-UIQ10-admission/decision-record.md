# Slice 774 — T04 format, import, sections, and fixtures

**Decision status:** selected within the maintainer-admitted EPIC-18/G05
boundary; implementation remains Slice 775. **Recorded:** 2026-10-13.
**Starting board:** revision 4614, with G05-T04 In Progress and UIQ-10 Backlog.

## Repository evidence

- `src/ui/tech-pack-records.ts` already defines a strict style-scoped
  `TechPackRecord` across schema versions 1, 2, and 3. It carries style and
  recipe identity, a revision ID/number, T01 cover/material/BOM/colorway
  values, optional T02 POM/sample-QA data, optional T03 operation data, and
  review state. Its parser rejects unsupported versions, unknown or missing
  keys, invalid revision pairs, and oversized collections.
- `src/ui/style-revisions.ts` stores a SHA-256 `revisionContentDigest` over
  immutable revision content. S766/S770/S773 acceptance requires the pack to
  remain bound to this existing identity.
- `src/export/techpack.ts` contains the existing legacy PDF and current V2
  readable PDF. `src/ui/app.ts` exposes the current whole-run PDF. The legacy
  route and eight protected export identities are held; T04 needs a separately
  named additive production-pack route.
- `src/ui/project-package.ts` is a strict local ZIP for whole-project backup.
  Its `infinidrip-project` format includes project/style/revision history,
  frozen outputs and artwork. It is not an appropriate import contract for a
  single tech pack and must not be extended or reused as one.
- Runtime dependency `fflate` 0.8.3 is already present. A dedicated ZIP needs
  no added package. S773's actual recipe inventory reports Tee at 3 components
  and 4 stitch declarations, and Woven Shirt at 12 and 12; all seven saved
  records had no T01 BOM links or T03 operations. Those counts select structural
  fixtures only and do not establish construction quality.

## Selected output format

Produce two additive artifacts from the same saved, immutable style revision:

1. A standalone, read-only `production-pack.pdf` for printing and quick review.
2. A `.techpack.zip` exchange bundle with a dedicated format identifier,
   distinct from `infinidrip-project`.

The ZIP has exactly these top-level roles, in fixed order:

| Path | Contents |
|---|---|
| `manifest.json` | `format: "infinidrip-techpack"`, `packageVersion: 1`, selected section IDs, and the exact style/recipe/revision identity including `revisionContentDigest`; entry names, media types, byte lengths, and SHA-256 for the PDF and read-only attachments. No wall-clock export timestamp. |
| `records/tech-pack.json` | One complete existing `TechPackRecord` value (schema 1, 2, or 3), kept as ordinary UTF-8 JSON so it can be edited outside InfiniDrip. It always includes the full record even when the PDF shows a subset of sections. |
| `documents/production-pack.pdf` | The exact bytes of the separately offered PDF. |
| `attachments/<safe-name>` | Only local artwork files explicitly referenced by the saved revision and included in the artwork section; preserve media type, source label/attribution, and byte identity. No remote fetches. |

The bundle's record JSON is intentionally editable, so its current bytes must
not be compared to a hash of the originally exported bytes as an integrity
failure. The manifest binds it to its base revision; the importer verifies
that identity against saved local history, parses the edited record strictly,
and presents a field-level diff. The manifest hashes the non-editable PDF and
attachments and verifies their exact bytes. The archive is not signed and
does not claim publisher authenticity.

Apply the existing local backup resource ceilings to the new parser: at most
256 MiB compressed and 256 MiB expanded total, at most 128 attachments and
131 unique entries (manifest, record, PDF, and attachments), with each
`manifest.json` and `records/tech-pack.json` capped at 32 MiB. Reject unsafe
relative paths, duplicate names, unexpected entries, and size/count excess
before importing data.

For the same immutable revision, section selection, attachment bytes, and
exporter version, the PDF, canonical JSON, manifest, ZIP entry order, ZIP
timestamps, and final bundle must be byte-deterministic. Do not embed a current
export time, random ID, or nondeterministic ordering. This is a writer-output
property, not T05's persisted freeze/invalidation lifecycle. Slice 775 must
prove byte repeatability from actual generated files before claiming the gate.

## Revision binding and import/round-trip contract

- Export requires an existing committed style revision whose record, style ID,
  recipe ID/version, revision ID/number, and `revisionContentDigest` agree.
  If the style has no committed revision or the records do not match its head,
  block export with an actionable save/reconcile message; do not silently save
  a revision as a side effect.
- Import accepts only `.techpack.zip`; PDF is display/print output and is not
  an import source. Require the dedicated format/version, safe relative paths,
  unique entries, bounded counts/expanded sizes, exact manifest hashes for the
  PDF/attachments, and a strict `parseTechPackRecord` success. Reject unsafe,
  unsupported, incomplete, duplicate, or mismatched payloads with a specific
  correction. No arbitrary file execution or network access.
- The manifest base must resolve to an existing local style revision and its
  recorded digest. The record's style/recipe/revision identity must match the
  manifest. Attachments are read-only snapshot evidence; importing does not
  add, replace, or relabel local artwork. If attachment bytes change, reject
  apply and direct the user to re-add the asset in the local artwork flow.
- An unchanged export/import round-trip produces an empty diff and creates no
  style revision. If the saved head still equals the bundle's base, show every
  changed field and allow only an explicit apply through the existing style
  revision save path; this creates a new immutable revision. Do not merge or
  overwrite automatically.
- If the saved head has moved since export, keep the import preview read-only
  and block apply. Require a fresh export from the current head or a user-led
  manual re-entry after review; no automatic rebase/merge.
- Imported data cannot approve itself. Ignore imported approval as authority;
  any applied authored-content change starts at `DRAFT` with no approved scope,
  and approval remains bound to the new revision through the existing review
  flow. Preserve field provenance and unresolved/conflict states as supplied;
  run existing semantic validation and never promote an unknown to
  source-confirmed, clamp a value, or infer a construction fact.
- Byte changes to the editable record are expected. Identity changes, invalid
  provenance combinations, missing required entries, and stale bases must
  remain visible in preview with a concrete correction.

## Section matrix and presets

The page order is stable: (1) identity/revision/review scope; (2)
materials/BOM/colorways; (3) POM definitions and grade/size context; (4)
sample/QA actuals; (5) construction operations and component/seam references;
(6) artwork/placements and source labels; (7) source status, unresolved items,
and local-review disclaimer.

| Section ID | Content | Selection rule |
|---|---|---|
| `identity` | Style, recipe, immutable revision identity and selected preset | Always included |
| `materials-bom` | T01 materials, BOM rows and colorways | Selectable |
| `measurements-qa` | T02 POM definitions, size/grade context and separate actual QA readings | Selectable |
| `construction` | T03 operations, source state and reconciled component/seam references | Selectable |
| `artwork` | Referenced local artwork and placements | Selectable; missing referenced assets stay explicit or block if the selected output requires the bytes |
| `sources-open-items` | Source/provenance, conflicts, missing facts and next actions | Always included; cannot be hidden |
| `approval-disclaimer` | Exact review state/scope and local digital-review-only disclaimer | Always included; cannot be hidden |

Presets are **Complete pack** (all sections), **Materials + construction**
(identity, materials/BOM, construction, artwork, sources/open items,
approval/disclaimer), and **Measurements + QA** (identity, measurements/QA,
sources/open items, approval/disclaimer). Users may further toggle selectable
sections. The PDF lists any intentionally excluded sections. The JSON always
contains the whole record and manifest selection. Unknown, invalid, conflicting,
or unavailable facts are reported even when their main data section is not
selected; selected sections never make an incomplete pack appear complete.

## Representative fixture styles

- **Tee (`tee`)** — simple structural fixture: 3 component roles and 4 stitch
  declarations in S773's rendered inventory.
- **Woven Shirt (`woven-shirt`)** — difficult structural fixture: 12 component
  roles and 12 stitch declarations, including placket, collar, yoke, pocket,
  sleeve and band references.

Use clearly synthetic, source-labeled T01/T02/T03 records to exercise populated,
unknown, conflicting and attachment cases. Keep a real saved empty-record view
to verify that actual unresolved states remain visible. Do not describe these
fixtures as source-supported construction, fit, supplier or production
validation. Slice 775 proves files/round-trip; S776 proves the UI at its
admitted viewports; S777 performs field-level, numeric, approval-scope and
rendered acceptance for both styles.

## Holds and next boundary

No source schema, project package, revision model, PDF writer, legacy export,
approval/freeze code, or UI changes are included here. T05 remains responsible
for persistent frozen-artifact manifests, lifecycle, dependency invalidation
and preservation of prior frozen bytes. S780 remains the settled global 100%
coverage, build, Control Center, readiness, browser/Electron and actual-output
gate. The next code boundary is S775: implement this package and standalone PDF
as additive outputs, then inspect generated PDF/ZIP/JSON bytes and exact
round-trip behavior before UIQ-10 starts.
